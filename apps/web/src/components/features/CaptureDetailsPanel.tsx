"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { DemoPanel } from "./types";

export interface CaptureDetailsPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  activePanel: DemoPanel;
  onChangePanel: (panel: DemoPanel) => void;
  panels: {
    data: React.ReactNode;
    next: React.ReactNode;
    status: React.ReactNode;
  };
}

const panelLabels: Record<DemoPanel, string> = {
  data: "Data",
  next: "Next action",
  status: "Status",
};

export function CaptureDetailsPanel({
  activePanel,
  className,
  onChangePanel,
  panels,
  ...props
}: CaptureDetailsPanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 overflow-hidden",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-1 border-b border-white/10 bg-white/3 p-1">
        {(Object.keys(panelLabels) as DemoPanel[]).map((panel) => (
          <button
            key={panel}
            type="button"
            onClick={() => onChangePanel(panel)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              activePanel === panel
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white",
            )}
          >
            {panelLabels[panel]}
          </button>
        ))}
      </div>

      <div className="p-3">
        {activePanel === "data"
          ? panels.data
          : activePanel === "status"
            ? panels.status
            : panels.next}
      </div>
    </div>
  );
}

