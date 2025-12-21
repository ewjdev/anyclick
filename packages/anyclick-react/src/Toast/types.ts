/**
 * Toast types for @ewjdev/anyclick-react
 *
 * Matches the showToast pattern from anyclick-extension for consistency.
 *
 * @module Toast/types
 * @since 1.6.0
 */

/**
 * Toast notification type.
 * Matches the extension pattern: success | error | warning | info
 */
export type ToastType = "success" | "error" | "warning" | "info";

/**
 * Internal toast state representation.
 */
export interface Toast {
  /** Unique identifier */
  id: string;
  /** Toast type determines color */
  type: ToastType;
  /** Message to display */
  message: string;
  /** Duration in ms before auto-dismiss (default: 4000) */
  duration?: number;
}

/**
 * Configuration for automatic toasts on submission.
 *
 * @example
 * ```tsx
 * <AnyclickProvider
 *   adapter={adapter}
 *   toastConfig={{
 *     enabled: true,
 *     position: "bottom-right",
 *     successMessage: "Thanks for your feedback!",
 *   }}
 * >
 * ```
 */
export interface ToastConfig {
  /**
   * Whether automatic toasts are enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Position of the toast container.
   * @default "bottom-right"
   */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";

  /**
   * Maximum number of toasts to show at once.
   * @default 3
   */
  maxToasts?: number;

  /**
   * Custom success message for submissions.
   * @default "Feedback sent!"
   */
  successMessage?: string;

  /**
   * Custom error message for failed submissions.
   * @default "Failed to send feedback"
   */
  errorMessage?: string;
}

/**
 * Toast store state interface.
 */
export interface ToastStore {
  /** Current toasts */
  toasts: Toast[];
  /** Add a new toast */
  addToast: (message: string, type: ToastType, duration?: number) => void;
  /** Remove a toast by id */
  removeToast: (id: string) => void;
  /** Clear all toasts */
  clearToasts: () => void;
}
