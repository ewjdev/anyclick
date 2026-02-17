"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { captureWorkflowContext } from "./contextCapture";
import { WorkflowFlowRenderer } from "./WorkflowFlowRenderer";
import type {
  WorkflowCaptureState,
  WorkflowLaunchState,
  WorkflowWorkstreamId,
} from "./types";

interface WorkflowDrawerProps {
  activeWorkflow: WorkflowLaunchState | null;
  onClose: () => void;
}

interface WorkflowPalette {
  accent: string;
  accentSoftBg: string;
  accentSoftBorder: string;
  accentStrongBg: string;
  accentText: string;
  accentTextMuted: string;
  closeHoverBg: string;
}

const WORKSTREAM_PALETTES: Record<WorkflowWorkstreamId, WorkflowPalette> = {
  software: {
    accent: "#00ff41",
    accentSoftBg: "rgba(0, 255, 65, 0.12)",
    accentSoftBorder: "rgba(0, 255, 65, 0.35)",
    accentStrongBg: "rgba(0, 255, 65, 0.95)",
    accentText: "#c7ffd8",
    accentTextMuted: "rgba(151, 255, 185, 0.8)",
    closeHoverBg: "rgba(0, 255, 65, 0.16)",
  },
  ecommerce: {
    accent: "#f59e0b",
    accentSoftBg: "rgba(245, 158, 11, 0.14)",
    accentSoftBorder: "rgba(245, 158, 11, 0.38)",
    accentStrongBg: "rgba(245, 158, 11, 0.96)",
    accentText: "#ffe8b8",
    accentTextMuted: "rgba(255, 212, 128, 0.82)",
    closeHoverBg: "rgba(245, 158, 11, 0.18)",
  },
  healthcare: {
    accent: "#10b981",
    accentSoftBg: "rgba(16, 185, 129, 0.13)",
    accentSoftBorder: "rgba(16, 185, 129, 0.34)",
    accentStrongBg: "rgba(16, 185, 129, 0.95)",
    accentText: "#c6ffec",
    accentTextMuted: "rgba(152, 255, 224, 0.82)",
    closeHoverBg: "rgba(16, 185, 129, 0.16)",
  },
  social: {
    accent: "#ec4899",
    accentSoftBg: "rgba(236, 72, 153, 0.14)",
    accentSoftBorder: "rgba(236, 72, 153, 0.36)",
    accentStrongBg: "rgba(236, 72, 153, 0.95)",
    accentText: "#ffd7ea",
    accentTextMuted: "rgba(255, 186, 223, 0.84)",
    closeHoverBg: "rgba(236, 72, 153, 0.17)",
  },
};

function getDrawerStyle(workstream: WorkflowWorkstreamId): CSSProperties {
  const palette = WORKSTREAM_PALETTES[workstream];

  return {
    "--workflow-accent": palette.accent,
    "--workflow-accent-soft-bg": palette.accentSoftBg,
    "--workflow-accent-soft-border": palette.accentSoftBorder,
    "--workflow-accent-strong-bg": palette.accentStrongBg,
    "--workflow-accent-text": palette.accentText,
    "--workflow-accent-text-muted": palette.accentTextMuted,
    "--workflow-close-hover-bg": palette.closeHoverBg,
  } as CSSProperties;
}

const INITIAL_CAPTURE_STATE: WorkflowCaptureState = {
  data: null,
  status: "idle",
};

export function WorkflowDrawer({
  activeWorkflow,
  onClose,
}: WorkflowDrawerProps) {
  const [captureState, setCaptureState] =
    useState<WorkflowCaptureState>(INITIAL_CAPTURE_STATE);

  const drawerStyle = getDrawerStyle(
    activeWorkflow?.action.workstream ?? "software",
  );

  const refreshCapture = useCallback(async () => {
    if (!activeWorkflow) return;

    setCaptureState({ data: null, status: "capturing" });

    try {
      const data = await captureWorkflowContext(
        activeWorkflow.targetElement,
        activeWorkflow.containerElement,
      );

      setCaptureState({
        data,
        status: "ready",
      });
    } catch (error) {
      setCaptureState({
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to capture workflow context",
        status: "ready",
      });
    }
  }, [activeWorkflow]);

  useEffect(() => {
    if (!activeWorkflow) {
      setCaptureState(INITIAL_CAPTURE_STATE);
      return;
    }

    let isActive = true;

    setCaptureState({ data: null, status: "capturing" });

    captureWorkflowContext(
      activeWorkflow.targetElement,
      activeWorkflow.containerElement,
    )
      .then((data) => {
        if (!isActive) return;
        setCaptureState({ data, status: "ready" });
      })
      .catch((error) => {
        if (!isActive) return;
        setCaptureState({
          data: null,
          error:
            error instanceof Error
              ? error.message
              : "Failed to capture workflow context",
          status: "ready",
        });
      });

    return () => {
      isActive = false;
    };
  }, [activeWorkflow]);

  useEffect(() => {
    if (!activeWorkflow) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeWorkflow]);

  useEffect(() => {
    if (!activeWorkflow) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [activeWorkflow, onClose]);

  if (!activeWorkflow) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[12000]">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
        aria-label="Close workflow drawer"
      />

      <aside
        className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-white/10 bg-[#080b12] shadow-2xl shadow-black/70"
        style={drawerStyle}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p
              className="text-xs uppercase tracking-[0.16em]"
              style={{ color: "var(--workflow-accent-text-muted)" }}
            >
              Anyclick workflow preview
            </p>
            <h3 className="text-lg font-semibold text-white">
              {activeWorkflow.action.menuLabel}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/15 p-2 text-gray-300 transition-colors hover:text-white"
            style={{
              backgroundColor: "transparent",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor =
                "var(--workflow-close-hover-bg)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Close workflow drawer"
          >
            <X size={16} />
          </button>
        </div>

        <WorkflowFlowRenderer
          launch={activeWorkflow}
          captureState={captureState}
          onClose={onClose}
          onRetryCapture={refreshCapture}
        />
      </aside>
    </div>
  );
}
