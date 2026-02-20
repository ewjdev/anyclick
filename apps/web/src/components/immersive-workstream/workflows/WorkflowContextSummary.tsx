"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import type { WorkflowCaptureState } from "./types";

interface WorkflowContextSummaryProps {
  captureState: WorkflowCaptureState;
  onRetryCapture: () => Promise<void>;
}

export function WorkflowContextSummary({
  captureState,
  onRetryCapture,
}: WorkflowContextSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const data = captureState.data;

  return (
    <section className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <h4
          className="text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--workflow-accent-text-muted)" }}
        >
          Captured Context
        </h4>

        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="rounded border border-white/20 px-2 py-1 text-[11px] font-medium text-gray-200 transition-colors hover:bg-white/10"
        >
          {isExpanded ? "Hide details" : "Show details"}
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-300">
        This workflow auto-captures selectors, page metadata, and screenshot
        evidence so teams can act on precise context instead of manually
        re-entering details and risking handoff mistakes.
      </p>

      {!isExpanded ? null : captureState.status === "capturing" ? (
        <div
          className="mt-3 rounded border px-2.5 py-2 text-xs"
          style={{
            backgroundColor: "var(--workflow-accent-soft-bg)",
            borderColor: "var(--workflow-accent-soft-border)",
            color: "var(--workflow-accent-text)",
          }}
        >
          <div className="flex items-center gap-2">
            <Loader2 size={13} className="animate-spin" />
            Capturing target and container context...
          </div>
        </div>
      ) : !data ? (
        <div className="mt-3 rounded border border-amber-400/30 bg-amber-500/10 p-2.5 text-xs text-amber-100">
          <div className="flex items-center justify-between gap-2">
            <span>Context capture is unavailable.</span>
            <button
              type="button"
              onClick={() => {
                void onRetryCapture();
              }}
              className="inline-flex items-center gap-1 rounded border border-amber-200/40 px-2 py-1 text-[11px] font-medium text-amber-100 hover:bg-amber-200/10"
            >
              <RefreshCw size={11} />
              Retry
            </button>
          </div>
          {captureState.error && (
            <p className="mt-1 text-[11px] text-amber-100/90">
              {captureState.error}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-3 rounded border border-white/10 bg-black/20 p-2">
            <p className="text-[11px] text-gray-300">
              <span style={{ color: "var(--workflow-accent-text-muted)" }}>
                Target:
              </span>{" "}
              <span className="font-mono text-[11px] text-gray-200">
                {data.targetSelector}
              </span>
            </p>
            <p className="mt-1 text-[11px] text-gray-300">
              <span style={{ color: "var(--workflow-accent-text-muted)" }}>
                Container:
              </span>{" "}
              <span className="font-mono text-[11px] text-gray-200">
                {data.containerSelector}
              </span>
            </p>
          </div>

          <dl className="mt-3 space-y-1.5 text-xs text-gray-200">
            <div>
              <dt style={{ color: "var(--workflow-accent-text-muted)" }}>
                Page
              </dt>
              <dd>{data.pageContext.title}</dd>
              <dd className="font-mono break-all text-[11px] text-gray-400">
                {data.pageContext.url}
              </dd>
            </div>
          </dl>

          {data.containerScreenshot ? (
            <div className="mt-3 overflow-hidden rounded border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.containerScreenshot.dataUrl}
                alt="Container screenshot"
                className="h-auto w-full"
              />
            </div>
          ) : (
            <div className="mt-3 rounded border border-amber-300/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-100">
              Screenshot unavailable.
              {data.screenshotError ? ` ${data.screenshotError}` : ""}
            </div>
          )}
        </>
      )}
    </section>
  );
}
