"use client";

/**
 * Ac.Intent - Declarative click/hover intent tracking component.
 *
 * Wraps interactive elements to automatically track clicks and hovers
 * without manual event handler wiring. Registers with parent Ac.Context
 * for context menu integration.
 *
 * @module components/tracking/AcIntent
 */
import { getTrackingManager } from "@/lib/tracking/manager";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { mergeContextData, useAcContext } from "./context";
import { generateId, useIntentStore } from "./store";
import type { AcIntentProps } from "./types";

// Re-export props type for external use
export type { AcIntentProps } from "./types";

/**
 * Ac.Intent - Declarative intent tracking wrapper.
 *
 * Automatically attaches event handlers and data attributes to track
 * user interactions without manual boilerplate. Registers with the
 * intent store for context menu integration (unless context={false}).
 *
 * @example
 * ```tsx
 * // Click tracking
 * <Ac.Intent intent={HomepageIntent.NAV_DOCS_CLICK}>
 *   <Link href="/docs">Docs</Link>
 * </Ac.Intent>
 *
 * // Hover tracking (fires once per mount)
 * <Ac.Intent intent={HomepageIntent.CARD_HOVER} on="hover">
 *   <Card />
 * </Ac.Intent>
 *
 * // With additional metadata
 * <Ac.Intent intent={HomepageIntent.LINK_CLICK} metadata={{ link: "docs" }}>
 *   <a href="/docs">Documentation</a>
 * </Ac.Intent>
 *
 * // With action for context menu
 * <Ac.Intent
 *   intent={HomepageIntent.FEATURE_CLICK}
 *   action={{ label: "View Feature", priority: 8 }}
 * >
 *   <FeatureCard />
 * </Ac.Intent>
 *
 * // Opt out of context menu (still tracks events)
 * <Ac.Intent intent={HomepageIntent.MINOR_CLICK} context={false}>
 *   <button>Minor Action</button>
 * </Ac.Intent>
 * ```
 */
export const AcIntent = React.forwardRef<HTMLElement, AcIntentProps>(
  (
    {
      intent,
      on = "click",
      metadata,
      context: registerWithContext = true,
      action,
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

    // Internal ref for registration
    const internalRef = React.useRef<HTMLElement | null>(null);

    // Combine refs
    const setRefs = React.useCallback(
      (node: HTMLElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    // Merge context metadata with local metadata (local overrides context)
    const mergedMetadata = React.useMemo(
      () => mergeContextData(contextMetadata, metadata ?? {}),
      [contextMetadata, metadata],
    );

    // Track hover only once per mount
    const hasHoveredRef = React.useRef(false);

    // Store actions
    const registerIntent = useIntentStore((s) => s.registerIntent);
    const unregisterIntent = useIntentStore((s) => s.unregisterIntent);

    // Determine event type for registration
    const eventType = on === "both" ? "click" : on;

    // Register with store on mount (unless context={false})
    React.useEffect(() => {
      if (disabled) return;

      // Always register, but mark optOut if context={false}
      // This allows events to pass through but consumers ignore optOut intents
      registerIntent({
        id: intentId,
        intent,
        contextId,
        metadata: mergedMetadata,
        elementRef: internalRef,
        optOut: !registerWithContext,
        eventType,
        action,
      });

      return () => {
        unregisterIntent(intentId);
      };
    }, [
      intentId,
      intent,
      contextId,
      disabled,
      registerWithContext,
      eventType,
      action,
      registerIntent,
      unregisterIntent,
    ]);

    // Track function
    const trackIntent = React.useCallback(() => {
      if (disabled) return;

      getTrackingManager().track(intent, {
        properties:
          Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
      });
    }, [intent, mergedMetadata, disabled]);

    // Click handler
    const handleClick = React.useCallback(
      (event: React.MouseEvent) => {
        if (on === "click" || on === "both") {
          trackIntent();
        }

        // Call original onClick if it exists
        const childProps = children.props as Record<string, unknown>;
        if (typeof childProps?.onClick === "function") {
          (childProps.onClick as (e: React.MouseEvent) => void)(event);
        }
      },
      [on, trackIntent, children.props],
    );

    // Hover handler (fires once per mount)
    const handleMouseEnter = React.useCallback(
      (event: React.MouseEvent) => {
        if ((on === "hover" || on === "both") && !hasHoveredRef.current) {
          hasHoveredRef.current = true;
          trackIntent();
        }

        // Call original onMouseEnter if it exists
        const childProps = children.props as Record<string, unknown>;
        if (typeof childProps?.onMouseEnter === "function") {
          (childProps.onMouseEnter as (e: React.MouseEvent) => void)(event);
        }
      },
      [on, trackIntent, children.props],
    );

    // Build data attributes for anyclick
    const dataAttributes: Record<string, string> = {
      "data-ac-intent": intent,
    };

    // Add data-ac-* attributes for each key in mergedMetadata
    for (const [key, value] of Object.entries(mergedMetadata)) {
      if (value !== undefined && value !== null) {
        dataAttributes[`data-ac-${key}`] = String(value);
      }
    }

    // Build props to merge onto child
    const slotProps: Record<string, unknown> = {
      ref: setRefs,
      ...dataAttributes,
    };

    // Attach event handlers based on tracking mode
    if (on === "click" || on === "both") {
      slotProps.onClick = handleClick;
    }
    if (on === "hover" || on === "both") {
      slotProps.onMouseEnter = handleMouseEnter;
    }

    return <Slot {...slotProps}>{children}</Slot>;
  },
);

AcIntent.displayName = "Ac.Intent";
