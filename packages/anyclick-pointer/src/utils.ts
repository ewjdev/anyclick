import {
  PointerConfig,
  PointerContextValue,
  PointerTheme,
  PointerThemeColors,
  PointerThemeSizes,
  defaultPointerConfig,
  defaultPointerTheme,
  defaultPointerThemeColors,
  defaultPointerThemeSizes,
} from "./types";

/**
 * Fully merged theme with required values
 */
export interface MergedTheme {
  colors: Required<PointerThemeColors>;
  sizes: Required<PointerThemeSizes>;
  pointerIcon: PointerTheme["pointerIcon"];
  circleElement: PointerTheme["circleElement"];
}

/**
 * Merge a partial theme with defaults
 */
export function mergeThemeWithDefaults(theme?: PointerTheme): MergedTheme {
  return {
    colors: {
      pointerColor:
        theme?.colors?.pointerColor ?? defaultPointerThemeColors.pointerColor,
      circleColor:
        theme?.colors?.circleColor ?? defaultPointerThemeColors.circleColor,
      circleBorderColor:
        theme?.colors?.circleBorderColor ??
        defaultPointerThemeColors.circleBorderColor,
    },
    sizes: {
      pointerSize:
        theme?.sizes?.pointerSize ?? defaultPointerThemeSizes.pointerSize,
      circleSize:
        theme?.sizes?.circleSize ?? defaultPointerThemeSizes.circleSize,
      circleBorderWidth:
        theme?.sizes?.circleBorderWidth ??
        defaultPointerThemeSizes.circleBorderWidth,
    },
    pointerIcon: theme?.pointerIcon ?? defaultPointerTheme.pointerIcon,
    circleElement: theme?.circleElement ?? defaultPointerTheme.circleElement,
  };
}

/**
 * Merge config with defaults
 */
export function mergeConfigWithDefaults(
  config?: PointerConfig,
): Required<PointerConfig> {
  return {
    visibility: config?.visibility ?? defaultPointerConfig.visibility,
    hideDefaultCursor:
      config?.hideDefaultCursor ?? defaultPointerConfig.hideDefaultCursor,
    zIndex: config?.zIndex ?? defaultPointerConfig.zIndex,
    respectReducedMotion:
      config?.respectReducedMotion ?? defaultPointerConfig.respectReducedMotion,
    offset: config?.offset ?? defaultPointerConfig.offset,
    mode: config?.mode ?? defaultPointerConfig.mode,
    funConfig: {
      ...defaultPointerConfig.funConfig,
      ...config?.funConfig,
      getTrackElement:
        config?.funConfig?.getTrackElement ??
        defaultPointerConfig.funConfig.getTrackElement,
      getObstacles:
        config?.funConfig?.getObstacles ??
        defaultPointerConfig.funConfig.getObstacles,
    },
  };
}
