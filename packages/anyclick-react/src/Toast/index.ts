/**
 * Toast module for @ewjdev/anyclick-react
 *
 * Provides toast notifications following the showToast pattern
 * from anyclick-extension.
 *
 * @module Toast
 * @since 1.6.0
 */

// Components
export { Toast } from "./Toast";
export type { ToastProps } from "./Toast";

export { ToastContainer } from "./ToastContainer";
export type { ToastContainerProps } from "./ToastContainer";

// Store and imperative API
export {
  useToastStore,
  showToast,
  dismissToast,
  clearToasts,
} from "./toastStore";

// Types
export type {
  Toast as ToastData,
  ToastType,
  ToastConfig,
  ToastStore,
} from "./types";

// Styles (for advanced customization)
export {
  TOAST_COLORS,
  DEFAULT_TOAST_DURATION,
  DEFAULT_MAX_TOASTS,
  POSITION_STYLES,
  containerStyles,
  toastStyles,
  closeButtonStyles,
} from "./styles";
