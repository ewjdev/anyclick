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
  // T3Chat and UploadThing settings
  T3CHAT_ENABLED: "anyclick_t3chat_enabled",
  T3CHAT_BASE_URL: "anyclick_t3chat_base_url",
  T3CHAT_SYSTEM_PROMPT: "anyclick_t3chat_system_prompt",
  T3CHAT_AUTO_REFINE: "anyclick_t3chat_auto_refine",
  T3CHAT_REFINE_ENDPOINT: "anyclick_t3chat_refine_endpoint",
  UPLOADTHING_ENABLED: "anyclick_uploadthing_enabled",
  UPLOADTHING_ENDPOINT: "anyclick_uploadthing_endpoint",
  UPLOADTHING_API_KEY: "anyclick_uploadthing_api_key",
  CUSTOM_MENU_OVERRIDE: "anyclick_custom_menu_override",
} as const;

/**
 * Default settings values
 */
export const DEFAULTS = {
  ENABLED: true,
  ENDPOINT: "",
  TOKEN: "",
  // T3Chat defaults
  T3CHAT_ENABLED: true,
  T3CHAT_BASE_URL: "https://t3.chat",
  T3CHAT_AUTO_REFINE: true,
  T3CHAT_SYSTEM_PROMPT: "",
  T3CHAT_REFINE_ENDPOINT: "http://localhost:3000/api/anyclick/chat",
  // UploadThing defaults
  UPLOADTHING_ENABLED: false,
  UPLOADTHING_ENDPOINT: "",
  UPLOADTHING_API_KEY: "",
  // Context menu override default
  CUSTOM_MENU_OVERRIDE: true,
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
  | "GET_ELEMENT_AT_POINT"
  | "GET_CONFIG" // T3Chat and UploadThing message types
  | "SET_CONFIG" // T3Chat and UploadThing message types
  | "SEND_TO_T3CHAT" // T3Chat and UploadThing message types
  | "UPLOAD_IMAGE" // T3Chat and UploadThing message types
  | "UPLOAD_SCREENSHOT" // T3Chat and UploadThing message types
  | "REFINE_PROMPT" // T3Chat and UploadThing message types
  | "OPEN_POPUP"; // Request to open extension popup from overlay

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
  /** Whether the DevTools panel was connected when handling an inspect */
  panelConnected?: boolean;
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
  /** Request background to open/focus the Anyclick DevTools panel */
  openDevtools?: boolean;
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
 * Request to open extension popup (overlay -> background)
 */
export interface OpenPopupMessage extends BaseMessage {
  type: "OPEN_POPUP";
}

/**
 * Request to refine a prompt via AI (content/popup -> background)
 */
export interface RefinePromptMessage extends BaseMessage {
  type: "REFINE_PROMPT";
  selectedText: string;
  context: string;
  systemPrompt?: string;
  refineEndpoint?: string;
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
  | GetElementAtPointMessage
  | OpenPopupMessage
  | RefinePromptMessage;

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

// ========== T3Chat & UploadThing Types ==========

/**
 * Extension configuration for t3chat and uploadthing features
 */
export interface ExtensionConfig {
  /** Whether the extension is enabled */
  enabled: boolean;
  /** t3.chat configuration */
  t3chat: {
    enabled: boolean;
    baseUrl: string;
    /** Custom system prompt for prompt refinement */
    systemPrompt?: string;
    /** Whether to auto-refine prompts before sending to t3.chat */
    autoRefine?: boolean;
  };
  /** UploadThing configuration */
  uploadthing: {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
  };
}

/**
 * Default system prompt for t3.chat prompt refinement
 */
export const DEFAULT_T3CHAT_SYSTEM_PROMPT = `You are a prompt refinement assistant. Your task is to refine the user's selected text into a clear, concise, and well-formed question or prompt for t3.chat.

Consider the context provided (element information, page details) to add relevant details that make the prompt more useful. Keep the refined prompt concise but informative. Return only the refined prompt, no explanations.`;

/**
 * Default extension configuration
 */
export const DEFAULT_EXTENSION_CONFIG: ExtensionConfig = {
  enabled: true,
  t3chat: {
    enabled: true,
    baseUrl: "https://t3.chat",
    systemPrompt: DEFAULT_T3CHAT_SYSTEM_PROMPT,
    autoRefine: true,
  },
  uploadthing: {
    enabled: false,
    endpoint: undefined,
    apiKey: undefined,
  },
};

/**
 * Context menu item IDs
 */
export const CONTEXT_MENU_IDS = {
  ANYCLICK_CAPTURE: "anyclick-capture",
  SEND_TO_T3CHAT: "anyclick-send-to-t3chat",
  UPLOAD_IMAGE: "anyclick-upload-image",
  UPLOAD_SCREENSHOT: "anyclick-upload-screenshot",
} as const;

/**
 * Response structure for extension messages
 */
export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Context for t3.chat prompt refinement
 */
export interface T3ChatRefinementContext {
  /** Selected text to refine */
  selectedText: string;
  /** Element context (if available) */
  element?: {
    tag: string;
    selector: string;
    innerText?: string;
    classes?: string[];
  };
  /** Page context */
  page: {
    url: string;
    title: string;
  };
}

/**
 * Request payload for prompt refinement API
 */
export interface RefinePromptRequest {
  action: "refine";
  selectedText: string;
  context: string;
  systemPrompt?: string;
}

/**
 * Response from prompt refinement API
 */
export interface RefinePromptResponse {
  refinedPrompt: string;
}
