"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureCaptureDemo } from "./FeatureCaptureDemo";
import type { FeatureConfig } from "./types";

export interface FeatureCardProps {
  className?: string;
  feature: FeatureConfig;
  isExpanded: boolean;
  onToggle: () => void;
}

export function FeatureCard({
  className,
  feature,
  isExpanded,
  onToggle,
}: FeatureCardProps) {
  const handleClick = React.useCallback(() => {
    if (!isExpanded) {
      onToggle();
    }
  }, [isExpanded, onToggle]);

  const handleClose = React.useCallback(
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
      className={cn(
        "group rounded-2xl bg-white/2 border border-white/5 transition-colors cursor-pointer",
        isExpanded
          ? feature.colorClasses.border
          : `hover:${feature.colorClasses.border}`,
        isExpanded ? "p-6 col-span-1 md:col-span-2 lg:col-span-2" : "p-6",
        !isExpanded ? "hover:bg-white/4" : "",
        className,
      )}
      transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className={cn(
                "mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br transition-transform group-hover:scale-110",
                feature.colorClasses.iconBg,
              )}
            >
              <span className={feature.colorClasses.text}>{feature.icon}</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              {feature.title}
            </h3>
            <p className="mb-3 text-sm leading-relaxed text-gray-400">
              {feature.description}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-sm transition-all group-hover:gap-2",
                feature.colorClasses.text,
              )}
            >
              Learn more <ArrowRight className="h-3 w-3" />
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, delay: 0.1 }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br",
                    feature.colorClasses.iconBg,
                  )}
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
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-gray-300">
              {feature.expandedDescription}
            </p>

            <FeatureCaptureDemo feature={feature} />

            <Link
              href={feature.linkHref}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90",
                feature.colorClasses.bg,
              )}
            >
              {feature.linkText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

