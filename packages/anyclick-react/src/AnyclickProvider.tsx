"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createAnyclickClient } from "@ewjdev/anyclick-core";
import type {
  AnyclickClient,
  AnyclickMenuEvent,
  AnyclickType,
  ScreenshotData,
} from "@ewjdev/anyclick-core";
import { AnyclickContext, useAnyclick } from "./context";
import { ContextMenu } from "./ContextMenu";
import { findContainerParent } from "./highlight";
import { useProviderStore, type ProviderInstance } from "./store";
import type {
  AnyclickContextValue,
  AnyclickProviderProps,
  AnyclickTheme,
  ContextMenuItem,
} from "./types";

/**
 * Default menu items
 */
const defaultMenuItems: ContextMenuItem[] = [
  { type: "issue", label: "Report an issue", showComment: true },
  { type: "feature", label: "Request a feature", showComment: true },
  { type: "like", label: "I like this!", showComment: false },
];

/**
 * AnyclickProvider component - wraps your app to enable feedback capture
 * Supports scoped providers and nested theming
 */
export function AnyclickProvider({
  adapter,
  children,
  targetFilter,
  menuItems = defaultMenuItems,
  maxInnerTextLength,
  maxOuterHTMLLength,
  maxAncestors,
  cooldownMs,
  stripAttributes,
  metadata,
  onSubmitSuccess,
  onSubmitError,
  menuStyle,
  menuClassName,
  disabled = false,
  highlightConfig,
  header,
  screenshotConfig,
  scoped = false,
  theme,
  touchHoldDurationMs,
  touchMoveThreshold,
}: AnyclickProviderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [containerElement, setContainerElement] = useState<Element | null>(
    null,
  );

  // Generate a stable ID for this provider instance using React's useId
  // This ensures consistent IDs between server and client rendering
  const providerId = useId();

  // Ref to the container element (for scoped providers)
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Track when container is ready for scoped providers
  const [containerReady, setContainerReady] = useState(!scoped);

  // Client reference
  const clientRef = useRef<AnyclickClient | null>(null);

  // Callback ref to detect when container element is mounted
  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[AnyclickProvider:${providerId}] Container ref callback`, {
          scoped,
          nodeReceived: !!node,
          hadPreviousNode: !!containerRef.current,
          clientExists: !!clientRef.current,
        });
      }

      containerRef.current = node;
      if (scoped && node) {
        setContainerReady(true);
        // If client already exists, update its container
        if (clientRef.current) {
          clientRef.current.setContainer(node);
        }
      }
    },
    [scoped, providerId],
  );

  // Access parent context (if nested)
  let parentContext: AnyclickContextValue | null = null;
  try {
    // This will throw if there's no parent provider
    parentContext = useAnyclick();
  } catch {
    // No parent provider - this is a root provider
    parentContext = null;
  }

  // Store access
  const {
    registerProvider,
    unregisterProvider,
    updateProvider,
    getMergedTheme,
    isDisabledByAncestor,
    findParentProvider,
    isElementInDisabledScope,
    isElementInAnyScopedProvider,
  } = useProviderStore();

  // Determine parent ID
  const parentId = parentContext?.providerId ?? null;

  // Calculate depth
  const depth = parentContext ? (parentContext.scoped ? 1 : 0) : 0;
  const actualDepth = useMemo(() => {
    if (!parentContext) return 0;
    // Find actual depth by traversing store
    let d = 0;
    let currentId = parentId;
    const providers = useProviderStore.getState().providers;
    while (currentId) {
      d++;
      const parent = providers.get(currentId);
      currentId = parent?.parentId ?? null;
    }
    return d;
  }, [parentId]);

  // Determine if disabled by theme
  const isDisabledByTheme = theme === null || theme?.disabled === true;
  const effectiveDisabled = disabled || isDisabledByTheme;

  // Build the theme for this provider
  const localTheme: AnyclickTheme = useMemo(() => {
    // If theme is null, treat as disabled
    if (theme === null) {
      return { disabled: true };
    }

    // Merge explicit theme props with theme object
    const explicitThemeProps: AnyclickTheme = {};
    if (menuStyle) explicitThemeProps.menuStyle = menuStyle;
    if (menuClassName) explicitThemeProps.menuClassName = menuClassName;
    if (highlightConfig) explicitThemeProps.highlightConfig = highlightConfig;
    if (screenshotConfig)
      explicitThemeProps.screenshotConfig = screenshotConfig;

    return {
      ...explicitThemeProps,
      ...theme,
    };
  }, [theme, menuStyle, menuClassName, highlightConfig, screenshotConfig]);

  // Context menu handler
  // Returns false to allow native context menu (for disabled scopes)
  // Returns true (or void) to show custom menu
  const handleContextMenu = useCallback(
    (event: AnyclickMenuEvent, element: Element): boolean => {
      // For non-scoped (global) providers, check if the element is inside
      // a disabled scoped provider's container - if so, allow native menu
      if (!scoped && isElementInDisabledScope(element)) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[AnyclickProvider:${providerId}] Allowing native menu - element is in disabled scope`,
            {
              targetTag: element.tagName,
            },
          );
        }
        return false; // Allow native context menu
      }

      // For non-scoped (global) providers on TOUCH events, check if the element
      // is inside any scoped provider's container - if so, defer to the scoped
      // provider to handle the event with its own theme
      // NOTE: For contextmenu (right-click) events, this is handled by capture
      // phase and stopPropagation in the client. But touch events don't have
      // the same propagation model, so we need to check here.
      if (!scoped && event.isTouch && isElementInAnyScopedProvider(element)) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[AnyclickProvider:${providerId}] Deferring to scoped provider for touch event`,
            {
              targetTag: element.tagName,
            },
          );
        }
        return false; // Let the scoped provider handle it
      }

      const mergedTheme = getMergedTheme(providerId);

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[AnyclickProvider:${providerId}] handleContextMenu called`,
          {
            scoped,
            targetTag: element.tagName,
            mergedThemeColors: mergedTheme.highlightConfig?.colors,
            position: { x: event.clientX, y: event.clientY },
            isTouch: event.isTouch,
          },
        );
      }

      setTargetElement(element);
      // Get merged theme for highlight config
      const container = findContainerParent(
        element,
        mergedTheme.highlightConfig ?? highlightConfig,
      );
      setContainerElement(container);
      setMenuPosition({ x: event.clientX, y: event.clientY });
      setMenuVisible(true);

      return true; // Handled - prevent native menu
    },
    [
      providerId,
      getMergedTheme,
      highlightConfig,
      scoped,
      isElementInDisabledScope,
      isElementInAnyScopedProvider,
    ],
  );

  // Register this provider in the store
  useLayoutEffect(() => {
    const providerInstance: ProviderInstance = {
      id: providerId,
      containerRef: containerRef as React.RefObject<Element | null>,
      scoped,
      theme: localTheme,
      disabled: effectiveDisabled,
      parentId,
      depth: actualDepth,
      onContextMenu: handleContextMenu,
    };

    registerProvider(providerInstance);

    return () => {
      unregisterProvider(providerId);
    };
  }, [
    providerId,
    scoped,
    localTheme,
    effectiveDisabled,
    parentId,
    actualDepth,
    handleContextMenu,
    registerProvider,
    unregisterProvider,
  ]);

  // Update provider when config changes
  useEffect(() => {
    updateProvider(providerId, {
      theme: localTheme,
      disabled: effectiveDisabled,
      onContextMenu: handleContextMenu,
    });
  }, [
    providerId,
    localTheme,
    effectiveDisabled,
    handleContextMenu,
    updateProvider,
  ]);

  // Create/update the feedback client
  // Wait for container to be ready for scoped providers
  useEffect(() => {
    // Check if disabled by any ancestor
    if (isDisabledByAncestor(providerId)) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[AnyclickProvider:${providerId}] Skipping - disabled by ancestor`,
        );
      }
      return;
    }

    // For scoped providers, wait until container is ready
    if (scoped && !containerReady) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[AnyclickProvider:${providerId}] Waiting for container to be ready`,
          {
            scoped,
            containerReady,
          },
        );
      }
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[AnyclickProvider:${providerId}] Creating client`, {
        scoped,
        containerReady,
        hasContainer: !!containerRef.current,
        effectiveDisabled,
        localThemeColors: localTheme.highlightConfig?.colors,
      });
    }

    const client = createAnyclickClient({
      adapter,
      targetFilter,
      maxInnerTextLength,
      maxOuterHTMLLength,
      maxAncestors,
      cooldownMs,
      stripAttributes,
      // For scoped providers, pass the container
      container: scoped ? containerRef.current : null,
      touchHoldDurationMs,
      touchMoveThreshold,
    });

    // Set up callbacks
    client.onSubmitSuccess = onSubmitSuccess;
    client.onSubmitError = onSubmitError;

    // Set up context menu handler
    client.onContextMenu = handleContextMenu;

    clientRef.current = client;

    // Attach event listeners if not disabled
    if (!effectiveDisabled) {
      client.attach();
    }

    return () => {
      client.detach();
    };
  }, [
    adapter,
    targetFilter,
    maxInnerTextLength,
    maxOuterHTMLLength,
    maxAncestors,
    cooldownMs,
    stripAttributes,
    onSubmitSuccess,
    onSubmitError,
    effectiveDisabled,
    scoped,
    containerReady,
    providerId,
    isDisabledByAncestor,
    handleContextMenu,
    touchHoldDurationMs,
    touchMoveThreshold,
  ]);

  // Submit feedback with optional screenshots
  const submitAnyclick = useCallback(
    async (
      element: Element,
      type: AnyclickType,
      comment?: string,
      screenshots?: ScreenshotData,
    ) => {
      const client = clientRef.current;
      if (!client) return;

      setIsSubmitting(true);
      try {
        await client.submitAnyclick(element, type, {
          comment,
          metadata,
          screenshots,
        });
      } finally {
        setIsSubmitting(false);
        setMenuVisible(false);
        setTargetElement(null);
        setContainerElement(null);
      }
    },
    [metadata],
  );

  // Open menu programmatically
  const openMenu = useCallback(
    (element: Element, position: { x: number; y: number }) => {
      setTargetElement(element);
      const mergedTheme = getMergedTheme(providerId);
      const container = findContainerParent(
        element,
        mergedTheme.highlightConfig ?? highlightConfig,
      );
      setContainerElement(container);
      setMenuPosition(position);
      setMenuVisible(true);
    },
    [providerId, getMergedTheme, highlightConfig],
  );

  // Close menu
  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setTargetElement(null);
    setContainerElement(null);
  }, []);

  // Handle menu selection
  const handleMenuSelect = useCallback(
    (type: AnyclickType, comment?: string, screenshots?: ScreenshotData) => {
      if (targetElement) {
        submitAnyclick(targetElement, type, comment, screenshots);
      }
    },
    [targetElement, submitAnyclick],
  );

  // Get merged theme for this provider
  // We use the store's getMergedTheme for inherited values (like highlightConfig),
  // but for this provider's own theme values, we use localTheme directly to avoid
  // timing issues with useMemo running before the provider is registered.
  const inheritedTheme = getMergedTheme(providerId);

  // Merge: inherited theme first, then local theme overrides
  const mergedTheme: AnyclickTheme = useMemo(
    () => ({
      ...inheritedTheme,
      ...localTheme,
      // Deep merge for nested configs
      highlightConfig: {
        ...inheritedTheme.highlightConfig,
        ...localTheme.highlightConfig,
        colors: {
          ...inheritedTheme.highlightConfig?.colors,
          ...localTheme.highlightConfig?.colors,
        },
      },
      screenshotConfig: {
        ...inheritedTheme.screenshotConfig,
        ...localTheme.screenshotConfig,
      },
    }),
    [inheritedTheme, localTheme],
  );

  // Apply merged theme styles
  const effectiveMenuStyle = mergedTheme.menuStyle ?? menuStyle;
  const effectiveMenuClassName = mergedTheme.menuClassName ?? menuClassName;

  // Debug: Log theme flow
  if (process.env.NODE_ENV === "development") {
    console.log(`[AnyclickProvider:${providerId}] Theme Debug`, {
      scoped,
      localThemeHasMenuStyle: !!localTheme.menuStyle,
      localThemeMenuStyleKeys: localTheme.menuStyle
        ? Object.keys(localTheme.menuStyle)
        : [],
      mergedThemeHasMenuStyle: !!mergedTheme.menuStyle,
      mergedThemeMenuStyleKeys: mergedTheme.menuStyle
        ? Object.keys(mergedTheme.menuStyle)
        : [],
      effectiveMenuStyleExists: !!effectiveMenuStyle,
      effectiveMenuStyleKeys: effectiveMenuStyle
        ? Object.keys(effectiveMenuStyle)
        : [],
      menuStyleProp: !!menuStyle,
    });
  }
  const effectiveHighlightConfig =
    mergedTheme.highlightConfig ?? highlightConfig;
  const effectiveScreenshotConfig =
    mergedTheme.screenshotConfig ?? screenshotConfig;

  // Context value
  const contextValue: AnyclickContextValue = useMemo(
    () => ({
      isEnabled: !effectiveDisabled && !isDisabledByAncestor(providerId),
      isSubmitting,
      submitAnyclick,
      openMenu,
      closeMenu,
      theme: mergedTheme,
      scoped,
      providerId,
    }),
    [
      effectiveDisabled,
      providerId,
      isDisabledByAncestor,
      isSubmitting,
      submitAnyclick,
      openMenu,
      closeMenu,
      mergedTheme,
      scoped,
    ],
  );

  // For scoped providers, wrap children in a container div
  // Add data-anyclick-provider attribute to mark the boundary for hierarchy navigation
  const content = scoped ? (
    <div
      ref={setContainerRef}
      style={{ display: "contents" }}
      data-anyclick-provider={providerId}
    >
      {children}
    </div>
  ) : (
    children
  );

  return (
    <AnyclickContext.Provider value={contextValue}>
      {content}
      <ContextMenu
        visible={menuVisible && !effectiveDisabled}
        position={menuPosition}
        targetElement={targetElement}
        containerElement={containerElement}
        items={menuItems}
        onSelect={handleMenuSelect}
        onClose={closeMenu}
        isSubmitting={isSubmitting}
        style={effectiveMenuStyle}
        className={effectiveMenuClassName}
        highlightConfig={effectiveHighlightConfig}
        screenshotConfig={effectiveScreenshotConfig}
        header={header}
      />
    </AnyclickContext.Provider>
  );
}

/**
 * @deprecated Use AnyclickProvider instead
 */
export const FeedbackProvider = AnyclickProvider;
