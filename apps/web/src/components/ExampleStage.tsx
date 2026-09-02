"use client";

import { CodeBlock } from "@/components/CodePreview";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AnyclickPayload } from "@ewjdev/anyclick-core";

export type CaptureStatus = "sent" | "error";
export type RevealMode = "compare" | "payload" | "none";

interface StageContextValue {
  onCapture: (payload: AnyclickPayload, status: CaptureStatus) => void;
}

const StageContext = createContext<StageContextValue | null>(null);

/** Null outside an ExampleStage. ExampleProvider uses this to report captures. */
export function useExampleStage(): StageContextValue | null {
  return useContext(StageContext);
}

export interface ExampleStageProps {
  /** Metric key, e.g. "custom-pointer". */
  id: string;
  /** The only copy above the Stage. Keep it to about seven words. */
  prompt: string;
  /** The exact provider block that is running inside the Stage. */
  source: string;
  sourceFilename?: string;
  /** One short paragraph on what is different about this example. */
  note?: string;
  /** What to show after the first capture. */
  reveal?: RevealMode;
  /** compare mode only: selectors to report match counts for. */
  sensitiveSelectors?: string[];
  children: ReactNode;
  className?: string;
}

const TEN_SECONDS = 10_000;

/**
 * The example primitive: prompt → Stage → Source → Capture reveal.
 *
 * Mount the page's provider *inside* the Stage (as children). The Stage surface
 * is opaque with no blur and no fixed children so screenshots are deterministic.
 */
export function ExampleStage({
  id,
  prompt,
  source,
  sourceFilename = "app/providers.tsx",
  note,
  reveal = "payload",
  sensitiveSelectors,
  children,
  className,
}: ExampleStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const metricRef = useRef<{ t0: number; sent: boolean }>({
    t0: 0,
    sent: false,
  });
  const [capture, setCapture] = useState<{
    payload: AnyclickPayload;
    status: CaptureStatus;
    matches: Array<{ selector: string; count: number }>;
  } | null>(null);

  const sendMetric = useCallback(
    (withinTenSeconds: boolean) => {
      const m = metricRef.current;
      if (m.sent) return;
      m.sent = true;
      try {
        navigator.sendBeacon?.(
          "/api/anyclick/stage-metric",
          JSON.stringify({ id, withinTenSeconds }),
        );
      } catch {
        // metric is best-effort
      }
    },
    [id],
  );

  // Metric: first right-mousedown inside the Stage within 10s of mount.
  // (Scoped anyclick clients stop `contextmenu` at the document, so we count
  // `mousedown` button 2, which nothing intercepts. onCapture is the fallback
  // for ctrl+click and touch.)
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    metricRef.current = { t0: performance.now(), sent: false };
    const onDown = (e: MouseEvent) => {
      if (e.button === 2) {
        sendMetric(performance.now() - metricRef.current.t0 <= TEN_SECONDS);
      }
    };
    node.addEventListener("mousedown", onDown, true);
    return () => node.removeEventListener("mousedown", onDown, true);
  }, [sendMetric]);

  const onCapture = useCallback(
    (payload: AnyclickPayload, status: CaptureStatus) => {
      sendMetric(performance.now() - metricRef.current.t0 <= TEN_SECONDS);
      const node = stageRef.current;
      const matches =
        reveal === "compare" && node && sensitiveSelectors
          ? sensitiveSelectors.map((selector) => {
              let count = 0;
              try {
                count = node.querySelectorAll(selector).length;
              } catch {
                count = 0;
              }
              return { selector, count };
            })
          : [];
      setCapture({ payload, status, matches });
    },
    [reveal, sendMetric, sensitiveSelectors],
  );

  const ctx = useMemo(() => ({ onCapture }), [onCapture]);

  return (
    <StageContext.Provider value={ctx}>
      <section className={cn("mb-12", className)} data-example-stage={id}>
        <p className="mb-3 text-sm font-medium text-gray-300">{prompt}</p>
        <div
          ref={stageRef}
          data-anyclick-stage
          className="rounded-2xl border border-white/10 bg-[#0f0f14] p-6 min-h-[320px]"
        >
          {children}
        </div>

        {note && (
          <p className="mt-6 text-sm text-gray-400 leading-relaxed">{note}</p>
        )}

        <div className="mt-6">
          <CodeBlock
            code={source}
            language="tsx"
            filename={sourceFilename}
            showCopy
          />
        </div>

        {reveal !== "none" && capture && (
          <CaptureReveal
            mode={reveal}
            payload={capture.payload}
            status={capture.status}
            matches={capture.matches}
          />
        )}
      </section>
    </StageContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Capture reveal
// ---------------------------------------------------------------------------

const HIGHLIGHT_KEYS = /"(outerHTML|innerText)":/;

function replacer(key: string, value: unknown) {
  if (
    key === "dataUrl" &&
    typeof value === "string" &&
    value.startsWith("data:")
  ) {
    const kb = Math.round((value.length * 0.75) / 1024);
    const mime = value.slice(5, value.indexOf(";")) || "image";
    return `data:${mime}… [${kb} KB]`;
  }
  if (
    (key === "outerHTML" || key === "innerText") &&
    typeof value === "string" &&
    value.length > 240
  ) {
    return `${value.slice(0, 240)}… [${value.length} chars]`;
  }
  return value;
}

function pickImage(payload: AnyclickPayload) {
  const s = payload.screenshots;
  return s?.container ?? s?.element ?? s?.viewport ?? null;
}

function CaptureReveal({
  mode,
  payload,
  status,
  matches,
}: {
  mode: Exclude<RevealMode, "none">;
  payload: AnyclickPayload;
  status: CaptureStatus;
  matches: Array<{ selector: string; count: number }>;
}) {
  const json = useMemo(() => JSON.stringify(payload, replacer, 2), [payload]);
  const lines = useMemo(() => json.split("\n"), [json]);
  const image = pickImage(payload);
  const matched = matches.filter((m) => m.count > 0);

  const jsonPanel = (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0f] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 text-xs text-gray-400">
        <span>
          {mode === "compare"
            ? "What the payload contains"
            : "What the adapter received"}
        </span>
        <StatusBadge status={status} />
      </div>
      <pre className="p-4 text-[11px] leading-relaxed overflow-x-auto max-h-[420px] overflow-y-auto">
        <code>
          {lines.map((line, i) => (
            <div
              key={i}
              className={
                HIGHLIGHT_KEYS.test(line)
                  ? "bg-amber-500/15 text-amber-200 -mx-4 px-4"
                  : "text-gray-300"
              }
            >
              {line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );

  return (
    <div
      className="mt-6 animate-in fade-in slide-in-from-top-2 duration-200"
      data-capture-reveal
    >
      {mode === "compare" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#0a0a0f] overflow-hidden">
              <div className="px-4 py-2 border-b border-white/5 text-xs text-gray-400">
                What the screenshot saw
              </div>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.dataUrl}
                  alt="Masked screenshot captured by anyclick"
                  className="w-full h-auto"
                />
              ) : (
                <div className="p-6 text-sm text-gray-500">
                  No screenshot captured. Use the preview&apos;s Send button
                  instead of &quot;Continue without screenshots&quot;.
                </div>
              )}
              {matched.length > 0 && (
                <div className="px-4 py-3 border-t border-white/5 text-xs text-gray-400">
                  Masked by:{" "}
                  {matched.map((m) => (
                    <code key={m.selector} className="text-emerald-400 mr-2">
                      {m.selector}
                    </code>
                  ))}
                </div>
              )}
            </div>
            {jsonPanel}
          </div>
          <p className="mt-3 text-sm text-amber-300/90">
            Masking is a screenshot feature. The highlighted{" "}
            <code>outerHTML</code> and <code>innerText</code> still leave the
            browser. Use <code>stripAttributes</code>, or keep secrets out of
            the DOM.
          </p>
        </>
      ) : (
        jsonPanel
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CaptureStatus }) {
  return status === "sent" ? (
    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
      sent
    </span>
  ) : (
    <span
      className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300"
      title="/api/feedback needs GITHUB_TOKEN (or Jira env) to accept submissions."
    >
      adapter rejected locally
    </span>
  );
}
