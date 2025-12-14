"use client";

/**
 * Zustand store for intent/context registration.
 *
 * Manages a registry of Ac.Context and Ac.Intent components,
 * enabling dynamic context menu actions and metadata inheritance.
 *
 * @module components/tracking/store
 */
import { create } from "zustand";
import type {
  AcAction,
  IntentStore,
  RegisteredContext,
  RegisteredIntent,
} from "./types";

/** Counter for generating unique IDs */
let idCounter = 0;

/**
 * Generates a unique ID for context or intent registration.
 */
export function generateId(prefix: "context" | "intent"): string {
  return `ac-${prefix}-${++idCounter}`;
}

/**
 * Default priority for actions (middle of 1-10 range).
 */
const DEFAULT_PRIORITY = 5;

/**
 * Zustand store for managing intent and context registrations.
 *
 * @example
 * ```ts
 * // Get actions for an element
 * const actions = useIntentStore.getState().getActionsForElement(element);
 *
 * // Register a context
 * const { registerContext } = useIntentStore();
 * registerContext({ id: "ctx-1", ... });
 * ```
 */
export const useIntentStore = create<IntentStore>((set, get) => ({
  contexts: new Map(),
  intents: new Map(),

  // =========================================================================
  // Context Registration
  // =========================================================================

  registerContext: (context) => {
    set((state) => {
      const newContexts = new Map(state.contexts);
      newContexts.set(context.id, context);
      return { contexts: newContexts };
    });
  },

  unregisterContext: (contextId) => {
    set((state) => {
      const newContexts = new Map(state.contexts);
      newContexts.delete(contextId);

      // Also remove intents belonging to this context
      const newIntents = new Map(state.intents);
      Array.from(newIntents.entries()).forEach(([intentId, intent]) => {
        if (intent.contextId === contextId) {
          newIntents.delete(intentId);
        }
      });

      return { contexts: newContexts, intents: newIntents };
    });
  },

  updateContext: (contextId, updates) => {
    set((state) => {
      const newContexts = new Map(state.contexts);
      const existing = newContexts.get(contextId);
      if (existing) {
        newContexts.set(contextId, { ...existing, ...updates });
      }
      return { contexts: newContexts };
    });
  },

  // =========================================================================
  // Intent Registration
  // =========================================================================

  registerIntent: (intent) => {
    set((state) => {
      const newIntents = new Map(state.intents);
      newIntents.set(intent.id, intent);
      return { intents: newIntents };
    });
  },

  unregisterIntent: (intentId) => {
    set((state) => {
      const newIntents = new Map(state.intents);
      newIntents.delete(intentId);
      return { intents: newIntents };
    });
  },

  // =========================================================================
  // Queries
  // =========================================================================

  findContextForElement: (element) => {
    const { contexts } = get();

    let nearestContext: RegisteredContext | null = null;
    let maxDepth = -1;

    Array.from(contexts.values()).forEach((context) => {
      const container = context.elementRef.current;
      if (!container) return;

      if (container.contains(element)) {
        if (context.depth > maxDepth) {
          nearestContext = context;
          maxDepth = context.depth;
        }
      }
    });

    return nearestContext;
  },

  findParentContext: (element, excludeId) => {
    const { contexts } = get();

    if (!element) return null;

    let nearestParent: RegisteredContext | null = null;
    let maxDepth = -1;

    Array.from(contexts.values()).forEach((context) => {
      if (context.id === excludeId) return;

      const container = context.elementRef.current;
      if (!container) return;

      if (container.contains(element)) {
        if (context.depth > maxDepth) {
          nearestParent = context;
          maxDepth = context.depth;
        }
      }
    });

    return nearestParent;
  },

  getMetadataForElement: (element) => {
    const { contexts, findContextForElement } = get();

    const nearestContext = findContextForElement(element);
    if (!nearestContext) return {};

    // Walk up the context hierarchy and merge metadata
    const metadataChain: Record<string, unknown>[] = [];
    let current: RegisteredContext | undefined = nearestContext;

    while (current) {
      metadataChain.unshift(current.metadata);
      current = current.parentId ? contexts.get(current.parentId) : undefined;
    }

    // Merge from root to leaf (later overrides earlier)
    return metadataChain.reduce(
      (acc, metadata) => ({ ...acc, ...metadata }),
      {},
    );
  },

  getActionsForElement: (element) => {
    const { contexts, intents, findContextForElement } = get();

    const nearestContext = findContextForElement(element);
    if (!nearestContext) return [];

    // Collect all actions from context hierarchy
    const allActions: AcAction[] = [];

    // Walk up the context hierarchy
    let current: RegisteredContext | undefined = nearestContext;
    while (current) {
      // Add explicit actions from context
      allActions.push(...current.actions);

      // Add actions from intents registered to this context
      const currentContextId = current.id;
      Array.from(intents.values()).forEach((intent) => {
        // Skip intents that opt out
        if (intent.optOut) return;
        // Skip intents not in this context
        if (intent.contextId !== currentContextId) return;
        // Skip intents without action config
        if (!intent.action) return;

        // Check if element is within this intent's element
        const intentElement = intent.elementRef.current;
        if (!intentElement || !intentElement.contains(element)) return;

        // Build action from intent
        const action: AcAction = {
          intent: intent.intent,
          label: intent.action.label ?? intent.intent,
          priority: intent.action.priority ?? DEFAULT_PRIORITY,
          ...intent.action,
        };
        allActions.push(action);
      });

      current = current.parentId ? contexts.get(current.parentId) : undefined;
    }

    // Sort by priority (highest first)
    return allActions.sort((a, b) => {
      const priorityA = a.priority ?? DEFAULT_PRIORITY;
      const priorityB = b.priority ?? DEFAULT_PRIORITY;
      return priorityB - priorityA;
    });
  },
}));

/**
 * Hook to get the current context for a component.
 * Used internally by Ac.Intent and Ac.View for auto-registration.
 */
export function useNearestContext(
  elementRef: React.RefObject<Element | null>,
): RegisteredContext | null {
  const findContextForElement = useIntentStore(
    (state) => state.findContextForElement,
  );

  const element = elementRef.current;
  if (!element) return null;

  return findContextForElement(element);
}
