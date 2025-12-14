"use client";

/**
 * useScrollDepth - Track scroll depth milestones.
 *
 * @module tracking/hooks/useScrollDepth
 */

import { useEffect, useRef } from "react";
import { getTrackingManager } from "../manager";
import type { ScrollDepthConfig } from "../types";

const DEFAULT_MILESTONES = [25, 50, 75, 100];

/**
 * Hook for tracking scroll depth milestones.
 *
 * @example
 * ```tsx
 * // In a page component
 * useScrollDepth({
 *   milestones: [25, 50, 75, 100],
 *   intentPrefix: 'web.homepage.scroll.depth',
 * });
 * ```
 */
export function useScrollDepth(config: ScrollDepthConfig = {}) {
  const {
    milestones = DEFAULT_MILESTONES,
    intentPrefix = "web.scroll.depth",
  } = config;

  // Track which milestones have been reached
  const reachedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY;

      // Calculate scroll percentage
      const scrollableHeight = scrollHeight - clientHeight;
      if (scrollableHeight <= 0) {
        return;
      }

      const scrollPercent = Math.round((scrollTop / scrollableHeight) * 100);

      // Check each milestone
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !reachedRef.current.has(milestone)) {
          reachedRef.current.add(milestone);

          // Track the milestone
          getTrackingManager().track(`${intentPrefix}.${milestone}`, {
            engagement: {
              scrollDepth: scrollPercent,
            },
          });
        }
      }
    };

    // Initial check
    handleScroll();

    // Listen for scroll events (throttled via passive listener)
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [milestones, intentPrefix]);

  return {
    reset: () => {
      reachedRef.current.clear();
    },
  };
}
