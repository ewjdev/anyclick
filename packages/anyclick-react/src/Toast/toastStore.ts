/**
 * Toast store for @ewjdev/anyclick-react
 *
 * Uses Zustand for lightweight state management.
 * Provides both hook-based and imperative API access.
 *
 * @module Toast/toastStore
 * @since 1.6.0
 */
import { create } from "zustand";
import { DEFAULT_MAX_TOASTS, DEFAULT_TOAST_DURATION } from "./styles";
import type { Toast, ToastStore, ToastType } from "./types";

/**
 * Generate a unique ID for toasts.
 */
function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * Zustand store for managing toast state.
 *
 * @internal
 */
export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (message: string, type: ToastType, duration?: number) => {
    const id = generateId();
    const actualDuration = duration ?? DEFAULT_TOAST_DURATION;

    set((state) => ({
      // Keep only the last (maxToasts - 1) toasts to make room for new one
      toasts: [
        ...state.toasts.slice(-(DEFAULT_MAX_TOASTS - 1)),
        { id, message, type, duration: actualDuration },
      ],
    }));

    // Auto-dismiss after duration
    setTimeout(() => {
      const { toasts } = get();
      // Only remove if the toast still exists (wasn't manually dismissed)
      if (toasts.some((t) => t.id === id)) {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }
    }, actualDuration);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

/**
 * Show a toast notification.
 *
 * This is the primary imperative API for showing toasts.
 * Matches the `showToast(message, type)` pattern from anyclick-extension.
 *
 * @param message - The message to display
 * @param type - Toast type: 'success' | 'error' | 'warning' | 'info'
 * @param duration - Optional duration in ms (default: 4000)
 *
 * @example
 * ```ts
 * import { showToast } from "@ewjdev/anyclick-react";
 *
 * // Success notification
 * showToast("Settings saved!", "success");
 *
 * // Error notification
 * showToast("Upload failed", "error");
 *
 * // Warning notification
 * showToast("Feature coming soon", "warning");
 *
 * // Info notification (default type)
 * showToast("Processing...", "info");
 * showToast("Processing..."); // type defaults to "info"
 * ```
 *
 * @since 1.6.0
 */
export function showToast(
  message: string,
  type: ToastType = "info",
  duration?: number,
): void {
  useToastStore.getState().addToast(message, type, duration);
}

/**
 * Remove a specific toast by ID.
 *
 * @param id - The toast ID to remove
 *
 * @since 1.6.0
 */
export function dismissToast(id: string): void {
  useToastStore.getState().removeToast(id);
}

/**
 * Clear all toasts.
 *
 * @since 1.6.0
 */
export function clearToasts(): void {
  useToastStore.getState().clearToasts();
}
