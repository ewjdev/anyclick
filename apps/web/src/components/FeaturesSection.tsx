"use client";

import {
  Camera,
  GitBranch,
  Layers,
  MousePointerClick,
  Terminal,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { HomepageIntent } from "@/lib/intents";
import { useTrackIntent, useSectionViewWithRef } from "@/lib/tracking";

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: typeof Camera;
  color: string;
  hoverBorder: string;
};

const features: Feature[] = [
  {
    id: "context-capture",
    title: "Context-Aware Capture",
    description:
      "Right-click any element to capture its full DOM context, including selectors, data attributes, ancestors, and surrounding page information.",
    icon: MousePointerClick,
    color: "violet",
    hoverBorder: "hover:border-violet-500/30",
  },
  {
    id: "visual-capture",
    title: "Visual Capture",
    description:
      "Automatically capture screenshots of the target element, its container, and the full page—all included in the feedback payload.",
    icon: Camera,
    color: "cyan",
    hoverBorder: "hover:border-cyan-500/30",
  },
  {
    id: "code-integration",
    title: "Code Source Integration",
    description:
      "Automatically create GitHub Issues with rich context, formatted markdown, and embedded screenshots for seamless issue tracking.",
    icon: GitBranch,
    color: "emerald",
    hoverBorder: "hover:border-emerald-500/30",
  },
  {
    id: "ai-agent",
    title: "AI Agent",
    description:
      "Launch Cursor's AI agent directly from feedback—locally during development or via cloud agent for instant code fixes.",
    icon: Terminal,
    color: "amber",
    hoverBorder: "hover:border-amber-500/30",
  },
  {
    id: "framework-agnostic",
    title: "Framework Agnostic",
    description:
      "Core library works with any JavaScript framework. Use the React provider for React apps, or build your own integration.",
    icon: Layers,
    color: "rose",
    hoverBorder: "hover:border-rose-500/30",
  },
  {
    id: "zero-config",
    title: "Zero Config",
    description:
      "Works out of the box with sensible defaults. Right-click anywhere in your app and start capturing feedback immediately.",
    icon: Zap,
    color: "indigo",
    hoverBorder: "hover:border-indigo-500/30",
  },
];

const colorClasses: Record<string, { icon: string; bg: string }> = {
  violet: {
    icon: "text-violet-400",
    bg: "from-violet-500/20 to-violet-500/5",
  },
  cyan: {
    icon: "text-cyan-400",
    bg: "from-cyan-500/20 to-cyan-500/5",
  },
  emerald: {
    icon: "text-emerald-400",
    bg: "from-emerald-500/20 to-emerald-500/5",
  },
  amber: {
    icon: "text-amber-400",
    bg: "from-amber-500/20 to-amber-500/5",
  },
  rose: {
    icon: "text-rose-400",
    bg: "from-rose-500/20 to-rose-500/5",
  },
  indigo: {
    icon: "text-indigo-400",
    bg: "from-indigo-500/20 to-indigo-500/5",
  },
};

function FeatureCard({ feature }: { feature: Feature }) {
  const { track } = useTrackIntent();
  const Icon = feature.icon;
  const colors = colorClasses[feature.color];
  const hoveredRef = useRef(false);

  const handleMouseEnter = () => {
    if (!hoveredRef.current) {
      hoveredRef.current = true;
      track(HomepageIntent.FEATURES_CARD_HOVER, {
        properties: { featureId: feature.id, featureTitle: feature.title },
      });
    }
  };

  return (
    <div
      className={`group p-6 rounded-2xl bg-white/2 border border-white/5 ${feature.hoverBorder} transition-all hover:bg-white/4`}
      onMouseEnter={handleMouseEnter}
      data-ac-intent={HomepageIntent.FEATURES_CARD_HOVER}
      data-ac-feature={feature.id}
    >
      <div
        className={`w-12 h-12 rounded-xl bg-linear-to-br ${colors.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon className={`w-6 h-6 ${colors.icon}`} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}

const FeaturesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Track section view
  useSectionViewWithRef(sectionRef, {
    intent: HomepageIntent.FEATURES_SECTION_VIEW,
    threshold: 0.3,
  });

  return (
    <div
      ref={sectionRef}
      className="max-w-7xl mx-auto relative"
      data-ac-intent={HomepageIntent.FEATURES_SECTION_VIEW}
    >
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Everything you need for UI context
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          From capturing user intent to automatic code fixes, anyclick
          streamlines the entire feedback workflow.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
    </div>
  );
};

export default FeaturesSection;
