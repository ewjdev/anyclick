/**
 * Type definitions for the custom tracking layer.
 *
 * @module tracking/types
 */

/**
 * Engagement data captured with tracking events.
 */
export interface EngagementData {
  /** Current scroll depth as a percentage (0-100) */
  scrollDepth?: number;
  /** Time spent on section in milliseconds */
  timeOnSection?: number;
  /** Whether the element is currently visible in the viewport */
  viewportVisible?: boolean;
  /** Time spent on the page in milliseconds */
  timeOnPage?: number;
}

/**
 * A tracking event to be sent to analytics providers.
 */
export interface TrackingEvent {
  /** The intent identifier (e.g., "web.homepage.nav.docs.click") */
  intent: string;
  /** ISO timestamp when the event occurred */
  timestamp: string;
  /** Unique session identifier */
  sessionId: string;
  /** Additional properties for the event */
  properties?: Record<string, unknown>;
  /** Engagement metrics at the time of the event */
  engagement?: EngagementData;
}

/**
 * Interface for analytics providers (Vercel, custom, etc.).
 */
export interface TrackingProvider {
  /** Unique name for the provider */
  name: string;
  /** Send a tracking event */
  track: (event: TrackingEvent) => void | Promise<void>;
  /** Optional: Identify a user */
  identify?: (userId: string, traits?: Record<string, unknown>) => void;
  /** Optional: Cleanup/flush events on unmount */
  flush?: () => void | Promise<void>;
}

/**
 * Configuration for the tracking manager.
 */
export interface TrackingConfig {
  /** Whether tracking is enabled (default: true) */
  enabled?: boolean;
  /** Enable debug logging to console (default: false in production) */
  debug?: boolean;
  /** Batch events and send periodically (default: false) */
  batching?: boolean;
  /** Batch interval in milliseconds (default: 5000) */
  batchInterval?: number;
  /** Maximum batch size before forcing flush (default: 10) */
  maxBatchSize?: number;
}

/**
 * Options for tracking a specific event.
 */
export interface TrackOptions {
  /** Additional properties to include with the event */
  properties?: Record<string, unknown>;
  /** Engagement data to include */
  engagement?: EngagementData;
  /** Override the timestamp (defaults to now) */
  timestamp?: string;
}

/**
 * Section view tracking configuration.
 */
export interface SectionViewConfig {
  /** The intent to fire when section becomes visible */
  intent: string;
  /** Intersection threshold (0-1, default: 0.5) */
  threshold?: number;
  /** Only fire once per session (default: true) */
  once?: boolean;
  /** Minimum time visible before firing (ms, default: 0) */
  minVisibleTime?: number;
}

/**
 * Scroll depth milestone configuration.
 */
export interface ScrollDepthConfig {
  /** Milestones to track (default: [25, 50, 75, 100]) */
  milestones?: number[];
  /** Intent prefix for scroll events */
  intentPrefix?: string;
}

/**
 * Time on page milestone configuration.
 */
export interface TimeOnPageConfig {
  /** Time milestones in seconds to track (default: [30, 60, 120]) */
  milestones?: number[];
  /** Intent prefix for time events */
  intentPrefix?: string;
}
