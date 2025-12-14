/**
 * Vercel Analytics Provider
 *
 * Adapter for sending tracking events to Vercel Analytics.
 *
 * @module tracking/providers/vercel
 */
import { track } from "@vercel/analytics";
import type { TrackingEvent, TrackingProvider } from "../types";

// vercel/analytics type AllowedPropertyValues, not currently exported
// https://github.com/vercel/analytics/blob/2275e2743d2827b786b4e47c4ab337dae1d2d75b/packages/web/src/types.ts#L13
type AllowedPropertyValues = string | number | boolean | null | undefined;
/**
 * Create a Vercel Analytics tracking provider.
 */
export function createVercelProvider(): TrackingProvider {
  return {
    name: "vercel",

    track: (event: TrackingEvent) => {
      // Vercel Analytics has limits on property depth/size
      // Flatten engagement data into the properties object
      const properties: Record<string, AllowedPropertyValues> = {
        ...event.properties,
        sessionId: event.sessionId,
        timestamp: event.timestamp,
      };

      if (event.engagement) {
        if (event.engagement.scrollDepth !== undefined) {
          properties.scrollDepth = event.engagement.scrollDepth;
        }
        if (event.engagement.timeOnPage !== undefined) {
          properties.timeOnPage = event.engagement.timeOnPage;
        }
        if (event.engagement.timeOnSection !== undefined) {
          properties.timeOnSection = event.engagement.timeOnSection;
        }
        if (event.engagement.viewportVisible !== undefined) {
          properties.viewportVisible = event.engagement.viewportVisible;
        }
      }

      // Use intent as the event name for Vercel Analytics
      track(event.intent, properties);
    },

    // Vercel Analytics doesn't have a built-in identify method
    // but we can track an identify event
    identify: (userId: string, traits?: Record<string, unknown>) => {
      track("user.identify", {
        userId,
        ...traits,
      });
    },
  };
}

/**
 * Default Vercel provider instance.
 */
export const vercelProvider = createVercelProvider();
