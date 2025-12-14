"use client";

/**
 * Helper functions for creating Ac actions.
 *
 * Provides convenient wrappers for common action patterns like
 * track-only, track-and-submit, and screenshot capture.
 *
 * @module components/tracking/helpers
 */
import { getTrackingManager } from "@/lib/tracking/manager";
import type { AcAction, AcActionContext } from "./types";

/**
 * Default priority for actions (middle of 1-10 range).
 */
const DEFAULT_PRIORITY = 5;

/**
 * Options for creating actions.
 */
interface ActionOptions {
  /** Display label in context menu */
  label?: string;
  /** Priority for sorting (1-10, where 10 = highest) */
  priority?: number;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Show comment input when selected */
  showComment?: boolean;
  /** Required roles to see this action */
  requiredRoles?: string[];
}

/**
 * Creates an action that only fires the tracking event.
 *
 * Use this for lightweight tracking without triggering anyclick submission.
 *
 * @param intent - The intent identifier
 * @param options - Optional configuration
 * @returns An AcAction that fires tracking only
 *
 * @example
 * ```tsx
 * <Ac.Context
 *   actions={[
 *     createTrackOnlyAction(HomepageIntent.SECTION_VIEWED, {
 *       label: "Mark as Viewed",
 *       priority: 3,
 *     }),
 *   ]}
 * >
 * ```
 */
export function createTrackOnlyAction(
  intent: string,
  options: ActionOptions = {},
): AcAction {
  return {
    intent,
    label: options.label ?? formatIntentAsLabel(intent),
    priority: options.priority ?? DEFAULT_PRIORITY,
    icon: options.icon,
    showComment: false,
    requiredRoles: options.requiredRoles,
    handler: (context: AcActionContext) => {
      // Fire tracking event
      context.track();
      // Close menu
      context.closeMenu();
      // Return false to skip default submission
      return false;
    },
  };
}

/**
 * Creates an action that fires tracking AND submits to the anyclick adapter.
 *
 * Use this for actions that should create issues, feedback, etc.
 *
 * @param intent - The intent identifier
 * @param options - Optional configuration
 * @returns An AcAction that tracks and submits
 *
 * @example
 * ```tsx
 * <Ac.Context
 *   actions={[
 *     createTrackAndSubmitAction(HomepageIntent.REPORT_ISSUE, {
 *       label: "Report Issue",
 *       showComment: true,
 *       priority: 10,
 *     }),
 *   ]}
 * >
 * ```
 */
export function createTrackAndSubmitAction(
  intent: string,
  options: ActionOptions = {},
): AcAction {
  return {
    intent,
    label: options.label ?? formatIntentAsLabel(intent),
    priority: options.priority ?? DEFAULT_PRIORITY,
    icon: options.icon,
    showComment: options.showComment ?? false,
    requiredRoles: options.requiredRoles,
    handler: async (context: AcActionContext) => {
      // Fire tracking event
      context.track();
      // Let default submission flow continue
      return true;
    },
  };
}

/**
 * Creates an action that captures screenshots before submitting.
 *
 * Use this for visual feedback that needs screenshot context.
 *
 * @param intent - The intent identifier
 * @param options - Optional configuration
 * @returns An AcAction that captures screenshots and submits
 *
 * @example
 * ```tsx
 * <Ac.Context
 *   actions={[
 *     createScreenshotAction(HomepageIntent.VISUAL_BUG, {
 *       label: "Report Visual Bug",
 *       showComment: true,
 *       priority: 9,
 *     }),
 *   ]}
 * >
 * ```
 */
export function createScreenshotAction(
  intent: string,
  options: ActionOptions = {},
): AcAction {
  return {
    intent,
    label: options.label ?? formatIntentAsLabel(intent),
    priority: options.priority ?? DEFAULT_PRIORITY,
    icon: options.icon,
    showComment: options.showComment ?? true,
    requiredRoles: options.requiredRoles,
    handler: async (context: AcActionContext) => {
      // Fire tracking event
      context.track();
      // Capture screenshots
      await context.captureScreenshots();
      // Let default submission flow continue
      return true;
    },
  };
}

/**
 * Creates a custom action with full control over the handler.
 *
 * Use this when you need custom behavior beyond track/submit/screenshot.
 *
 * @param intent - The intent identifier
 * @param handler - Custom handler function
 * @param options - Optional configuration
 * @returns An AcAction with custom handler
 *
 * @example
 * ```tsx
 * <Ac.Context
 *   actions={[
 *     createCustomAction(
 *       HomepageIntent.CUSTOM_ACTION,
 *       async (ctx) => {
 *         ctx.track();
 *         await myCustomLogic(ctx.metadata);
 *         ctx.closeMenu();
 *         return false; // Skip default submission
 *       },
 *       { label: "Custom Action", priority: 7 }
 *     ),
 *   ]}
 * >
 * ```
 */
export function createCustomAction(
  intent: string,
  handler: AcAction["handler"],
  options: ActionOptions = {},
): AcAction {
  return {
    intent,
    label: options.label ?? formatIntentAsLabel(intent),
    priority: options.priority ?? DEFAULT_PRIORITY,
    icon: options.icon,
    showComment: options.showComment ?? false,
    requiredRoles: options.requiredRoles,
    handler,
  };
}

/**
 * Helper to fire a tracking event for an intent.
 *
 * Use this in custom handlers or outside of Ac components.
 *
 * @param intent - The intent identifier
 * @param metadata - Optional metadata to include
 *
 * @example
 * ```ts
 * trackIntent(HomepageIntent.BUTTON_CLICK, { buttonId: "cta" });
 * ```
 */
export function trackIntent(
  intent: string,
  metadata?: Record<string, unknown>,
): void {
  getTrackingManager().track(intent, {
    properties: metadata,
  });
}

/**
 * Formats an intent string as a human-readable label.
 *
 * Converts "web.homepage.nav.docs.click" to "Docs Click"
 *
 * @param intent - The intent identifier
 * @returns Human-readable label
 */
function formatIntentAsLabel(intent: string): string {
  // Get last two segments (e.g., "docs.click" from "web.homepage.nav.docs.click")
  const segments = intent.split(".");
  const lastTwo = segments.slice(-2);

  // Capitalize and join
  return lastTwo.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}
