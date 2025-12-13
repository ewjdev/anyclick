"use client";

import { create } from "zustand";
import type { PointerConfig } from "./types";
import type { MergedTheme } from "./utils";

/**
 * Registered pointer container in the registry.
 *
 * Each PointerProvider creates an instance when mounted,
 * enabling scoped cursor visibility and theme management.
 */
export interface PointerContainerEntry {
  /** Unique identifier for this container */
  id: string;
  /** Reference to the container's DOM element */
  element: HTMLElement;
  /** Merged theme configuration for this container */
  theme: MergedTheme;
  /** Merged config for this container */
  config: Required<PointerConfig>;
  /** Whether this container is enabled */
  enabled: boolean;
}

/**
 * Pointer store state and actions.
 */
interface PointerStore {
  /** Map of container ID to container entry */
  containers: Map<string, PointerContainerEntry>;

  /** Currently active container (innermost one under cursor) */
  activeContainerId: string | null;

  /** Current cursor position */
  position: { x: number; y: number };

  /** Whether the cursor is within any registered container */
  isInAnyContainer: boolean;

  /** Whether the global mouse listener is active */
  listenerActive: boolean;

  /**
   * Registers a new container in the store.
   */
  registerContainer: (entry: PointerContainerEntry) => void;

  /**
   * Unregisters a container from the store.
   */
  unregisterContainer: (id: string) => void;

  /**
   * Updates a container's configuration.
   */
  updateContainer: (
    id: string,
    updates: Partial<Omit<PointerContainerEntry, "id">>,
  ) => void;

  /**
   * Sets the active container and position (called by global listener).
   */
  setActiveState: (
    containerId: string | null,
    position: { x: number; y: number },
  ) => void;

  /**
   * Gets the active container entry.
   */
  getActiveContainer: () => PointerContainerEntry | null;

  /**
   * Marks the global listener as active.
   */
  setListenerActive: (active: boolean) => void;
}

/** Data attribute used to identify pointer containers in the DOM */
export const POINTER_CONTAINER_ATTR = "data-anyclick-pointer-id";

/**
 * Zustand store for managing pointer container instances.
 *
 * This store maintains a global registry of all PointerProvider containers,
 * enabling:
 * - Scoped cursor visibility (only show pointer inside containers)
 * - Nested container support (innermost container wins)
 * - Global mouse tracking with single listener
 */
export const usePointerStore = create<PointerStore>((set, get) => ({
  containers: new Map(),
  activeContainerId: null,
  position: { x: 0, y: 0 },
  isInAnyContainer: false,
  listenerActive: false,

  registerContainer: (entry) => {
    set((state) => {
      const newContainers = new Map(state.containers);
      newContainers.set(entry.id, entry);
      return { containers: newContainers };
    });

    // Initialize global listener when first container registers
    initGlobalMouseListener();
  },

  unregisterContainer: (id) => {
    set((state) => {
      const newContainers = new Map(state.containers);
      newContainers.delete(id);

      // If the unregistered container was active, clear active state
      const newActiveId =
        state.activeContainerId === id ? null : state.activeContainerId;

      return {
        containers: newContainers,
        activeContainerId: newActiveId,
        isInAnyContainer: newActiveId !== null,
      };
    });

    // Clean up listener if no containers remain
    const { containers } = get();
    if (containers.size === 0) {
      cleanupGlobalMouseListener();
    }
  },

  updateContainer: (id, updates) => {
    set((state) => {
      const newContainers = new Map(state.containers);
      const existing = newContainers.get(id);
      if (existing) {
        newContainers.set(id, { ...existing, ...updates });
      }
      return { containers: newContainers };
    });
  },

  setActiveState: (containerId, position) => {
    set({
      activeContainerId: containerId,
      position,
      isInAnyContainer: containerId !== null,
    });
  },

  getActiveContainer: () => {
    const { containers, activeContainerId } = get();
    if (!activeContainerId) return null;
    return containers.get(activeContainerId) ?? null;
  },

  setListenerActive: (active) => {
    set({ listenerActive: active });
  },
}));

// --- Global Mouse Listener Management ---

let rafId: number | null = null;
let latestMousePos = { x: 0, y: 0 };
let listenerAttached = false;

/** WeakMap for O(1) lookup from DOM element to container entry */
const elementToContainerMap = new WeakMap<HTMLElement, PointerContainerEntry>();

/**
 * Updates the WeakMap when containers change.
 * Called after registration/unregistration.
 */
function syncElementMap() {
  const { containers } = usePointerStore.getState();

  // Clear and rebuild (WeakMap doesn't have clear, but old refs will be GC'd)
  for (const entry of containers.values()) {
    elementToContainerMap.set(entry.element, entry);
  }
}

/**
 * Finds the innermost pointer container at the given coordinates.
 * Uses native browser hit-testing for performance.
 */
function findContainerAtPoint(
  x: number,
  y: number,
): PointerContainerEntry | null {
  // Use browser's native hit-testing
  const target = document.elementFromPoint(x, y);
  if (!target) return null;

  // Walk up the DOM looking for a pointer container
  const containerEl = target.closest(
    `[${POINTER_CONTAINER_ATTR}]`,
  ) as HTMLElement | null;
  if (!containerEl) return null;

  // Get the container ID from the attribute
  const containerId = containerEl.getAttribute(POINTER_CONTAINER_ATTR);
  if (!containerId) return null;

  // Look up in the store
  const { containers } = usePointerStore.getState();
  return containers.get(containerId) ?? null;
}

/**
 * Handles mouse movement - finds active container and updates store.
 */
function handleMouseMove(event: MouseEvent) {
  latestMousePos = { x: event.clientX, y: event.clientY };

  if (rafId === null) {
    rafId = requestAnimationFrame(() => {
      rafId = null;

      const container = findContainerAtPoint(
        latestMousePos.x,
        latestMousePos.y,
      );

      usePointerStore
        .getState()
        .setActiveState(
          container?.enabled ? container.id : null,
          latestMousePos,
        );
    });
  }
}

/**
 * Handles mouse leaving the document.
 */
function handleMouseLeave() {
  usePointerStore.getState().setActiveState(null, latestMousePos);
}

/**
 * Initializes the global mouse listener (called when first container registers).
 */
function initGlobalMouseListener() {
  if (listenerAttached) return;
  listenerAttached = true;

  document.addEventListener("mousemove", handleMouseMove, { passive: true });
  document.documentElement.addEventListener("mouseleave", handleMouseLeave);

  usePointerStore.getState().setListenerActive(true);

  if (process.env.NODE_ENV === "development") {
    console.log("[PointerStore] Global mouse listener initialized");
  }
}

/**
 * Cleans up the global mouse listener (called when last container unregisters).
 */
function cleanupGlobalMouseListener() {
  if (!listenerAttached) return;
  listenerAttached = false;

  document.removeEventListener("mousemove", handleMouseMove);
  document.documentElement.removeEventListener("mouseleave", handleMouseLeave);

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  usePointerStore.getState().setListenerActive(false);

  if (process.env.NODE_ENV === "development") {
    console.log("[PointerStore] Global mouse listener cleaned up");
  }
}

// Subscribe to container changes to keep WeakMap in sync
usePointerStore.subscribe((state, prevState) => {
  if (state.containers !== prevState.containers) {
    syncElementMap();
  }
});
