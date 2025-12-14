"use client";

/**
 * Ac.Context - Hierarchical context provider for intent tracking.
 *
 * Provides context data that flows to nested Ac.Intent and Ac.View components.
 * Nested contexts merge data (inner overrides outer for duplicate keys).
 * Registers with the intent store for context menu integration.
 *
 * @module components/tracking/AcContext
 */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { AcTrackingContext, mergeContextData, useAcContext } from "./context";
import { generateId, useIntentStore } from "./store";
import type { AcAction, AcContextProps } from "./types";

// Re-export props type for external use
export type { AcContextProps } from "./types";

/**
 * Ac.Context - Hierarchical context provider for intent tracking.
 *
 * Wraps a section of the UI to provide context data to all nested
 * Ac.Intent and Ac.View components. Registers with the intent store
 * to enable context menu actions.
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
 * // With explicit actions for context menu
 * <Ac.Context
 *   name="features"
 *   metadata={{ section: "features" }}
 *   actions={[
 *     { intent: "feedback", label: "Give Feedback", priority: 10 },
 *   ]}
 * >
 *   <FeaturesSection />
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
  (
    {
      metadata,
      name,
      actions = [],
      disabled = false,
      asChild = false,
      children,
      className,
    },
    forwardedRef,
  ) => {
    // Get parent context data
    const parentContext = useAcContext();

    // Generate unique ID for this context
    const contextIdRef = React.useRef<string>(generateId("context"));
    const contextId = contextIdRef.current;

    // Internal ref for registration
    const internalRef = React.useRef<HTMLDivElement | null>(null);

    // Combine refs
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    // Merge parent metadata with this context's metadata
    const mergedMetadata = React.useMemo(
      () => mergeContextData(parentContext.metadata, metadata),
      [parentContext.metadata, metadata],
    );

    // Calculate depth
    const depth = parentContext.depth + 1;

    // Store actions
    const registerContext = useIntentStore((s) => s.registerContext);
    const unregisterContext = useIntentStore((s) => s.unregisterContext);
    const updateContext = useIntentStore((s) => s.updateContext);

    // Register with store on mount
    React.useEffect(() => {
      if (disabled) return;

      registerContext({
        id: contextId,
        name,
        metadata: mergedMetadata,
        actions: actions as AcAction[],
        elementRef: internalRef,
        parentId: parentContext.contextId,
        depth,
      });

      return () => {
        unregisterContext(contextId);
      };
    }, [
      contextId,
      name,
      disabled,
      registerContext,
      unregisterContext,
      parentContext.contextId,
      depth,
    ]);

    // Update store when metadata or actions change
    React.useEffect(() => {
      if (disabled) return;

      updateContext(contextId, {
        metadata: mergedMetadata,
        actions: actions as AcAction[],
      });
    }, [contextId, mergedMetadata, actions, disabled, updateContext]);

    // Create new context value for children
    const contextValue = React.useMemo(
      () => ({
        contextId,
        metadata: mergedMetadata,
        name: name ?? parentContext.name,
        depth,
      }),
      [contextId, mergedMetadata, name, parentContext.name, depth],
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
        <Slot ref={setRefs} {...dataAttributes}>
          {content}
        </Slot>
      );
    }

    // Otherwise wrap in a div
    return (
      <div ref={setRefs} className={className} {...dataAttributes}>
        {content}
      </div>
    );
  },
);

AcContext.displayName = "Ac.Context";
