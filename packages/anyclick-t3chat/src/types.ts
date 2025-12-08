/**
 * Configuration options for t3.chat adapter
 */
export interface T3ChatAdapterOptions {
  /**
   * Base URL for t3.chat
   * @default "https://t3.chat"
   */
  baseUrl?: string;

  /**
   * Whether to open in a new tab or the same window
   * @default true
   */
  openInNewTab?: boolean;

  /**
   * Custom URL builder function for advanced use cases
   */
  buildUrl?: (query: string) => string;
}

/**
 * Result from sending text to t3.chat
 */
export interface T3ChatResult {
  /** Whether the navigation was successful */
  success: boolean;
  /** The URL that was opened */
  url: string;
  /** Error message if navigation failed */
  error?: string;
}

/**
 * Context provided when detecting text selection
 */
export interface TextSelectionContext {
  /** The selected text */
  text: string;
  /** Whether any text is selected */
  hasSelection: boolean;
  /** The element the selection is in (if determinable) */
  anchorElement?: Element | null;
}
