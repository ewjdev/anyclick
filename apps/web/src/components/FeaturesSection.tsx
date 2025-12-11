"use client";

import * as React from "react";
import {
  Camera,
  Clipboard,
  Eye,
  FileText,
  GitBranch,
  Info,
  Layers,
  MousePointerClick,
  RotateCcw,
  Sparkles,
  Terminal,
  Target,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { FeatureCard } from "@/components/features/FeatureCard";
import type { FeatureConfig } from "@/components/features/types";

const features: FeatureConfig[] = [
  {
    id: "context-capture",
    icon: <MousePointerClick className="h-6 w-6" />,
    title: "Context-aware container",
    description:
      "Click to expand and explore a capture that starts with element + container context (no auto-play).",
    expandedDescription:
      "Start a capture to see element context, container context, connected data, and how Anyclick metadata is shaped for the next action.",
    linkHref: "/examples/basic",
    linkText: "Try the demo",
    color: "violet",
    colorClasses: {
      border: "border-violet-500/30",
      bg: "bg-violet-500",
      text: "text-violet-400",
      iconBg: "from-violet-500/20 to-violet-500/5",
      dot: "bg-violet-500",
      dotMuted: "bg-violet-500/50",
    },
    demo: {
      defaultPanel: "data",
      primaryCta: {
        label: "Start capture",
        action: { kind: "startCapture", setActivePanel: "data" },
      },
      secondaryCta: {
        label: "Pick a target",
        action: { kind: "toggleTargetPicker" },
      },
      menuItems: [
        {
          id: "view-data",
          label: "View capture data",
          icon: <Eye className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "data" },
        },
        {
          id: "view-status",
          label: "View status",
          icon: <Info className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "status" },
        },
        {
          id: "view-next",
          label: "View next action",
          icon: <Sparkles className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "next" },
        },
        {
          id: "copy-payload",
          label: "Copy payload JSON",
          icon: <Clipboard className="h-4 w-4" />,
          action: { kind: "copy", target: "payloadJson" },
        },
        {
          id: "reset",
          label: "Reset capture",
          icon: <RotateCcw className="h-4 w-4" />,
          action: { kind: "reset" },
        },
      ],
      runner: {
        enableScreenshots: false,
        includeInspectInfo: true,
      },
    },
  },
  {
    id: "visual-capture",
    icon: <Camera className="h-6 w-6" />,
    title: "Visual capture",
    description:
      "Capture element/container/viewport screenshots (when supported) and inspect sizes + errors.",
    expandedDescription:
      "Run a visual capture to see screenshots (or fallback errors), masking behavior, and how visuals attach to downstream workflows.",
    linkHref: "/examples/basic",
    linkText: "See it in action",
    color: "cyan",
    colorClasses: {
      border: "border-cyan-500/30",
      bg: "bg-cyan-500",
      text: "text-cyan-400",
      iconBg: "from-cyan-500/20 to-cyan-500/5",
      dot: "bg-cyan-500",
      dotMuted: "bg-cyan-500/50",
    },
    demo: {
      defaultPanel: "data",
      primaryCta: {
        label: "Capture screenshots",
        action: { kind: "startCapture", setActivePanel: "data" },
      },
      secondaryCta: {
        label: "Retake",
        action: { kind: "retakeScreenshots" },
      },
      menuItems: [
        {
          id: "view-screenshots",
          label: "View screenshots",
          icon: <Eye className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "data" },
        },
        {
          id: "view-mask",
          label: "View mask list",
          icon: <FileText className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "data" },
        },
        {
          id: "view-status",
          label: "View status",
          icon: <Info className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "status" },
        },
        {
          id: "copy-sizes",
          label: "Copy screenshot sizes",
          icon: <Clipboard className="h-4 w-4" />,
          action: { kind: "copy", target: "screenshotSummary" },
        },
        {
          id: "reset",
          label: "Reset capture",
          icon: <RotateCcw className="h-4 w-4" />,
          action: { kind: "reset" },
        },
      ],
      runner: {
        enableScreenshots: true,
        includeInspectInfo: false,
      },
    },
  },
  {
    id: "github-integration",
    icon: <GitBranch className="h-6 w-6" />,
    title: "Code source integration",
    description:
      "Draft rich GitHub issue content from captured context (no network calls in the demo).",
    expandedDescription:
      "Capture context and assemble an issue draft (markdown) showing how element + page context become developer-ready artifacts.",
    linkHref: "/examples/github-integration",
    linkText: "View integration",
    color: "emerald",
    colorClasses: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500",
      text: "text-emerald-400",
      iconBg: "from-emerald-500/20 to-emerald-500/5",
      dot: "bg-emerald-500",
      dotMuted: "bg-emerald-500/50",
    },
    demo: {
      defaultPanel: "next",
      primaryCta: {
        label: "Draft GitHub issue",
        action: { kind: "startCapture", setActivePanel: "next" },
      },
      secondaryCta: {
        label: "Copy issue markdown",
        action: { kind: "copy", target: "issueMarkdown" },
      },
      menuItems: [
        {
          id: "view-issue",
          label: "View issue draft",
          icon: <FileText className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "next" },
        },
        {
          id: "view-payload",
          label: "View payload JSON",
          icon: <Eye className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "data" },
        },
        {
          id: "view-status",
          label: "View status",
          icon: <Info className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "status" },
        },
        {
          id: "copy-issue",
          label: "Copy issue markdown",
          icon: <Clipboard className="h-4 w-4" />,
          action: { kind: "copy", target: "issueMarkdown" },
        },
        {
          id: "reset",
          label: "Reset",
          icon: <RotateCcw className="h-4 w-4" />,
          action: { kind: "reset" },
        },
      ],
      runner: {
        enableScreenshots: true,
        includeInspectInfo: false,
      },
    },
  },
  {
    id: "ai-agent",
    icon: <Terminal className="h-6 w-6" />,
    title: "AI agent",
    description:
      "Shape capture context into a structured agent input for fast debugging and next steps.",
    expandedDescription:
      "Run capture and see the exact context bundle (prompt + structured data) that an agent would receive.",
    linkHref: "/examples/cursor-local",
    linkText: "Explore AI features",
    color: "amber",
    colorClasses: {
      border: "border-amber-500/30",
      bg: "bg-amber-500",
      text: "text-amber-400",
      iconBg: "from-amber-500/20 to-amber-500/5",
      dot: "bg-amber-500",
      dotMuted: "bg-amber-500/50",
    },
    demo: {
      defaultPanel: "next",
      primaryCta: {
        label: "Ask AI about this",
        action: { kind: "startCapture", setActivePanel: "next" },
      },
      secondaryCta: {
        label: "Copy agent context",
        action: { kind: "copy", target: "agentContext" },
      },
      menuItems: [
        {
          id: "view-agent",
          label: "View agent input",
          icon: <Sparkles className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "next" },
        },
        {
          id: "view-payload",
          label: "View payload JSON",
          icon: <Eye className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "data" },
        },
        {
          id: "view-status",
          label: "View status",
          icon: <Info className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "status" },
        },
        {
          id: "copy-agent",
          label: "Copy agent context",
          icon: <Clipboard className="h-4 w-4" />,
          action: { kind: "copy", target: "agentContext" },
        },
        {
          id: "reset",
          label: "Reset",
          icon: <RotateCcw className="h-4 w-4" />,
          action: { kind: "reset" },
        },
      ],
      runner: {
        enableScreenshots: false,
        includeInspectInfo: false,
      },
    },
  },
  {
    id: "framework-agnostic",
    icon: <Layers className="h-6 w-6" />,
    title: "Framework agnostic",
    description:
      "Switch between integration modes and copy the right snippet for your stack.",
    expandedDescription:
      "Toggle integration wiring (React vs vanilla, scoped vs global) and see how the same capture payload powers your next action.",
    linkHref: "/docs/react",
    linkText: "View docs",
    color: "rose",
    colorClasses: {
      border: "border-rose-500/30",
      bg: "bg-rose-500",
      text: "text-rose-400",
      iconBg: "from-rose-500/20 to-rose-500/5",
      dot: "bg-rose-500",
      dotMuted: "bg-rose-500/50",
    },
    demo: {
      defaultPanel: "next",
      primaryCta: {
        label: "Toggle integration mode",
        action: { kind: "toggleIntegrationMode" },
      },
      secondaryCta: {
        label: "Copy snippet",
        action: { kind: "copy", target: "snippet" },
      },
      menuItems: [
        {
          id: "view-wiring",
          label: "View wiring",
          icon: <Eye className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "next" },
        },
        {
          id: "run-capture",
          label: "Run sample capture",
          icon: <Target className="h-4 w-4" />,
          action: { kind: "startCapture", setActivePanel: "status" },
        },
        {
          id: "view-payload",
          label: "View payload JSON",
          icon: <Eye className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "data" },
        },
        {
          id: "view-status",
          label: "View status",
          icon: <Info className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "status" },
        },
        {
          id: "copy-snippet",
          label: "Copy snippet",
          icon: <Clipboard className="h-4 w-4" />,
          action: { kind: "copy", target: "snippet" },
        },
        {
          id: "reset",
          label: "Reset",
          icon: <RotateCcw className="h-4 w-4" />,
          action: { kind: "reset" },
        },
      ],
      runner: {
        enableScreenshots: false,
        includeInspectInfo: false,
      },
    },
  },
  {
    id: "zero-config",
    icon: <Zap className="h-6 w-6" />,
    title: "Zero config",
    description:
      "Copy the minimal setup, then run a sample capture to see what comes out.",
    expandedDescription:
      "Get started in seconds. Copy the setup snippet, then run a sample capture to see the payload shape and default behavior.",
    linkHref: "/docs/getting-started",
    linkText: "Get started",
    color: "indigo",
    colorClasses: {
      border: "border-indigo-500/30",
      bg: "bg-indigo-500",
      text: "text-indigo-400",
      iconBg: "from-indigo-500/20 to-indigo-500/5",
      dot: "bg-indigo-500",
      dotMuted: "bg-indigo-500/50",
    },
    demo: {
      defaultPanel: "next",
      primaryCta: {
        label: "Copy install + wrap snippet",
        action: { kind: "copy", target: "commands" },
      },
      secondaryCta: {
        label: "Run sample capture",
        action: { kind: "startCapture", setActivePanel: "data" },
      },
      menuItems: [
        {
          id: "copy-snippet",
          label: "Copy commands + snippet",
          icon: <Clipboard className="h-4 w-4" />,
          action: { kind: "copy", target: "commands" },
        },
        {
          id: "view-payload",
          label: "View payload JSON",
          icon: <Eye className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "data" },
        },
        {
          id: "view-status",
          label: "View status",
          icon: <Info className="h-4 w-4" />,
          action: { kind: "setPanel", panel: "status" },
        },
        {
          id: "reset",
          label: "Reset",
          icon: <RotateCcw className="h-4 w-4" />,
          action: { kind: "reset" },
        },
      ],
      runner: {
        enableScreenshots: false,
        includeInspectInfo: false,
      },
    },
  },
];

export interface FeaturesSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export default function FeaturesSection({
  className,
  ...props
}: FeaturesSectionProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const handleToggle = React.useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Close expanded card when clicking outside the card area.
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        expandedId &&
        target.closest("[data-features-grid]") &&
        !target.closest("[data-feature-card]")
      ) {
        setExpandedId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [expandedId]);

  return (
    <div className={cn("max-w-7xl mx-auto relative", className)} {...props}>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Everything you need for UI context
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          From capturing user intent to automatic code fixes, anyclick
          streamlines the entire feedback workflow.
        </p>
      </div>

      <motion.div
        data-features-grid
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        layout
      >
        {features.map((feature) => (
          <div key={feature.id} data-feature-card>
            <FeatureCard
              feature={feature}
              isExpanded={expandedId === feature.id}
              onToggle={() => handleToggle(feature.id)}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
