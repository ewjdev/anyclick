"use client";

/**
 * useTimeOnPage - Track time-on-page milestones.
 *
 * @module tracking/hooks/useTimeOnPage
 */

import { useEffect, useRef } from "react";
import { getTrackingManager } from "../manager";
import type { TimeOnPageConfig } from "../types";

const DEFAULT_MILESTONES = [30, 60, 120]; // seconds

/**
 * Hook for tracking time-on-page milestones.
 *
 * @example
 * ```tsx
 * // In a page component
 * useTimeOnPage({
 *   milestones: [30, 60, 120], // seconds
 *   intentPrefix: 'web.homepage.engagement.time',
 * });
 * ```
 */
export function useTimeOnPage(config: TimeOnPageConfig = {}) {
  const {
    milestones = DEFAULT_MILESTONES,
    intentPrefix = "web.engagement.time",
  } = config;

  const reachedRef = useRef<Set<number>>(new Set());
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    startTimeRef.current = Date.now();

    // Check milestones every second
    intervalRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );

      for (const milestone of milestones) {
        if (elapsedSeconds >= milestone && !reachedRef.current.has(milestone)) {
          reachedRef.current.add(milestone);

          // Track the milestone
          getTrackingManager().track(`${intentPrefix}.${milestone}s`, {
            engagement: {
              timeOnPage: elapsedSeconds * 1000, // Convert to ms
            },
          });
        }
      }

      // Stop checking if all milestones reached
      const maxMilestone = Math.max(...milestones);
      if (elapsedSeconds > maxMilestone && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [milestones, intentPrefix]);

  return {
    reset: () => {
      reachedRef.current.clear();
      startTimeRef.current = Date.now();
    },
    getElapsedTime: () => Date.now() - startTimeRef.current,
  };
}
