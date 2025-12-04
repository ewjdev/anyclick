// Types
export type {
  BuiltInFeedbackType,
  FeedbackType,
  AncestorInfo,
  ElementContext,
  PageContext,
  FeedbackPayload,
  FeedbackAdapter,
  FeedbackClientOptions,
  FeedbackResult,
  FeedbackEvent,
  ScreenshotCaptureMode,
  ScreenshotCapture,
  ScreenshotData,
  ScreenshotConfig,
  ScreenshotResult,
  ScreenshotError,
  FeedbackTriggerEvent,
  FeedbackMenuEvent,
} from "./types";

export { DEFAULT_SENSITIVE_SELECTORS } from "./types";

// Errors
export {
  ELEMENT_CANNOT_BE_CAPTURED_ERROR,
  SCREENSHOT_TIMEOUT_ERROR,
  SCREENSHOT_NOT_SUPPORTED_ERROR,
} from "./errors";

// DOM utilities
export {
  getUniqueSelector,
  getAncestors,
  getDataAttributes,
  truncate,
  stripAttributesFromHTML,
  buildElementContext,
} from "./dom";

// Payload building
export { buildPageContext, buildFeedbackPayload } from "./payload";

// Screenshot utilities
export {
  DEFAULT_SCREENSHOT_CONFIG,
  isScreenshotSupported,
  captureScreenshot,
  captureAllScreenshots,
  estimateTotalSize,
  formatBytes,
} from "./screenshot";

// Client
export { FeedbackClient, createFeedbackClient } from "./client";
