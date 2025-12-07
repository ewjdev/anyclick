/**
 * Storage keys for chrome.storage.local
 */
export const STORAGE_KEYS = {
  ENABLED: "anyclick_enabled",
  ENDPOINT: "anyclick_endpoint",
  TOKEN: "anyclick_token",
  LAST_CAPTURE: "anyclick_last_capture",
  LAST_STATUS: "anyclick_last_status",
  QUEUE: "anyclick_queue",
} as const;

/**
 * Default settings values
 */
export const DEFAULTS = {
  ENABLED: true,
  ENDPOINT: "",
  TOKEN: "",
} as const;

/**
 * Extension settings stored in chrome.storage.local
 */
export interface ExtensionSettings {
  enabled: boolean;
  endpoint: string;
  token: string;
}

/**
 * Capture status for last operation
 */
export interface CaptureStatus {
  timestamp: string;
  success: boolean;
  message: string;
  url?: string;
}

/**
 * Action metadata from user interaction
 */
export interface ActionMetadata {
  /** Type of action that triggered capture */
  actionType: "contextmenu";
  /** Click coordinates relative to viewport */
  clientX: number;
  clientY: number;
  /** Click coordinates relative to page */
  pageX: number;
  pageY: number;
  /** Modifier keys held during action */
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  };
  /** Scroll position at capture time */
  scrollX: number;
  scrollY: number;
  /** Timestamp of interaction */
  timestamp: string;
}

/**
 * Bounding rectangle info
 */
export interface BoundingRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Ancestor element info (lightweight)
 */
export interface AncestorInfo {
  tag: string;
  id?: string;
  classes: string[];
  selector: string;
}

/**
 * Element context captured from DOM
 */
export interface ElementContext {
  selector: string;
  tag: string;
  id?: string;
  classes: string[];
  innerText: string;
  outerHTML: string;
  boundingRect: BoundingRect;
  dataAttributes: Record<string, string>;
  ancestors: AncestorInfo[];
}

/**
 * Page context at capture time
 */
export interface PageContext {
  url: string;
  title: string;
  referrer: string;
  screen: { width: number; height: number };
  viewport: { width: number; height: number };
  userAgent: string;
  timestamp: string;
}

/**
 * Screenshot data (viewport only for lean v1)
 */
export interface ScreenshotData {
  viewport?: {
    dataUrl: string;
    width: number;
    height: number;
    sizeBytes: number;
  };
  capturedAt: string;
}

/**
 * Complete capture payload sent to adapter endpoint
 */
export interface CapturePayload {
  type: "extension-capture";
  element: ElementContext;
  page: PageContext;
  action: ActionMetadata;
  screenshots?: ScreenshotData;
  metadata?: Record<string, unknown>;
}

/**
 * Queued payload persisted in storage for background processing
 */
export interface QueuedPayload {
  id: string;
  payload: CapturePayload;
  attempts: number;
  createdAt: number;
  nextRetry: number;
  tabId?: number;
  lastError?: string;
}

// ========== Message Protocol ==========

/**
 * Message types for content <-> background communication
 */
export type MessageType =
  | "CAPTURE_REQUEST"
  | "CAPTURE_RESPONSE"
  | "SCREENSHOT_REQUEST"
  | "SCREENSHOT_RESPONSE"
  | "SUBMIT_REQUEST"
  | "SUBMIT_RESPONSE"
  | "GET_SETTINGS"
  | "SETTINGS_RESPONSE"
  | "PING"
  | "PONG"
  | "QUEUE_ADD"
  | "PROCESS_QUEUE"
  | "INSPECT_ELEMENT"
  | "DEVTOOLS_ELEMENT_UPDATE"
  | "TOGGLE_CUSTOM_MENU"
  | "GET_ELEMENT_AT_POINT";

/**
 * Base message structure
 */
export interface BaseMessage {
  type: MessageType;
  timestamp: string;
}

/**
 * Request to capture element context (content -> background)
 */
export interface CaptureRequestMessage extends BaseMessage {
  type: "CAPTURE_REQUEST";
  element: ElementContext;
  page: PageContext;
  action: ActionMetadata;
}

/**
 * Capture response (background -> content)
 */
export interface CaptureResponseMessage extends BaseMessage {
  type: "CAPTURE_RESPONSE";
  success: boolean;
  payload?: CapturePayload;
  error?: string;
}

/**
 * Request screenshot from background (content -> background)
 */
export interface ScreenshotRequestMessage extends BaseMessage {
  type: "SCREENSHOT_REQUEST";
}

/**
 * Screenshot response (background -> content)
 */
export interface ScreenshotResponseMessage extends BaseMessage {
  type: "SCREENSHOT_RESPONSE";
  success: boolean;
  dataUrl?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  error?: string;
}

/**
 * Request to submit payload to endpoint (content -> background)
 */
export interface SubmitRequestMessage extends BaseMessage {
  type: "SUBMIT_REQUEST";
  payload: CapturePayload;
}

/**
 * Request to queue payload for background processing (content -> background)
 */
export interface QueueAddMessage extends BaseMessage {
  type: "QUEUE_ADD";
  payload: CapturePayload;
}

/**
 * Manual request to process queue (content -> background)
 */
export interface ProcessQueueMessage extends BaseMessage {
  type: "PROCESS_QUEUE";
}

/**
 * Submit response (background -> content)
 */
export interface SubmitResponseMessage extends BaseMessage {
  type: "SUBMIT_RESPONSE";
  success: boolean;
  error?: string;
}

/**
 * Request settings (content -> background)
 */
export interface GetSettingsMessage extends BaseMessage {
  type: "GET_SETTINGS";
}

/**
 * Settings response (background -> content)
 */
export interface SettingsResponseMessage extends BaseMessage {
  type: "SETTINGS_RESPONSE";
  settings: ExtensionSettings;
}

/**
 * Ping message for health check
 */
export interface PingMessage extends BaseMessage {
  type: "PING";
}

/**
 * Pong response
 */
export interface PongMessage extends BaseMessage {
  type: "PONG";
}

/**
 * Inspect element message (content -> background -> devtools)
 */
export interface InspectElementMessage extends BaseMessage {
  type: "INSPECT_ELEMENT";
  element: ElementContext;
  position: { x: number; y: number };
}

/**
 * DevTools element update message (background -> devtools panel)
 */
export interface DevToolsElementUpdateMessage extends BaseMessage {
  type: "DEVTOOLS_ELEMENT_UPDATE";
  element: ElementContext | null;
  page?: PageContext;
  screenshotPending?: boolean;
}

/**
 * Toggle custom context menu (popup -> content)
 */
export interface ToggleCustomMenuMessage extends BaseMessage {
  type: "TOGGLE_CUSTOM_MENU";
}

/**
 * Get element at current pointer position (devtools -> content)
 */
export interface GetElementAtPointMessage extends BaseMessage {
  type: "GET_ELEMENT_AT_POINT";
}

/**
 * Union of all message types
 */
export type ExtensionMessage =
  | CaptureRequestMessage
  | CaptureResponseMessage
  | ScreenshotRequestMessage
  | ScreenshotResponseMessage
  | SubmitRequestMessage
  | SubmitResponseMessage
  | GetSettingsMessage
  | SettingsResponseMessage
  | PingMessage
  | PongMessage
  | QueueAddMessage
  | ProcessQueueMessage
  | InspectElementMessage
  | DevToolsElementUpdateMessage
  | ToggleCustomMenuMessage
  | GetElementAtPointMessage;

/**
 * Helper to create message with timestamp
 * Uses a simpler type that adds timestamp to any message object
 */
export function createMessage<T extends { type: MessageType }>(
  msg: T,
): T & { timestamp: string } {
  return {
    ...msg,
    timestamp: new Date().toISOString(),
  };
}

// ========== Performance Constants ==========

/**
 * Performance limits for lean capture
 */
export const PERF_LIMITS = {
  /** Max characters for innerText */
  MAX_INNER_TEXT: 200,
  /** Max characters for outerHTML */
  MAX_OUTER_HTML: 500,
  /** Max ancestor depth */
  MAX_ANCESTORS: 3,
  /** Max payload size in bytes (500KB) */
  MAX_PAYLOAD_SIZE: 512000,
  /** Screenshot JPEG quality (0-1) */
  SCREENSHOT_QUALITY: 0.7,
  /** Submission timeout in ms */
  SUBMIT_TIMEOUT: 8000,
  /** Retry count for failed submissions */
  MAX_RETRIES: 2,
  /** Delay between retries in ms */
  RETRY_DELAY: 1000,
  /** Max outerHTML size in bytes before skipping */
  MAX_OUTER_HTML_BYTES: 10000,
} as const;
