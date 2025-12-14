"use client";

/**
 * AnyclickProvider - Main provider component for anyclick functionality.
 *
 * Wraps your app to enable right-click feedback capture. Supports scoped
 * providers and nested theming with inheritance.
 *
 * @module AnyclickProvider
 * @since 1.0.0
 */
import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AnyclickClient,
  AnyclickMenuEvent,
  AnyclickType,
  ScreenshotData,
} from "@ewjdev/anyclick-core";
import { createAnyclickClient } from "@ewjdev/anyclick-core";
import { ContextMenu } from "./ContextMenu";
import { AnyclickContext, useAnyclick } from "./context";
import { findContainerParent } from "./highlight";
import {
  type ProviderInstance,
  generateDynamicMenuGetterId,
  useProviderStore,
} from "./store";
import type {
  AnyclickContextValue,
  AnyclickProviderProps,
  AnyclickTheme,
  AnyclickUserContext,
  ContextMenuItem,
} from "./types";
import { filterMenuItemsByRole } from "./types";

/**
 * Default menu items shown when no custom items are provided.
 */
const defaultMenuItems: ContextMenuItem[] = [
  { label: "Report an issue", showComment: true, type: "issue" },
  { label: "Request a feature", showComment: true, type: "feature" },
  { label: "I like this!", showComment: false, type: "like" },
];

const OFFSCREEN_POSITION = { x: -9999, y: -9999 };

/** Default priority for menu items (middle of 1-10 range) */
const DEFAULT_PRIORITY = 5;

/**
 * Assigns stable IDs to menu items that don't have one.
 * Recursively processes children.
 */
function assignMenuItemIds(
  items: ContextMenuItem[],
  prefix = "auto",
): ContextMenuItem[] {
  return items.map((item, index) => {
    const id = item.id ?? `${prefix}:${item.type}:${item.label}:${index}`;
    const children = item.children
      ? assignMenuItemIds(item.children, `${id}:child`)
      : undefined;
    return { ...item, id, children };
  });
}

/**
 * Deduplicates menu items by id, keeping the first occurrence.
 */
function dedupeMenuItems(items: ContextMenuItem[]): ContextMenuItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = item.id ?? `${item.type}:${item.label}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * Sorts menu items by priority (highest first).
 * Uses stable sort to preserve original order for equal priorities.
 * Recursively sorts children.
 */
function sortMenuItemsByPriority(items: ContextMenuItem[]): ContextMenuItem[] {
  // Create indexed items for stable sort
  const indexed = items.map((item, index) => ({ item, index }));

  // Sort by priority desc, then by original index (stable)
  indexed.sort((a, b) => {
    const priorityA = a.item.priority ?? DEFAULT_PRIORITY;
    const priorityB = b.item.priority ?? DEFAULT_PRIORITY;
    if (priorityB !== priorityA) return priorityB - priorityA;
    return a.index - b.index;
  });

  return indexed.map(({ item }) => ({
    ...item,
    children: item.children
      ? sortMenuItemsByPriority(item.children)
      : undefined,
  }));
}

/**
 * Recursively filters menu items by role.
 */
function filterMenuItemsByRoleRecursive(
  items: ContextMenuItem[],
  userContext?: AnyclickUserContext,
): ContextMenuItem[] {
  const filtered = filterMenuItemsByRole(items, userContext);
  return filtered.map((item) => ({
    ...item,
    children: item.children
      ? filterMenuItemsByRoleRecursive(item.children, userContext)
      : undefined,
  }));
}

/**
 * Normalizes menu items: assigns IDs, dedupes, sorts by priority, and filters by role.
 */
function normalizeMenuItems(
  staticItems: ContextMenuItem[],
  dynamicItems: ContextMenuItem[],
  userContext?: AnyclickUserContext,
): ContextMenuItem[] {
  // Merge static + dynamic
  const merged = [...staticItems, ...dynamicItems];

  // Assign IDs
  const withIds = assignMenuItemIds(merged);

  // Dedupe
  const deduped = dedupeMenuItems(withIds);

  // Sort by priority
  const sorted = sortMenuItemsByPriority(deduped);

  // Filter by role (only if userContext provided)
  const filtered = userContext
    ? filterMenuItemsByRoleRecursive(sorted, userContext)
    : sorted;

  return filtered;
}

/**
 * AnyclickProvider component - wraps your app to enable feedback capture.
 *
 * Supports scoped providers and nested theming with inheritance.
 * Child providers automatically inherit and can override parent themes.
 *
 * @example
 * ```tsx
 * <AnyclickProvider
 *   adapter={myAdapter}
 *   menuItems={[
 *     { type: "bug", label: "Report Bug", showComment: true },
 *   ]}
 *   onSubmitSuccess={(payload) => console.log("Submitted:", payload)}
 * >
 *   <App />
 * </AnyclickProvider>
 * ```
 *
 * @since 1.0.0
 */
export function AnyclickProvider({
  adapter,
  children,
  cooldownMs,
  disabled = false,
  dynamicMenuItems,
  header,
  highlightConfig,
  maxAncestors,
  maxInnerTextLength,
  maxOuterHTMLLength,
  menuClassName,
  menuItems = defaultMenuItems,
  menuPositionMode,
  menuStyle,
  metadata,
  onSubmitError,
  onSubmitSuccess,
  quickChatConfig,
  scoped = false,
  screenshotConfig,
  stripAttributes,
  targetFilter,
  theme,
  touchHoldDurationMs,
  touchMoveThreshold,
  userContext,
}: AnyclickProviderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState(OFFSCREEN_POSITION);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [containerElement, setContainerElement] = useState<Element | null>(
    null,
  );
  // Snapshot of resolved menu items (computed once when menu opens)
  const [resolvedMenuItems, setResolvedMenuItems] =
    useState<ContextMenuItem[]>(menuItems);

  // Generate a stable ID for this provider instance using React's useId
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
      containerRef.current = node;
      if (scoped && node) {
        setContainerReady(true);
        // If client already exists, update its container
        if (clientRef.current) {
          clientRef.current.setContainer(node);
        }
      }
    },
    [scoped],
  );

  // Access parent context (if nested)
  let parentContext: AnyclickContextValue | null = null;
  try {
    parentContext = useAnyclick();
  } catch {
    parentContext = null;
  }

  // Store access
  const {
    findParentProvider,
    getDynamicMenuItems,
    getMergedTheme,
    isDisabledByAncestor,
    isElementInAnyScopedProvider,
    isElementInDisabledScope,
    registerProvider,
    unregisterProvider,
    updateProvider,
  } = useProviderStore();

  // Determine parent ID
  const parentId = parentContext?.providerId ?? null;

  // Calculate depth
  const actualDepth = useMemo(() => {
    if (!parentContext) return 0;
    let d = 0;
    let currentId = parentId;
    const providers = useProviderStore.getState().providers;
    while (currentId) {
      d++;
      const parent = providers.get(currentId);
      currentId = parent?.parentId ?? null;
    }
    return d;
  }, [parentContext, parentId]);

  // Determine if disabled by theme
  const isDisabledByTheme = theme === null || theme?.disabled === true;
  const effectiveDisabled = disabled || isDisabledByTheme;

  // Build the theme for this provider
  const localTheme: AnyclickTheme = useMemo(() => {
    if (theme === null) {
      return { disabled: true };
    }

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
  }, [highlightConfig, menuClassName, menuStyle, screenshotConfig, theme]);

  // Snapshot menu items for a given element (called once when menu opens)
  const snapshotMenuItems = useCallback(
    (element: Element) => {
      // Get dynamic items from prop callback
      const dynamicFromProp = dynamicMenuItems ? dynamicMenuItems(element) : [];

      // Get dynamic items from registered getters (via store)
      const dynamicFromRegistry = getDynamicMenuItems(providerId, element);

      // Merge and normalize
      const allDynamic = [...dynamicFromProp, ...dynamicFromRegistry];
      const normalized = normalizeMenuItems(menuItems, allDynamic, userContext);

      setResolvedMenuItems(normalized);
    },
    [dynamicMenuItems, getDynamicMenuItems, menuItems, providerId, userContext],
  );

  // Context menu handler
  const handleContextMenu = useCallback(
    (event: AnyclickMenuEvent, element: Element): boolean => {
      // For non-scoped providers, check if element is in a disabled scope
      if (!scoped && isElementInDisabledScope(element)) {
        return false;
      }

      // For non-scoped providers on touch events, defer to scoped providers
      if (!scoped && event.isTouch && isElementInAnyScopedProvider(element)) {
        return false;
      }

      const mergedTheme = getMergedTheme(providerId);

      // Snapshot menu items for this element
      snapshotMenuItems(element);

      setTargetElement(element);
      const container = findContainerParent(
        element,
        mergedTheme.highlightConfig ?? highlightConfig,
      );
      setContainerElement(container);
      setMenuPosition({ x: event.clientX, y: event.clientY });
      setMenuVisible(true);

      return true;
    },
    [
      getMergedTheme,
      highlightConfig,
      isElementInAnyScopedProvider,
      isElementInDisabledScope,
      providerId,
      scoped,
      snapshotMenuItems,
    ],
  );

  // Register this provider in the store
  useLayoutEffect(() => {
    const providerInstance: ProviderInstance = {
      containerRef: containerRef as React.RefObject<Element | null>,
      depth: actualDepth,
      disabled: effectiveDisabled,
      dynamicMenuItemGetters: new Map(),
      id: providerId,
      onContextMenu: handleContextMenu,
      parentId,
      scoped,
      theme: localTheme,
    };

    registerProvider(providerInstance);

    return () => {
      unregisterProvider(providerId);
    };
  }, [
    actualDepth,
    effectiveDisabled,
    handleContextMenu,
    localTheme,
    parentId,
    providerId,
    registerProvider,
    scoped,
    unregisterProvider,
  ]);

  // Update provider when config changes
  useEffect(() => {
    updateProvider(providerId, {
      disabled: effectiveDisabled,
      onContextMenu: handleContextMenu,
      theme: localTheme,
    });
  }, [
    effectiveDisabled,
    handleContextMenu,
    localTheme,
    providerId,
    updateProvider,
  ]);

  // Create/update the feedback client
  useEffect(() => {
    if (isDisabledByAncestor(providerId)) {
      return;
    }

    if (scoped && !containerReady) {
      return;
    }

    const client = createAnyclickClient({
      adapter,
      container: scoped ? containerRef.current : null,
      cooldownMs,
      maxAncestors,
      maxInnerTextLength,
      maxOuterHTMLLength,
      stripAttributes,
      targetFilter,
      touchHoldDurationMs,
      touchMoveThreshold,
    });

    client.onSubmitSuccess = onSubmitSuccess;
    client.onSubmitError = onSubmitError;
    client.onContextMenu = handleContextMenu;

    clientRef.current = client;

    if (!effectiveDisabled) {
      client.attach();
    }

    return () => {
      client.detach();
    };
  }, [
    adapter,
    containerReady,
    cooldownMs,
    effectiveDisabled,
    handleContextMenu,
    isDisabledByAncestor,
    maxAncestors,
    maxInnerTextLength,
    maxOuterHTMLLength,
    onSubmitError,
    onSubmitSuccess,
    providerId,
    scoped,
    stripAttributes,
    targetFilter,
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
        setMenuPosition(OFFSCREEN_POSITION);
        setTargetElement(null);
        setContainerElement(null);
      }
    },
    [metadata],
  );

  // Open menu programmatically
  const openMenu = useCallback(
    (element: Element, position: { x: number; y: number }) => {
      // Snapshot menu items for this element
      snapshotMenuItems(element);

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
    [getMergedTheme, highlightConfig, providerId, snapshotMenuItems],
  );

  // Close menu
  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setMenuPosition(OFFSCREEN_POSITION);
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
    [submitAnyclick, targetElement],
  );

  // Get merged theme for this provider
  const inheritedTheme = getMergedTheme(providerId);

  // Merge: inherited theme first, then local theme overrides
  const mergedTheme: AnyclickTheme = useMemo(
    () => ({
      ...inheritedTheme,
      ...localTheme,
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
  const effectiveHighlightConfig =
    mergedTheme.highlightConfig ?? highlightConfig;
  const effectiveScreenshotConfig =
    mergedTheme.screenshotConfig ?? screenshotConfig;

  // Register dynamic menu items function (exposed via context for child components)
  // Uses getState() to avoid dependency on store functions which could cause re-render loops
  const registerDynamicMenuItems = useCallback(
    (getter: (element: Element) => ContextMenuItem[]) => {
      const getterId = generateDynamicMenuGetterId();
      const store = useProviderStore.getState();
      store.registerDynamicMenuItems(providerId, getterId, getter);

      // Return unregister function
      return () => {
        const store = useProviderStore.getState();
        store.unregisterDynamicMenuItems(providerId, getterId);
      };
    },
    [providerId],
  );

  // Context value
  const contextValue: AnyclickContextValue = useMemo(
    () => ({
      closeMenu,
      isEnabled: !effectiveDisabled && !isDisabledByAncestor(providerId),
      isSubmitting,
      openMenu,
      providerId,
      registerDynamicMenuItems,
      scoped,
      submitAnyclick,
      theme: mergedTheme,
    }),
    [
      closeMenu,
      effectiveDisabled,
      isDisabledByAncestor,
      isSubmitting,
      mergedTheme,
      openMenu,
      providerId,
      registerDynamicMenuItems,
      scoped,
      submitAnyclick,
    ],
  );

  // For scoped providers, wrap children in a container div
  const content = scoped ? (
    <div
      ref={setContainerRef}
      data-anyclick-provider={providerId}
      style={{ display: "contents" }}
    >
      {children}
    </div>
  ) : (
    children
  );

  return (
    <AnyclickContext.Provider value={contextValue}>
      <div data-anyclick-root>
        {content}
        <ContextMenu
          className={effectiveMenuClassName}
          containerElement={containerElement}
          header={header}
          highlightConfig={effectiveHighlightConfig}
          isSubmitting={isSubmitting}
          items={resolvedMenuItems}
          onClose={closeMenu}
          onSelect={handleMenuSelect}
          position={menuPosition}
          positionMode={menuPositionMode}
          quickChatConfig={quickChatConfig}
          screenshotConfig={effectiveScreenshotConfig}
          style={effectiveMenuStyle}
          targetElement={targetElement}
          visible={menuVisible && !effectiveDisabled}
        />
      </div>
    </AnyclickContext.Provider>
  );
}

/**
 * @deprecated Use {@link AnyclickProvider} instead. Will be removed in v2.0.0.
 */
export const FeedbackProvider = AnyclickProvider;
