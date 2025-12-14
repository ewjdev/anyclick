"use client";

/**
 * React context for Ac.Context data propagation.
 *
 * Provides hierarchical data that flows to nested Ac.Intent and Ac.View components.
 *
 * @module components/tracking/context
 */
import { createContext, useContext } from "react";

/**
 * Data stored in the Ac tracking context.
 */
export interface AcContextData {
  /** Key-value pairs of context data */
  metadata: Record<string, unknown>;
  /** Optional context name for data-ac-context attribute */
  name?: string;
}

/**
 * Default context value (empty data).
 */
const defaultContextData: AcContextData = {
  metadata: {},
  name: undefined,
};

/**
 * React context for Ac tracking data.
 */
export const AcTrackingContext =
  createContext<AcContextData>(defaultContextData);

/**
 * Hook to access the current Ac tracking context data.
 *
 * @returns The current context data, or empty object if no context provider exists
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data, name } = useAcContext();
 *   // data contains merged context from all parent Ac.Context providers
 * }
 * ```
 */
export function useAcContext(): AcContextData {
  return useContext(AcTrackingContext);
}

/**
 * Merge parent context data with child context data.
 * Child data overrides parent data for duplicate keys.
 *
 * @param parent - Parent context data
 * @param child - Child context data to merge
 * @returns Merged context data
 */
export function mergeContextData(
  parent: Record<string, unknown>,
  child: Record<string, unknown>,
): Record<string, unknown> {
  return { ...parent, ...child };
}
