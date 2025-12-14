"use client";

/**
 * useTrackIntent - React hook for tracking intents.
 *
 * @module tracking/hooks/useTrackIntent
 */

import { useCallback } from "react";
import { getTrackingManager } from "../manager";
import type { TrackOptions } from "../types";

/**
 * Hook for tracking intents with the tracking manager.
 *
 * @example
 * ```tsx
 * const { track } = useTrackIntent();
 *
 * // Track a click
 * <button onClick={() => track(HomepageIntent.HERO_CTA_CLICK)}>
 *   Get Started
 * </button>
 *
 * // Track with properties
 * track(HomepageIntent.NAV_LINK_CLICK, { properties: { linkTarget: '/docs' } });
 * ```
 */
export function useTrackIntent() {
  /**
   * Track an intent event.
   */
  const track = useCallback((intent: string, options?: TrackOptions) => {
    getTrackingManager().track(intent, options);
  }, []);

  /**
   * Track a click event on a specific intent.
   * Returns an onClick handler.
   */
  const trackClick = useCallback(
    (intent: string, properties?: Record<string, unknown>) => {
      return () => {
        getTrackingManager().track(intent, { properties });
      };
    },
    []
  );

  /**
   * Track a hover event on a specific intent.
   * Returns onMouseEnter handler.
   */
  const trackHover = useCallback(
    (intent: string, properties?: Record<string, unknown>) => {
      let tracked = false;
      return () => {
        // Only track once per mount
        if (!tracked) {
          tracked = true;
          getTrackingManager().track(intent, { properties });
        }
      };
    },
    []
  );

  return {
    track,
    trackClick,
    trackHover,
  };
}
