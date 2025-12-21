import type { ReactNode } from "react";

export type DemoPanel = "data" | "next" | "status";

export type FeatureDemoActionKind =
  | "copy"
  | "reset"
  | "retakeScreenshots"
  | "setPanel"
  | "startCapture"
  | "toggleIntegrationMode"
  | "toggleTargetPicker";

export type CopyTarget =
  | "agentContext"
  | "commands"
  | "issueMarkdown"
  | "payloadJson"
  | "screenshotSummary"
  | "snippet";

export type FeatureDemoAction =
  | {
      kind: "startCapture";
      /** Optional hint to switch panels after starting capture. */
      setActivePanel?: DemoPanel;
    }
  | { kind: "reset" }
  | { kind: "toggleTargetPicker" }
  | { kind: "retakeScreenshots" }
  | { kind: "toggleIntegrationMode" }
  | { kind: "setPanel"; panel: DemoPanel }
  | { kind: "copy"; target: CopyTarget };

export interface FeatureDemoMenuItem {
  action: FeatureDemoAction;
  icon?: ReactNode;
  id: string;
  label: string;
}

export interface FeatureDemoConfig {
  /** Default panel when the card expands (and after reset). */
  defaultPanel: DemoPanel;
  /** Primary CTA shown in the card. */
  primaryCta: { action: FeatureDemoAction; label: string };
  /** Optional secondary CTA shown in the card. */
  secondaryCta?: { action: FeatureDemoAction; label: string };
  /** Right-click menu items for the demo area. */
  menuItems: FeatureDemoMenuItem[];
  /** Capture runner options for this card. */
  runner: {
    enableScreenshots?: boolean;
    includeInspectInfo?: boolean;
  };
}

export interface FeatureConfig {
  color: string;
  colorClasses: {
    bg: string;
    border: string;
    dot: string;
    dotMuted: string;
    iconBg: string;
    text: string;
  };
  demo: FeatureDemoConfig;
  description: string;
  expandedDescription: string;
  icon: ReactNode;
  id: string;
  linkHref: string;
  linkText: string;
  title: string;
}

