/**
 * Built-in feedback types
 */
export type BuiltInFeedbackType = 'issue' | 'feature' | 'like';

/**
 * Type of feedback the user is submitting
 * Supports built-in types and custom string types for extensibility
 */
export type FeedbackType = BuiltInFeedbackType | (string & {});

/**
 * Information about a single ancestor element in the DOM hierarchy
 */
export interface AncestorInfo {
  /** Tag name (lowercase) */
  tag: string;
  /** Element's id attribute if present */
  id?: string;
  /** Element's class list */
  classes: string[];
  /** CSS selector that uniquely identifies this element */
  selector: string;
}

/**
 * Context about the clicked element and its position in the DOM
 */
export interface ElementContext {
  /** CSS selector for the target element */
  selector: string;
  /** Tag name (lowercase) */
  tag: string;
  /** Element's id attribute if present */
  id?: string;
  /** Element's class list */
  classes: string[];
  /** Inner text content (truncated if too long) */
  innerText: string;
  /** Outer HTML (truncated if too long) */
  outerHTML: string;
  /** Computed bounding rect */
  boundingRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  /** Relevant data-* attributes */
  dataAttributes: Record<string, string>;
  /** List of ancestor elements up to body */
  ancestors: AncestorInfo[];
}

/**
 * Page-level context at the time of feedback
 */
export interface PageContext {
  /** Current URL */
  url: string;
  /** Page title */
  title: string;
  /** Referrer URL */
  referrer: string;
  /** Screen dimensions */
  screen: {
    width: number;
    height: number;
  };
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
  /** User agent string */
  userAgent: string;
  /** ISO timestamp */
  timestamp: string;
}

/**
 * Screenshot capture mode
 */
export type ScreenshotCaptureMode = 'element' | 'container' | 'viewport';

/**
 * Single screenshot capture result
 */
export interface ScreenshotCapture {
  /** Base64 encoded image data (data:image/png;base64,...) */
  dataUrl: string;
  /** Width of the captured image in pixels */
  width: number;
  /** Height of the captured image in pixels */
  height: number;
  /** File size in bytes (after compression) */
  sizeBytes: number;
}

/**
 * Collection of all captured screenshots
 */
export interface ScreenshotData {
  /** Screenshot of just the target element */
  element?: ScreenshotCapture;
  /** Screenshot of the container element (includes target) */
  container?: ScreenshotCapture;
  /** Screenshot of the full viewport */
  viewport?: ScreenshotCapture;
  /** Timestamp when screenshots were captured */
  capturedAt: string;
}

/**
 * Configuration for screenshot capture
 */
export interface ScreenshotConfig {
  /** Whether to capture screenshots (default: true) */
  enabled?: boolean;
  /** JPEG quality from 0-1 (default: 0.7) */
  quality?: number;
  /** Maximum file size in bytes per screenshot (default: 500KB) */
  maxSizeBytes?: number;
  /** Padding around captured elements in pixels (default: 20) */
  padding?: number;
  /** CSS selectors for sensitive elements to mask (e.g., password inputs) */
  sensitiveSelectors?: string[];
  /** Custom mask color for sensitive elements (default: #1a1a1a) */
  maskColor?: string;
  /** Whether to show preview before sending (default: true) */
  showPreview?: boolean;
}

/**
 * Default sensitive element selectors
 */
export const DEFAULT_SENSITIVE_SELECTORS: string[] = [
  'input[type="password"]',
  'input[type="credit-card"]',
  'input[autocomplete="cc-number"]',
  'input[autocomplete="cc-csc"]',
  'input[autocomplete="cc-exp"]',
  '[data-sensitive="true"]',
  '[data-mask="true"]',
  '.sensitive',
  '.private',
];

/**
 * The complete payload sent to the adapter
 */
export interface FeedbackPayload {
  /** Type of feedback */
  type: FeedbackType;
  /** Optional user comment */
  comment?: string;
  /** Element context */
  element: ElementContext;
  /** Page context */
  page: PageContext;
  /** Additional custom metadata */
  metadata?: Record<string, unknown>;
  /** Optional screenshot data */
  screenshots?: ScreenshotData;
}

/**
 * Adapter interface for submitting feedback to any backend
 */
export interface FeedbackAdapter {
  /**
   * Submit feedback payload to the backend
   * @returns Promise that resolves when feedback is submitted
   */
  submitFeedback(payload: FeedbackPayload): Promise<void>;
}

/**
 * Configuration options for the FeedbackClient
 */
export interface FeedbackClientOptions {
  /** The adapter to use for submitting feedback */
  adapter: FeedbackAdapter;
  /** 
   * Filter function to determine if feedback should be captured for a target element
   * Return true to allow feedback, false to ignore
   */
  targetFilter?: (event: MouseEvent, target: Element) => boolean;
  /** Maximum length for innerText capture */
  maxInnerTextLength?: number;
  /** Maximum length for outerHTML capture */
  maxOuterHTMLLength?: number;
  /** Maximum number of ancestors to capture */
  maxAncestors?: number;
  /** Cooldown in milliseconds between submissions (rate limiting) */
  cooldownMs?: number;
  /** Attributes to strip from outerHTML for privacy */
  stripAttributes?: string[];
}

/**
 * Result of a feedback submission attempt
 */
export interface FeedbackResult {
  success: boolean;
  error?: Error;
}

/**
 * Event fired when feedback is about to be submitted
 */
export interface FeedbackEvent {
  type: FeedbackType;
  element: Element;
  payload: FeedbackPayload;
}

