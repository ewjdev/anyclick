"use client";

import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StorageValue,
} from "zustand/middleware";
import type { PinnedPosition } from "./InspectDialog";

/**
 * Current version of the persisted state schema.
 * Increment this when making breaking changes to the state structure.
 */
const STORE_VERSION = 1;

/**
 * Represents a modification made to an element
 */
export interface ElementModification {
  /** Unique identifier for the element (generated selector or path) */
  elementId: string;
  /** CSS selector to find the element */
  selector: string;
  /** Human-readable description of the element */
  description: string;
  /** Timestamp of the last modification */
  lastModified: number;
  /** Original inline styles before modification */
  originalStyles: Record<string, string>;
  /** Current modified inline styles */
  modifiedStyles: Record<string, string>;
  /** Original attributes before modification */
  originalAttributes: Record<string, string>;
  /** Current modified attributes */
  modifiedAttributes: Record<string, string>;
  /** Whether the element was deleted */
  isDeleted?: boolean;
}

/**
 * Represents a deleted (hidden) element that can be restored
 * Elements are hidden with display:none rather than removed from DOM
 * for easier persistence and recovery
 */
export interface DeletedElement {
  /** Unique identifier for the element */
  elementId: string;
  /** CSS selector to find the element */
  selector: string;
  /** Human-readable description */
  description: string;
  /** Original display value before hiding */
  originalDisplay: string;
  /** Timestamp of deletion */
  deletedAt: number;
}

/**
 * Escape a string for use in CSS selectors
 * Uses CSS.escape if available, otherwise falls back to manual escaping
 */
function escapeCSSSelector(str: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) {
    return CSS.escape(str);
  }
  // Fallback: escape special CSS characters
  return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

/**
 * Generate a unique ID for an element based on its position in the DOM
 * Uses only simple, reliable selectors to avoid issues with special characters
 */
export function generateElementId(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      // IDs need to be escaped in case they contain special characters
      selector += `#${escapeCSSSelector(current.id)}`;
      path.unshift(selector);
      break; // ID is unique enough
    }

    // Only use simple class names that don't contain special characters
    // Skip Tailwind arbitrary value classes like bg-[#xxx], w-[100px], etc.
    if (current.className && typeof current.className === "string") {
      const simpleClasses = current.className
        .trim()
        .split(/\s+/)
        .filter((cls) => !cls.includes("[") && !cls.includes(":"))
        .slice(0, 2);

      if (simpleClasses.length > 0) {
        selector += `.${simpleClasses.map(escapeCSSSelector).join(".")}`;
      }
    }

    // Add nth-of-type for uniqueness
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(" > ");
}

/**
 * Get a human-readable description of an element
 */
export function getElementDescription(element: Element): string {
  let desc = element.tagName.toLowerCase();
  if (element.id) {
    desc += `#${element.id}`;
  } else if (element.className && typeof element.className === "string") {
    const firstClass = element.className.split(" ")[0];
    if (firstClass) {
      desc += `.${firstClass}`;
    }
  }
  return desc;
}

/**
 * Get current inline styles from an element
 */
function getInlineStyles(element: Element): Record<string, string> {
  if (!(element instanceof HTMLElement)) return {};

  const styles: Record<string, string> = {};
  const styleAttr = element.getAttribute("style");

  if (styleAttr) {
    const declarations = styleAttr.split(";").filter(Boolean);
    for (const decl of declarations) {
      const [prop, ...valueParts] = decl.split(":");
      if (prop && valueParts.length) {
        styles[prop.trim()] = valueParts.join(":").trim();
      }
    }
  }

  return styles;
}

/**
 * Get current attributes from an element (excluding style and class)
 */
function getAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};

  for (const attr of Array.from(element.attributes)) {
    if (attr.name !== "style" && attr.name !== "class") {
      attrs[attr.name] = attr.value;
    }
  }

  return attrs;
}

/**
 * Persisted state shape (what gets saved to localStorage)
 */
interface PersistedState {
  pinnedPosition: PinnedPosition;
  modifiedElements: Record<string, ElementModification>;
  deletedElements: Record<string, DeletedElement>;
}

interface InspectStore extends PersistedState {
  /** Persisted pinned position */
  setPinnedPosition: (position: PinnedPosition) => void;

  /** Whether the store has been hydrated from storage */
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  /** Whether modifications were auto-applied on page load */
  hasAutoAppliedModifications: boolean;
  setHasAutoAppliedModifications: (value: boolean) => void;

  /** Track a modification to an element */
  trackModification: (
    element: Element,
    type: "style" | "attribute",
    key: string,
    oldValue: string | null,
    newValue: string | null,
  ) => void;

  /** Track an element deletion */
  trackDeletion: (element: Element) => void;

  /** Get modification record for an element */
  getModification: (element: Element) => ElementModification | null;

  /** Reset all modifications for a specific element */
  resetElement: (elementId: string) => void;

  /** Reset all modifications for all elements (including restoring deleted elements) */
  resetAllElements: () => void;

  /** Get all modified elements that still exist in the DOM */
  getModifiedElementsInDOM: () => Array<{
    modification: ElementModification;
    element: Element | null;
  }>;

  /** Get count of deleted elements */
  getDeletedCount: () => number;

  /** Apply persisted modifications to the DOM */
  applyPersistedModifications: () => number;

  /** Clear persisted state (for testing) */
  clearPersistedState: () => void;
}

export const useInspectStore = create<InspectStore>()(
  persist(
    (set, get) => ({
      // Persisted state
      pinnedPosition: "floating",
      modifiedElements: {},
      deletedElements: {},

      // Non-persisted state
      _hasHydrated: false,
      hasAutoAppliedModifications: false,

      // Actions
      setPinnedPosition: (position) => set({ pinnedPosition: position }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setHasAutoAppliedModifications: (value) =>
        set({ hasAutoAppliedModifications: value }),

      trackDeletion: (element) => {
        if (!(element instanceof HTMLElement)) return;

        const elementId = generateElementId(element);

        // Store original display value before hiding
        const computedStyle = window.getComputedStyle(element);
        const originalDisplay =
          element.style.display || computedStyle.display || "";

        const deletedElement: DeletedElement = {
          elementId,
          selector: elementId,
          description: getElementDescription(element),
          originalDisplay,
          deletedAt: Date.now(),
        };

        // Hide the element instead of removing it
        element.style.setProperty("display", "none", "important");

        // Also mark in modifiedElements if it exists there
        const currentMods = get().modifiedElements;
        if (currentMods[elementId]) {
          set({
            modifiedElements: {
              ...currentMods,
              [elementId]: {
                ...currentMods[elementId],
                isDeleted: true,
              },
            },
          });
        }

        set({
          deletedElements: {
            ...get().deletedElements,
            [elementId]: deletedElement,
          },
        });
      },

      trackModification: (element, type, key, oldValue, newValue) => {
        const elementId = generateElementId(element);
        const currentMods = get().modifiedElements;
        const existing = currentMods[elementId];

        // Initialize or update modification record
        const modification: ElementModification = existing
          ? { ...existing }
          : {
              elementId,
              selector: elementId,
              description: getElementDescription(element),
              lastModified: Date.now(),
              originalStyles: getInlineStyles(element),
              modifiedStyles: {},
              originalAttributes: getAttributes(element),
              modifiedAttributes: {},
            };

        // Update the appropriate modification tracking
        if (type === "style") {
          // Track original value if not already tracked
          if (
            oldValue !== null &&
            !(key in modification.originalStyles) &&
            !existing
          ) {
            modification.originalStyles[key] = oldValue;
          }

          // Track current modified value
          if (newValue !== null) {
            modification.modifiedStyles[key] = newValue;
          } else {
            // Style was removed
            delete modification.modifiedStyles[key];
          }
        } else {
          // Track original value if not already tracked
          if (
            oldValue !== null &&
            !(key in modification.originalAttributes) &&
            !existing
          ) {
            modification.originalAttributes[key] = oldValue;
          }

          // Track current modified value
          if (newValue !== null) {
            modification.modifiedAttributes[key] = newValue;
          } else {
            // Attribute was removed
            delete modification.modifiedAttributes[key];
          }
        }

        modification.lastModified = Date.now();

        set({
          modifiedElements: {
            ...currentMods,
            [elementId]: modification,
          },
        });
      },

      getModification: (element) => {
        const elementId = generateElementId(element);
        return get().modifiedElements[elementId] || null;
      },

      resetElement: (elementId) => {
        const mods = get().modifiedElements;
        const deletedEls = get().deletedElements;
        const modification = mods[elementId];
        const deletedElement = deletedEls[elementId];

        // Handle restoring a hidden (deleted) element
        if (deletedElement) {
          try {
            const element = document.querySelector(deletedElement.selector);
            if (element && element instanceof HTMLElement) {
              // Restore original display value
              if (deletedElement.originalDisplay) {
                element.style.display = deletedElement.originalDisplay;
              } else {
                element.style.removeProperty("display");
              }
            }
          } catch {
            // Element may not exist anymore
          }

          // Remove from deleted elements
          const { [elementId]: _d, ...restDeleted } = deletedEls;
          set({ deletedElements: restDeleted });

          // Also remove isDeleted flag from modifications if present
          if (modification?.isDeleted) {
            const { [elementId]: _m, ...restMods } = mods;
            set({ modifiedElements: restMods });
          }
          return; // Exit early if this was a deleted element
        }

        // Handle resetting modifications (non-deleted elements)
        if (modification) {
          // Try to find the element in the DOM
          try {
            const element = document.querySelector(modification.selector);
            if (element && element instanceof HTMLElement) {
              // Reset styles
              for (const [key, value] of Object.entries(
                modification.originalStyles,
              )) {
                if (value) {
                  element.style.setProperty(key, value);
                } else {
                  element.style.removeProperty(key);
                }
              }

              // Remove any styles that were added (not in original)
              for (const key of Object.keys(modification.modifiedStyles)) {
                if (!(key in modification.originalStyles)) {
                  element.style.removeProperty(key);
                }
              }

              // Reset attributes
              for (const [key, value] of Object.entries(
                modification.originalAttributes,
              )) {
                element.setAttribute(key, value);
              }

              // Remove any attributes that were added (not in original)
              for (const key of Object.keys(modification.modifiedAttributes)) {
                if (!(key in modification.originalAttributes)) {
                  element.removeAttribute(key);
                }
              }
            }
          } catch {
            // Element may not exist anymore
          }

          // Remove from tracked modifications
          const { [elementId]: _m, ...restMods } = mods;
          set({ modifiedElements: restMods });
        }
      },

      resetAllElements: () => {
        const mods = get().modifiedElements;
        const deletedEls = get().deletedElements;

        // First restore deleted elements (in reverse order of deletion)
        const sortedDeleted = Object.values(deletedEls).sort(
          (a, b) => b.deletedAt - a.deletedAt,
        );
        for (const deleted of sortedDeleted) {
          get().resetElement(deleted.elementId);
        }

        // Then reset modified elements
        for (const elementId of Object.keys(mods)) {
          get().resetElement(elementId);
        }

        set({ modifiedElements: {}, deletedElements: {} });
      },

      getDeletedCount: () => {
        return Object.keys(get().deletedElements).length;
      },

      getModifiedElementsInDOM: () => {
        const mods = get().modifiedElements;
        const results: Array<{
          modification: ElementModification;
          element: Element | null;
        }> = [];

        for (const modification of Object.values(mods)) {
          let element: Element | null = null;

          // Find element using selector
          try {
            element = document.querySelector(modification.selector);
          } catch (e) {
            // Invalid selector - still add to results with null element
            console.warn(
              `[Anyclick] Invalid selector: ${modification.selector}`,
              e,
            );
          }

          // Always add to results (element may be null if not found or invalid selector)
          results.push({ modification, element });
        }

        // Sort by last modified (most recent first)
        return results.sort(
          (a, b) => b.modification.lastModified - a.modification.lastModified,
        );
      },

      applyPersistedModifications: () => {
        const mods = get().modifiedElements;
        const deletedEls = get().deletedElements;
        let appliedCount = 0;

        // Apply style/attribute modifications
        for (const modification of Object.values(mods)) {
          // Skip if marked as deleted (will be handled separately)
          if (modification.isDeleted) continue;

          try {
            const element = document.querySelector(modification.selector);
            if (element && element instanceof HTMLElement) {
              // Apply modified styles
              for (const [key, value] of Object.entries(
                modification.modifiedStyles,
              )) {
                element.style.setProperty(key, value);
                appliedCount++;
              }

              // Apply modified attributes
              for (const [key, value] of Object.entries(
                modification.modifiedAttributes,
              )) {
                element.setAttribute(key, value);
                appliedCount++;
              }
            }
          } catch {
            // Element may not exist or selector may be invalid
          }
        }

        // Apply deletions (hide elements with display: none)
        for (const deleted of Object.values(deletedEls)) {
          try {
            const element = document.querySelector(deleted.selector);
            if (element && element instanceof HTMLElement) {
              element.style.setProperty("display", "none", "important");
              appliedCount++;
            }
          } catch {
            // Element may not exist or selector may be invalid
          }
        }

        if (appliedCount > 0) {
          set({ hasAutoAppliedModifications: true });
        }

        return appliedCount;
      },

      clearPersistedState: () => {
        set({
          pinnedPosition: "floating",
          modifiedElements: {},
          deletedElements: {},
          hasAutoAppliedModifications: false,
          _hasHydrated: true, // Keep hydrated state
        });
        // Also clear from storage
        useInspectStore.persist.clearStorage();
      },
    }),
    {
      name: "anyclick-inspect-store",
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),

      // Only persist these fields
      partialize: (state): PersistedState => ({
        pinnedPosition: state.pinnedPosition,
        modifiedElements: state.modifiedElements,
        deletedElements: state.deletedElements,
      }),

      // Handle hydration lifecycle
      onRehydrateStorage: () => {
        console.log("[Anyclick] Hydration starting...");

        return (state, error) => {
          if (error) {
            console.error("[Anyclick] Hydration failed:", error);
          } else {
            console.log("[Anyclick] Hydration finished");
          }
          // Mark as hydrated regardless of success/failure
          state?.setHasHydrated(true);
        };
      },

      // Deep merge persisted state with current state
      // This ensures nested objects like modifiedElements are properly merged
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedState | undefined;
        return {
          ...currentState,
          pinnedPosition:
            persisted?.pinnedPosition ?? currentState.pinnedPosition,
          modifiedElements: {
            ...currentState.modifiedElements,
            ...(persisted?.modifiedElements ?? {}),
          },
          deletedElements: {
            ...currentState.deletedElements,
            ...(persisted?.deletedElements ?? {}),
          },
        };
      },

      // Handle migrations between versions
      migrate: (persistedState, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persistedState as any;

        if (version === 0) {
          // Migration from version 0 to 1
          // Ensure deletedElements exists (added in v1)
          if (!state.deletedElements) {
            state.deletedElements = {};
          }
        }

        return state as PersistedState;
      },
    },
  ),
);

/**
 * Custom hook to check if the store has been hydrated
 * Use this to prevent hydration mismatches in SSR
 */
export function useHasHydrated() {
  return useInspectStore((state) => state._hasHydrated);
}

/**
 * Wait for hydration to complete before accessing persisted data
 * Useful for ensuring data is available before rendering
 */
export async function waitForHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useInspectStore.getState()._hasHydrated) {
      resolve();
      return;
    }

    const unsubscribe = useInspectStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

export default useInspectStore;
