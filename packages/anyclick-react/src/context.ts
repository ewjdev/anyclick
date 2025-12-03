"use client";

import { createContext, useContext } from "react";
import type { FeedbackContextValue } from "./types";

/**
 * React context for feedback functionality
 */
export const FeedbackContext = createContext<FeedbackContextValue | null>(null);

/**
 * Hook to access feedback context
 * @throws Error if used outside of FeedbackProvider
 */
export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}
