/**
 * Toast styles for @ewjdev/anyclick-react
 *
 * Uses the same color palette as anyclick-extension for consistency.
 *
 * @module Toast/styles
 * @since 1.6.0
 */
import type { ToastType } from "./types";

/**
 * Standard toast colors matching the extension.
 * - success: emerald
 * - error: red
 * - warning: amber
 * - info: blue
 */
export const TOAST_COLORS: Record<
  ToastType,
  { bg: string; border: string; text: string }
> = {
  success: { bg: "#10b981", border: "#059669", text: "#ffffff" },
  error: { bg: "#ef4444", border: "#dc2626", text: "#ffffff" },
  warning: { bg: "#f59e0b", border: "#d97706", text: "#ffffff" },
  info: { bg: "#3b82f6", border: "#2563eb", text: "#ffffff" },
} as const;

/**
 * Default duration for toast auto-dismiss (4 seconds).
 * Matches the extension's content.ts behavior.
 */
export const DEFAULT_TOAST_DURATION = 4000;

/**
 * Maximum number of toasts to show at once.
 */
export const DEFAULT_MAX_TOASTS = 3;

/**
 * Position styles for the toast container.
 */
export const POSITION_STYLES: Record<
  "top-right" | "top-left" | "bottom-right" | "bottom-left",
  React.CSSProperties
> = {
  "top-right": {
    top: 20,
    right: 20,
    flexDirection: "column",
  },
  "top-left": {
    top: 20,
    left: 20,
    flexDirection: "column",
  },
  "bottom-right": {
    bottom: 20,
    right: 20,
    flexDirection: "column-reverse",
  },
  "bottom-left": {
    bottom: 20,
    left: 20,
    flexDirection: "column-reverse",
  },
};

/**
 * Base container styles for the toast stack.
 */
export const containerStyles: React.CSSProperties = {
  position: "fixed",
  display: "flex",
  gap: 8,
  zIndex: 999999,
  pointerEvents: "none",
};

/**
 * Base toast styles.
 */
export const toastStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 16px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)",
  backdropFilter: "blur(8px)",
  pointerEvents: "auto",
  maxWidth: 360,
  minWidth: 200,
};

/**
 * Close button styles.
 */
export const closeButtonStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  padding: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  opacity: 0.7,
  cursor: "pointer",
  borderRadius: 4,
  transition: "opacity 0.15s ease",
  flexShrink: 0,
};
