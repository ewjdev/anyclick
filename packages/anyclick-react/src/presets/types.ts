import type { ScreenshotConfig } from "@ewjdev/anyclick-core";
import { AnyclickTheme, ContextMenuItem, HighlightConfig } from "../types";

/**
 * Available preset role identifiers.
 *
 * - `qa` - QA/Testing focused menu with bug reporting and repro steps
 * - `pm` - Product Manager focused menu with feature ideas and impact sizing
 * - `designer` - Designer focused menu with visual QA and accessibility
 * - `developer` - Developer focused menu with diagnostics and debugging
 * - `chrome` - Chrome-like context menu with browser actions
 *
 * @since 1.2.0
 */
export type PresetRole = "chrome" | "designer" | "developer" | "pm" | "qa";

/**
 * Complete preset configuration for a role.
 *
 * Contains all the settings needed to configure an AnyclickProvider
 * for a specific user role.
 *
 * @since 1.2.0
 */
export interface PresetConfig {
  /** Human-readable description of the preset */
  description: string;
  /** Optional highlight configuration */
  highlightConfig?: HighlightConfig;
  /** Human-readable label for the preset */
  label: string;
  /** Context menu items for this preset */
  menuItems: ContextMenuItem[];
  /** Additional metadata to include with submissions */
  metadata?: Record<string, unknown>;
  /** The preset role identifier */
  role: PresetRole;
  /** Screenshot capture configuration */
  screenshotConfig?: Partial<ScreenshotConfig>;
  /** Theme configuration including styles and highlighting */
  theme?: AnyclickTheme;
}

/**
 * Options for customizing preset menu creation.
 *
 * @since 1.2.0
 */
export interface CreatePresetMenuOptions {
  /**
   * Whether to include coming-soon items in the menu.
   * Coming-soon items are shown but disabled.
   * @default true
   */
  includeComingSoon?: boolean;
  /**
   * Optional overrides for menu items, screenshot config, metadata, or theme.
   * Useful when you want to tweak a preset without rebuilding it manually.
   *
   * @example
   * ```ts
   * const qaPreset = createPresetMenu("qa", {
   *   overrides: {
   *     screenshotConfig: { quality: 0.9 },
   *     theme: { highlightConfig: { colors: { targetColor: "#ef4444" } } },
   *   },
   * });
   * ```
   */
  overrides?: Partial<Omit<PresetConfig, "description" | "label" | "role">>;
}
