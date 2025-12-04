"use client";

import { create } from "zustand";
import type { AnyclickTheme } from "./types";

/**
 * Registered provider instance
 */
export interface ProviderInstance {
  /** Unique identifier for this provider instance */
  id: string;
  /** Reference to the provider's container element (null if not scoped) */
  containerRef: React.RefObject<Element | null>;
  /** Whether this provider is scoped to its container */
  scoped: boolean;
  /** The provider's theme configuration */
  theme: AnyclickTheme | null;
  /** Whether this provider is disabled */
  disabled: boolean;
  /** Parent provider ID (if nested) */
  parentId: string | null;
  /** Depth in the provider hierarchy (0 = root) */
  depth: number;
  /** Handler to call when an event occurs in this provider's scope */
  onContextMenu?: (event: MouseEvent, element: Element) => void;
}

/**
 * Provider registry store state
 */
interface ProviderStore {
  /** Map of provider ID to provider instance */
  providers: Map<string, ProviderInstance>;

  /**
   * Register a new provider
   */
  registerProvider: (provider: ProviderInstance) => void;

  /**
   * Unregister a provider
   */
  unregisterProvider: (id: string) => void;

  /**
   * Update a provider's configuration
   */
  updateProvider: (id: string, updates: Partial<ProviderInstance>) => void;

  /**
   * Find all providers that contain a given element, sorted by depth (nearest first)
   */
  findProvidersForElement: (element: Element) => ProviderInstance[];

  /**
   * Find the nearest parent provider for a given container
   */
  findParentProvider: (
    container: Element | null,
    excludeId?: string,
  ) => ProviderInstance | null;

  /**
   * Get merged theme for a provider (includes inherited parent themes)
   */
  getMergedTheme: (providerId: string) => AnyclickTheme;

  /**
   * Check if any ancestor provider has disabled anyclick
   */
  isDisabledByAncestor: (providerId: string) => boolean;
}

/**
 * Generate a unique ID for a provider instance
 */
let providerIdCounter = 0;
export function generateProviderId(): string {
  return `anyclick-provider-${++providerIdCounter}`;
}

/**
 * Zustand store for managing provider instances
 */
export const useProviderStore = create<ProviderStore>((set, get) => ({
  providers: new Map(),

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
      current = current.parentId
        ? providers.get(current.parentId)
        : undefined;
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
      current = current.parentId
        ? providers.get(current.parentId)
        : undefined;
    }

    return false;
  },
}));

/**
 * Dispatch a context menu event to all matching providers (bubble up)
 */
export function dispatchContextMenuEvent(
  event: MouseEvent,
  element: Element,
): void {
  const store = useProviderStore.getState();
  const providers = store.findProvidersForElement(element);

  // Call handlers from nearest to outermost
  for (const provider of providers) {
    // Check if disabled by theme or prop
    if (store.isDisabledByAncestor(provider.id)) {
      continue;
    }

    if (provider.onContextMenu) {
      provider.onContextMenu(event, element);
      // After the first handler processes, we don't need to call others
      // unless we want to implement explicit bubbling control
      break;
    }
  }
}

