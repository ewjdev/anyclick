import type { CSSProperties } from "react";

export const menuStyles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9998,
  },
  container: {
    position: "fixed",
    zIndex: 9999,
    minWidth: "200px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "14px",
  },
  header: {
    padding: "12px 16px",
    borderBottom: "1px solid #e5e5e5",
    color: "#666",
    fontSize: "12px",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  itemList: {
    padding: "4px 0",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 16px",
    cursor: "pointer",
    transition: "background-color 0.15s",
    color: "#333",
    border: "none",
    background: "none",
    width: "100%",
    textAlign: "left" as const,
    fontSize: "14px",
  },
  itemHover: {
    backgroundColor: "#f5f5f5",
  },
  itemIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    fontSize: "16px",
  },
  commentSection: {
    padding: "12px 16px",
    borderTop: "1px solid #e5e5e5",
  },
  commentInput: {
    width: "100%",
    minHeight: "60px",
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "8px",
  },
  button: {
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.15s, opacity 0.15s",
    border: "none",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    color: "#666",
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  submitButton: {
    backgroundColor: "#0066cc",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};

// Dark mode styles
export const darkMenuStyles: Record<string, CSSProperties> = {
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
  commentSection: {
    ...menuStyles.commentSection,
    borderTop: "1px solid #333",
  },
  commentInput: {
    ...menuStyles.commentInput,
    backgroundColor: "#2a2a2a",
    border: "1px solid #444",
    color: "#e0e0e0",
  },
  cancelButton: {
    ...menuStyles.cancelButton,
    backgroundColor: "#333",
    color: "#ccc",
  },
};
