"use client";

/**
 * Ac - Declarative intent tracking components.
 *
 * A namespace of React components for tracking user interactions
 * with minimal boilerplate. Integrates with AnyclickProvider for
 * context menu actions.
 *
 * @module components/tracking
 *
 * @example
 * ```tsx
 * import { Ac } from "@/components/tracking";
 *
 * // Click tracking
 * <Ac.Intent intent={HomepageIntent.NAV_DOCS_CLICK}>
 *   <Link href="/docs">Docs</Link>
 * </Ac.Intent>
 *
 * // Hover tracking
 * <Ac.Intent intent={HomepageIntent.CARD_HOVER} on="hover">
 *   <Card />
 * </Ac.Intent>
 *
 * // View tracking
 * <Ac.View intent={HomepageIntent.SECTION_VIEW}>
 *   <section>...</section>
 * </Ac.View>
 *
 * // Context provider with actions
 * <Ac.Context
 *   metadata={{ section: "packages" }}
 *   actions={[
 *     createTrackAndSubmitAction(HomepageIntent.FEEDBACK, {
 *       label: "Give Feedback",
 *       showComment: true,
 *     }),
 *   ]}
 * >
 *   <Ac.Intent intent={HomepageIntent.CARD_CLICK}>
 *     <Card />
 *   </Ac.Intent>
 * </Ac.Context>
 * ```
 */
// Components
import { AcContext } from "./AcContext";
import { AcDebugPanel } from "./AcDebugPanel";
import { AcIntent } from "./AcIntent";
import { AcMenuBridge } from "./AcMenuBridge";
import { AcView } from "./AcView";

// Export individual components
export { AcContext } from "./AcContext";
export { AcIntent } from "./AcIntent";
export { AcView } from "./AcView";
export { AcMenuBridge, useAcActions, useAcActionGetter } from "./AcMenuBridge";

// Export context hook
export { useAcContext } from "./context";

// Export store and hooks
export { useIntentStore, generateId } from "./store";

// Export helper functions
export {
  createTrackOnlyAction,
  createTrackAndSubmitAction,
  createScreenshotAction,
  createCustomAction,
  trackIntent,
} from "./helpers";

// Export types
export type {
  AcAction,
  AcActionContext,
  AcContextProps,
  AcIntentProps,
  AcViewProps,
  RegisteredContext,
  RegisteredIntent,
  IntentEventType,
  IntentStore,
} from "./types";

export type { AcContextData } from "./context";
export type { AcMenuBridgeProps } from "./AcMenuBridge";

/**
 * Ac namespace - Declarative intent tracking components.
 *
 * Use `Ac.Intent` for click/hover tracking, `Ac.View` for visibility tracking,
 * `Ac.Context` for hierarchical context and actions, and `Ac.MenuBridge`
 * for AnyclickProvider integration.
 */
export const Ac = {
  /**
   * Wraps interactive elements to track clicks and/or hovers.
   *
   * @example
   * ```tsx
   * <Ac.Intent intent={HomepageIntent.NAV_CLICK}>
   *   <Link href="/docs">Docs</Link>
   * </Ac.Intent>
   * ```
   */
  Intent: AcIntent,

  /**
   * Provides context data and actions to nested Ac.Intent and Ac.View components.
   *
   * @example
   * ```tsx
   * <Ac.Context
   *   metadata={{ section: "hero" }}
   *   actions={[createTrackAndSubmitAction("feedback", { label: "Feedback" })]}
   * >
   *   <Ac.Intent intent={HomepageIntent.CTA_CLICK}>
   *     <button>Get Started</button>
   *   </Ac.Intent>
   * </Ac.Context>
   * ```
   */
  Context: AcContext,

  /**
   * Tracks when an element becomes visible in the viewport.
   *
   * @example
   * ```tsx
   * <Ac.View intent={HomepageIntent.SECTION_VIEW} threshold={0.3}>
   *   <section>...</section>
   * </Ac.View>
   * ```
   */
  View: AcView,

  /**
   * Bridges Ac actions with AnyclickProvider context menu.
   * Place inside AnyclickProvider to enable dynamic menu items.
   *
   * @example
   * ```tsx
   * <AnyclickProvider adapter={adapter}>
   *   <Ac.MenuBridge />
   *   <App />
   * </AnyclickProvider>
   * ```
   */
  MenuBridge: AcMenuBridge,

  /**
   * Debug panel showing registered contexts and intents.
   * Only renders in development mode.
   *
   * @example
   * ```tsx
   * <Ac.DebugPanel />
   * ```
   */
  DebugPanel: AcDebugPanel,
} as const;
