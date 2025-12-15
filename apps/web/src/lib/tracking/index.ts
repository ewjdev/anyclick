/**
 * Anyclick Web Tracking Layer
 *
 * Custom tracking infrastructure for intent-based analytics.
 * Supports multiple providers (Vercel Analytics, custom, etc.)
 *
 * @example
 * ```tsx
 * import { IntentProvider } from '@/components/IntentProvider';
 * import { useTrackIntent, HomepageIntent } from '@/lib/tracking';
 *
 * // In layout
 * <IntentProvider>
 *   <App />
 * </IntentProvider>
 *
 * // In components
 * const { track } = useTrackIntent();
 * track(HomepageIntent.HERO_CTA_CLICK);
 * ```
 *
 * @module tracking
 */

// Types
export type {
  TrackingEvent,
  TrackingProvider,
  TrackingConfig,
  TrackOptions,
  EngagementData,
  SectionViewConfig,
  ScrollDepthConfig,
  TimeOnPageConfig,
} from "./types";

// Manager
export { getTrackingManager, trackEvent, identifyUser } from "./manager";

// Providers
export {
  createVercelProvider,
  vercelProvider,
  createConsoleProvider,
  consoleProvider,
} from "./providers";

// Hooks
export {
  useTrackIntent,
  useScrollDepth,
  useSectionView,
  useSectionViewWithRef,
  useTimeOnPage,
} from "./hooks";
