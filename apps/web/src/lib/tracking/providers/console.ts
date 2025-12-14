/**
 * Console Provider - For development/debugging
 *
 * Logs all tracking events to the console.
 *
 * @module tracking/providers/console
 */

import type { TrackingEvent, TrackingProvider } from "../types";

/**
 * Create a console logging provider for development.
 */
export function createConsoleProvider(): TrackingProvider {
  return {
    name: "console",

    track: (event: TrackingEvent) => {
      console.log(
        "%c[Intent Track]",
        "color: #8b5cf6; font-weight: bold;",
        event.intent,
        {
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          properties: event.properties,
          engagement: event.engagement,
        }
      );
    },

    identify: (userId: string, traits?: Record<string, unknown>) => {
      console.log(
        "%c[Intent Identify]",
        "color: #06b6d4; font-weight: bold;",
        userId,
        traits
      );
    },
  };
}

/**
 * Default console provider instance.
 */
export const consoleProvider = createConsoleProvider();
