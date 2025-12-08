import type { T3ChatAdapterOptions, T3ChatResult } from "./types";
import {
  buildT3ChatUrl,
  DEFAULT_T3CHAT_BASE_URL,
  getSelectedText,
  navigateToUrl,
} from "./utils";

/**
 * T3.Chat Adapter
 *
 * Browser-side adapter for sending text and queries to t3.chat.
 * Supports text selection detection and navigation.
 *
 * @example
 * ```ts
 * import { T3ChatAdapter } from "@ewjdev/anyclick-t3chat";
 *
 * const adapter = new T3ChatAdapter();
 *
 * // Send selected text
 * adapter.sendSelectedText();
 *
 * // Send custom query
 * adapter.sendQuery("How do I fix this React error?");
 * ```
 */
export class T3ChatAdapter {
  private baseUrl: string;
  private openInNewTab: boolean;
  private customBuildUrl?: (query: string) => string;

  constructor(options: T3ChatAdapterOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_T3CHAT_BASE_URL;
    this.openInNewTab = options.openInNewTab ?? true;
    this.customBuildUrl = options.buildUrl;
  }

  /**
   * Build a URL for the given query
   */
  private buildUrl(query: string): string {
    if (this.customBuildUrl) {
      return this.customBuildUrl(query);
    }
    return buildT3ChatUrl(query, this.baseUrl);
  }

  /**
   * Send a query to t3.chat
   * @param query - The text/query to send
   * @returns Result indicating success/failure
   */
  sendQuery(query: string): T3ChatResult {
    const url = this.buildUrl(query);

    const success = navigateToUrl(url, this.openInNewTab);

    return {
      success,
      url,
      error: success ? undefined : "Failed to navigate to t3.chat",
    };
  }

  /**
   * Send the currently selected text to t3.chat
   * @returns Result indicating success/failure, or error if no text selected
   */
  sendSelectedText(): T3ChatResult {
    const selectedText = getSelectedText();

    if (!selectedText) {
      return {
        success: false,
        url: this.baseUrl,
        error: "No text selected",
      };
    }

    return this.sendQuery(selectedText);
  }

  /**
   * Open t3.chat without a pre-filled query
   * @returns Result indicating success/failure
   */
  openT3Chat(): T3ChatResult {
    const success = navigateToUrl(this.baseUrl, this.openInNewTab);

    return {
      success,
      url: this.baseUrl,
      error: success ? undefined : "Failed to open t3.chat",
    };
  }

  /**
   * Get the base URL configured for this adapter
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Check if there is currently text selected
   */
  hasSelection(): boolean {
    return getSelectedText().length > 0;
  }

  /**
   * Get the currently selected text
   */
  getSelectedText(): string {
    return getSelectedText();
  }
}

/**
 * Create a T3ChatAdapter instance
 * @param options - Configuration options
 * @returns Configured T3ChatAdapter
 */
export function createT3ChatAdapter(
  options: T3ChatAdapterOptions = {}
): T3ChatAdapter {
  return new T3ChatAdapter(options);
}
