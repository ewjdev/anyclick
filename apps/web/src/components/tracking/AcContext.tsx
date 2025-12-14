"use client";

/**
 * Ac.Context - Hierarchical context provider for intent tracking.
 *
 * Provides context data that flows to nested Ac.Intent and Ac.View components.
 * Nested contexts merge data (inner overrides outer for duplicate keys).
 *
 * @module components/tracking/AcContext
 */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { AcTrackingContext, mergeContextData, useAcContext } from "./context";

export interface AcContextProps {
  /** Context data to provide to nested Ac.Intent and Ac.View components */
  metadata: Record<string, unknown>;
  /** Optional context name (sets data-ac-context attribute) */
  name?: string;
  /** Whether to render as a wrapper div or use Slot pattern */
  asChild?: boolean;
  /** Children to render */
  children: React.ReactNode;
  /** Optional className for wrapper element (only used when asChild is false) */
  className?: string;
}

/**
 * Ac.Context - Hierarchical context provider for intent tracking.
 *
 * Wraps a section of the UI to provide context data to all nested
 * Ac.Intent and Ac.View components.
 *
 * @example
 * ```tsx
 * // Basic usage - provides context data to nested components
 * <Ac.Context metadata={{ section: "packages" }}>
 *   <Ac.Intent intent={HomepageIntent.CARD_HOVER} metadata={{ card: "react" }}>
 *     <Card />
 *   </Ac.Intent>
 *   // Tracked data will include: { section: "packages", card: "react" }
 * </Ac.Context>
 *
 * // With context name for data attribute
 * <Ac.Context metadata={{ section: "hero" }} name="hero">
 *   <section>...</section>
 * </Ac.Context>
 *
 * // Nested contexts (inner overrides outer for duplicate keys)
 * <Ac.Context metadata={{ section: "packages" }}>
 *   <Ac.Context metadata={{ subsection: "core" }}>
 *     // data = { section: "packages", subsection: "core" }
 *   </Ac.Context>
 * </Ac.Context>
 * ```
 */
export const AcContext = React.forwardRef<HTMLDivElement, AcContextProps>(
  ({ metadata, name, asChild = false, children, className }, ref) => {
    // Get parent context data
    const parentContext = useAcContext();

    // Merge parent data with this context's data
    const mergedData = React.useMemo(
      () => mergeContextData(parentContext.metadata, metadata),
      [parentContext.data, metadata],
    );

    // Create new context value
    const contextValue = React.useMemo(
      () => ({
        data: mergedData,
        name: name ?? parentContext.name,
      }),
      [mergedData, name, parentContext.name],
    );

    // Build data attributes
    const dataAttributes: Record<string, string | undefined> = {};
    if (name) {
      dataAttributes["data-ac-context"] = name;
    }

    // Render content
    const content = (
      <AcTrackingContext.Provider value={contextValue}>
        {children}
      </AcTrackingContext.Provider>
    );

    // If asChild, use Slot to merge props onto single child
    if (asChild) {
      return (
        <Slot ref={ref} {...dataAttributes}>
          {content}
        </Slot>
      );
    }

    // Otherwise wrap in a div
    return (
      <div ref={ref} className={className} {...dataAttributes}>
        {content}
      </div>
    );
  },
);

AcContext.displayName = "Ac.Context";
