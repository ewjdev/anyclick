import type { ScreenshotConfig } from "@ewjdev/anyclick-core";
import type { AnyclickTheme, FeedbackMenuItem } from "./types";

export type PresetRole = "qa" | "pm" | "designer" | "developer";

export interface PresetConfig {
  role: PresetRole;
  label: string;
  description: string;
  menuItems: FeedbackMenuItem[];
  screenshotConfig?: Partial<ScreenshotConfig>;
  metadata?: Record<string, unknown>;
  theme?: AnyclickTheme;
}

export interface CreatePresetMenuOptions {
  /** Whether to include coming-soon items (defaults to true) */
  includeComingSoon?: boolean;
  /**
   * Optional overrides for menu items, screenshot config, metadata, or theme.
   * Useful when you want to tweak a preset without rebuilding it manually.
   */
  overrides?: Partial<Omit<PresetConfig, "role" | "label" | "description">>;
}

const presetDefaults: Record<PresetRole, PresetConfig> = {
  qa: {
    role: "qa",
    label: "QA",
    description: "Defect-first menu tuned for repros and logs.",
    menuItems: [
      { type: "bug", label: "Bug / defect", showComment: true },
      { type: "ux_papercut", label: "UX papercut", showComment: true },
      {
        type: "repro_steps",
        label: "Repro steps",
        showComment: true,
      },
      {
        type: "perf_trace",
        label: "Performance trace",
        showComment: true,
        status: "comingSoon",
        badge: { label: "Coming soon", tone: "info" },
      },
      {
        type: "video_capture",
        label: "Video capture",
        showComment: false,
        status: "comingSoon",
        badge: { label: "Coming soon", tone: "info" },
      },
    ],
    screenshotConfig: {
      enabled: true,
      showPreview: true,
      padding: 24,
      quality: 0.7,
    },
    metadata: {
      capture: {
        console: "errors",
        network: "errors",
        domSnapshot: true,
      },
    },
  },
  pm: {
    role: "pm",
    label: "PM",
    description: "Idea-first menu with quick impact sizing.",
    menuItems: [
      { type: "feature", label: "Feature idea", showComment: true },
      { type: "ux_papercut", label: "UX papercut", showComment: true },
      { type: "success_story", label: "Customer quote", showComment: true },
      {
        type: "impact_sizing",
        label: "Impact / priority",
        showComment: true,
        status: "comingSoon",
        badge: { label: "Coming soon", tone: "neutral" },
      },
    ],
    screenshotConfig: {
      enabled: true,
      showPreview: true,
      quality: 0.65,
      padding: 16,
    },
    metadata: {
      capture: {
        sentiment: true,
        audience: "pm",
      },
    },
  },
  designer: {
    role: "designer",
    label: "Designer",
    description: "Visual QA with contrast and motion cues.",
    menuItems: [
      { type: "visual_bug", label: "Visual bug", showComment: true },
      { type: "accessibility", label: "Accessibility", showComment: true },
      { type: "copy_tone", label: "Copy / tone", showComment: true },
      {
        type: "motion_glitch",
        label: "Motion glitch",
        showComment: true,
        status: "comingSoon",
        badge: { label: "Coming soon", tone: "info" },
      },
    ],
    screenshotConfig: {
      enabled: true,
      showPreview: true,
      quality: 0.75,
      padding: 32,
    },
    metadata: {
      capture: {
        colorContrast: true,
        prefersReducedMotion: true,
      },
    },
    theme: {
      highlightConfig: {
        colors: {
          targetColor: "#a855f7",
          containerColor: "#22d3ee",
        },
      },
    },
  },
  developer: {
    role: "developer",
    label: "Developer",
    description: "Debug-ready menu with diagnostics placeholders.",
    menuItems: [
      { type: "bug", label: "Bug", showComment: true },
      { type: "refactor", label: "Refactor request", showComment: true },
      {
        type: "diagnostics",
        label: "Diagnostics",
        children: [
          {
            type: "console_snapshot",
            label: "Console snapshot",
            showComment: false,
            status: "comingSoon",
            badge: { label: "Coming soon", tone: "info" },
          },
          {
            type: "network_trace",
            label: "Network trace",
            showComment: false,
            status: "comingSoon",
            badge: { label: "Coming soon", tone: "info" },
          },
          {
            type: "copy_selector",
            label: "Copy CSS selector",
            showComment: false,
          },
        ],
      },
    ],
    screenshotConfig: {
      enabled: true,
      showPreview: true,
      padding: 20,
      quality: 0.7,
    },
    metadata: {
      capture: {
        console: "errors",
        network: "errors",
        reduxState: "opt-in",
      },
    },
    theme: {
      highlightConfig: {
        colors: {
          targetColor: "#22c55e",
          containerColor: "#0ea5e9",
        },
      },
    },
  },
};

/**
 * Create a preset menu for a given role. Coming-soon items remain visible but disabled.
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
  const menuItems = (options.overrides?.menuItems ??
    preset.menuItems).filter((item) =>
    includeComingSoon ? true : item.status !== "comingSoon",
  );

  // Shallow-clone menu items so consumers can mutate safely
  const clonedMenuItems: FeedbackMenuItem[] = menuItems.map((item) => ({
    ...item,
    children: item.children
      ? item.children.map((child) => ({ ...child }))
      : undefined,
  }));

  return {
    role: preset.role,
    label: preset.label,
    description: preset.description,
    menuItems: clonedMenuItems,
    screenshotConfig: {
      ...preset.screenshotConfig,
      ...options.overrides?.screenshotConfig,
    },
    metadata: {
      ...preset.metadata,
      ...options.overrides?.metadata,
    },
    theme: {
      ...preset.theme,
      ...options.overrides?.theme,
    },
  };
}

/**
 * List all available presets with their defaults.
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

