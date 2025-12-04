"use client";

import { createContext, useContext } from "react";
import type { AnyclickContextValue } from "./types";

/**
 * React context for anyclick functionality
 */
export const AnyclickContext = createContext<AnyclickContextValue | null>(null);

/**
 * @deprecated Use AnyclickContext instead
 */
export const FeedbackContext = AnyclickContext;

/**
 * Hook to access anyclick context
 * @throws Error if used outside of AnyclickProvider
 */
export function useAnyclick(): AnyclickContextValue {
  const context = useContext(AnyclickContext);
  if (!context) {
    throw new Error("useAnyclick must be used within an AnyclickProvider");
  }
  return context;
}

/**
 * @deprecated Use useAnyclick instead
 */
export function useFeedback(): AnyclickContextValue {
  const context = useContext(AnyclickContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}
