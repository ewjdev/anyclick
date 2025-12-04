"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
  useId,
} from "react";
import type {
  PointerProviderProps,
  PointerContextValue,
  PointerInteractionState,
  PointerState,
  PointerTheme,
  PointerConfig,
  PointerThemeColors,
  PointerThemeSizes,
} from "./types";
import {
  defaultPointerTheme,
  defaultPointerThemeColors,
  defaultPointerThemeSizes,
  defaultPointerConfig,
} from "./types";
import { CustomPointer } from "./CustomPointer";
import { GoKartPointer } from "./GoKartPointer";

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
 * Internal context for root pointer control
 * Used by nested providers to communicate with the root
 */
interface RootPointerContextValue {
  /** Push a theme override when entering a nested provider area */
  pushOverride: (
    id: string,
    theme: MergedTheme,
    config: Required<PointerConfig>,
  ) => void;
  /** Pop a theme override when leaving a nested provider area */
  popOverride: (id: string) => void;
}

const RootPointerContext = createContext<RootPointerContextValue | null>(null);

/**
 * Context for accessing parent's theme/config for merging
 */
interface ParentThemeContextValue {
  theme: MergedTheme;
  config: Required<PointerConfig>;
}

const ParentThemeContext = createContext<ParentThemeContextValue | null>(null);

/**
 * Hook to access parent theme context for merging
 * Returns null if there's no parent provider
 */
export function useParentPointerTheme(): ParentThemeContextValue | null {
  return useContext(ParentThemeContext);
}

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
 * Merge a partial theme with a parent theme
 * Values from the child theme override the parent theme
 */
export function mergeThemeWithParent(
  parentTheme: MergedTheme,
  childTheme?: PointerTheme,
): MergedTheme {
  if (!childTheme) return parentTheme;

  return {
    colors: {
      pointerColor:
        childTheme.colors?.pointerColor ?? parentTheme.colors.pointerColor,
      circleColor:
        childTheme.colors?.circleColor ?? parentTheme.colors.circleColor,
      circleBorderColor:
        childTheme.colors?.circleBorderColor ??
        parentTheme.colors.circleBorderColor,
    },
    sizes: {
      pointerSize:
        childTheme.sizes?.pointerSize ?? parentTheme.sizes.pointerSize,
      circleSize: childTheme.sizes?.circleSize ?? parentTheme.sizes.circleSize,
      circleBorderWidth:
        childTheme.sizes?.circleBorderWidth ??
        parentTheme.sizes.circleBorderWidth,
    },
    pointerIcon: childTheme.pointerIcon ?? parentTheme.pointerIcon,
    circleElement: childTheme.circleElement ?? parentTheme.circleElement,
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

/**
 * Merge a partial config with a parent config
 * Values from the child config override the parent config
 */
export function mergeConfigWithParent(
  parentConfig: Required<PointerConfig>,
  childConfig?: PointerConfig,
): Required<PointerConfig> {
  if (!childConfig) return parentConfig;

  return {
    visibility: childConfig.visibility ?? parentConfig.visibility,
    hideDefaultCursor:
      childConfig.hideDefaultCursor ?? parentConfig.hideDefaultCursor,
    zIndex: childConfig.zIndex ?? parentConfig.zIndex,
    respectReducedMotion:
      childConfig.respectReducedMotion ?? parentConfig.respectReducedMotion,
    offset: childConfig.offset ?? parentConfig.offset,
    mode: childConfig.mode ?? parentConfig.mode,
    funConfig: {
      ...parentConfig.funConfig,
      ...childConfig.funConfig,
      getTrackElement:
        childConfig.funConfig?.getTrackElement ??
        parentConfig.funConfig?.getTrackElement,
      getObstacles:
        childConfig.funConfig?.getObstacles ??
        parentConfig.funConfig?.getObstacles,
    },
  };
}

/**
 * Override entry in the stack
 */
interface ThemeOverride {
  id: string;
  theme: MergedTheme;
  config: Required<PointerConfig>;
}

/**
 * Root PointerProvider implementation
 * Renders the actual CustomPointer and manages the override stack
 */
function RootPointerProvider({
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

  // State for dynamic theme and config (set via setTheme/setConfig)
  const [dynamicTheme, setDynamicTheme] = useState<PointerTheme | undefined>(
    initialTheme,
  );
  const [dynamicConfig, setDynamicConfig] = useState<PointerConfig | undefined>(
    initialConfig,
  );

  // Stack of theme overrides from nested providers
  const [overrideStack, setOverrideStack] = useState<ThemeOverride[]>([]);

  // Memoize the root's merged theme and config
  const rootMergedTheme = useMemo(
    () => mergeThemeWithDefaults(dynamicTheme),
    [dynamicTheme],
  );
  const rootMergedConfig = useMemo(
    () => mergeConfigWithDefaults(dynamicConfig),
    [dynamicConfig],
  );

  // Active theme/config is the top of the stack, or root's theme/config if stack is empty
  const activeTheme = useMemo(() => {
    if (overrideStack.length > 0) {
      return overrideStack[overrideStack.length - 1].theme;
    }
    return rootMergedTheme;
  }, [overrideStack, rootMergedTheme]);

  const activeConfig = useMemo(() => {
    if (overrideStack.length > 0) {
      return overrideStack[overrideStack.length - 1].config;
    }
    return rootMergedConfig;
  }, [overrideStack, rootMergedConfig]);

  // Push/pop functions for nested providers
  const pushOverride = useCallback(
    (id: string, theme: MergedTheme, config: Required<PointerConfig>) => {
      setOverrideStack((prev) => {
        // Remove any existing entry with this id (in case of re-entry)
        const filtered = prev.filter((entry) => entry.id !== id);
        return [...filtered, { id, theme, config }];
      });
    },
    [],
  );

  const popOverride = useCallback((id: string) => {
    setOverrideStack((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  // Root context value
  const rootContextValue = useMemo<RootPointerContextValue>(
    () => ({ pushOverride, popOverride }),
    [pushOverride, popOverride],
  );

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

  // Context value for consumers
  const contextValue: PointerContextValue = useMemo(
    () => ({
      state,
      isEnabled: enabled,
      theme: activeTheme,
      config: activeConfig,
      setInteractionState,
      setEnabled,
      setTheme,
      setConfig,
    }),
    [
      state,
      enabled,
      activeTheme,
      activeConfig,
      setInteractionState,
      setTheme,
      setConfig,
    ],
  );

  // Parent theme context for nested providers
  const parentThemeContextValue = useMemo<ParentThemeContextValue>(
    () => ({
      theme: rootMergedTheme,
      config: rootMergedConfig,
    }),
    [rootMergedTheme, rootMergedConfig],
  );

  // Determine if pointer should be shown based on visibility config
  const shouldShowPointer = useMemo(() => {
    if (activeConfig.visibility === "never") return false;
    if (activeConfig.visibility === "always") return true;
    return enabled;
  }, [activeConfig.visibility, enabled]);

  return (
    <RootPointerContext.Provider value={rootContextValue}>
      <ParentThemeContext.Provider value={parentThemeContextValue}>
        <PointerContext.Provider value={contextValue}>
          <div className={className} style={style}>
            {children}
          </div>
          {shouldShowPointer &&
            (activeConfig.mode === "fun" ? (
              <GoKartPointer
                theme={activeTheme}
                config={activeConfig}
                enabled={enabled}
                onInteractionChange={handleInteractionChange}
              />
            ) : (
              <CustomPointer
                theme={activeTheme}
                config={activeConfig}
                enabled={enabled}
                onInteractionChange={handleInteractionChange}
              />
            ))}
        </PointerContext.Provider>
      </ParentThemeContext.Provider>
    </RootPointerContext.Provider>
  );
}

/**
 * Nested PointerProvider implementation
 * Wraps children in a hover-detection container and communicates with root
 */
function NestedPointerProvider({
  children,
  theme: childTheme,
  config: childConfig,
  enabled: initialEnabled = true,
  className,
  style,
  rootContext,
  parentTheme,
}: PointerProviderProps & {
  rootContext: RootPointerContextValue;
  parentTheme: ParentThemeContextValue;
}) {
  const id = useId();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [state, setState] = useState<PointerState>({
    position: { x: 0, y: 0 },
    interactionState: "normal",
    isVisible: false,
    isInBounds: false,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);

  // State for dynamic theme and config (set via setTheme/setConfig)
  const [dynamicTheme, setDynamicTheme] = useState<PointerTheme | undefined>(
    childTheme,
  );
  const [dynamicConfig, setDynamicConfig] = useState<PointerConfig | undefined>(
    childConfig,
  );

  // Merge with parent theme/config
  const mergedTheme = useMemo(
    () => mergeThemeWithParent(parentTheme.theme, dynamicTheme),
    [parentTheme.theme, dynamicTheme],
  );
  const mergedConfig = useMemo(
    () => mergeConfigWithParent(parentTheme.config, dynamicConfig),
    [parentTheme.config, dynamicConfig],
  );

  // Update the root when theme/config changes while hovered
  const updateRootIfHovered = useCallback(() => {
    if (isHoveredRef.current) {
      rootContext.pushOverride(id, mergedTheme, mergedConfig);
    }
  }, [id, mergedTheme, mergedConfig, rootContext]);

  // Handle mouse enter
  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
    rootContext.pushOverride(id, mergedTheme, mergedConfig);
  }, [id, mergedTheme, mergedConfig, rootContext]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
    rootContext.popOverride(id);
  }, [id, rootContext]);

  // Update interaction state
  const setInteractionState = useCallback(
    (interactionState: PointerInteractionState) => {
      setState((prev) => ({ ...prev, interactionState }));
    },
    [],
  );

  // Set theme dynamically (merges with existing)
  const setTheme = useCallback(
    (newTheme: PointerTheme) => {
      setDynamicTheme((prev) => {
        const updated = {
          ...prev,
          ...newTheme,
          colors: { ...prev?.colors, ...newTheme.colors },
          sizes: { ...prev?.sizes, ...newTheme.sizes },
        };
        return updated;
      });
      // Schedule update to root on next tick (after state updates)
      setTimeout(updateRootIfHovered, 0);
    },
    [updateRootIfHovered],
  );

  // Set config dynamically (merges with existing)
  const setConfig = useCallback(
    (newConfig: PointerConfig) => {
      setDynamicConfig((prev) => ({
        ...prev,
        ...newConfig,
      }));
      // Schedule update to root on next tick (after state updates)
      setTimeout(updateRootIfHovered, 0);
    },
    [updateRootIfHovered],
  );

  // Context value for consumers
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
    [
      state,
      enabled,
      mergedTheme,
      mergedConfig,
      setInteractionState,
      setTheme,
      setConfig,
    ],
  );

  // Parent theme context for further nested providers
  const nestedParentThemeContextValue = useMemo<ParentThemeContextValue>(
    () => ({
      theme: mergedTheme,
      config: mergedConfig,
    }),
    [mergedTheme, mergedConfig],
  );

  return (
    <ParentThemeContext.Provider value={nestedParentThemeContextValue}>
      <PointerContext.Provider value={contextValue}>
        <div
          ref={containerRef}
          className={className}
          style={style}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </div>
      </PointerContext.Provider>
    </ParentThemeContext.Provider>
  );
}

/**
 * PointerProvider component - provides pointer context to children
 *
 * Supports nesting: when nested inside another PointerProvider, hovering over
 * the nested provider's children will apply its theme/config to the pointer.
 *
 * Nested themes are merged with the parent theme - you only need to specify
 * the values you want to override. Use the helper functions `mergeThemeWithParent`
 * and `mergeConfigWithParent` if you need to programmatically merge themes.
 *
 * @example
 * ```tsx
 * // Root provider
 * <PointerProvider theme={{ colors: { pointerColor: 'blue' } }}>
 *   <div>Blue pointer here</div>
 *
 *   {// Nested provider - only overrides pointerColor, inherits everything else }
 *   <PointerProvider theme={{ colors: { pointerColor: 'red' } }}>
 *     <div>Red pointer when hovering here</div>
 *   </PointerProvider>
 * </PointerProvider>
 * ```
 */
export function PointerProvider({
  children,
  theme: initialTheme,
  config: initialConfig,
  enabled: initialEnabled = true,
  className,
  style,
}: PointerProviderProps) {
  const rootContext = useContext(RootPointerContext);
  const parentThemeContext = useContext(ParentThemeContext);
  const isRoot = rootContext === null;

  if (isRoot) {
    return (
      <RootPointerProvider
        theme={initialTheme}
        config={initialConfig}
        enabled={initialEnabled}
        className={className}
        style={style}
      >
        {children}
      </RootPointerProvider>
    );
  }

  return (
    <NestedPointerProvider
      theme={initialTheme}
      config={initialConfig}
      enabled={initialEnabled}
      className={className}
      style={style}
      rootContext={rootContext}
      parentTheme={parentThemeContext!}
    >
      {children}
    </NestedPointerProvider>
  );
}

export default PointerProvider;
