"use client";

/**
 * Ac.View - Visibility/section view tracking component.
 *
 * Tracks when an element enters the viewport using IntersectionObserver.
 *
 * @module components/tracking/AcView
 */
import { getTrackingManager } from "@/lib/tracking/manager";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { mergeContextData, useAcContext } from "./context";

export interface AcViewProps {
  /** The intent identifier to track when element becomes visible */
  intent: string;
  /** IntersectionObserver threshold (0-1, default: 0.5) */
  threshold?: number;
  /** Fire only once per mount (default: true) */
  once?: boolean;
  /** Minimum time visible in ms before firing (default: 0) */
  minVisibleTime?: number;
  /** Additional properties to include with the tracking event */
  data?: Record<string, unknown>;
  /** Disable tracking */
  disabled?: boolean;
  /** Single child element (uses Slot pattern to attach ref) */
  children: React.ReactElement;
}

/**
 * Ac.View - Declarative view tracking wrapper.
 *
 * Automatically tracks when the wrapped element becomes visible
 * in the viewport using IntersectionObserver.
 *
 * @example
 * ```tsx
 * // Basic view tracking
 * <Ac.View intent={HomepageIntent.FEATURES_SECTION_VIEW}>
 *   <section>...</section>
 * </Ac.View>
 *
 * // With threshold and minimum visible time
 * <Ac.View
 *   intent={HomepageIntent.HERO_VIEW}
 *   threshold={0.3}
 *   minVisibleTime={1000}
 * >
 *   <section>...</section>
 * </Ac.View>
 *
 * // With additional data
 * <Ac.View intent={HomepageIntent.SECTION_VIEW} metadata={{ section: "hero" }}>
 *   <section>...</section>
 * </Ac.View>
 * ```
 */
export const AcView = React.forwardRef<HTMLElement, AcViewProps>(
  (
    {
      intent,
      threshold = 0.5,
      once = true,
      minVisibleTime = 0,
      data,
      disabled = false,
      children,
    },
    forwardedRef,
  ) => {
    // Get context data from parent Ac.Context providers
    const { data: contextData } = useAcContext();

    // Merge context data with local data (local overrides context)
    const mergedData = React.useMemo(
      () => mergeContextData(contextData, data ?? {}),
      [contextData, data],
    );

    // Internal ref for the element
    const internalRef = React.useRef<HTMLElement | null>(null);

    // Track if we've already fired
    const hasTrackedRef = React.useRef(false);

    // Timer ref for minVisibleTime
    const visibleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    // Combine refs
    const setRefs = React.useCallback(
      (node: HTMLElement | null) => {
        internalRef.current = node;

        // Forward ref
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    // Track function
    const trackView = React.useCallback(() => {
      if (disabled || (once && hasTrackedRef.current)) return;

      hasTrackedRef.current = true;
      getTrackingManager().track(intent, {
        properties: Object.keys(mergedData).length > 0 ? mergedData : undefined,
        engagement: {
          viewportVisible: true,
          timeOnSection: minVisibleTime > 0 ? minVisibleTime : undefined,
        },
      });
    }, [intent, mergedData, disabled, once, minVisibleTime]);

    // Set up IntersectionObserver
    React.useEffect(() => {
      if (typeof window === "undefined" || !internalRef.current || disabled) {
        return;
      }

      const element = internalRef.current;

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (entry?.isIntersecting) {
            // Element is visible
            if (hasTrackedRef.current && once) {
              return;
            }

            if (minVisibleTime > 0) {
              // Wait for minimum visible time
              visibleTimerRef.current = setTimeout(() => {
                trackView();
              }, minVisibleTime);
            } else {
              // Track immediately
              trackView();
            }
          } else {
            // Element left viewport - cancel pending timer
            if (visibleTimerRef.current) {
              clearTimeout(visibleTimerRef.current);
              visibleTimerRef.current = null;
            }
          }
        },
        {
          threshold,
          rootMargin: "0px",
        },
      );

      observer.observe(element);

      return () => {
        observer.disconnect();
        if (visibleTimerRef.current) {
          clearTimeout(visibleTimerRef.current);
        }
      };
    }, [threshold, once, minVisibleTime, disabled, trackView]);

    // Build data attributes
    const dataAttributes: Record<string, string> = {
      "data-ac-intent": intent,
    };

    // Add data-ac-* attributes for each key in mergedData
    for (const [key, value] of Object.entries(mergedData)) {
      if (value !== undefined && value !== null) {
        dataAttributes[`data-ac-${key}`] = String(value);
      }
    }

    return (
      <Slot ref={setRefs} {...dataAttributes}>
        {children}
      </Slot>
    );
  },
);

AcView.displayName = "Ac.View";
