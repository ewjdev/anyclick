/**
 * Style definitions for QuickChat component.
 *
 * @module QuickChat/styles
 * @since 2.0.0
 */
import type { CSSProperties } from "react";

/**
 * QuickChat component styles.
 */
export const quickChatStyles: Record<string, CSSProperties> = {
  // Inline container - inside the context menu
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxHeight: "320px",
    overflow: "hidden",
  },

  // Pinned drawer - anchored to right side of screen
  pinnedContainer: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "340px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--anyclick-menu-bg, #ffffff)",
    borderLeft: "1px solid var(--anyclick-menu-border, #e5e5e5)",
    boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.15)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "14px",
    overflow: "hidden",
    zIndex: 9998,
  },

  // Pinned messages area (taller)
  pinnedMessagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minHeight: "200px",
  },

  // Header - minimal design
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 8px",
    gap: "8px",
  },
  headerTitle: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    color: "var(--anyclick-menu-text-muted, #666)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  iconButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "transparent",
    color: "var(--anyclick-menu-text-muted, #666)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  iconButtonActive: {
    backgroundColor: "var(--anyclick-menu-accent, #0066cc)",
    color: "#fff",
  },

  // Context badge in header
  contextBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    fontSize: "10px",
    fontWeight: 500,
    border: "1px solid var(--anyclick-menu-border, #e5e5e5)",
    borderRadius: "10px",
    backgroundColor: "transparent",
    color: "var(--anyclick-menu-text-muted, #666)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  contextBadgeActive: {
    borderColor: "var(--anyclick-menu-accent, #0066cc)",
    backgroundColor: "rgba(0, 102, 204, 0.08)",
  },

  // Context dropdown (in normal flow, not absolute)
  contextDropdown: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
    padding: "6px 8px",
    margin: "0 8px 6px 8px",
    backgroundColor: "var(--anyclick-menu-hover, #f5f5f5)",
    borderRadius: "6px",
    maxHeight: "80px",
    overflowY: "auto" as const,
  },

  // Messages area
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minHeight: "40px",
    maxHeight: "140px",
  },
  emptyState: {
    display: "none", // Hide empty state, placeholder in input is enough
  },

  // Message bubble
  message: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    maxWidth: "100%",
  },
  messageUser: {
    alignSelf: "flex-end",
    backgroundColor: "var(--anyclick-menu-accent, #0066cc)",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "12px 12px 4px 12px",
    fontSize: "13px",
    maxWidth: "85%",
    wordBreak: "break-word" as const,
  },
  messageAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "var(--anyclick-menu-hover, #f5f5f5)",
    color: "var(--anyclick-menu-text, #333)",
    padding: "8px 10px",
    borderRadius: "12px 12px 12px 4px",
    fontSize: "13px",
    maxWidth: "100%",
    wordBreak: "break-word" as const,
    lineHeight: 1.4,
  },
  messageActions: {
    display: "flex",
    gap: "4px",
    marginTop: "4px",
    flexWrap: "wrap" as const,
  },
  actionButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: 500,
    border: "1px solid var(--anyclick-menu-border, #e5e5e5)",
    borderRadius: "4px",
    backgroundColor: "transparent",
    color: "var(--anyclick-menu-text-muted, #666)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  streamingIndicator: {
    display: "inline-block",
    width: "4px",
    height: "14px",
    backgroundColor: "var(--anyclick-menu-accent, #0066cc)",
    borderRadius: "1px",
    animation: "blink 1s infinite",
  },

  // Suggestions - compact horizontal scroll
  suggestionsContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    padding: "6px 8px",
    overflowX: "auto" as const,
    overflowY: "hidden",
    scrollbarWidth: "none" as const,
    msOverflowStyle: "none" as const,
  },
  suggestionChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    fontSize: "11px",
    border: "1px solid var(--anyclick-menu-border, #e5e5e5)",
    borderRadius: "12px",
    backgroundColor: "var(--anyclick-menu-hover, #f5f5f5)",
    color: "var(--anyclick-menu-text, #333)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  suggestionChipHover: {
    backgroundColor: "var(--anyclick-menu-bg, #fff)",
    borderColor: "var(--anyclick-menu-accent, #0066cc)",
  },

  // Context redaction - now in dropdown
  contextContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  contextHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  contextTitle: {
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    color: "var(--anyclick-menu-text-muted, #666)",
  },
  contextToggle: {
    fontSize: "10px",
    color: "var(--anyclick-menu-accent, #0066cc)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  contextToggleSmall: {
    fontSize: "9px",
    fontWeight: 500,
    color: "var(--anyclick-menu-text-muted, #666)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 4px",
    borderRadius: "3px",
    transition: "all 0.15s ease",
  },
  contextChunks: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  contextChunk: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 6px",
    borderRadius: "4px",
    fontSize: "11px",
    backgroundColor: "var(--anyclick-menu-hover, #f5f5f5)",
    cursor: "pointer",
    transition: "opacity 0.15s ease",
  },
  contextChunkCompact: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "2px 4px",
    borderRadius: "3px",
    fontSize: "10px",
    cursor: "pointer",
    transition: "opacity 0.15s ease",
  },
  contextChunkExcluded: {
    opacity: 0.5,
    textDecoration: "line-through" as const,
  },
  contextCheckbox: {
    width: "12px",
    height: "12px",
    accentColor: "var(--anyclick-menu-accent, #0066cc)",
  },
  contextLabel: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    color: "var(--anyclick-menu-text, #333)",
  },
  contextSize: {
    fontSize: "10px",
    color: "var(--anyclick-menu-text-muted, #666)",
  },

  // Input area
  inputContainer: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    padding: "8px",
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    fontSize: "13px",
    border: "1px solid var(--anyclick-menu-input-border, #ddd)",
    borderRadius: "18px",
    backgroundColor: "var(--anyclick-menu-input-bg, #fff)",
    color: "var(--anyclick-menu-text, #333)",
    outline: "none",
    resize: "none" as const,
    fontFamily: "inherit",
    lineHeight: 1.4,
    maxHeight: "80px",
    minHeight: "36px",
  },
  inputFocused: {
    borderColor: "var(--anyclick-menu-accent, #0066cc)",
    boxShadow: "0 0 0 2px rgba(0, 102, 204, 0.1)",
  },
  sendButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    border: "none",
    borderRadius: "50%",
    backgroundColor: "var(--anyclick-menu-accent, #0066cc)",
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.15s ease",
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: "var(--anyclick-menu-border, #e5e5e5)",
    cursor: "not-allowed",
  },

  // Loading states
  loadingDots: {
    display: "flex",
    gap: "4px",
    padding: "8px",
  },
  loadingDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "var(--anyclick-menu-text-muted, #666)",
    animation: "bounce 1.4s infinite ease-in-out both",
  },

  // Error states
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "16px",
    textAlign: "center" as const,
  },
  errorIcon: {
    color: "#ef4444",
  },
  errorText: {
    fontSize: "12px",
    color: "#ef4444",
    maxWidth: "200px",
  },
  errorRetry: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 500,
    border: "1px solid #ef4444",
    borderRadius: "4px",
    backgroundColor: "transparent",
    color: "#ef4444",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  // Truncation indicator
  truncated: {
    fontSize: "10px",
    color: "var(--anyclick-menu-text-muted, #666)",
    fontStyle: "italic" as const,
    marginTop: "4px",
  },
};

/**
 * CSS keyframes for animations (to be injected).
 */
export const quickChatKeyframes = `
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideOutToRight {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
`;
