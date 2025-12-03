// Components
"use client";

export { PointerProvider, PointerContext, usePointer } from "./PointerProvider";
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
