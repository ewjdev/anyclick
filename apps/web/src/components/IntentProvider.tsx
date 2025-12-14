"use client";

/**
 * IntentProvider - Context provider for intent tracking.
 *
 * Manages tracking initialization, scroll depth, and time-on-page metrics.
 *
 * @module components/IntentProvider
 */
import { HomepageIntent } from "@/lib/intents";
import {
  type TrackingConfig,
  consoleProvider,
  getTrackingManager,
  useScrollDepth,
  useTimeOnPage,
  vercelProvider,
} from "@/lib/tracking";
import { type ReactNode, createContext, useContext, useEffect } from "react";

// ============================================================================
// Context
// ============================================================================

interface IntentContextValue {
  /** Whether tracking is enabled */
  enabled: boolean;
  /** Current session ID */
  sessionId: string;
}

const IntentContext = createContext<IntentContextValue | null>(null);

/**
 * Hook to access intent tracking context.
 */
export function useIntentContext(): IntentContextValue {
  const context = useContext(IntentContext);
  if (!context) {
    throw new Error("useIntentContext must be used within an IntentProvider");
  }
  return context;
}

// ============================================================================
// Provider Props
// ============================================================================

interface IntentProviderProps {
  children: ReactNode;
  /**
   * Tracking configuration overrides.
   */
  config?: TrackingConfig;
  /**
   * Whether to enable scroll depth tracking.
   * @default true
   */
  enableScrollDepth?: boolean;
  /**
   * Whether to enable time-on-page tracking.
   * @default true
   */
  enableTimeOnPage?: boolean;
  /**
   * Custom scroll depth milestones (percentages).
   * @default [25, 50, 75, 100]
   */
  scrollMilestones?: number[];
  /**
   * Custom time-on-page milestones (seconds).
   * @default [30, 60, 120]
   */
  timeMilestones?: number[];
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * IntentProvider - Wraps the app to enable intent tracking.
 *
 * @example
 * ```tsx
 * <IntentProvider>
 *   <App />
 * </IntentProvider>
 * ```
 */
export function IntentProvider({
  children,
  config,
  enableScrollDepth = true,
  enableTimeOnPage = true,
  scrollMilestones = [25, 50, 75, 100],
  timeMilestones = [30, 60, 120],
}: IntentProviderProps) {
  // Initialize tracking on mount
  useEffect(() => {
    const manager = getTrackingManager();

    // Apply config if provided
    if (config) {
      manager.configure(config);
    }

    // Register providers
    // In production, use Vercel Analytics
    // In development, also add console provider for debugging
    manager.registerProvider(vercelProvider);

    if (process.env.NODE_ENV === "development") {
      manager.registerProvider(consoleProvider);
    }

    // Cleanup on unmount
    return () => {
      manager.flush();
    };
  }, [config]);

  // Track scroll depth
  useScrollDepth(
    enableScrollDepth
      ? {
          milestones: scrollMilestones,
          intentPrefix: "web.homepage.scroll.depth",
        }
      : { milestones: [] },
  );

  // Track time on page
  useTimeOnPage(
    enableTimeOnPage
      ? {
          milestones: timeMilestones,
          intentPrefix: "web.homepage.engagement.time",
        }
      : { milestones: [] },
  );

  // Get context value
  const contextValue: IntentContextValue = {
    enabled: config?.enabled !== false,
    sessionId: getTrackingManager().getSessionId(),
  };

  return (
    <IntentContext.Provider value={contextValue}>
      {children}
    </IntentContext.Provider>
  );
}

// ============================================================================
// Homepage Tracking Component
// ============================================================================

/**
 * HomepageTracking - Enables scroll and time tracking for the homepage.
 *
 * Use this component on the homepage to track engagement metrics.
 * This is a client component that should be rendered within the page.
 *
 * @example
 * ```tsx
 * // In page.tsx
 * <HomepageTracking />
 * ```
 */
export function HomepageTracking() {
  // Track scroll depth with homepage-specific intents
  useScrollDepth({
    milestones: [25, 50, 75, 100],
    intentPrefix: "web.homepage.scroll.depth",
  });

  // Track time on page with homepage-specific intents
  useTimeOnPage({
    milestones: [30, 60, 120],
    intentPrefix: "web.homepage.engagement.time",
  });

  return null;
}
