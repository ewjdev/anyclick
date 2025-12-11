import type { CSSProperties, ReactNode } from "react";

export const BRAND_BLUE = "#3b82f6";

/**
 * Pointer visibility modes
 */
export type PointerVisibility = "always" | "enabled" | "never";

/**
 * Pointer operating modes
 * - normal: existing behavior
 * - fun: go-kart cursor with keyboard controls
 * - calm: reserved for future low-stimulus mode
 */
export type PointerMode = "normal" | "fun" | "calm";

/**
 * Pointer state during interactions
 */
export type PointerInteractionState = "normal" | "rightClick" | "pressing";

/**
 * Configuration for pointer theme colors
 */
export interface PointerThemeColors {
  /** Color of the pointer icon (default: brand blue) */
  pointerColor?: string;
  /** Color of the right-click circle (default: rgba(59, 130, 246, 0.5)) */
  circleColor?: string;
  /** Border color of the right-click circle (default: rgba(59, 130, 246, 0.8)) */
  circleBorderColor?: string;
}

/**
 * Configuration for pointer sizes
 */
export interface PointerThemeSizes {
  /** Size of the pointer icon in pixels (default: 24) */
  pointerSize?: number;
  /** Size of the right-click circle in pixels (default: 40) */
  circleSize?: number;
  /** Border width of the circle in pixels (default: 2) */
  circleBorderWidth?: number;
}

/**
 * Complete pointer theme configuration
 */
export interface PointerTheme {
  /** Color configuration */
  colors?: PointerThemeColors;
  /** Size configuration */
  sizes?: PointerThemeSizes;
  /** Custom pointer icon (default: MousePointer2 from lucide-react) */
  pointerIcon?: ReactNode;
  /** Custom circle icon/element for right-click state */
  circleElement?: ReactNode;
}

/**
 * Configuration for pointer behavior
 */
export interface PointerConfig {
  /**
   * When the custom pointer should be visible
   * - "always": Always show custom pointer
   * - "enabled": Only when parent provider enables it
   * - "never": Never show custom pointer
   * (default: "always")
   */
  visibility?: PointerVisibility;
  /** Whether to hide the default browser cursor (default: true) */
  hideDefaultCursor?: boolean;
  /** Z-index for the pointer element (default: 9990) */
  zIndex?: number;
  /** Whether to respect prefers-reduced-motion (default: true) */
  respectReducedMotion?: boolean;
  /** Offset from cursor position in pixels [x, y] (default: [0, 0]) */
  offset?: [number, number];
  /**
   * Pointer operating mode (default: normal)
   */
  mode?: PointerMode;
  /**
   * Enable lightweight performance logging/marks for debugging (default: false).
   * When enabled, CustomPointer will emit performance marks and aggregate
   * input-to-render latency to the console periodically.
   */
  debugPerformance?: boolean;
  /**
   * Enable verbose pointer debug logging/visual hints (default: false).
   * Shows console.debug output for pointer lifecycle and paints a magenta
   * outline on the pointer container to prove it is rendered.
   */
  debugLogging?: boolean;
  /** Interval in ms for perf log summaries when debugPerformance is true. */
  debugLogIntervalMs?: number;
  /**
   * Fun mode configuration
   */
  funConfig?: FunModeConfig;
}

/**
 * Configuration for fun mode (go-kart cursor)
 */
export interface FunModeConfig {
  /** Max speed in pixels per second (default: 650) */
  maxSpeed?: number;
  /** Acceleration in pixels per second^2 (default: 2200) */
  acceleration?: number;
  /** Friction per second (0-1, default: 0.82) */
  friction?: number;
  /** Bounce damping when hitting walls (0-1, default: 0.35) */
  bounceDamping?: number;
  /** Optional custom track element; falls back to viewport if absent */
  getTrackElement?: () => HTMLElement | null;
  /**
   * Optional function to provide obstacle bounding boxes for collisions.
   * Keep small for perf (e.g., sibling/child rects).
   */
  getObstacles?: () => DOMRect[];
}

/**
 * Internal state for go-kart pointer
 */
export interface GoKartState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  angle: number;
}

/**
 * Internal pointer state
 */
export interface PointerState {
  /** Current cursor position */
  position: { x: number; y: number };
  /** Current interaction state */
  interactionState: PointerInteractionState;
  /** Whether the pointer is visible */
  isVisible: boolean;
  /** Whether the pointer is within the document bounds */
  isInBounds: boolean;
}

/**
 * Props for the PointerProvider component
 */
export interface PointerProviderProps {
  /** Child components */
  children: ReactNode;
  /** Pointer theme configuration */
  theme?: PointerTheme;
  /** Pointer behavior configuration */
  config?: PointerConfig;
  /** Whether the pointer is enabled (default: true) */
  enabled?: boolean;
  /** Additional CSS class for the pointer container */
  className?: string;
  /** Additional inline styles for the pointer container */
  style?: CSSProperties;
}

/**
 * Props for the CustomPointer component (internal)
 */
export interface CustomPointerProps {
  /** Pointer theme configuration */
  theme?: PointerTheme;
  /** Pointer behavior configuration */
  config?: PointerConfig;
  /** Whether the pointer is enabled */
  enabled?: boolean;
  /** Callback when interaction state changes */
  onInteractionChange?: (state: PointerInteractionState) => void;
}

/**
 * Default theme colors
 */
export const defaultPointerThemeColors: Required<PointerThemeColors> = {
  pointerColor: BRAND_BLUE,
  circleColor: "rgba(59, 130, 246, 0.4)",
  circleBorderColor: "rgba(59, 130, 246, 0.7)",
};

/**
 * Default theme sizes
 */
export const defaultPointerThemeSizes: Required<PointerThemeSizes> = {
  pointerSize: 24,
  circleSize: 44,
  circleBorderWidth: 2,
};

/**
 * Default theme values
 */
export const defaultPointerTheme: PointerTheme & {
  colors: Required<PointerThemeColors>;
  sizes: Required<PointerThemeSizes>;
} = {
  colors: defaultPointerThemeColors,
  sizes: defaultPointerThemeSizes,
  pointerIcon: undefined,
  circleElement: undefined,
};

/**
 * Default configuration values
 */
export const defaultPointerConfig: Required<PointerConfig> = {
  visibility: "always",
  hideDefaultCursor: true,
  zIndex: 10001,
  respectReducedMotion: true,
  offset: [0, 0],
  mode: "normal",
  debugPerformance: false,
  debugLogging: false,
  debugLogIntervalMs: 4000,
  funConfig: {
    maxSpeed: 650,
    acceleration: 2200,
    friction: 0.82,
    bounceDamping: 0.35,
    getTrackElement: () => document.body,
    getObstacles: () => [],
  },
};
