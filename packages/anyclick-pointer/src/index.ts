// Components
"use client";

// Legacy provider (complex nesting with context merging) - deprecated
export {
  // Theme/config merging helpers (still useful)
  mergeThemeWithDefaults,
  mergeConfigWithDefaults,
} from "./utils";

// Re-export MergedTheme type
export type { MergedTheme } from "./utils";

// Custom pointer component (for advanced use cases)
export { CustomPointer } from "./CustomPointer";

// Pointer store (for advanced use cases - accessing global state)
export { usePointerStore, POINTER_CONTAINER_ATTR } from "./pointerStore";
export type { PointerContainerEntry } from "./pointerStore";

// Types
export type {
  PointerVisibility,
  PointerMode,
  PointerInteractionState,
  PointerThemeColors,
  PointerThemeSizes,
  PointerTheme,
  PointerConfig,
  FunModeConfig,
  PointerState,
  PointerProviderProps,
  CustomPointerProps,
  PointerContextValue,
} from "./types";

// Default values
export {
  defaultPointerTheme,
  defaultPointerThemeColors,
  defaultPointerThemeSizes,
  defaultPointerConfig,
} from "./types";

// Animation utilities
export {
  springTransition,
  quickSpringTransition,
  fadeTransition,
  pointerVariants,
  circleVariants,
  rippleVariants,
  containerVariants,
  getTransition,
  createSpringTransition,
} from "./animations";

// Device detection utilities
export {
  hasTouchSupport,
  hasFinePointer,
  isMobileDevice,
  isTabletDevice,
  isDesktopDevice,
  shouldShowPointer,
  markTouchInteraction,
  wasLastInteractionTouch,
  clearTouchInteraction,
  resetDeviceDetectionCache,
  getDeviceType,
} from "./deviceDetection";

// Cursor hiding utility
export { useHideCursor } from "./useHideCursor";

export { usePointer } from "./usePointer";

export { PointerProvider } from "./PointerProvider";
