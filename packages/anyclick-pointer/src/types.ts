import type { ReactNode, CSSProperties } from "react";

/**
 * Pointer visibility modes
 */
export type PointerVisibility = "always" | "enabled" | "never";

/**
 * Pointer state during interactions
 */
export type PointerInteractionState = "normal" | "rightClick" | "pressing";

/**
 * Configuration for pointer theme colors
 */
export interface PointerThemeColors {
  /** Color of the pointer icon (default: currentColor) */
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
 * Context value for pointer state and configuration
 */
export interface PointerContextValue {
  /** Current pointer state */
  state: PointerState;
  /** Whether the pointer is enabled */
  isEnabled: boolean;
  /** Current theme */
  theme: PointerTheme;
  /** Current configuration */
  config: PointerConfig;
  /** Update the interaction state programmatically */
  setInteractionState: (state: PointerInteractionState) => void;
  /** Update enabled state */
  setEnabled: (enabled: boolean) => void;
  /** Update theme dynamically */
  setTheme: (theme: PointerTheme) => void;
  /** Update config dynamically */
  setConfig: (config: PointerConfig) => void;
}

/**
 * Default theme colors
 */
export const defaultPointerThemeColors: Required<PointerThemeColors> = {
  pointerColor: "currentColor",
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
};
