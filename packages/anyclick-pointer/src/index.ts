// Components
"use client";

export {
  PointerProvider,
  PointerContext,
  usePointer,
  useParentPointerTheme,
  // Theme/config merging helpers
  mergeThemeWithDefaults,
  mergeThemeWithParent,
  mergeConfigWithDefaults,
  mergeConfigWithParent,
} from "./PointerProvider";

// Re-export MergedTheme type
export type { MergedTheme } from "./PointerProvider";
export { CustomPointer } from "./CustomPointer";

// Types
export type {
  PointerVisibility,
  PointerInteractionState,
  PointerThemeColors,
  PointerThemeSizes,
  PointerTheme,
  PointerConfig,
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
