"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  GitBranch,
  Layers,
  Loader2,
  MousePointerClick,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

interface WorkflowStep {
  label: string;
  detail: string;
}

interface FeatureConfig {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  expandedDescription: string;
  workflow: WorkflowStep[];
  linkHref: string;
  linkText: string;
  color: string;
  colorClasses: {
    border: string;
    bg: string;
    text: string;
    iconBg: string;
    dot: string;
    dotMuted: string;
  };
}

// ============================================================================
// Feature Configurations
// ============================================================================

const features: FeatureConfig[] = [
  {
    id: "context-capture",
    icon: <MousePointerClick className="w-6 h-6" />,
    title: "Context-Aware Capture",
    description:
      "Right-click any element to capture its full DOM context, including selectors, data attributes, ancestors, and surrounding page information.",
    expandedDescription:
      "When you right-click an element, Anyclick captures comprehensive context about that element and its surroundings—CSS selectors, attributes, parent containers, and more.",
    workflow: [
      { label: "Detecting element", detail: "Finding target under cursor..." },
      {
        label: "Capturing context",
        detail: "CSS selector, attributes, ancestors",
      },
      { label: "Analyzing hierarchy", detail: "Parent containers, siblings" },
      { label: "Context ready", detail: "Full element context captured ✓" },
    ],
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
  },
  {
    id: "visual-capture",
    icon: <Camera className="w-6 h-6" />,
    title: "Visual Capture",
    description:
      "Automatically capture screenshots of the target element, its container, and the full page—all included in the feedback payload.",
    expandedDescription:
      "Anyclick captures multiple screenshots automatically—the clicked element, its container, and the full viewport—providing complete visual context for debugging.",
    workflow: [
      {
        label: "Preparing capture",
        detail: "Initializing screenshot engine...",
      },
      { label: "Capturing element", detail: "Taking element screenshot..." },
      { label: "Capturing viewport", detail: "Taking full page screenshot..." },
      { label: "Screenshots ready", detail: "2 screenshots captured ✓" },
    ],
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
  },
  {
    id: "github-integration",
    icon: <GitBranch className="w-6 h-6" />,
    title: "Code Source Integration",
    description:
      "Automatically create GitHub Issues with rich context, formatted markdown, and embedded screenshots for seamless issue tracking.",
    expandedDescription:
      "Connect to GitHub and automatically create issues with all captured context—formatted markdown, embedded screenshots, and element details ready for developers.",
    workflow: [
      { label: "Gathering context", detail: "Element data + screenshots..." },
      {
        label: "Formatting issue",
        detail: "Creating markdown with context...",
      },
      { label: "Creating issue", detail: "Sending to GitHub API..." },
      { label: "Issue created", detail: "Issue #234 created ✓" },
    ],
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
  },
  {
    id: "ai-agent",
    icon: <Terminal className="w-6 h-6" />,
    title: "AI Agent",
    description:
      "Launch Cursor's AI agent directly from feedback—locally during development or via cloud agent for instant code fixes.",
    expandedDescription:
      "Trigger AI-powered code assistance directly from captured feedback. The AI agent receives full element context to understand and fix issues automatically.",
    workflow: [
      { label: "Analyzing context", detail: "AI processing element..." },
      { label: "Understanding intent", detail: "Determining action type..." },
      { label: "Generating response", detail: "Creating suggestions..." },
      { label: "Ready", detail: "AI response ready ✓" },
    ],
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
  },
  {
    id: "framework-agnostic",
    icon: <Layers className="w-6 h-6" />,
    title: "Framework Agnostic",
    description:
      "Core library works with any JavaScript framework. Use the React provider for React apps, or build your own integration.",
    expandedDescription:
      "Anyclick's core is framework-agnostic. Use our React provider for React/Next.js apps, or integrate the core library with Vue, Svelte, or vanilla JavaScript.",
    workflow: [
      {
        label: "Detecting framework",
        detail: "Checking for React/Vue/Svelte...",
      },
      { label: "Loading adapter", detail: "Initializing React adapter..." },
      { label: "Attaching listeners", detail: "Context menu ready..." },
      { label: "Active", detail: "Anyclick enabled ✓" },
    ],
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
  },
  {
    id: "zero-config",
    icon: <Zap className="w-6 h-6" />,
    title: "Zero Config",
    description:
      "Works out of the box with sensible defaults. Right-click anywhere in your app and start capturing feedback immediately.",
    expandedDescription:
      "Get started in seconds. Wrap your app with AnyclickProvider, and you're ready to capture feedback. No complex configuration required.",
    workflow: [
      { label: "Installing", detail: "npm install @ewjdev/anyclick-react" },
      { label: "Wrapping app", detail: "Adding AnyclickProvider..." },
      { label: "Configuring", detail: "Default settings applied..." },
      { label: "Ready", detail: "Start right-clicking! ✓" },
    ],
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
  },
];

// ============================================================================
// WorkflowVisualization Component
// ============================================================================

function WorkflowVisualization({
  steps,
  isActive,
  colorClasses,
}: {
  steps: WorkflowStep[];
  isActive: boolean;
  colorClasses: FeatureConfig["colorClasses"];
}) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isActive, steps.length]);

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="mt-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-3 mb-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`
              w-2.5 h-2.5 rounded-full transition-all duration-300
              ${
                i === currentStep
                  ? `${colorClasses.dot} scale-125`
                  : i < currentStep
                    ? colorClasses.dotMuted
                    : "bg-white/20"
              }
            `}
          />
        ))}
      </div>

      {/* Current step display */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-1">
          {isLastStep ? (
            <Check className={`w-4 h-4 ${colorClasses.text}`} />
          ) : (
            <Loader2 className={`w-4 h-4 ${colorClasses.text} animate-spin`} />
          )}
          <span className="font-medium text-white">
            {steps[currentStep].label}
          </span>
        </div>
        <p className="text-sm text-gray-400 pl-6">
          {steps[currentStep].detail}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// FeatureCard Component
// ============================================================================

function FeatureCard({
  feature,
  isExpanded,
  onToggle,
}: {
  feature: FeatureConfig;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const handleClick = useCallback(() => {
    if (!isExpanded) {
      onToggle();
    }
  }, [isExpanded, onToggle]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle();
    },
    [onToggle],
  );

  return (
    <motion.div
      layout
      layoutId={feature.id}
      onClick={handleClick}
      className={`
        group p-6 rounded-2xl bg-white/2 border border-white/5 
        transition-colors cursor-pointer
        ${isExpanded ? feature.colorClasses.border : `hover:${feature.colorClasses.border}`}
        ${isExpanded ? "col-span-1 md:col-span-2 lg:col-span-2" : "hover:bg-white/4"}
      `}
      transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Collapsed content
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className={`w-12 h-12 rounded-xl bg-linear-to-br ${feature.colorClasses.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              <span className={feature.colorClasses.text}>{feature.icon}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-3">
              {feature.description}
            </p>
            <span
              className={`text-sm ${feature.colorClasses.text} inline-flex items-center gap-1 group-hover:gap-2 transition-all`}
            >
              Learn more <ArrowRight className="w-3 h-3" />
            </span>
          </motion.div>
        ) : (
          // Expanded content
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, delay: 0.1 }}
          >
            {/* Header with close button */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-linear-to-br ${feature.colorClasses.iconBg} flex items-center justify-center`}
                >
                  <span className={feature.colorClasses.text}>
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {feature.title}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Extended description */}
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {feature.expandedDescription}
            </p>

            {/* Workflow visualization */}
            <WorkflowVisualization
              steps={feature.workflow}
              isActive={isExpanded}
              colorClasses={feature.colorClasses}
            />

            {/* CTA link */}
            <Link
              href={feature.linkHref}
              onClick={(e) => e.stopPropagation()}
              className={`
                inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg
                ${feature.colorClasses.bg} text-white text-sm font-medium
                hover:opacity-90 transition-opacity
              `}
            >
              {feature.linkText}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// FeaturesSection Component
// ============================================================================

const FeaturesSection = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Close expanded card when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If clicking on the grid background (not a card), close expanded card
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
    <div className="max-w-7xl mx-auto relative">
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
};

export default FeaturesSection;
