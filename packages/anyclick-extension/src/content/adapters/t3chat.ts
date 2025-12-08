/**
 * T3.Chat adapter wrapper for extension context.
 *
 * Provides a thin wrapper around the t3chat adapter that works
 * in the extension content script environment.
 *
 * @module content/adapters/t3chat
 * @since 1.0.0
 */

export interface T3ChatExtensionConfig {
  baseUrl?: string;
}

/**
 * Send text to t3.chat
 */
export function sendToT3Chat(
  query: string,
  config: T3ChatExtensionConfig = {},
): void {
  const baseUrl = config.baseUrl ?? "https://t3.chat";
  const trimmedQuery = query.trim();

  const url = trimmedQuery
    ? `${baseUrl}/?q=${encodeURIComponent(trimmedQuery)}`
    : baseUrl;

  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Send selected text to t3.chat
 */
export function sendSelectionToT3Chat(
  config: T3ChatExtensionConfig = {},
): boolean {
  const selection = window.getSelection()?.toString().trim();

  if (!selection) {
    return false;
  }

  sendToT3Chat(selection, config);
  return true;
}

/**
 * Check if there is text selected
 */
export function hasSelection(): boolean {
  const selection = window.getSelection()?.toString().trim();
  return Boolean(selection && selection.length > 0);
}
