"use client";

import * as React from "react";
import type {
  AnyclickPayload,
  ElementContext,
  ElementInspectInfo,
  PageContext,
  ScreenshotCapture,
  ScreenshotData,
} from "@ewjdev/anyclick-core";
import {
  buildAnyclickPayload,
  buildElementContext,
  buildPageContext,
  captureAllScreenshots,
  formatBytes,
  getElementInspectInfo,
  isScreenshotSupported,
} from "@ewjdev/anyclick-core";
import {
  ContextMenu,
  type ContextMenuItem,
  showToast,
} from "@ewjdev/anyclick-react";
import {
  Braces,
  Clipboard,
  Info,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CaptureDetailsPanel } from "./CaptureDetailsPanel";
import {
  CaptureWorkflowTimeline,
  type CaptureStep,
  type CaptureStepId,
  type CaptureStepState,
} from "./CaptureWorkflowTimeline";
import type { DemoPanel, FeatureConfig, FeatureDemoAction } from "./types";

type CaptureRunStatus = "idle" | "running" | "success";

type IntegrationMode = {
  framework: "react" | "vanilla";
  scope: "global" | "scoped";
};

type CaptureArtifacts = {
  agentInput?: unknown;
  connectedData?: unknown;
  containerContext?: ElementContext;
  elementContext?: ElementContext;
  inspectInfo?: ElementInspectInfo;
  integrationSnippet?: string;
  issueMarkdown?: string;
  metadata?: Record<string, unknown>;
  pageContext?: PageContext;
  payload?: AnyclickPayload;
  screenshots?: ScreenshotData | null;
};

const OFFSCREEN_POSITION = { x: -9999, y: -9999 };

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function")
    return performance.now();
  return Date.now();
}

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return JSON.stringify({ error: "Failed to serialize JSON" }, null, 2);
  }
}

function summarizeScreenshotCapture(capture?: ScreenshotCapture) {
  if (!capture) return null;
  return {
    height: capture.height,
    sizeBytes: capture.sizeBytes,
    sizeHuman: formatBytes(capture.sizeBytes),
    width: capture.width,
  };
}

function summarizeScreenshots(screenshots: ScreenshotData | null | undefined) {
  if (!screenshots) return null;
  return {
    capturedAt: screenshots.capturedAt,
    container: summarizeScreenshotCapture(screenshots.container),
    element: summarizeScreenshotCapture(screenshots.element),
    errors: screenshots.errors,
    viewport: summarizeScreenshotCapture(screenshots.viewport),
  };
}

function buildGitHubIssueMarkdown(input: {
  element: ElementContext;
  page: PageContext;
  screenshots?: ScreenshotData | null;
}) {
  const { element, page } = input;
  const screenshots = summarizeScreenshots(input.screenshots);

  const lines: string[] = [
    `## Summary`,
    ``,
    `Right-click capture on **${element.tag}** at \`${element.selector}\`.`,
    ``,
    `## Page`,
    `- URL: ${page.url}`,
    `- Title: ${page.title}`,
    ``,
    `## Element`,
    `- Tag: \`${element.tag}\``,
    element.id ? `- ID: \`${element.id}\`` : `- ID: _(none)_`,
    element.classes.length
      ? `- Classes: \`${element.classes.slice(0, 6).join(" ")}\``
      : `- Classes: _(none)_`,
    ``,
    `## Context`,
    `- Ancestors captured: ${element.ancestors.length}`,
    `- data-* keys: ${Object.keys(element.dataAttributes).length}`,
    ``,
    `## Screenshots`,
  ];

  if (!screenshots) {
    lines.push(`- Not captured`);
  } else {
    lines.push(
      `- Element: ${screenshots.element ? screenshots.element.sizeHuman : "n/a"}`,
      `- Container: ${
        screenshots.container ? screenshots.container.sizeHuman : "n/a"
      }`,
      `- Viewport: ${
        screenshots.viewport ? screenshots.viewport.sizeHuman : "n/a"
      }`,
      screenshots.errors
        ? `- Errors: ${Object.keys(screenshots.errors).join(", ")}`
        : `- Errors: none`,
    );
  }

  lines.push(
    ``,
    `---`,
    `_(This is a demo draft; no network calls are made.)_`,
  );

  return lines.join("\n");
}

function buildAgentInput(input: {
  element: ElementContext;
  page: PageContext;
  screenshots?: ScreenshotData | null;
}) {
  const screenshots = summarizeScreenshots(input.screenshots);
  return {
    title: "Quick Ask Agent Input (demo)",
    prompt:
      "Explain what this element is, why it matters, and what the next debugging action should be.",
    context: {
      page: {
        title: input.page.title,
        url: input.page.url,
      },
      element: {
        selector: input.element.selector,
        tag: input.element.tag,
        id: input.element.id ?? null,
        classes: input.element.classes,
        dataAttributes: input.element.dataAttributes,
        ancestors: input.element.ancestors,
      },
      screenshots,
    },
  };
}

function buildIntegrationSnippet(mode: IntegrationMode) {
  const scopeComment =
    mode.scope === "scoped"
      ? `// Scoped: only captures inside a subtree`
      : `// Global: captures across the document`;

  if (mode.framework === "react") {
    return [
      `import { AnyclickProvider } from "@ewjdev/anyclick-react";`,
      `import { createHttpAdapter } from "@ewjdev/anyclick-github";`,
      ``,
      `const adapter = createHttpAdapter({ endpoint: "/api/feedback" });`,
      ``,
      scopeComment,
      `<AnyclickProvider adapter={adapter} ${mode.scope === "scoped" ? "scoped" : ""}>`,
      `  <App />`,
      `</AnyclickProvider>`,
    ].join("\n");
  }

  return [
    `import { createAnyclickClient } from "@ewjdev/anyclick-core";`,
    ``,
    `const client = createAnyclickClient({`,
    `  adapter: { submitAnyclick: async (payload) => console.log(payload) },`,
    `  // targetFilter: (event, el) => true,`,
    `});`,
    ``,
    scopeComment,
    `client.attach();`,
  ].join("\n");
}

function buildZeroConfigSnippet() {
  return [
    `# install`,
    `yarn add @ewjdev/anyclick-react @ewjdev/anyclick-github`,
    ``,
    `# wrap`,
    `import { AnyclickProvider } from "@ewjdev/anyclick-react";`,
    `import { createHttpAdapter } from "@ewjdev/anyclick-github";`,
    ``,
    `const adapter = createHttpAdapter({ endpoint: "/api/feedback" });`,
    ``,
    `<AnyclickProvider adapter={adapter}>`,
    `  <App />`,
    `</AnyclickProvider>`,
  ].join("\n");
}

function createInitialStepStates(): Record<CaptureStepId, CaptureStepState> {
  return {
    connected: { status: "idle" },
    container: { status: "idle" },
    element: { status: "idle" },
    metadata: { status: "idle" },
  };
}

export interface FeatureCaptureDemoProps
  extends React.HTMLAttributes<HTMLDivElement> {
  feature: FeatureConfig;
}

export function FeatureCaptureDemo({
  className,
  feature,
  ...props
}: FeatureCaptureDemoProps) {
  const [activePanel, setActivePanel] = React.useState<DemoPanel>(
    feature.demo.defaultPanel,
  );
  const [runStatus, setRunStatus] = React.useState<CaptureRunStatus>("idle");
  const [stepStates, setStepStates] = React.useState<
    Record<CaptureStepId, CaptureStepState>
  >(createInitialStepStates);
  const [artifacts, setArtifacts] = React.useState<CaptureArtifacts>({});

  // Subtle interaction variants
  const [isTargetPickerEnabled, setIsTargetPickerEnabled] = React.useState(false);
  const [selectedTargetKey, setSelectedTargetKey] = React.useState("primary");
  const [integrationMode, setIntegrationMode] = React.useState<IntegrationMode>({
    framework: "react",
    scope: "global",
  });

  // Demo element refs
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const targetRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const setTargetRef = React.useCallback(
    (key: string) => (node: HTMLElement | null) => {
      targetRefs.current[key] = node;
    },
    [],
  );

  // Right-click menu state (card-local)
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState(OFFSCREEN_POSITION);

  const runTokenRef = React.useRef(0);

  const steps: CaptureStep[] = React.useMemo(
    () => [
      { id: "element", label: "Capture element" },
      { id: "container", label: "Capture container" },
      { id: "connected", label: "Get connected data" },
      { id: "metadata", label: "Shape anyclick metadata" },
    ],
    [],
  );

  const reset = React.useCallback(() => {
    runTokenRef.current += 1;
    setRunStatus("idle");
    setStepStates(createInitialStepStates());
    setArtifacts({});
    setActivePanel(feature.demo.defaultPanel);
    setMenuVisible(false);
    setMenuPosition(OFFSCREEN_POSITION);
  }, [feature.demo.defaultPanel]);

  const updateStep = React.useCallback(
    (stepId: CaptureStepId, patch: Partial<CaptureStepState>) => {
      setStepStates((prev) => ({
        ...prev,
        [stepId]: { ...prev[stepId], ...patch },
      }));
    },
    [],
  );

  const getActiveTargetElement = React.useCallback((): HTMLElement | null => {
    const explicit = targetRefs.current[selectedTargetKey];
    if (explicit) return explicit;
    return targetRefs.current.primary ?? null;
  }, [selectedTargetKey]);

  const copyToClipboard = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard", "success");
    } catch {
      showToast("Failed to copy", "error");
    }
  }, []);

  const handleAction = React.useCallback(
    async (action: FeatureDemoAction) => {
      if (action.kind === "setPanel") {
        setActivePanel(action.panel);
        return;
      }
      if (action.kind === "reset") {
        reset();
        return;
      }
      if (action.kind === "toggleTargetPicker") {
        setIsTargetPickerEnabled((prev) => !prev);
        return;
      }
      if (action.kind === "toggleIntegrationMode") {
        setIntegrationMode((prev) => ({
          framework: prev.framework === "react" ? "vanilla" : "react",
          scope: prev.scope === "global" ? "scoped" : "global",
        }));
        return;
      }
      if (action.kind === "retakeScreenshots") {
        // Just re-run capture with screenshots enabled (if this card supports it)
        // and keep the user on Data panel.
        setActivePanel("data");
        action = { kind: "startCapture", setActivePanel: "data" };
      }
      if (action.kind === "copy") {
        const screenshotsSummary = summarizeScreenshots(artifacts.screenshots);
        const payloadForCopy = artifacts.payload
          ? {
              ...artifacts.payload,
              screenshots: artifacts.payload.screenshots
                ? summarizeScreenshots(artifacts.payload.screenshots)
                : screenshotsSummary ?? undefined,
            }
          : null;

        if (action.target === "payloadJson") {
          await copyToClipboard(payloadForCopy ? safeJson(payloadForCopy) : "{}");
          return;
        }
        if (action.target === "issueMarkdown") {
          await copyToClipboard(artifacts.issueMarkdown ?? "");
          return;
        }
        if (action.target === "agentContext") {
          await copyToClipboard(safeJson(artifacts.agentInput ?? {}));
          return;
        }
        if (action.target === "snippet") {
          const snippet =
            feature.id === "framework-agnostic"
              ? buildIntegrationSnippet(integrationMode)
              : artifacts.integrationSnippet ?? "";
          await copyToClipboard(snippet);
          return;
        }
        if (action.target === "commands") {
          await copyToClipboard(buildZeroConfigSnippet());
          return;
        }
        if (action.target === "screenshotSummary") {
          await copyToClipboard(safeJson(screenshotsSummary ?? {}));
          return;
        }
      }

      if (action.kind === "startCapture") {
        const token = (runTokenRef.current += 1);
        setRunStatus("running");
        setStepStates(createInitialStepStates());
        setArtifacts({});

        const targetEl = getActiveTargetElement();
        const containerEl = containerRef.current;

        if (!targetEl || !containerEl) {
          setRunStatus("idle");
          updateStep("element", {
            status: "error",
            errorMessage: "Demo elements not ready",
          });
          return;
        }

        let elementContext: ElementContext | undefined;
        let containerContext: ElementContext | undefined;
        let inspectInfo: ElementInspectInfo | undefined;
        let pageContext: PageContext | undefined;
        let screenshots: ScreenshotData | null | undefined;
        let connectedData: unknown;
        let issueMarkdown: string | undefined;
        let agentInput: unknown;
        let integrationSnippet: string | undefined;

        // Step 1: element
        {
          const start = nowMs();
          updateStep("element", {
            status: "running",
            detail: "Building element selector + attributes…",
          });
          try {
            elementContext = buildElementContext(targetEl);
            inspectInfo = feature.demo.runner.includeInspectInfo
              ? getElementInspectInfo(targetEl)
              : undefined;

            // ensure the UI updates even when capture is instant
            await sleep(200);
            if (runTokenRef.current !== token) return;

            setArtifacts((prev) => ({
              ...prev,
              elementContext: elementContext!,
              inspectInfo,
            }));
            updateStep("element", {
              status: "success",
              durationMs: nowMs() - start,
              detail: `Selector: ${elementContext!.selector}`,
            });
          } catch (err) {
            if (runTokenRef.current !== token) return;
            updateStep("element", {
              status: "error",
              durationMs: nowMs() - start,
              errorMessage: err instanceof Error ? err.message : String(err),
            });
            setRunStatus("idle");
            return;
          }
        }

        // Step 2: container
        {
          const start = nowMs();
          updateStep("container", {
            status: "running",
            detail: "Capturing container context…",
          });
          try {
            containerContext = buildElementContext(containerEl);
            await sleep(200);
            if (runTokenRef.current !== token) return;
            setArtifacts((prev) => ({ ...prev, containerContext: containerContext! }));
            updateStep("container", {
              status: "success",
              durationMs: nowMs() - start,
              detail: `Selector: ${containerContext!.selector}`,
            });
          } catch (err) {
            if (runTokenRef.current !== token) return;
            // Fallback: simulate container
            containerContext = elementContext;
            setArtifacts((prev) => ({
              ...prev,
              containerContext: elementContext,
            }));
            updateStep("container", {
              status: "simulated",
              durationMs: nowMs() - start,
              detail: "Using element context as container fallback",
            });
          }
        }

        // Step 3: connected data (screenshots, page context, feature-specific outputs)
        {
          const start = nowMs();
          updateStep("connected", {
            status: "running",
            detail: "Collecting page + connected context…",
          });

          try {
            pageContext = buildPageContext();
            screenshots = undefined;

            if (feature.demo.runner.enableScreenshots) {
              updateStep("connected", {
                status: "running",
                detail: isScreenshotSupported()
                  ? "Capturing element/container/viewport…"
                  : "Screenshots unsupported; capturing errors…",
              });
              screenshots = await captureAllScreenshots(
                targetEl,
                containerEl,
                // keep safe defaults for homepage demo; don’t show the preview UI
                {
                  enabled: true,
                  showPreview: false,
                },
              );
            }

            // Feature-specific connected data + next action prep
            connectedData =
              feature.id === "github-integration"
                ? {
                    issueTitle: `Issue: ${elementContext!.tag} @ ${elementContext!.selector}`,
                    labels: ["anyclick", "demo"],
                  }
                : feature.id === "ai-agent"
                  ? {
                      intent: "Ask AI",
                      suggestedPrompts: [
                        "Why is this element here?",
                        "What should I debug next?",
                      ],
                    }
                  : feature.id === "visual-capture"
                    ? {
                        screenshots: summarizeScreenshots(screenshots),
                        masking: { sensitiveSelectors: "defaults" },
                      }
                    : feature.id === "framework-agnostic"
                      ? {
                          mode: integrationMode,
                          note: "Adapter + client wiring varies by environment",
                        }
                      : feature.id === "zero-config"
                        ? {
                            defaults: {
                              highlight: true,
                              screenshots: true,
                              menu: "preset",
                            },
                          }
                        : {
                            ancestors: elementContext!.ancestors.slice(0, 3),
                            dataAttributes: elementContext!.dataAttributes,
                          };

            // Next action outputs
            issueMarkdown =
              feature.id === "github-integration"
                ? buildGitHubIssueMarkdown({
                    element: elementContext!,
                    page: pageContext!,
                    screenshots: screenshots ?? null,
                  })
                : undefined;

            agentInput =
              feature.id === "ai-agent"
                ? buildAgentInput({
                    element: elementContext!,
                    page: pageContext!,
                    screenshots: screenshots ?? null,
                  })
                : undefined;

            integrationSnippet =
              feature.id === "framework-agnostic"
                ? buildIntegrationSnippet(integrationMode)
                : undefined;

            await sleep(250);
            if (runTokenRef.current !== token) return;

            setArtifacts((prev) => ({
              ...prev,
              agentInput,
              connectedData,
              integrationSnippet,
              issueMarkdown,
              pageContext,
              screenshots: screenshots ?? null,
            }));

            updateStep("connected", {
              status: "success",
              durationMs: nowMs() - start,
              detail:
                feature.demo.runner.enableScreenshots && screenshots
                  ? `Screenshots: ${
                      summarizeScreenshots(screenshots)?.errors ? "partial" : "ok"
                    }`
                  : `Connected context captured`,
            });
          } catch (err) {
            if (runTokenRef.current !== token) return;
            updateStep("connected", {
              status: "error",
              durationMs: nowMs() - start,
              errorMessage: err instanceof Error ? err.message : String(err),
            });
            setRunStatus("idle");
            return;
          }
        }

        // Step 4: shape metadata + payload
        {
          const start = nowMs();
          updateStep("metadata", {
            status: "running",
            detail: "Shaping metadata + payload…",
          });
          try {
            const screenshotSummary = summarizeScreenshots(screenshots ?? null);

            const metadata: Record<string, unknown> = {
              demo: true,
              featureId: feature.id,
              selectedTargetKey,
              containerContext: containerContext ?? null,
              connectedData: connectedData ?? null,
              screenshots: screenshotSummary,
              integrationMode:
                feature.id === "framework-agnostic" ? integrationMode : undefined,
            };

            const payload = buildAnyclickPayload(targetEl, feature.id, {
              metadata,
            });

            // Attach screenshots for demo purposes (payload supports it)
            if (screenshots) {
              payload.screenshots = screenshots;
            }

            await sleep(200);
            if (runTokenRef.current !== token) return;

            setArtifacts((prev) => ({
              ...prev,
              metadata,
              payload,
              // Keep the page context captured in step 3 for display
              pageContext: prev.pageContext ?? pageContext,
            }));
            updateStep("metadata", {
              status: "success",
              durationMs: nowMs() - start,
              detail: `Payload type: ${payload.type}`,
            });
            setRunStatus("success");

            if (action.setActivePanel) {
              setActivePanel(action.setActivePanel);
            }
          } catch (err) {
            if (runTokenRef.current !== token) return;
            updateStep("metadata", {
              status: "error",
              durationMs: nowMs() - start,
              errorMessage: err instanceof Error ? err.message : String(err),
            });
            setRunStatus("idle");
            return;
          }
        }
      }
    },
    [
      artifacts,
      copyToClipboard,
      feature.demo.defaultPanel,
      feature.demo.runner.enableScreenshots,
      feature.demo.runner.includeInspectInfo,
      feature.id,
      getActiveTargetElement,
      integrationMode,
      reset,
      selectedTargetKey,
      updateStep,
    ],
  );

  const handleTargetClick = React.useCallback(
    (key: string) => {
      if (!isTargetPickerEnabled) return;
      setSelectedTargetKey(key);
      setIsTargetPickerEnabled(false);
      showToast(`Target selected: ${key}`, "info");
    },
    [isTargetPickerEnabled],
  );

  const menuItems: ContextMenuItem[] = React.useMemo(() => {
    return feature.demo.menuItems.map((item) => ({
      icon: item.icon,
      label: item.label,
      showComment: false,
      type: `demo-${feature.id}-${item.id}`,
      onClick: async ({ closeMenu }) => {
        closeMenu();
        await handleAction(item.action);
      },
    }));
  }, [feature.demo.menuItems, feature.id, handleAction]);

  const onOpenMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setMenuVisible(true);
    },
    [],
  );

  const onCloseMenu = React.useCallback(() => {
    setMenuVisible(false);
    setMenuPosition(OFFSCREEN_POSITION);
  }, []);

  const demoHeader = (
    <div className="flex items-center justify-between gap-4">
      <div className="text-xs text-gray-400">
        Right-click inside this demo for actions.
      </div>
      <div className="text-xs text-gray-500">
        {runStatus === "running"
          ? "Running…"
          : runStatus === "success"
            ? "Capture complete"
            : "Idle"}
      </div>
    </div>
  );

  const screenshotsSummary = React.useMemo(
    () => summarizeScreenshots(artifacts.screenshots),
    [artifacts.screenshots],
  );

  const dataPanel = (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-black/30 p-3">
        {demoHeader}
      </div>

      <details className="rounded-lg border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-xs font-medium text-white">
          Element context
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto text-xs text-gray-300">
          {safeJson(artifacts.elementContext ?? null)}
        </pre>
      </details>

      {artifacts.inspectInfo ? (
        <details className="rounded-lg border border-white/10 bg-black/20 p-3">
          <summary className="cursor-pointer text-xs font-medium text-white">
            Inspect info
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto text-xs text-gray-300">
            {safeJson(artifacts.inspectInfo)}
          </pre>
        </details>
      ) : null}

      <details className="rounded-lg border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-xs font-medium text-white">
          Container context
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto text-xs text-gray-300">
          {safeJson(artifacts.containerContext ?? null)}
        </pre>
      </details>

      <details className="rounded-lg border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-xs font-medium text-white">
          Page context
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto text-xs text-gray-300">
          {safeJson(artifacts.pageContext ?? null)}
        </pre>
      </details>

      <details className="rounded-lg border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-xs font-medium text-white">
          Connected data
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto text-xs text-gray-300">
          {safeJson(artifacts.connectedData ?? null)}
        </pre>
      </details>

      <details className="rounded-lg border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-xs font-medium text-white">
          Metadata + payload (sanitized)
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto text-xs text-gray-300">
          {safeJson({
            metadata: artifacts.metadata ?? null,
            payload: artifacts.payload
              ? {
                  ...artifacts.payload,
                  screenshots: artifacts.payload.screenshots
                    ? summarizeScreenshots(artifacts.payload.screenshots)
                    : undefined,
                }
              : null,
          })}
        </pre>
      </details>

      {feature.demo.runner.enableScreenshots ? (
        <details className="rounded-lg border border-white/10 bg-black/20 p-3">
          <summary className="cursor-pointer text-xs font-medium text-white">
            Screenshots
          </summary>
          <div className="mt-2 space-y-3">
            <pre className="max-h-56 overflow-auto text-xs text-gray-300">
              {safeJson(screenshotsSummary)}
            </pre>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(
                [
                  ["element", artifacts.screenshots?.element?.dataUrl],
                  ["container", artifacts.screenshots?.container?.dataUrl],
                  ["viewport", artifacts.screenshots?.viewport?.dataUrl],
                ] as const
              ).map(([label, dataUrl]) => (
                <div
                  key={label}
                  className="overflow-hidden rounded-lg border border-white/10 bg-white/3"
                >
                  <div className="border-b border-white/10 px-2 py-1 text-[11px] text-gray-400">
                    {label}
                  </div>
                  {dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`${label} screenshot`}
                      src={dataUrl}
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center text-xs text-gray-500">
                      n/a
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );

  const statusPanel = (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-black/30 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-gray-400">
            Run status:{" "}
            <span className="font-medium text-white">{runStatus}</span>
          </div>
          <div className="text-xs text-gray-500">
            Screenshot support:{" "}
            <span className="font-medium text-white">
              {isScreenshotSupported() ? "yes" : "no"}
            </span>
          </div>
        </div>
      </div>

      <pre className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
        {safeJson({
          steps: stepStates,
          simulatedFallbacks: Object.entries(stepStates)
            .filter(([, s]) => s.status === "simulated")
            .map(([k]) => k),
          screenshotErrors: screenshotsSummary?.errors ?? null,
        })}
      </pre>
    </div>
  );

  const nextPanel = (
    <div className="space-y-3">
      {feature.id === "github-integration" ? (
        <pre className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
          {artifacts.issueMarkdown ?? "Run the capture to draft an issue…"}
        </pre>
      ) : feature.id === "ai-agent" ? (
        <pre className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
          {safeJson(artifacts.agentInput ?? {})}
        </pre>
      ) : feature.id === "framework-agnostic" ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-gray-400">
              Mode:{" "}
              <span className="font-medium text-white">
                {integrationMode.framework} / {integrationMode.scope}
              </span>
            </div>
          </div>
          <pre className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
            {buildIntegrationSnippet(integrationMode)}
          </pre>
        </div>
      ) : feature.id === "zero-config" ? (
        <pre className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
          {buildZeroConfigSnippet()}
        </pre>
      ) : (
        <pre className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
          {safeJson({
            metadata: artifacts.metadata ?? null,
            payload: artifacts.payload
              ? {
                  ...artifacts.payload,
                  screenshots: artifacts.payload.screenshots
                    ? summarizeScreenshots(artifacts.payload.screenshots)
                    : undefined,
                }
              : null,
          })}
        </pre>
      )}
    </div>
  );

  const primary = feature.demo.primaryCta;
  const secondary = feature.demo.secondaryCta;

  return (
    <div
      className={cn("space-y-4", className)}
      data-anyclick-ignore
      onContextMenu={onOpenMenu}
      {...props}
    >
      {/* CTA row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={runStatus === "running"}
          onClick={() => handleAction(primary.action)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "bg-white/10 hover:bg-white/15 border border-white/10",
            runStatus === "running" ? "opacity-60 cursor-not-allowed" : "",
          )}
        >
          {primary.action.kind === "startCapture" ? (
            <Target className="h-4 w-4" />
          ) : primary.action.kind === "toggleIntegrationMode" ? (
            <Sparkles className="h-4 w-4" />
          ) : primary.action.kind === "copy" ? (
            <Clipboard className="h-4 w-4" />
          ) : (
            <Target className="h-4 w-4" />
          )}
          {primary.label}
        </button>

        {secondary ? (
          (() => {
            const isSecondaryDisabled =
              runStatus === "running" ||
              (secondary.action.kind === "retakeScreenshots" &&
                runStatus !== "success");

            return (
          <button
            type="button"
            disabled={isSecondaryDisabled}
            onClick={() => handleAction(secondary.action)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200",
              isSecondaryDisabled ? "opacity-60 cursor-not-allowed" : "",
            )}
          >
            {secondary.action.kind === "toggleTargetPicker" ? (
              <Target className="h-4 w-4" />
            ) : secondary.action.kind === "retakeScreenshots" ? (
              <RotateCcw className="h-4 w-4" />
            ) : secondary.action.kind === "copy" ? (
              <Clipboard className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            {secondary.label}
          </button>
            );
          })()
        ) : null}

        <button
          type="button"
          onClick={() => handleAction({ kind: "reset" })}
          className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {/* Demo sandbox (captures real DOM context from these elements) */}
      <div
        ref={containerRef}
        className={cn(
          "rounded-xl border border-white/10 bg-black/20 p-4",
          isTargetPickerEnabled ? "ring-1 ring-amber-400/50" : "",
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs font-medium text-gray-300">
            Demo sandbox
            <span className="ml-2 text-xs text-gray-500">
              (selected:{" "}
              <span className="font-medium text-white">{selectedTargetKey}</span>)
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {isTargetPickerEnabled
              ? "Click an element below to select it"
              : "Click primary CTA to run capture"}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <button
            ref={setTargetRef("primary")}
            type="button"
            onClick={() => handleTargetClick("primary")}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition-colors",
              selectedTargetKey === "primary"
                ? "border-white/25 bg-white/10"
                : "border-white/10 bg-white/5 hover:bg-white/8",
            )}
          >
            Primary action
          </button>

          <button
            ref={setTargetRef("secondary")}
            type="button"
            onClick={() => handleTargetClick("secondary")}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition-colors",
              selectedTargetKey === "secondary"
                ? "border-white/25 bg-white/10"
                : "border-white/10 bg-white/5 hover:bg-white/8",
            )}
          >
            Secondary action
          </button>

          <div
            ref={setTargetRef("info")}
            role="button"
            tabIndex={0}
            onClick={() => handleTargetClick("info")}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTargetClick("info");
            }}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition-colors select-none",
              selectedTargetKey === "info"
                ? "border-white/25 bg-white/10"
                : "border-white/10 bg-white/5 hover:bg-white/8",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span>Info row</span>
              <Braces className="h-4 w-4 text-gray-400" />
            </div>
            <div className="mt-1 text-xs text-gray-500">
              data-attrs, text, hierarchy
            </div>
          </div>
        </div>
      </div>

      {/* Workflow timeline */}
      <CaptureWorkflowTimeline
        steps={steps}
        stepStates={stepStates}
        accent={{
          dot: feature.colorClasses.dot,
          dotMuted: feature.colorClasses.dotMuted,
          text: feature.colorClasses.text,
        }}
      />

      {/* Details */}
      <CaptureDetailsPanel
        activePanel={activePanel}
        onChangePanel={setActivePanel}
        panels={{ data: dataPanel, next: nextPanel, status: statusPanel }}
      />

      {/* Card-local context menu */}
      <ContextMenu
        containerElement={containerRef.current}
        header={<></>}
        highlightConfig={{ enabled: false }}
        isSubmitting={false}
        items={menuItems}
        onClose={onCloseMenu}
        onSelect={() => {
          // no-op: all items are handled via onClick hooks
        }}
        position={menuPosition}
        screenshotConfig={{ enabled: false, showPreview: false }}
        targetElement={getActiveTargetElement() ?? containerRef.current}
        visible={menuVisible}
      />
    </div>
  );
}

