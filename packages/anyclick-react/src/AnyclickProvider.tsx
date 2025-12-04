"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createFeedbackClient } from "@ewjdev/anyclick-core";
import type {
  FeedbackClient,
  FeedbackType,
  ScreenshotData,
} from "@ewjdev/anyclick-core";
import { AnyclickContext, useAnyclick } from "./context";
import { ContextMenu } from "./ContextMenu";
import { findContainerParent } from "./highlight";
import {
  useProviderStore,
  generateProviderId,
  type ProviderInstance,
} from "./store";
import type {
  AnyclickContextValue,
  AnyclickProviderProps,
  AnyclickTheme,
  FeedbackMenuItem,
} from "./types";

/**
 * Default menu items
 */
const defaultMenuItems: FeedbackMenuItem[] = [
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
  screenshotConfig,
  scoped = false,
  theme,
}: AnyclickProviderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [containerElement, setContainerElement] = useState<Element | null>(
    null,
  );

  // Generate a stable ID for this provider instance
  const providerIdRef = useRef<string>(generateProviderId());
  const providerId = providerIdRef.current;

  // Ref to the container element (for scoped providers)
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Track when container is ready for scoped providers
  const [containerReady, setContainerReady] = useState(!scoped);

  // Client reference
  const clientRef = useRef<FeedbackClient | null>(null);

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
  const handleContextMenu = useCallback(
    (event: MouseEvent, element: Element) => {
      const mergedTheme = getMergedTheme(providerId);

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[AnyclickProvider:${providerId}] handleContextMenu called`,
          {
            scoped,
            targetTag: element.tagName,
            mergedThemeColors: mergedTheme.highlightConfig?.colors,
            position: { x: event.clientX, y: event.clientY },
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
    },
    [providerId, getMergedTheme, highlightConfig, scoped],
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

    const client = createFeedbackClient({
      adapter,
      targetFilter,
      maxInnerTextLength,
      maxOuterHTMLLength,
      maxAncestors,
      cooldownMs,
      stripAttributes,
      // For scoped providers, pass the container
      container: scoped ? containerRef.current : null,
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
  ]);

  // Submit feedback with optional screenshots
  const submitFeedback = useCallback(
    async (
      element: Element,
      type: FeedbackType,
      comment?: string,
      screenshots?: ScreenshotData,
    ) => {
      const client = clientRef.current;
      if (!client) return;

      setIsSubmitting(true);
      try {
        await client.submitFeedback(element, type, {
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
    (type: FeedbackType, comment?: string, screenshots?: ScreenshotData) => {
      if (targetElement) {
        submitFeedback(targetElement, type, comment, screenshots);
      }
    },
    [targetElement, submitFeedback],
  );

  // Get merged theme for this provider
  const mergedTheme = useMemo(
    () => getMergedTheme(providerId),
    [providerId, getMergedTheme],
  );

  // Apply merged theme styles
  const effectiveMenuStyle = mergedTheme.menuStyle ?? menuStyle;
  const effectiveMenuClassName = mergedTheme.menuClassName ?? menuClassName;
  const effectiveHighlightConfig =
    mergedTheme.highlightConfig ?? highlightConfig;
  const effectiveScreenshotConfig =
    mergedTheme.screenshotConfig ?? screenshotConfig;

  // Context value
  const contextValue: AnyclickContextValue = useMemo(
    () => ({
      isEnabled: !effectiveDisabled && !isDisabledByAncestor(providerId),
      isSubmitting,
      submitFeedback,
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
      submitFeedback,
      openMenu,
      closeMenu,
      mergedTheme,
      scoped,
    ],
  );

  // For scoped providers, wrap children in a container div
  const content = scoped ? (
    <div ref={setContainerRef} style={{ display: "contents" }}>
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
      />
    </AnyclickContext.Provider>
  );
}

/**
 * @deprecated Use AnyclickProvider instead
 */
export const FeedbackProvider = AnyclickProvider;
