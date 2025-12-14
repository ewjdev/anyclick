"use client";

/**
 * Ac - Declarative intent tracking components.
 *
 * A namespace of React components for tracking user interactions
 * with minimal boilerplate.
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
 * // Context provider
 * <Ac.Context metadata={{ section: "packages" }}>
 *   <Ac.Intent intent={HomepageIntent.CARD_CLICK}>
 *     <Card />
 *   </Ac.Intent>
 * </Ac.Context>
 * ```
 */
import { AcContext } from "./AcContext";
import { AcIntent } from "./AcIntent";
import { AcView } from "./AcView";

// Export individual components for direct imports
export { AcIntent } from "./AcIntent";
export { AcContext } from "./AcContext";
export { AcView } from "./AcView";
export { useAcContext } from "./context";

// Export types
export type { AcIntentProps } from "./AcIntent";
export type { AcContextProps } from "./AcContext";
export type { AcViewProps } from "./AcView";
export type { AcContextData } from "./context";

/**
 * Ac namespace - Declarative intent tracking components.
 *
 * Use `Ac.Intent` for click/hover tracking, `Ac.View` for visibility tracking,
 * and `Ac.Context` for hierarchical context data.
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
   * Provides context data to nested Ac.Intent and Ac.View components.
   *
   * @example
   * ```tsx
   * <Ac.Context metadata={{ section: "hero" }}>
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
} as const;
