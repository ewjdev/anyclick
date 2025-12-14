"use client";

/**
 * Ac.View - Visibility/section view tracking component.
 *
 * Tracks when an element enters the viewport using IntersectionObserver.
 * Registers with parent Ac.Context for context menu integration.
 *
 * @module components/tracking/AcView
 */
import { getTrackingManager } from "@/lib/tracking/manager";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { mergeContextData, useAcContext } from "./context";
import { generateId, useIntentStore } from "./store";
import type { AcViewProps } from "./types";

// Re-export props type for external use
export type { AcViewProps } from "./types";

/**
 * Ac.View - Declarative view tracking wrapper.
 *
 * Automatically tracks when the wrapped element becomes visible
 * in the viewport using IntersectionObserver. Registers with the
 * intent store for context menu integration (unless context={false}).
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
 * // With additional metadata
 * <Ac.View intent={HomepageIntent.SECTION_VIEW} metadata={{ section: "hero" }}>
 *   <section>...</section>
 * </Ac.View>
 *
 * // Opt out of context menu (still tracks view)
 * <Ac.View intent={HomepageIntent.MINOR_VIEW} context={false}>
 *   <div>...</div>
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
      metadata,
      context: registerWithContext = true,
      disabled = false,
      children,
    },
    forwardedRef,
  ) => {
    // Get context data from parent Ac.Context providers
    const { metadata: contextMetadata, contextId } = useAcContext();

    // Generate unique ID for this intent
    const intentIdRef = React.useRef<string>(generateId("intent"));
    const intentId = intentIdRef.current;

    // Merge context metadata with local metadata (local overrides context)
    const mergedMetadata = React.useMemo(
      () => mergeContextData(contextMetadata, metadata ?? {}),
      [contextMetadata, metadata],
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

    // Store actions
    const registerIntent = useIntentStore((s) => s.registerIntent);
    const unregisterIntent = useIntentStore((s) => s.unregisterIntent);

    // Register with store on mount (unless context={false})
    React.useEffect(() => {
      if (disabled) return;

      // Always register, but mark optOut if context={false}
      registerIntent({
        id: intentId,
        intent,
        contextId,
        metadata: mergedMetadata,
        elementRef: internalRef,
        optOut: !registerWithContext,
        eventType: "view",
        action: undefined, // Views don't have actions by default
      });

      return () => {
        unregisterIntent(intentId);
      };
    }, [
      intentId,
      intent,
      contextId,
      mergedMetadata,
      disabled,
      registerWithContext,
      registerIntent,
      unregisterIntent,
    ]);

    // Track function
    const trackView = React.useCallback(() => {
      if (disabled || (once && hasTrackedRef.current)) return;

      hasTrackedRef.current = true;
      getTrackingManager().track(intent, {
        properties:
          Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
        engagement: {
          viewportVisible: true,
          timeOnSection: minVisibleTime > 0 ? minVisibleTime : undefined,
        },
      });
    }, [intent, mergedMetadata, disabled, once, minVisibleTime]);

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

    // Add data-ac-* attributes for each key in mergedMetadata
    for (const [key, value] of Object.entries(mergedMetadata)) {
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
