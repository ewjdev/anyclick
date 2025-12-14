"use client";

/**
 * Ac.Intent - Declarative click/hover intent tracking component.
 *
 * Wraps interactive elements to automatically track clicks and hovers
 * without manual event handler wiring.
 *
 * @module components/tracking/AcIntent
 */
import { getTrackingManager } from "@/lib/tracking/manager";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { mergeContextData, useAcContext } from "./context";

export interface AcIntentProps {
  /** The intent identifier to track */
  intent: string;
  /** Event type to track (default: "click") */
  on?: "click" | "hover" | "both";
  /** Additional properties to include with the tracking event */
  metadata?: Record<string, unknown>;
  /** Disable tracking (useful for conditional tracking) */
  disabled?: boolean;
  /** Single child element (uses Slot pattern to merge props) */
  children: React.ReactElement;
}

/**
 * Ac.Intent - Declarative intent tracking wrapper.
 *
 * Automatically attaches event handlers and data attributes to track
 * user interactions without manual boilerplate.
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
 * // With additional data
 * <Ac.Intent intent={HomepageIntent.LINK_CLICK} metadata={{ link: "docs" }}>
 *   <a href="/docs">Documentation</a>
 * </Ac.Intent>
 * ```
 */
export const AcIntent = React.forwardRef<HTMLElement, AcIntentProps>(
  ({ intent, on = "click", metadata, disabled = false, children }, ref) => {
    // Get context data from parent Ac.Context providers
    const { metadata: contextData } = useAcContext();

    // Merge context data with local data (local overrides context)
    const mergedData = React.useMemo(
      () => mergeContextData(contextData, metadata ?? {}),
      [contextData, metadata],
    );

    // Track hover only once per mount
    const hasHoveredRef = React.useRef(false);

    // Track function
    const trackIntent = React.useCallback(() => {
      if (disabled) return;

      getTrackingManager().track(intent, {
        properties: Object.keys(mergedData).length > 0 ? mergedData : undefined,
      });
    }, [intent, mergedData, disabled]);

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

    // Add data-ac-* attributes for each key in mergedData
    for (const [key, value] of Object.entries(mergedData)) {
      if (value !== undefined && value !== null) {
        dataAttributes[`data-ac-${key}`] = String(value);
      }
    }

    // Build props to merge onto child
    const slotProps: Record<string, unknown> = {
      ref,
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
