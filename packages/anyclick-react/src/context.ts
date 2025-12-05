"use client";

import { createContext, useContext } from "react";
import type { AnyclickContextValue } from "./types";

/**
 * React context for anyclick functionality.
 *
 * Provides access to anyclick state and methods throughout the component tree.
 * Use the {@link useAnyclick} hook for type-safe access.
 *
 * @example
 * ```tsx
 * // Using the context directly (advanced)
 * const context = useContext(AnyclickContext);
 * if (context) {
 *   context.openMenu(element, { x: 100, y: 100 });
 * }
 * ```
 *
 * @see {@link useAnyclick} for the recommended way to access this context
 * @since 1.0.0
 */
export const AnyclickContext = createContext<AnyclickContextValue | null>(null);

/**
 * @deprecated Use {@link AnyclickContext} instead. Will be removed in v2.0.0.
 * @see {@link AnyclickContext}
 */
export const FeedbackContext = AnyclickContext;

/**
 * Hook to access anyclick context values and methods.
 *
 * Provides access to:
 * - `isEnabled` - Whether anyclick is currently enabled
 * - `isSubmitting` - Whether a submission is in progress
 * - `submitAnyclick` - Function to submit feedback programmatically
 * - `openMenu` - Function to open the context menu programmatically
 * - `closeMenu` - Function to close the context menu
 * - `theme` - The current merged theme configuration
 * - `scoped` - Whether the current provider is scoped
 * - `providerId` - The unique ID of the current provider
 *
 * @returns {AnyclickContextValue} The anyclick context value
 * @throws {Error} When used outside of an AnyclickProvider
 *
 * @example
 * ```tsx
 * function FeedbackButton() {
 *   const { openMenu, isSubmitting, isEnabled } = useAnyclick();
 *
 *   const handleClick = (event: React.MouseEvent) => {
 *     if (isEnabled && !isSubmitting) {
 *       openMenu(event.currentTarget, {
 *         x: event.clientX,
 *         y: event.clientY,
 *       });
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleClick} disabled={!isEnabled || isSubmitting}>
 *       Send Feedback
 *     </button>
 *   );
 * }
 * ```
 *
 * @since 1.0.0
 */
export function useAnyclick(): AnyclickContextValue {
  const context = useContext(AnyclickContext);
  if (!context) {
    throw new Error("useAnyclick must be used within an AnyclickProvider");
  }
  return context;
}

/**
 * @deprecated Use {@link useAnyclick} instead. Will be removed in v2.0.0.
 * @see {@link useAnyclick}
 */
export function useFeedback(): AnyclickContextValue {
  const context = useContext(AnyclickContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}
