/**
 * Role-based preset configurations for common user types.
 *
 * Provides pre-configured menu items, screenshot settings, and themes
 * tailored for specific roles like QA, PM, Designer, and Developer.
 *
 * @module presets
 * @since 1.2.0
 *
 * @example
 * ```tsx
 * import { AnyclickProvider, createPresetMenu } from "@ewjdev/anyclick-react";
 *
 * const qaPreset = createPresetMenu("qa");
 *
 * function App() {
 *   return (
 *     <AnyclickProvider
 *       adapter={adapter}
 *       menuItems={qaPreset.menuItems}
 *       screenshotConfig={qaPreset.screenshotConfig}
 *       theme={qaPreset.theme}
 *     >
 *       <YourApp />
 *     </AnyclickProvider>
 *   );
 * }
 * ```
 */
import { CSSProperties } from "react";
import type { ScreenshotConfig } from "@ewjdev/anyclick-core";
import { openInspectDialog } from "./InspectDialog/InspectDialogManager";
import type { AnyclickTheme, ContextMenuItem, HighlightConfig } from "./types";

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

/**
 * Default preset configurations for each role.
 *
 * These are the base configurations that {@link createPresetMenu} uses.
 * You can use them directly if you don't need any customization.
 *
 * @since 1.2.0
 */
const presetDefaults: Record<PresetRole, PresetConfig> = {
  chrome: {
    description:
      "Chrome-like context menu with core browser actions and native styling.",
    label: "Chrome",
    menuItems: [
      {
        label: "Reload page",
        onClick: ({ closeMenu }) => {
          closeMenu();
          if (typeof window !== "undefined") {
            window.location.reload();
          }
          return false;
        },
        showComment: false,
        type: "reload_page",
      },
      {
        label: "Print…",
        onClick: ({ closeMenu }) => {
          closeMenu();
          if (typeof window !== "undefined") {
            window.print();
          }
          return false;
        },
        showComment: false,
        type: "print_page",
      },
      {
        label: 'Search "Google"',
        onClick: ({ closeMenu }) => {
          closeMenu();
          if (typeof window === "undefined") return false;
          const selection = window.getSelection()?.toString().trim();
          const query = selection && selection.length > 0 ? selection : "";
          const url = query
            ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
            : "https://www.google.com";
          window.open(url, "_blank", "noopener,noreferrer");
          return false;
        },
        showComment: false,
        type: "search_google",
      },
      {
        label: "Share…",
        onClick: async ({ closeMenu }) => {
          closeMenu();
          if (typeof window === "undefined") return false;
          const shareData = {
            text: document.title,
            title: document.title,
            url: window.location.href,
          };
          try {
            if (navigator.share) {
              await navigator.share(shareData);
            } else if (navigator.clipboard?.writeText) {
              await navigator.clipboard.writeText(window.location.href);
            }
          } catch {
            // Silently ignore share/clipboard errors to match native feel
          }
          return false;
        },
        showComment: false,
        type: "share_page",
      },
      {
        label: "Inspect",
        onClick: ({ closeMenu, targetElement }) => {
          closeMenu();
          if (targetElement) {
            openInspectDialog(targetElement);
          }
          return false;
        },
        showComment: false,
        type: "inspect",
      },
    ],
    role: "chrome",
    screenshotConfig: {
      enabled: false,
    },
    theme: {
      highlightConfig: {
        enabled: false,
      },
      menuStyle: {
        "--anyclick-menu-accent": "#8ab4f8",
        "--anyclick-menu-accent-text": "#0b1117",
        "--anyclick-menu-bg": "#202124",
        "--anyclick-menu-border": "#3c4043",
        "--anyclick-menu-cancel-bg": "#2f3135",
        "--anyclick-menu-cancel-text": "#9aa0a6",
        "--anyclick-menu-hover": "#2f3135",
        "--anyclick-menu-input-bg": "#2f3135",
        "--anyclick-menu-input-border": "#3c4043",
        "--anyclick-menu-text": "#e8eaed",
        "--anyclick-menu-text-muted": "#9aa0a6",
        backgroundColor: "#202124",
        border: "1px solid #3c4043",
        borderRadius: 6,
        boxShadow: "0 8px 18px rgba(0, 0, 0, 0.4)",
        color: "#e8eaed",
        fontFamily:
          'Roboto, "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: 14,
        letterSpacing: 0,
        minWidth: 240,
        padding: 0,
      } as CSSProperties,
    },
  },
  designer: {
    description: "Visual QA with contrast and motion cues.",
    label: "Designer",
    menuItems: [
      { label: "Visual bug", showComment: true, type: "visual_bug" },
      { label: "Accessibility", showComment: true, type: "accessibility" },
      { label: "Copy / tone", showComment: true, type: "copy_tone" },
      {
        badge: { label: "Coming soon", tone: "info" },
        label: "Motion glitch",
        showComment: true,
        status: "comingSoon",
        type: "motion_glitch",
      },
    ],
    metadata: {
      capture: {
        colorContrast: true,
        prefersReducedMotion: true,
      },
    },
    role: "designer",
    screenshotConfig: {
      enabled: true,
      padding: 32,
      quality: 0.75,
      showPreview: true,
    },
    theme: {
      highlightConfig: {
        colors: {
          containerColor: "#22d3ee",
          targetColor: "#a855f7",
        },
      },
    },
  },
  developer: {
    description: "Debug-ready menu with diagnostics placeholders.",
    label: "Developer",
    menuItems: [
      { label: "Bug", showComment: true, type: "bug" },
      { label: "Refactor request", showComment: true, type: "refactor" },
      {
        children: [
          {
            badge: { label: "Coming soon", tone: "info" },
            label: "Console snapshot",
            showComment: false,
            status: "comingSoon",
            type: "console_snapshot",
          },
          {
            badge: { label: "Coming soon", tone: "info" },
            label: "Network trace",
            showComment: false,
            status: "comingSoon",
            type: "network_trace",
          },
          {
            label: "Copy CSS selector",
            showComment: false,
            type: "copy_selector",
          },
        ],
        label: "Diagnostics",
        type: "diagnostics",
      },
    ],
    metadata: {
      capture: {
        console: "errors",
        network: "errors",
        reduxState: "opt-in",
      },
    },
    role: "developer",
    screenshotConfig: {
      enabled: true,
      padding: 20,
      quality: 0.7,
      showPreview: true,
    },
    theme: {
      highlightConfig: {
        colors: {
          containerColor: "#0ea5e9",
          targetColor: "#22c55e",
        },
      },
    },
  },
  pm: {
    description: "Idea-first menu with quick impact sizing.",
    label: "PM",
    menuItems: [
      { label: "Feature idea", showComment: true, type: "feature" },
      { label: "UX papercut", showComment: true, type: "ux_papercut" },
      { label: "Customer quote", showComment: true, type: "success_story" },
      {
        badge: { label: "Coming soon", tone: "neutral" },
        label: "Impact / priority",
        showComment: true,
        status: "comingSoon",
        type: "impact_sizing",
      },
    ],
    metadata: {
      capture: {
        audience: "pm",
        sentiment: true,
      },
    },
    role: "pm",
    screenshotConfig: {
      enabled: true,
      padding: 16,
      quality: 0.65,
      showPreview: true,
    },
  },
  qa: {
    description: "Defect-first menu tuned for repros and logs.",
    label: "QA",
    menuItems: [
      { label: "Bug / defect", showComment: true, type: "bug" },
      { label: "UX papercut", showComment: true, type: "ux_papercut" },
      { label: "Repro steps", showComment: true, type: "repro_steps" },
      {
        badge: { label: "Coming soon", tone: "info" },
        label: "Performance trace",
        showComment: true,
        status: "comingSoon",
        type: "perf_trace",
      },
      {
        badge: { label: "Coming soon", tone: "info" },
        label: "Video capture",
        showComment: false,
        status: "comingSoon",
        type: "video_capture",
      },
    ],
    metadata: {
      capture: {
        console: "errors",
        domSnapshot: true,
        network: "errors",
      },
    },
    role: "qa",
    screenshotConfig: {
      enabled: true,
      padding: 24,
      quality: 0.7,
      showPreview: true,
    },
  },
};

/**
 * Creates a preset menu configuration for a specific role.
 *
 * Returns a complete configuration that can be spread into AnyclickProvider props.
 * Coming-soon items are included by default but shown as disabled.
 *
 * @param role - The preset role to create a menu for
 * @param options - Optional customization options
 * @returns A complete preset configuration
 * @throws {Error} If an unknown role is specified
 *
 * @example
 * ```tsx
 * // Basic usage
 * const qaPreset = createPresetMenu("qa");
 *
 * // With customization
 * const devPreset = createPresetMenu("developer", {
 *   includeComingSoon: false,
 *   overrides: {
 *     screenshotConfig: { quality: 0.9 },
 *   },
 * });
 *
 * <AnyclickProvider
 *   adapter={adapter}
 *   menuItems={qaPreset.menuItems}
 *   screenshotConfig={qaPreset.screenshotConfig}
 *   theme={qaPreset.theme}
 * >
 *   <App />
 * </AnyclickProvider>
 * ```
 *
 * @since 1.2.0
 */
export function createPresetMenu(
  role: PresetRole,
  options: CreatePresetMenuOptions = {},
): PresetConfig {
  const preset = presetDefaults[role];
  if (!preset) {
    throw new Error(`Unknown preset role: ${role}`);
  }

  const includeComingSoon = options.includeComingSoon ?? true;
  const menuItems = (options.overrides?.menuItems ?? preset.menuItems).filter(
    (item) => (includeComingSoon ? true : item.status !== "comingSoon"),
  );

  // Shallow-clone menu items so consumers can mutate safely
  const clonedMenuItems: ContextMenuItem[] = menuItems.map((item) => ({
    ...item,
    children: item.children
      ? item.children.map((child) => ({ ...child }))
      : undefined,
  }));

  return {
    description: preset.description,
    label: preset.label,
    menuItems: clonedMenuItems,
    metadata: {
      ...preset.metadata,
      ...options.overrides?.metadata,
    },
    role: preset.role,
    screenshotConfig: {
      ...preset.screenshotConfig,
      ...options.overrides?.screenshotConfig,
    },
    theme: {
      ...preset.theme,
      ...options.overrides?.theme,
    },
  };
}

/**
 * Lists all available preset configurations.
 *
 * Returns cloned copies of all presets so they can be safely modified.
 * Useful for displaying available options or building custom preset selectors.
 *
 * @returns Array of all preset configurations
 *
 * @example
 * ```tsx
 * const presets = listPresets();
 *
 * function PresetSelector({ onSelect }) {
 *   return (
 *     <select onChange={(e) => onSelect(e.target.value)}>
 *       {presets.map((preset) => (
 *         <option key={preset.role} value={preset.role}>
 *           {preset.label} - {preset.description}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 *
 * @since 1.2.0
 */
export function listPresets(): PresetConfig[] {
  return Object.values(presetDefaults).map((preset) => ({
    ...preset,
    menuItems: preset.menuItems.map((item) => ({
      ...item,
      children: item.children
        ? item.children.map((child) => ({ ...child }))
        : undefined,
    })),
  }));
}

export { presetDefaults };
