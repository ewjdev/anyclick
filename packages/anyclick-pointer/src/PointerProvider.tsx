"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CustomPointer } from "./CustomPointer";
import { POINTER_CONTAINER_ATTR, usePointerStore } from "./pointerStore";
import type {
  PointerConfig,
  PointerContextValue,
  PointerInteractionState,
  PointerProviderProps,
  PointerState,
  PointerTheme,
} from "./types";
import { PointerContext } from "./usePointer";
import { mergeConfigWithDefaults, mergeThemeWithDefaults } from "./utils";

/**
 * PointerProvider - provides scoped custom cursor functionality
 *
 * Each provider:
 * - Registers its container in the global pointer store
 * - Renders its own CustomPointer (visible only when cursor is inside)
 * - Supports nesting (innermost container's pointer is shown)
 *
 * @example
 * ```tsx
 * <PointerProvider theme={{ colors: { pointerColor: 'blue' } }}>
 *   <div>Blue pointer here</div>
 * </PointerProvider>
 *
 * // Nested providers - innermost wins
 * <PointerProvider theme={{ colors: { pointerColor: 'blue' } }}>
 *   <div>Blue pointer here</div>
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
  // Generate stable container ID
  const reactId = useId();
  const containerId = useMemo(
    () => `pointer-container-${reactId.replace(/[^a-zA-Z0-9\-_]/g, "")}`,
    [reactId],
  );
  const containerRef = useRef<HTMLDivElement>(null);

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
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  // Merge theme and config with defaults
  const mergedTheme = useMemo(
    () => mergeThemeWithDefaults(dynamicTheme),
    [dynamicTheme],
  );
  const mergedConfig = useMemo(
    () => mergeConfigWithDefaults(dynamicConfig),
    [dynamicConfig],
  );

  // Subscribe to active container state from store
  const activeContainerId = usePointerStore((state) => state.activeContainerId);
  const isThisContainerActive = activeContainerId === containerId;

  // Register/unregister container in store
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Register this container
    usePointerStore.getState().registerContainer({
      id: containerId,
      element,
      theme: mergedTheme,
      config: mergedConfig,
      enabled,
    });

    return () => {
      usePointerStore.getState().unregisterContainer(containerId);
    };
  }, [containerId]); // Only re-run if ID changes (shouldn't happen)

  // Update container config in store when theme/config/enabled changes
  useEffect(() => {
    usePointerStore.getState().updateContainer(containerId, {
      theme: mergedTheme,
      config: mergedConfig,
      enabled,
    });
  }, [containerId, mergedTheme, mergedConfig, enabled]);

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

  // Determine if pointer should be shown based on:
  // 1. Visibility config
  // 2. Enabled state
  // 3. Whether this container is the active one (cursor is inside)
  const shouldShowPointer = useMemo(() => {
    if (mergedConfig.visibility === "never") return false;
    if (mergedConfig.visibility === "always") {
      return isThisContainerActive;
    }
    // "enabled" mode - respect enabled state AND container must be active
    return enabled && isThisContainerActive;
  }, [mergedConfig.visibility, enabled, isThisContainerActive]);

  // Container style - hide cursor when this container is active
  const containerStyle = useMemo(
    () => ({
      ...style,
      cursor: isThisContainerActive ? "none" : undefined,
    }),
    [style, isThisContainerActive],
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    setPortalRoot(document.body);
  }, []);

  const pointerNode =
    shouldShowPointer && portalRoot
      ? createPortal(
          <CustomPointer
            theme={mergedTheme}
            config={mergedConfig}
            enabled={enabled}
            onInteractionChange={handleInteractionChange}
          />,
          portalRoot,
        )
      : shouldShowPointer
        ? (
            <CustomPointer
              theme={mergedTheme}
              config={mergedConfig}
              enabled={enabled}
              onInteractionChange={handleInteractionChange}
            />
          )
        : null;

  return (
    <PointerContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        {...{ [POINTER_CONTAINER_ATTR]: containerId }}
        data-anyclick-id="pointer-container"
        className={className}
        style={containerStyle}
      >
        {children}
      </div>
      {pointerNode}
    </PointerContext.Provider>
  );
}

export default PointerProvider;

// Re-export context and hook from the dedicated file
export { PointerContext, usePointer } from "./usePointer";

// Re-export MergedTheme type for consumers
export type { MergedTheme } from "./utils";
