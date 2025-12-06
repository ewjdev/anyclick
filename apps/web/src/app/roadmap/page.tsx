"use client";

import releasesData from "@/data/releases.json";
import roadmapItemsData from "@/data/roadmap-items.json";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Github,
  Package,
  Rocket,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";

type ReleaseType = "major" | "minor" | "patch";
type Era = "past" | "today" | "near-future" | "next-major";
type RoadmapEra = "short-term" | "mid-term" | "later";

interface Release {
  id: string;
  packages: string[];
  version: string;
  type: ReleaseType;
  date: string;
  summary: string;
  details: string;
  highlights: string[];
  npmLink: string;
  era: Era;
}

interface UpcomingFeature {
  id: string;
  title: string;
  era: Era;
  summary: string;
  details: string;
  highlights: string[];
}

interface RoadmapItem {
  id: string;
  source: "github" | "plan" | "manual";
  type: string;
  title: string;
  description: string;
  era: RoadmapEra;
  status: string;
  url: string | null;
  labels: string[];
  tags: string[];
  assignees: string[];
  todos: Array<{ completed: boolean; text: string }>;
  updatedAt: string;
}

interface ReleasesData {
  releases: Release[];
  upcoming: UpcomingFeature[];
  currentVersion: string;
  lastUpdated: string;
}

interface RoadmapItemsData {
  items: RoadmapItem[];
  lastSynced: string;
  version: string;
}

const data = releasesData as ReleasesData;
const roadmapData = roadmapItemsData as RoadmapItemsData;

// Map roadmap era to display era
const roadmapEraToDisplayEra: Record<RoadmapEra, Era> = {
  "short-term": "near-future",
  "mid-term": "near-future",
  later: "next-major",
};

// Roadmap era configuration
const roadmapEraConfig: Record<
  RoadmapEra,
  { label: string; color: string; bgColor: string }
> = {
  "short-term": {
    label: "Short-term",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  "mid-term": {
    label: "Mid-term",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  later: {
    label: "Later",
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
  },
};

// Era configuration with labels and colors
const eraConfig: Record<
  Era,
  { label: string; color: string; bgColor: string }
> = {
  past: {
    label: "Released",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
  },
  today: {
    label: "Current",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  "near-future": {
    label: "Near Future",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  "next-major": {
    label: "Next Major",
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
  },
};

// Release marker component
function ReleaseMarker({
  release,
  index,
  onClick,
  isSelected,
  asIndicator = false, // When true, renders as non-interactive indicator (for use inside buttons)
}: {
  release: Release;
  index: number;
  onClick: () => void;
  isSelected: boolean;
  asIndicator?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const sizeClasses = {
    major: "w-4 h-4 md:w-5 md:h-5",
    minor: "w-2.5 h-2.5 md:w-3 md:h-3",
    patch: "w-1.5 h-1.5 md:w-2 md:h-2",
  };

  const glowClasses = {
    major: "shadow-[0_0_12px_rgba(139,92,246,0.6)]",
    minor: "shadow-[0_0_8px_rgba(6,182,212,0.4)]",
    patch: "",
  };

  const isInteractive = release.type !== "patch" && !asIndicator;
  const eraColors = {
    past: "bg-gray-400",
    today: "bg-cyan-400",
    "near-future": "bg-amber-400",
    "next-major": "bg-violet-400",
  };

  const markerClasses = `
    relative rounded-full transition-all duration-300 ease-out
    animate-fade-in-scale
    ${sizeClasses[release.type]}
    ${eraColors[release.era]}
    ${isInteractive ? "cursor-pointer hover:scale-125" : ""}
    ${release.type === "major" ? glowClasses.major : ""}
    ${
    release.type === "minor" && isInteractive
      ? "hover:" + glowClasses.minor
      : ""
  }
    ${
    isSelected
      ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0f] scale-125"
      : ""
  }
  `;

  // When used as indicator inside a button, render as a div
  if (asIndicator) {
    return (
      <div className="relative" style={{ animationDelay: `${index * 80}ms` }}>
        <div className={markerClasses}>
          {release.type === "major" && (
            <span className="absolute inset-0 rounded-full animate-ping-slow opacity-40 bg-violet-400" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <button
        onClick={isInteractive ? onClick : undefined}
        onMouseEnter={() => release.type === "minor" && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={!isInteractive}
        className={markerClasses}
        aria-label={isInteractive ? `View ${release.summary}` : undefined}
      >
        {release.type === "major" && (
          <span className="absolute inset-0 rounded-full animate-ping-slow opacity-40 bg-violet-400" />
        )}
      </button>

      {/* Tooltip for minor releases */}
      {showTooltip && release.type === "minor" && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 md:bottom-auto md:left-full md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:ml-3 pointer-events-none">
          <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl animate-fade-in">
            <p className="font-semibold text-white">{release.summary}</p>
            <p className="text-gray-400">v{release.version}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Upcoming feature marker component for timeline
function UpcomingMarker({
  feature,
  index,
  onClick,
  isSelected,
  asIndicator = false, // When true, renders as non-interactive indicator (for use inside buttons)
}: {
  feature: UpcomingFeature;
  index: number;
  onClick: () => void;
  isSelected: boolean;
  asIndicator?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const eraColors = {
    past: "bg-gray-400",
    today: "bg-cyan-400",
    "near-future": "bg-amber-400",
    "next-major": "bg-violet-400",
  };

  const glowColors = {
    past: "shadow-[0_0_12px_rgba(156,163,175,0.4)]",
    today: "shadow-[0_0_12px_rgba(6,182,212,0.4)]",
    "near-future": "shadow-[0_0_12px_rgba(251,191,36,0.4)]",
    "next-major": "shadow-[0_0_12px_rgba(139,92,246,0.6)]",
  };

  const markerClasses = `
    relative rounded-full transition-all duration-300 ease-out
    animate-fade-in-scale
    w-4 h-4 md:w-5 md:h-5
    ${eraColors[feature.era]}
    ${glowColors[feature.era]}
    ${
    isSelected
      ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0f] scale-125"
      : ""
  }
    border-2 border-dashed border-white/30
    ${!asIndicator ? "cursor-pointer hover:scale-125" : ""}
  `;

  // When used as indicator inside a button, render as a div
  if (asIndicator) {
    return (
      <div
        className="relative"
        style={{ animationDelay: `${index * 80 + 400}ms` }}
      >
        <div className={markerClasses}>
          <span
            className="absolute inset-0 rounded-full animate-ping-slow opacity-30"
            style={{
              backgroundColor: feature.era === "next-major"
                ? "rgb(139, 92, 246)"
                : "rgb(251, 191, 36)",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group"
      style={{ animationDelay: `${index * 80 + 400}ms` }}
    >
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={markerClasses}
        aria-label={`View ${feature.title}`}
      >
        <span
          className="absolute inset-0 rounded-full animate-ping-slow opacity-30"
          style={{
            backgroundColor: feature.era === "next-major"
              ? "rgb(139, 92, 246)"
              : "rgb(251, 191, 36)",
          }}
        />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 md:bottom-auto md:left-full md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:ml-3 pointer-events-none">
          <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl animate-fade-in">
            <p className="font-semibold text-white">{feature.title}</p>
            <p className={`${eraConfig[feature.era].color}`}>
              {eraConfig[feature.era].label}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Desktop dialog component
function ReleaseDialog({
  release,
  onClose,
  position,
}: {
  release: Release | UpcomingFeature | null;
  onClose: () => void;
  position: "left" | "right";
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!release) return null;

  const isRelease = "version" in release;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={`
          fixed top-1/2 -translate-y-1/2 z-50 w-full max-w-md
          ${
          position === "left"
            ? "left-8 animate-slide-in-left"
            : "right-8 animate-slide-in-right"
        }
        `}
      >
        <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            {isRelease
              ? (
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      eraConfig[release.era].bgColor
                    } ${eraConfig[release.era].color}`}
                  >
                    {(release as Release).type.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    v{(release as Release).version}
                  </span>
                </div>
              )
              : (
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      eraConfig[release.era].bgColor
                    } ${eraConfig[release.era].color}`}
                  >
                    {eraConfig[release.era].label.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">Coming Soon</span>
                </div>
              )}

            <h3 className="text-xl font-bold text-white pr-8">
              {isRelease
                ? (release as Release).summary
                : (release as UpcomingFeature).title}
            </h3>

            {isRelease && (
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date((release as Release).date).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  {(release as Release).packages.length} package
                  {(release as Release).packages.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              {release.details}
            </p>

            {release.highlights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Highlights
                </h4>
                <ul className="space-y-1.5">
                  {release.highlights.map((highlight, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <Sparkles className="w-3.5 h-3.5 mt-0.5 text-amber-400 flex-shrink-0" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isRelease && (release as Release).packages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Packages
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(release as Release).packages.map((pkg) => (
                    <span
                      key={pkg}
                      className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded-md text-gray-400 font-mono"
                    >
                      {pkg}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {isRelease && (
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
              <Link
                href={(release as Release).npmLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium transition-colors"
              >
                View on npm
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Mobile drawer component with swipe-to-close
function ReleaseDrawer({
  release,
  onClose,
}: {
  release: Release | UpcomingFeature | null;
  onClose: () => void;
}) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (release) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [release]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Handle touch/swipe to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setDragY(0);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const startY = e.currentTarget.getBoundingClientRect().top;
      const currentY = touch.clientY - startY;
      if (currentY > 0) {
        setDragY(currentY);
      }
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  }, [dragY, onClose]);

  if (!release) return null;

  const isRelease = "version" in release;
  const drawerTransform = dragY > 0 ? `translateY(${dragY}px)` : undefined;
  const backdropOpacity = dragY > 0 ? Math.max(0.2, 0.6 - dragY / 300) : 0.6;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black backdrop-blur-sm z-40 animate-fade-in"
        style={{ opacity: backdropOpacity }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 animate-slide-up touch-none"
        style={{
          transform: drawerTransform,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-[#0d0d14] backdrop-blur-xl border-t border-white/10 rounded-t-[28px] shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-hidden flex flex-col">
          {/* Drag handle - larger touch target */}
          <div className="flex-shrink-0 flex justify-center py-4 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Header */}
            <div className="px-5 pb-4 border-b border-white/5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {isRelease
                    ? (
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            eraConfig[release.era].bgColor
                          } ${eraConfig[release.era].color}`}
                        >
                          {(release as Release).type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-400 font-mono">
                          v{(release as Release).version}
                        </span>
                      </div>
                    )
                    : (
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            eraConfig[release.era].bgColor
                          } ${eraConfig[release.era].color}`}
                        >
                          {eraConfig[release.era].label.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-400">
                          Coming Soon
                        </span>
                      </div>
                    )}
                  <h3 className="text-xl font-bold text-white leading-tight">
                    {isRelease
                      ? (release as Release).summary
                      : (release as UpcomingFeature).title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2.5 -m-1 rounded-xl bg-white/5 active:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {isRelease && (
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date((release as Release).date).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4" />
                    {(release as Release).packages.length} package
                    {(release as Release).packages.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-5 py-5 space-y-6">
              <p className="text-gray-300 text-[15px] leading-relaxed">
                {release.details}
              </p>

              {release.highlights.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Highlights
                  </h4>
                  <ul className="space-y-2.5">
                    {release.highlights.map((highlight, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-[15px] text-gray-300"
                      >
                        <Sparkles className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isRelease && (release as Release).packages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Packages
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(release as Release).packages.map((pkg) => (
                      <span
                        key={pkg}
                        className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-gray-400 font-mono"
                      >
                        {pkg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isRelease && (
                <Link
                  href={(release as Release).npmLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-cyan-500/20 active:bg-cyan-500/30 text-cyan-400 rounded-2xl text-base font-semibold transition-colors"
                >
                  View on npm
                  <ExternalLink className="w-5 h-5" />
                </Link>
              )}
            </div>

            {/* Safe area spacing for bottom */}
            <div className="h-10" />
          </div>
        </div>
      </div>
    </>
  );
}

// Upcoming feature card
function UpcomingCard({
  feature,
  index,
  onClick,
}: {
  feature: UpcomingFeature;
  index: number;
  onClick: () => void;
}) {
  const eraIcons = {
    "near-future": Clock,
    "next-major": Rocket,
    past: Package,
    today: Package,
  };
  const Icon = eraIcons[feature.era];

  return (
    <button
      onClick={onClick}
      className="group text-left w-full p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 100 + 200}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${eraConfig[feature.era].bgColor}`}>
          <Icon className={`w-4 h-4 ${eraConfig[feature.era].color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                eraConfig[feature.era].bgColor
              } ${eraConfig[feature.era].color}`}
            >
              {eraConfig[feature.era].label}
            </span>
          </div>
          <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
            {feature.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {feature.summary}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}

// Roadmap item card
function RoadmapItemCard({
  item,
  index,
}: {
  item: RoadmapItem;
  index: number;
}) {
  const sourceIcons = {
    github: Github,
    plan: FileText,
    manual: Sparkles,
  };
  const SourceIcon = sourceIcons[item.source] || Sparkles;
  const eraConf = roadmapEraConfig[item.era];

  return (
    <div
      className="group text-left w-full p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 100 + 200}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${eraConf.bgColor}`}>
          <SourceIcon className={`w-4 h-4 ${eraConf.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${eraConf.bgColor} ${eraConf.color}`}
            >
              {eraConf.label}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-white/5 text-gray-400">
              {item.source}
            </span>
            {item.status === "closed" || item.status === "completed"
              ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-emerald-500/20 text-emerald-400">
                  Done
                </span>
              )
              : null}
          </div>
          <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
            {item.url
              ? (
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {item.title}
                </Link>
              )
              : (
                item.title
              )}
          </h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {item.description}
          </p>
          {item.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.labels.slice(0, 3).map((label) => (
                <span
                  key={label}
                  className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-gray-500"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
        {item.url && (
          <ExternalLink className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const [selectedRelease, setSelectedRelease] = useState<
    Release | UpcomingFeature | null
  >(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Group releases by era
  const groupedReleases = useMemo(() => {
    const groups: Record<Era, Release[]> = {
      past: [],
      today: [],
      "near-future": [],
      "next-major": [],
    };
    data.releases.forEach((release) => {
      groups[release.era].push(release);
    });
    return groups;
  }, []);

  // Group upcoming features by era
  const groupedUpcoming = useMemo(() => {
    const groups: Record<Era, UpcomingFeature[]> = {
      past: [],
      today: [],
      "near-future": [],
      "next-major": [],
    };
    data.upcoming.forEach((feature) => {
      groups[feature.era].push(feature);
    });
    return groups;
  }, []);

  // Get position for dialog
  const getDialogPosition = useCallback(
    (release: Release | UpcomingFeature): "left" | "right" => {
      if ("version" in release) {
        const allReleases = data.releases;
        const index = allReleases.findIndex((r) => r.id === release.id);
        return index < allReleases.length / 2 ? "right" : "left";
      }
      return "right";
    },
    [],
  );

  const handleReleaseClick = useCallback(
    (release: Release | UpcomingFeature) => {
      setSelectedRelease(release);
    },
    [],
  );

  const handleClose = useCallback(() => {
    setSelectedRelease(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] via-[#0a0a0f] to-[#1a0a2e]" />
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[150px] animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-xl bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-medium">
                anyclick
              </p>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Release Timeline
              </h1>
            </div>
          </div>
          <Link
            href="https://github.com/ewjdev/anyclick/blob/main/docs/roadmap.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-medium transition-all hover:border-white/20"
          >
            <span className="hidden sm:inline">Full roadmap</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Current version badge */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            Current: v{data.currentVersion}
          </div>
        </div>

        {/* Timeline Section */}
        <section className="mb-12">
          {/* Desktop: Horizontal Timeline */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Era labels */}
              <div className="flex justify-between mb-6 px-4">
                {(["past", "today", "near-future", "next-major"] as Era[]).map(
                  (era) => (
                    <div
                      key={era}
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        eraConfig[era].color
                      }`}
                    >
                      {eraConfig[era].label}
                    </div>
                  ),
                )}
              </div>

              {/* Ruler */}
              <div className="relative h-24">
                {/* Main ruler line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-gray-700 via-cyan-500/50 to-violet-500/50 transform -translate-y-1/2" />

                {/* Ruler ticks background */}
                <div className="absolute top-1/2 left-0 right-0 flex justify-between transform -translate-y-1/2 px-2">
                  {Array.from({ length: 21 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-px bg-white/10 ${
                        i % 5 === 0 ? "h-4" : "h-2"
                      }`}
                    />
                  ))}
                </div>

                {/* Era sections */}
                <div className="absolute inset-0 flex">
                  {(
                    ["past", "today", "near-future", "next-major"] as Era[]
                  ).map((era, eraIndex) => {
                    const releases = groupedReleases[era];
                    const upcoming = groupedUpcoming[era];

                    return (
                      <div
                        key={era}
                        className="flex-1 flex items-center justify-center gap-3 relative"
                        style={{
                          borderRight: eraIndex < 3
                            ? "1px dashed rgba(255,255,255,0.1)"
                            : "none",
                        }}
                      >
                        {/* "Today" indicator */}
                        {era === "today" && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
                              You are here
                            </span>
                            <div className="w-px h-3 bg-cyan-400/50" />
                          </div>
                        )}

                        {/* Released versions */}
                        {releases.map((release, index) => (
                          <ReleaseMarker
                            key={release.id}
                            release={release}
                            index={index}
                            onClick={() => handleReleaseClick(release)}
                            isSelected={selectedRelease?.id === release.id}
                          />
                        ))}

                        {/* Upcoming features */}
                        {upcoming.map((feature, index) => (
                          <UpcomingMarker
                            key={feature.id}
                            feature={feature}
                            index={index}
                            onClick={() => handleReleaseClick(feature)}
                            isSelected={selectedRelease?.id === feature.id}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-center flex-wrap gap-4 md:gap-6 mt-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                  <span>Major</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span>Minor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span>Patch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-dashed border-white/30" />
                  <span>Upcoming</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Vertical Timeline */}
          <div className="md:hidden">
            {/* Mobile Legend - shown at top */}
            <div className="flex justify-center gap-4 mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
                <span className="text-[10px] text-gray-500">Major</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-[10px] text-gray-500">Minor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-[10px] text-gray-500">Patch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400 border border-dashed border-white/30" />
                <span className="text-[10px] text-gray-500">Soon</span>
              </div>
            </div>

            <div className="relative pl-10">
              {/* Vertical ruler line with gradient */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-gray-600 via-cyan-500/40 to-violet-500/40" />

              {/* Releases by era */}
              {(["past", "today", "near-future", "next-major"] as Era[]).map(
                (era) => {
                  const releases = groupedReleases[era];
                  const upcoming = groupedUpcoming[era];
                  if (releases.length === 0 && upcoming.length === 0) {
                    return null;
                  }

                  return (
                    <div key={era} className="mb-8 last:mb-0">
                      {/* Era label - positioned on the timeline */}
                      <div className="flex items-center gap-3 mb-4 -ml-10">
                        <div
                          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                            era === "today"
                              ? "bg-cyan-500/20 ring-2 ring-cyan-400/50"
                              : era === "past"
                              ? "bg-gray-500/20"
                              : era === "near-future"
                              ? "bg-amber-500/20"
                              : "bg-violet-500/20"
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${
                              era === "today"
                                ? "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                                : era === "past"
                                ? "bg-gray-500"
                                : era === "near-future"
                                ? "bg-amber-400"
                                : "bg-violet-400"
                            }`}
                          />
                          {era === "today" && (
                            <span className="absolute inset-0 rounded-full animate-ping-slow opacity-30 bg-cyan-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              eraConfig[era].color
                            }`}
                          >
                            {eraConfig[era].label}
                          </span>
                          {era === "today" && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[10px] text-cyan-400 font-medium">
                              NOW
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Release items - card style */}
                      <div className="space-y-3">
                        {releases.map((release, index) => (
                          <button
                            key={release.id}
                            onClick={() =>
                              release.type !== "patch" &&
                              handleReleaseClick(release)}
                            disabled={release.type === "patch"}
                            className={`
                              flex items-center gap-4 w-full text-left p-4 rounded-xl
                              transition-all duration-200 animate-fade-in-up
                              ${
                              release.type === "patch"
                                ? "bg-white/[0.02] opacity-60"
                                : "bg-white/[0.03] active:bg-white/[0.08] active:scale-[0.98]"
                            }
                              border border-white/5
                            `}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex-shrink-0">
                              <ReleaseMarker
                                release={release}
                                index={index}
                                onClick={() => {}}
                                isSelected={selectedRelease?.id === release.id}
                                asIndicator
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-semibold leading-tight">
                                {release.summary}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500 font-mono">
                                  v{release.version}
                                </span>
                                <span className="text-gray-600">•</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(release.date).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  )}
                                </span>
                              </div>
                            </div>
                            {release.type !== "patch" && (
                              <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90 flex-shrink-0" />
                            )}
                          </button>
                        ))}

                        {/* Upcoming feature items */}
                        {upcoming.map((feature, index) => (
                          <button
                            key={feature.id}
                            onClick={() => handleReleaseClick(feature)}
                            className="flex items-center gap-4 w-full text-left p-4 rounded-xl transition-all duration-200 animate-fade-in-up bg-white/[0.03] active:bg-white/[0.08] active:scale-[0.98] border border-white/5 border-dashed"
                            style={{
                              animationDelay: `${
                                (releases.length + index) * 50
                              }ms`,
                            }}
                          >
                            <div className="flex-shrink-0">
                              <UpcomingMarker
                                feature={feature}
                                index={index}
                                onClick={() => {}}
                                isSelected={selectedRelease?.id === feature.id}
                                asIndicator
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-semibold leading-tight">
                                {feature.title}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  eraConfig[feature.era].color
                                }`}
                              >
                                {eraConfig[feature.era].label}
                              </p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>

        {/* Upcoming Features - Hidden on mobile since they're in the timeline */}
        <section className="hidden md:block">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold">Coming Soon</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {data.upcoming.map((feature, index) => (
              <UpcomingCard
                key={feature.id}
                feature={feature}
                index={index}
                onClick={() => handleReleaseClick(feature)}
              />
            ))}
          </div>
        </section>

        {/* Roadmap Items by Era */}
        {roadmapData.items.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold">Full Roadmap</h2>
              </div>
              <span className="text-xs text-gray-500">
                Last synced:{" "}
                {new Date(roadmapData.lastSynced).toLocaleDateString()}
              </span>
            </div>

            {/* Short-term items */}
            {roadmapData.items.filter((i) => i.era === "short-term").length >
                0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
                  Short-term (Next Up)
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {roadmapData.items
                    .filter((i) => i.era === "short-term")
                    .map((item, index) => (
                      <RoadmapItemCard
                        key={item.id}
                        item={item}
                        index={index}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Mid-term items */}
            {roadmapData.items.filter((i) => i.era === "mid-term").length >
                0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
                  Mid-term
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {roadmapData.items
                    .filter((i) => i.era === "mid-term")
                    .map((item, index) => (
                      <RoadmapItemCard
                        key={item.id}
                        item={item}
                        index={index}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Later items */}
            {roadmapData.items.filter((i) => i.era === "later").length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-4">
                  Later
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {roadmapData.items
                    .filter((i) => i.era === "later")
                    .map((item, index) => (
                      <RoadmapItemCard
                        key={item.id}
                        item={item}
                        index={index}
                      />
                    ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Dialog/Drawer based on viewport */}
      {!isMobile && (
        <ReleaseDialog
          release={selectedRelease}
          onClose={handleClose}
          position={selectedRelease
            ? getDialogPosition(selectedRelease)
            : "right"}
        />
      )}

      {isMobile && (
        <ReleaseDrawer release={selectedRelease} onClose={handleClose} />
      )}

      {/* Custom animations */}
      <style jsx global>
        {`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translate(-100%, -50%);
          }
          to {
            opacity: 1;
            transform: translate(0, -50%);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translate(100%, -50%);
          }
          to {
            opacity: 1;
            transform: translate(0, -50%);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes ping-slow {
          75%,
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 0.4s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in,
          .animate-fade-in-scale,
          .animate-fade-in-up,
          .animate-slide-in-left,
          .animate-slide-in-right,
          .animate-slide-up,
          .animate-ping-slow,
          .animate-pulse-slow {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}
      </style>
    </div>
  );
}
