/**
 * Style definitions for anyclick-react components.
 *
 * This module provides consolidated styling for all UI components,
 * including CSS custom properties for theming and dark mode support.
 *
 * @module styles
 * @since 1.0.0
 */
import type { CSSProperties } from "react";

// ============================================================================
// CSS Custom Properties
// ============================================================================

/**
 * CSS custom properties for menu theming.
 *
 * These can be overridden via the `style` prop on AnyclickProvider.
 *
 * @example
 * ```tsx
 * <AnyclickProvider
 *   theme={{
 *     menuStyle: {
 *       '--anyclick-menu-bg': 'rgba(0, 0, 0, 0.9)',
 *       '--anyclick-menu-text': '#ffffff',
 *       '--anyclick-menu-border': 'rgba(255, 255, 255, 0.1)',
 *       '--anyclick-menu-hover': 'rgba(255, 255, 255, 0.1)',
 *       '--anyclick-menu-accent': '#f59e0b',
 *     }
 *   }}
 * />
 * ```
 *
 * @since 1.0.0
 */
export const menuCSSVariables = {
  "--anyclick-menu-accent": "#0066cc",
  "--anyclick-menu-accent-text": "#ffffff",
  "--anyclick-menu-bg": "#ffffff",
  "--anyclick-menu-border": "#e5e5e5",
  "--anyclick-menu-cancel-bg": "#f0f0f0",
  "--anyclick-menu-cancel-text": "#666666",
  "--anyclick-menu-hover": "#f5f5f5",
  "--anyclick-menu-input-bg": "#ffffff",
  "--anyclick-menu-input-border": "#dddddd",
  "--anyclick-menu-text": "#333333",
  "--anyclick-menu-text-muted": "#666666",
} as const;

// ============================================================================
// Badge Styles
// ============================================================================

/**
 * Badge tone color configuration.
 * @internal
 */
const badgeToneColors = {
  info: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    color: "#60a5fa",
  },
  neutral: {
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    border: "1px solid rgba(148, 163, 184, 0.3)",
    color: "#cbd5e1",
  },
  success: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    color: "#4ade80",
  },
  warning: {
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    border: "1px solid rgba(251, 191, 36, 0.3)",
    color: "#fbbf24",
  },
} as const;

/**
 * Gets badge styles for a specific tone.
 *
 * @param tone - The badge tone (info, neutral, success, warning)
 * @returns CSSProperties for the badge
 *
 * @example
 * ```tsx
 * const style = getBadgeStyle("success");
 * // => { backgroundColor: "rgba(34, 197, 94, 0.15)", ... }
 * ```
 *
 * @since 1.2.0
 */
export function getBadgeStyle(
  tone: "info" | "neutral" | "success" | "warning" = "neutral",
): CSSProperties {
  const toneColors = badgeToneColors[tone];
  return {
    alignItems: "center",
    backgroundColor: toneColors.backgroundColor,
    border: toneColors.border,
    borderRadius: "9999px",
    color: toneColors.color,
    display: "inline-flex",
    fontSize: "10px",
    lineHeight: 1.2,
    padding: "2px 6px",
  };
}

// ============================================================================
// Menu Styles
// ============================================================================

/**
 * Core menu component styles.
 *
 * @since 1.0.0
 */
export const menuStyles: Record<string, CSSProperties> = {
  backButton: {
    borderBottom: "1px solid var(--anyclick-menu-border, #e5e5e5)",
    marginBottom: "4px",
    minHeight: "44px",
  },
  button: {
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    padding: "6px 12px",
    transition: "background-color 0.15s, opacity 0.15s",
  },
  buttonRow: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    marginTop: "8px",
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: "var(--anyclick-menu-cancel-bg, #f0f0f0)",
    color: "var(--anyclick-menu-cancel-text, #666)",
    display: "flex",
    gap: "2px",
  },
  commentInput: {
    backgroundColor: "var(--anyclick-menu-input-bg, #ffffff)",
    border: "1px solid var(--anyclick-menu-input-border, #ddd)",
    borderRadius: "6px",
    boxSizing: "border-box" as const,
    color: "var(--anyclick-menu-text, #333)",
    fontFamily: "inherit",
    fontSize: "14px",
    minHeight: "60px",
    outline: "none",
    padding: "8px 12px",
    resize: "vertical" as const,
    width: "100%",
  },
  commentSection: {
    borderTop: "1px solid var(--anyclick-menu-border, #e5e5e5)",
    padding: "12px 16px",
  },
  container: {
    backgroundColor: "var(--anyclick-menu-bg, #ffffff)",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "14px",
    minWidth: "200px",
    overflow: "hidden",
    position: "fixed",
    zIndex: 9999,
    ...menuCSSVariables,
  },
  dragHandle: {
    alignItems: "center",
    borderRadius: "4px",
    display: "flex",
    marginRight: "-4px",
    opacity: 0.5,
    padding: "4px",
    transition: "opacity 0.15s",
  },
  header: {
    alignItems: "center",
    borderBottom: "1px solid var(--anyclick-menu-border, #e5e5e5)",
    color: "var(--anyclick-menu-text-muted, #666)",
    display: "flex",
    fontSize: "12px",
    fontWeight: 500,
    justifyContent: "space-between",
    letterSpacing: "0.5px",
    padding: "8px 12px",
    textTransform: "uppercase" as const,
  },
  item: {
    alignItems: "center",
    backgroundColor: "transparent",
    border: "none",
    color: "var(--anyclick-menu-text, #333)",
    cursor: "pointer",
    display: "flex",
    fontSize: "14px",
    gap: "10px",
    padding: "10px 16px",
    textAlign: "left" as const,
    transition: "background-color 0.15s",
    width: "100%",
  },
  itemDisabled: {
    cursor: "not-allowed",
    opacity: 0.5,
  },
  itemHover: {
    backgroundColor: "var(--anyclick-menu-hover, #f5f5f5)",
  },
  itemIcon: {
    alignItems: "center",
    display: "flex",
    fontSize: "16px",
    height: "20px",
    justifyContent: "center",
    width: "20px",
  },
  itemLabel: {
    alignItems: "center",
    display: "inline-flex",
    flex: 1,
    gap: "8px",
  },
  itemList: {
    padding: "0px 0px",
  },
  overlay: {
    inset: 0,
    position: "fixed",
    zIndex: 9998,
  },
  screenshotIndicator: {
    display: "flex",
    flex: 1,
    justifyContent: "flex-end",
    marginLeft: "4px",
    opacity: 0.7,
  },
  submenuIcon: {
    marginLeft: "auto",
    opacity: 0.5,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "var(--anyclick-menu-accent, #0066cc)",
    color: "var(--anyclick-menu-accent-text, #ffffff)",
    display: "flex",
    gap: "2px",
  },
  submitButtonDisabled: {
    cursor: "not-allowed",
    opacity: 0.6,
  },
  touchFriendly: {
    minHeight: "38px",
    userSelect: "none",
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
  },
};

// ============================================================================
// Dark Mode Styles
// ============================================================================

/**
 * Dark mode menu styles.
 *
 * Apply these styles for dark theme support.
 *
 * @since 1.0.0
 */
export const darkMenuStyles: Record<string, CSSProperties> = {
  cancelButton: {
    ...menuStyles.cancelButton,
    backgroundColor: "#333",
    color: "#ccc",
  },
  commentInput: {
    ...menuStyles.commentInput,
    backgroundColor: "#2a2a2a",
    border: "1px solid #444",
    color: "#e0e0e0",
  },
  commentSection: {
    ...menuStyles.commentSection,
    borderTop: "1px solid #333",
  },
  container: {
    ...menuStyles.container,
    backgroundColor: "#1a1a1a",
    boxShadow:
      "0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
  },
  header: {
    ...menuStyles.header,
    borderBottom: "1px solid #333",
    color: "#888",
  },
  item: {
    ...menuStyles.item,
    color: "#e0e0e0",
  },
  itemHover: {
    backgroundColor: "#2a2a2a",
  },
};

// ============================================================================
// Screenshot Preview Styles
// ============================================================================

/**
 * Screenshot preview component styles.
 *
 * @since 1.0.0
 */
export const screenshotPreviewStyles: Record<string, CSSProperties> = {
  actions: {
    alignItems: "center",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "8px",
  },
  actionsRight: {
    display: "flex",
    gap: "8px",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
  },
  containerExpanded: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    left: "50%",
    maxHeight: "90vh",
    maxWidth: "800px",
    padding: "16px",
    position: "fixed",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "90vw",
    zIndex: 10000,
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    fontSize: "12px",
    fontWeight: "500",
    gap: "6px",
    padding: "8px 12px",
  },
  dimensionsInfo: {
    color: "#9ca3af",
    fontSize: "11px",
    textAlign: "center" as const,
  },
  emptyActions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  emptyContainer: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    justifyContent: "center",
    padding: "24px",
  },
  emptySubtext: {
    color: "#9ca3af",
    fontSize: "11px",
    textAlign: "center" as const,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "500",
  },
  errorMessage: {
    color: "#6b7280",
    fontSize: "12px",
    lineHeight: "1.4",
    maxWidth: "250px",
  },
  errorPreview: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    justifyContent: "center",
    padding: "16px",
    textAlign: "center" as const,
  },
  errorTitle: {
    color: "#ef4444",
    fontSize: "14px",
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 4px",
  },
  headerActions: {
    alignItems: "center",
    display: "flex",
    gap: "8px",
  },
  headerTitle: {
    color: "#374151",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "4px",
    color: "#6b7280",
    cursor: "pointer",
    display: "flex",
    height: "24px",
    justifyContent: "center",
    width: "24px",
  },
  loadingContainer: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    justifyContent: "center",
    padding: "24px",
  },
  loadingText: {
    color: "#6b7280",
    fontSize: "13px",
  },
  noPreview: {
    alignItems: "center",
    color: "#9ca3af",
    display: "flex",
    flexDirection: "column",
    fontSize: "12px",
    gap: "8px",
  },
  previewContainer: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    display: "flex",
    height: "150px",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  previewContainerExpanded: {
    height: "60vh",
    maxHeight: "500px",
  },
  previewImage: {
    maxHeight: "100%",
    maxWidth: "100%",
    objectFit: "contain",
  },
  retakeButton: {
    alignItems: "center",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    fontSize: "13px",
    fontWeight: "500",
    gap: "6px",
    padding: "8px 16px",
  },
  retakeButtonOutline: {
    alignItems: "center",
    backgroundColor: "transparent",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    color: "#6b7280",
    cursor: "pointer",
    display: "flex",
    fontSize: "12px",
    gap: "6px",
    padding: "8px 12px",
  },
  retakeButtonSmall: {
    alignItems: "center",
    backgroundColor: "transparent",
    border: "1px solid #e5e7eb",
    borderRadius: "4px",
    color: "#6b7280",
    cursor: "pointer",
    display: "flex",
    fontSize: "11px",
    gap: "4px",
    padding: "4px 8px",
  },
  sizeLabel: {
    color: "#9ca3af",
    fontSize: "11px",
  },
  tab: {
    alignItems: "center",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "4px",
    color: "#6b7280",
    cursor: "pointer",
    display: "flex",
    fontSize: "12px",
    gap: "4px",
    padding: "2px 5px",
    transition: "all 0.15s ease",
  },
  tabActive: {
    backgroundColor: "#eff6ff",
    color: "#3b82f6",
    fontWeight: "500",
  },
  tabContainer: {
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    gap: "4px",
    paddingBottom: "8px",
  },
  tabError: {
    color: "#ef4444",
  },
  tabSize: {
    color: "#9ca3af",
    fontSize: "10px",
  },
};
