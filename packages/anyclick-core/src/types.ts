/**
 * Built-in anyclick types
 */
export type AnyclickBuiltInType = "issue" | "feature" | "like";

/**
 * Type of anyclick the user is submitting
 * Supports built-in types and custom string types for extensibility
 */
export type AnyclickType = AnyclickBuiltInType | (string & {});

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
 * Page-level context at the time of anyclick
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
export type ScreenshotCaptureMode = "element" | "container" | "viewport";

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
 * Error information for a failed screenshot capture
 */
export interface ScreenshotError {
  /** Error message */
  message: string;
  /** Error name/code */
  name: string;
}

/**
 * Result of a single screenshot capture (success or error)
 */
export interface ScreenshotResult {
  /** The captured screenshot data (undefined if error) */
  capture?: ScreenshotCapture;
  /** Error information if capture failed */
  error?: ScreenshotError;
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
  /** Errors encountered during capture (keyed by screenshot type) */
  errors?: {
    element?: ScreenshotError;
    container?: ScreenshotError;
    viewport?: ScreenshotError;
  };
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
  ".sensitive",
  ".private",
];

/**
 * The complete payload sent to the adapter
 */
export interface AnyclickPayload {
  /** Type of anyclick */
  type: AnyclickType;
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
 * Adapter interface for submitting anyclick to any backend
 */
export interface AnyclickAdapter {
  /**
   * Submit anyclick payload to the backend
   * @returns Promise that resolves when anyclick is submitted
   */
  submitAnyclick(payload: AnyclickPayload): Promise<void>;
}

/**
 * Event types that can trigger the anyclick context menu
 */
export type AnyclickTriggerEvent = MouseEvent | TouchEvent;

/**
 * Synthetic event with position information for context menu positioning
 * Used to normalize mouse and touch events
 */
export interface AnyclickMenuEvent {
  /** Client X position (viewport coordinates) */
  clientX: number;
  /** Client Y position (viewport coordinates) */
  clientY: number;
  /** The original event that triggered the menu */
  originalEvent: AnyclickTriggerEvent;
  /** Whether this was triggered by touch (press-and-hold) */
  isTouch: boolean;
}

/**
 * Configuration options for the AnyclickClient
 */
export interface AnyclickClientOptions {
  /** The adapter to use for submitting anyclick */
  adapter: AnyclickAdapter;
  /**
   * Filter function to determine if anyclick should be captured for a target element
   * Return true to allow anyclick, false to ignore
   */
  targetFilter?: (event: AnyclickTriggerEvent, target: Element) => boolean;
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
  /**
   * Optional container element to scope event listeners to.
   * If provided, only events within this container will be captured.
   * If not provided, events are captured from the entire document.
   */
  container?: Element | null;
  /** Duration in ms to hold touch before triggering context menu (default: 500) */
  touchHoldDurationMs?: number;
  /** Maximum movement in px before touch hold is cancelled (default: 10) */
  touchMoveThreshold?: number;
}

/**
 * Result of a anyclick submission attempt
 */
export interface AnyclickResult {
  success: boolean;
  error?: Error;
}

/**
 * Event fired when anyclick is about to be submitted
 */
export interface AnyclickEvent {
  type: AnyclickType;
  element: Element;
  payload: AnyclickPayload;
}
