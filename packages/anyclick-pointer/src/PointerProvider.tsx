"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  PointerProviderProps,
  PointerContextValue,
  PointerInteractionState,
  PointerState,
  PointerTheme,
  PointerConfig,
} from "./types";
import {
  defaultPointerTheme,
  defaultPointerThemeColors,
  defaultPointerThemeSizes,
  defaultPointerConfig,
} from "./types";
import { CustomPointer } from "./CustomPointer";

/**
 * Default context state
 */
const defaultContextValue: PointerContextValue = {
  state: {
    position: { x: 0, y: 0 },
    interactionState: "normal",
    isVisible: false,
    isInBounds: false,
  },
  isEnabled: true,
  theme: defaultPointerTheme,
  config: defaultPointerConfig,
  setInteractionState: () => {},
  setEnabled: () => {},
  setTheme: () => {},
  setConfig: () => {},
};

/**
 * React context for pointer state and configuration
 */
export const PointerContext =
  createContext<PointerContextValue>(defaultContextValue);

/**
 * Hook to access pointer context
 */
export function usePointer(): PointerContextValue {
  const context = useContext(PointerContext);
  if (!context) {
    throw new Error("usePointer must be used within a PointerProvider");
  }
  return context;
}

/**
 * Fully merged theme with required values
 */
interface MergedTheme {
  colors: Required<NonNullable<PointerTheme["colors"]>>;
  sizes: Required<NonNullable<PointerTheme["sizes"]>>;
  pointerIcon: PointerTheme["pointerIcon"];
  circleElement: PointerTheme["circleElement"];
}

/**
 * Merge theme with defaults
 */
function mergeTheme(theme?: PointerTheme): MergedTheme {
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
function mergeConfig(config?: PointerConfig): Required<PointerConfig> {
  return {
    ...defaultPointerConfig,
    ...config,
    offset: config?.offset ?? defaultPointerConfig.offset,
  };
}

/**
 * PointerProvider component - provides pointer context to children
 */
export function PointerProvider({
  children,
  theme: initialTheme,
  config: initialConfig,
  enabled: initialEnabled = true,
  className,
  style,
}: PointerProviderProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [state, setState] = useState<PointerState>({
    position: { x: 0, y: 0 },
    interactionState: "normal",
    isVisible: false,
    isInBounds: false,
  });

  // State for dynamic theme and config
  const [dynamicTheme, setDynamicTheme] = useState<PointerTheme | undefined>(
    initialTheme,
  );
  const [dynamicConfig, setDynamicConfig] = useState<PointerConfig | undefined>(
    initialConfig,
  );

  // Memoize merged theme and config
  const mergedTheme = useMemo(() => mergeTheme(dynamicTheme), [dynamicTheme]);
  const mergedConfig = useMemo(() => mergeConfig(dynamicConfig), [dynamicConfig]);

  // Update interaction state
  const setInteractionState = useCallback(
    (interactionState: PointerInteractionState) => {
      setState((prev) => ({ ...prev, interactionState }));
    },
    [],
  );

  // Handle interaction changes from CustomPointer
  const handleInteractionChange = useCallback(
    (interactionState: PointerInteractionState) => {
      setState((prev) => ({ ...prev, interactionState }));
    },
    [],
  );

  // Set theme dynamically (merges with existing)
  const setTheme = useCallback((newTheme: PointerTheme) => {
    setDynamicTheme((prev) => ({
      ...prev,
      ...newTheme,
      colors: { ...prev?.colors, ...newTheme.colors },
      sizes: { ...prev?.sizes, ...newTheme.sizes },
    }));
  }, []);

  // Set config dynamically (merges with existing)
  const setConfig = useCallback((newConfig: PointerConfig) => {
    setDynamicConfig((prev) => ({
      ...prev,
      ...newConfig,
    }));
  }, []);

  // Context value
  const contextValue: PointerContextValue = useMemo(
    () => ({
      state,
      isEnabled: enabled,
      theme: mergedTheme,
      config: mergedConfig,
      setInteractionState,
      setEnabled,
      setTheme,
      setConfig,
    }),
    [state, enabled, mergedTheme, mergedConfig, setInteractionState, setTheme, setConfig],
  );

  // Determine if pointer should be shown based on visibility config
  const shouldShowPointer = useMemo(() => {
    if (mergedConfig.visibility === "never") return false;
    if (mergedConfig.visibility === "always") return true;
    return enabled;
  }, [mergedConfig.visibility, enabled]);

  return (
    <PointerContext.Provider value={contextValue}>
      <div className={className} style={style}>
        {children}
      </div>
      {shouldShowPointer && (
        <CustomPointer
          theme={mergedTheme}
          config={mergedConfig}
          enabled={enabled}
          onInteractionChange={handleInteractionChange}
        />
      )}
    </PointerContext.Provider>
  );
}

export default PointerProvider;
