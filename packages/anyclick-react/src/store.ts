/**
 * Provider registry store for managing anyclick provider instances.
 *
 * Uses Zustand to maintain a global registry of all AnyclickProvider instances,
 * enabling features like nested providers, theme inheritance, and scoped contexts.
 *
 * @module store
 * @since 1.0.0
 */
"use client";

import type { AnyclickMenuEvent } from "@ewjdev/anyclick-core";
import { create } from "zustand";
import type { AnyclickTheme } from "./types";

/**
 * Registered provider instance in the provider registry.
 *
 * Each AnyclickProvider creates an instance of this type when mounted,
 * enabling the store to track and manage provider hierarchies.
 *
 * @since 1.0.0
 */
export interface ProviderInstance {
  /** Reference to the provider's container element (null if not scoped) */
  containerRef: React.RefObject<Element | null>;
  /** Depth in the provider hierarchy (0 = root) */
  depth: number;
  /** Whether this provider is disabled */
  disabled: boolean;
  /** Unique identifier for this provider instance */
  id: string;
  /** Handler to call when an event occurs in this provider's scope */
  onContextMenu?: (
    event: AnyclickMenuEvent,
    element: Element,
  ) => boolean | void;
  /** Parent provider ID (if nested) */
  parentId: string | null;
  /** Whether this provider is scoped to its container */
  scoped: boolean;
  /** The provider's theme configuration */
  theme: AnyclickTheme | null;
}

/**
 * Provider registry store state and actions.
 * @internal
 */
interface ProviderStore {
  /** Map of provider ID to provider instance */
  providers: Map<string, ProviderInstance>;

  /**
   * Finds all providers that contain a given element, sorted by depth (nearest first).
   * @param element - The DOM element to find providers for
   * @returns Array of matching providers, sorted by depth (deepest first)
   */
  findProvidersForElement: (element: Element) => ProviderInstance[];

  /**
   * Finds the nearest parent provider for a given container.
   * @param container - The container element to find a parent for
   * @param excludeId - Optional provider ID to exclude from search
   * @returns The nearest parent provider, or null if none found
   */
  findParentProvider: (
    container: Element | null,
    excludeId?: string,
  ) => ProviderInstance | null;

  /**
   * Gets the merged theme for a provider (includes inherited parent themes).
   * @param providerId - The ID of the provider to get the merged theme for
   * @returns The merged theme configuration
   */
  getMergedTheme: (providerId: string) => AnyclickTheme;

  /**
   * Checks if any ancestor provider has disabled anyclick.
   * @param providerId - The ID of the provider to check
   * @returns True if any ancestor is disabled
   */
  isDisabledByAncestor: (providerId: string) => boolean;

  /**
   * Checks if an element is inside any scoped provider's container.
   * Used to prevent the global provider from handling touch events.
   * @param element - The element to check
   * @returns True if element is inside any scoped provider
   */
  isElementInAnyScopedProvider: (element: Element) => boolean;

  /**
   * Checks if an element is inside a disabled scoped provider's container.
   * @param element - The element to check
   * @returns True if element is inside a disabled scope
   */
  isElementInDisabledScope: (element: Element) => boolean;

  /**
   * Registers a new provider in the store.
   * @param provider - The provider instance to register
   */
  registerProvider: (provider: ProviderInstance) => void;

  /**
   * Unregisters a provider from the store.
   * @param id - The ID of the provider to unregister
   */
  unregisterProvider: (id: string) => void;

  /**
   * Updates a provider's configuration.
   * @param id - The ID of the provider to update
   * @param updates - Partial updates to apply
   */
  updateProvider: (id: string, updates: Partial<ProviderInstance>) => void;
}

/** Counter for generating unique provider IDs */
let providerIdCounter = 0;

/**
 * Generates a unique ID for a provider instance.
 *
 * @returns A unique provider ID string
 *
 * @example
 * ```ts
 * const id = generateProviderId();
 * // => "anyclick-provider-1"
 * ```
 *
 * @since 1.0.0
 */
export function generateProviderId(): string {
  return `anyclick-provider-${++providerIdCounter}`;
}

/**
 * Zustand store hook for managing provider instances.
 *
 * This store maintains a global registry of all AnyclickProvider instances,
 * enabling features like:
 * - Nested provider hierarchies
 * - Theme inheritance
 * - Scoped contexts
 * - Event routing
 *
 * @example
 * ```ts
 * // Get providers for an element
 * const providers = useProviderStore.getState().findProvidersForElement(element);
 *
 * // Get merged theme for a provider
 * const { getMergedTheme } = useProviderStore();
 * const theme = getMergedTheme(providerId);
 * ```
 *
 * @since 1.0.0
 */
export const useProviderStore = create<ProviderStore>((set, get) => ({
  providers: new Map(),

  findProvidersForElement: (element) => {
    const { providers } = get();
    const matching: ProviderInstance[] = [];

    for (const provider of providers.values()) {
      // Skip disabled providers
      if (provider.disabled) continue;

      const container = provider.containerRef.current;

      // For scoped providers, check if element is within container
      if (provider.scoped && container) {
        if (container.contains(element)) {
          matching.push(provider);
        }
      } else if (!provider.scoped) {
        // Non-scoped providers match all elements
        matching.push(provider);
      }
    }

    // Sort by depth (nearest/deepest first)
    return matching.sort((a, b) => b.depth - a.depth);
  },

  findParentProvider: (container, excludeId) => {
    const { providers } = get();

    if (!container) return null;

    let nearestParent: ProviderInstance | null = null;
    let nearestDepth = -1;

    for (const provider of providers.values()) {
      if (provider.id === excludeId) continue;

      const providerContainer = provider.containerRef.current;
      if (!providerContainer) continue;

      // Check if this provider's container contains our container
      if (providerContainer.contains(container)) {
        // This is a potential parent - check if it's the nearest one
        if (provider.depth > nearestDepth) {
          nearestParent = provider;
          nearestDepth = provider.depth;
        }
      }
    }

    return nearestParent;
  },

  getMergedTheme: (providerId) => {
    const { providers } = get();
    const provider = providers.get(providerId);

    if (!provider) {
      return {};
    }

    // Build ancestor chain
    const ancestors: ProviderInstance[] = [];
    let current: ProviderInstance | undefined = provider;

    while (current) {
      ancestors.unshift(current);
      current = current.parentId ? providers.get(current.parentId) : undefined;
    }

    // Merge themes from root to current (later themes override earlier)
    const mergedTheme: AnyclickTheme = {};

    for (const ancestor of ancestors) {
      if (ancestor.theme) {
        // Deep merge for nested objects
        Object.assign(mergedTheme, ancestor.theme);

        // Special handling for highlightConfig and screenshotConfig
        if (ancestor.theme.highlightConfig) {
          mergedTheme.highlightConfig = {
            ...mergedTheme.highlightConfig,
            ...ancestor.theme.highlightConfig,
            colors: {
              ...mergedTheme.highlightConfig?.colors,
              ...ancestor.theme.highlightConfig.colors,
            },
          };
        }

        if (ancestor.theme.screenshotConfig) {
          mergedTheme.screenshotConfig = {
            ...mergedTheme.screenshotConfig,
            ...ancestor.theme.screenshotConfig,
          };
        }
      }
    }

    return mergedTheme;
  },

  isDisabledByAncestor: (providerId) => {
    const { providers } = get();
    const provider = providers.get(providerId);

    if (!provider) return false;

    // Check this provider and all ancestors
    let current: ProviderInstance | undefined = provider;

    while (current) {
      if (current.disabled || current.theme?.disabled) {
        return true;
      }
      current = current.parentId ? providers.get(current.parentId) : undefined;
    }

    return false;
  },

  isElementInAnyScopedProvider: (element) => {
    const { providers } = get();

    // Check all scoped providers (enabled or disabled)
    for (const provider of providers.values()) {
      // Only check scoped providers
      if (!provider.scoped) continue;

      const container = provider.containerRef.current;
      if (!container) continue;

      // If element is inside this scoped provider's container
      if (container.contains(element)) {
        return true;
      }
    }

    return false;
  },

  isElementInDisabledScope: (element) => {
    const { providers } = get();

    // Check all scoped providers (including disabled ones)
    for (const provider of providers.values()) {
      // Only check scoped providers that are disabled
      if (!provider.scoped) continue;
      if (!provider.disabled && !provider.theme?.disabled) continue;

      const container = provider.containerRef.current;
      if (!container) continue;

      // If element is inside this disabled scoped provider's container
      if (container.contains(element)) {
        return true;
      }
    }

    return false;
  },

  registerProvider: (provider) => {
    set((state) => {
      const newProviders = new Map(state.providers);
      newProviders.set(provider.id, provider);
      return { providers: newProviders };
    });
  },

  unregisterProvider: (id) => {
    set((state) => {
      const newProviders = new Map(state.providers);
      newProviders.delete(id);
      return { providers: newProviders };
    });
  },

  updateProvider: (id, updates) => {
    set((state) => {
      const newProviders = new Map(state.providers);
      const existing = newProviders.get(id);
      if (existing) {
        newProviders.set(id, { ...existing, ...updates });
      }
      return { providers: newProviders };
    });
  },
}));

/**
 * Dispatches a context menu event to all matching providers.
 *
 * Routes the event through the provider hierarchy, calling handlers
 * from the nearest (deepest) provider first.
 *
 * @param event - The original mouse event
 * @param element - The target element
 *
 * @example
 * ```ts
 * document.addEventListener("contextmenu", (event) => {
 *   dispatchContextMenuEvent(event, event.target as Element);
 * });
 * ```
 *
 * @since 1.0.0
 */
export function dispatchContextMenuEvent(
  event: MouseEvent,
  element: Element,
): void {
  const store = useProviderStore.getState();
  const providers = store.findProvidersForElement(element);

  // Convert MouseEvent to AnyclickMenuEvent
  const menuEvent: AnyclickMenuEvent = {
    clientX: event.clientX,
    clientY: event.clientY,
    isTouch: false,
    originalEvent: event,
  };

  // Call handlers from nearest to outermost
  for (const provider of providers) {
    // Check if disabled by theme or prop
    if (store.isDisabledByAncestor(provider.id)) {
      continue;
    }

    if (provider.onContextMenu) {
      provider.onContextMenu(menuEvent, element);
      // After the first handler processes, we don't need to call others
      break;
    }
  }
}
