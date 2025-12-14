/**
 * Tracking Manager - Singleton for managing analytics providers.
 *
 * Handles event batching, session management, and provider registration.
 *
 * @module tracking/manager
 */

import type {
  TrackingConfig,
  TrackingEvent,
  TrackingProvider,
  TrackOptions,
} from "./types";

const DEFAULT_CONFIG: Required<TrackingConfig> = {
  enabled: true,
  debug: process.env.NODE_ENV === "development",
  batching: false,
  batchInterval: 5000,
  maxBatchSize: 10,
};

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get or create a session ID from sessionStorage.
 */
function getSessionId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const STORAGE_KEY = "ac_session_id";
  let sessionId = sessionStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Tracking Manager class - manages providers and event dispatch.
 */
class TrackingManager {
  private static instance: TrackingManager | null = null;

  private providers: Map<string, TrackingProvider> = new Map();
  private config: Required<TrackingConfig> = DEFAULT_CONFIG;
  private eventQueue: TrackingEvent[] = [];
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;

  private constructor() {
    this.sessionId = getSessionId();

    // Setup batch timer if batching is enabled
    if (typeof window !== "undefined") {
      this.setupBatchTimer();
    }
  }

  /**
   * Get the singleton instance.
   */
  static getInstance(): TrackingManager {
    if (!TrackingManager.instance) {
      TrackingManager.instance = new TrackingManager();
    }
    return TrackingManager.instance;
  }

  /**
   * Configure the tracking manager.
   */
  configure(config: TrackingConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Reset batch timer with new config
    this.setupBatchTimer();
  }

  /**
   * Register an analytics provider.
   */
  registerProvider(provider: TrackingProvider): void {
    if (this.providers.has(provider.name)) {
      this.log(`Provider "${provider.name}" already registered, replacing...`);
    }
    this.providers.set(provider.name, provider);
    this.log(`Provider "${provider.name}" registered`);
  }

  /**
   * Unregister an analytics provider.
   */
  unregisterProvider(name: string): void {
    if (this.providers.has(name)) {
      this.providers.delete(name);
      this.log(`Provider "${name}" unregistered`);
    }
  }

  /**
   * Track an event with all registered providers.
   */
  track(intent: string, options: TrackOptions = {}): void {
    if (!this.config.enabled) {
      return;
    }

    const event: TrackingEvent = {
      intent,
      timestamp: options.timestamp ?? new Date().toISOString(),
      sessionId: this.sessionId,
      properties: options.properties,
      engagement: options.engagement,
    };

    this.log("Track event:", event);

    if (this.config.batching) {
      this.queueEvent(event);
    } else {
      this.dispatchEvent(event);
    }
  }

  /**
   * Identify a user across all providers.
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.config.enabled) {
      return;
    }

    this.log("Identify user:", userId, traits);

    const providers = Array.from(this.providers.values());
    for (const provider of providers) {
      if (provider.identify) {
        try {
          provider.identify(userId, traits);
        } catch (error) {
          console.error(
            `[Tracking] Error identifying with provider "${provider.name}":`,
            error
          );
        }
      }
    }
  }

  /**
   * Flush all queued events immediately.
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    this.log(`Flushing ${this.eventQueue.length} queued events`);

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of events) {
      await this.dispatchEvent(event);
    }

    // Also flush individual providers
    const allProviders = Array.from(this.providers.values());
    for (const provider of allProviders) {
      if (provider.flush) {
        try {
          await provider.flush();
        } catch (error) {
          console.error(
            `[Tracking] Error flushing provider "${provider.name}":`,
            error
          );
        }
      }
    }
  }

  /**
   * Get the current session ID.
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get registered provider names.
   */
  getProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setupBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.config.batching && typeof window !== "undefined") {
      this.batchTimer = setInterval(() => {
        this.flush();
      }, this.config.batchInterval);
    }
  }

  private queueEvent(event: TrackingEvent): void {
    this.eventQueue.push(event);

    // Force flush if queue is full
    if (this.eventQueue.length >= this.config.maxBatchSize) {
      this.flush();
    }
  }

  private async dispatchEvent(event: TrackingEvent): Promise<void> {
    const providers = Array.from(this.providers.values());
    for (const provider of providers) {
      try {
        await provider.track(event);
      } catch (error) {
        console.error(
          `[Tracking] Error dispatching to provider "${provider.name}":`,
          error
        );
      }
    }
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log("[Tracking]", ...args);
    }
  }
}

/**
 * Get the tracking manager singleton.
 */
export function getTrackingManager(): TrackingManager {
  return TrackingManager.getInstance();
}

/**
 * Convenience function to track an event.
 */
export function trackEvent(intent: string, options?: TrackOptions): void {
  getTrackingManager().track(intent, options);
}

/**
 * Convenience function to identify a user.
 */
export function identifyUser(
  userId: string,
  traits?: Record<string, unknown>
): void {
  getTrackingManager().identify(userId, traits);
}
