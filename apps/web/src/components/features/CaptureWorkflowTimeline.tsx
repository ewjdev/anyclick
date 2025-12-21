"use client";

import * as React from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type CaptureStepId = "connected" | "container" | "element" | "metadata";
export type CaptureStepStatus =
  | "error"
  | "idle"
  | "running"
  | "simulated"
  | "success";

export interface CaptureStep {
  id: CaptureStepId;
  label: string;
}

export interface CaptureStepState {
  detail?: string;
  durationMs?: number;
  errorMessage?: string;
  status: CaptureStepStatus;
}

export interface CaptureWorkflowTimelineProps
  extends React.HTMLAttributes<HTMLDivElement> {
  accent: {
    dot: string;
    dotMuted: string;
    text: string;
  };
  steps: CaptureStep[];
  stepStates: Record<CaptureStepId, CaptureStepState>;
}

function formatDuration(durationMs?: number) {
  if (typeof durationMs !== "number") return null;
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  return `${(durationMs / 1000).toFixed(2)}s`;
}

export function CaptureWorkflowTimeline({
  accent,
  className,
  steps,
  stepStates,
  ...props
}: CaptureWorkflowTimelineProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-4",
        className,
      )}
      {...props}
    >
      {/* Progress dots */}
      <div className="mb-4 flex items-center justify-center gap-3">
        {steps.map((step) => {
          const state = stepStates[step.id];
          const dotClass =
            state.status === "running"
              ? `${accent.dot} scale-125`
              : state.status === "success" || state.status === "simulated"
                ? accent.dotMuted
                : state.status === "error"
                  ? "bg-red-500"
                  : "bg-white/20";

          return (
            <div
              key={step.id}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-all duration-300",
                dotClass,
              )}
              aria-label={`${step.label}: ${state.status}`}
              title={`${step.label}: ${state.status}`}
            />
          );
        })}
      </div>

      {/* Step list */}
      <div className="space-y-3">
        {steps.map((step) => {
          const state = stepStates[step.id];
          const durationLabel = formatDuration(state.durationMs);

          return (
            <div key={step.id} className="flex items-start gap-3">
              <div className="mt-0.5">
                {state.status === "running" ? (
                  <Loader2 className={cn("h-4 w-4 animate-spin", accent.text)} />
                ) : state.status === "success" ? (
                  <Check className={cn("h-4 w-4", accent.text)} />
                ) : state.status === "simulated" ? (
                  <Check className={cn("h-4 w-4 opacity-70", accent.text)} />
                ) : state.status === "error" ? (
                  <TriangleAlert className="h-4 w-4 text-red-400" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-white/15" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-white">
                    {step.label}
                    {state.status === "simulated" ? (
                      <span className="ml-2 text-xs font-normal text-amber-300/80">
                        simulated
                      </span>
                    ) : null}
                  </div>
                  {durationLabel ? (
                    <div className="shrink-0 text-xs text-gray-500">
                      {durationLabel}
                    </div>
                  ) : null}
                </div>

                {state.status === "error" && state.errorMessage ? (
                  <div className="mt-1 text-xs text-red-300">
                    {state.errorMessage}
                  </div>
                ) : state.detail ? (
                  <div className="mt-1 text-xs text-gray-400">
                    {state.detail}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-gray-500">
                    {state.status === "idle" ? "Waiting…" : ""}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

