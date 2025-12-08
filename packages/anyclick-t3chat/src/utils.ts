import type { TextSelectionContext } from "./types";

/**
 * Default base URL for t3.chat
 */
export const DEFAULT_T3CHAT_BASE_URL = "https://t3.chat";

/**
 * Get the current text selection from the document
 * @returns The selected text trimmed, or empty string if none
 */
export function getSelectedText(): string {
  if (typeof window === "undefined") return "";

  const selection = window.getSelection();
  if (!selection) return "";

  return selection.toString().trim();
}

/**
 * Get detailed context about the current text selection
 * @returns TextSelectionContext with selection details
 */
export function getTextSelectionContext(): TextSelectionContext {
  if (typeof window === "undefined") {
    return { text: "", hasSelection: false };
  }

  const selection = window.getSelection();
  if (!selection) {
    return { text: "", hasSelection: false };
  }

  const text = selection.toString().trim();
  const hasSelection = text.length > 0;

  // Try to get the anchor element (where selection starts)
  let anchorElement: Element | null = null;
  if (selection.anchorNode) {
    anchorElement =
      selection.anchorNode.nodeType === Node.ELEMENT_NODE
        ? (selection.anchorNode as Element)
        : selection.anchorNode.parentElement;
  }

  return {
    text,
    hasSelection,
    anchorElement,
  };
}

/**
 * Check if there is currently any text selected
 * @returns true if text is selected
 */
export function hasTextSelection(): boolean {
  return getSelectedText().length > 0;
}

/**
 * Build a t3.chat URL with the given query
 * @param query - The query/text to send to t3.chat
 * @param baseUrl - Base URL for t3.chat (defaults to https://t3.chat)
 * @returns The full URL to open
 */
export function buildT3ChatUrl(
  query: string,
  baseUrl: string = DEFAULT_T3CHAT_BASE_URL
): string {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return baseUrl;
  }

  // Construct URL with query parameter
  const url = new URL(baseUrl);
  url.searchParams.set("q", trimmedQuery);

  return url.toString();
}

/**
 * Open a URL in a new tab or the same window
 * @param url - The URL to open
 * @param newTab - Whether to open in a new tab
 * @returns true if navigation was initiated successfully
 */
export function navigateToUrl(url: string, newTab: boolean = true): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (newTab) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
    return true;
  } catch {
    console.error("[anyclick-t3chat] Failed to navigate to URL:", url);
    return false;
  }
}
