// Types
export type {
  BuiltInAnyclickType,
  AnyclickType,
  AncestorInfo,
  ElementContext,
  PageContext,
  AnyclickPayload,
  AnyclickAdapter,
  AnyclickClientOptions,
  AnyclickResult,
  AnyclickEvent,
  ScreenshotCaptureMode,
  ScreenshotCapture,
  ScreenshotData,
  ScreenshotConfig,
  ScreenshotResult,
  ScreenshotError,
  AnyclickTriggerEvent,
  AnyclickMenuEvent,
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
export { buildPageContext, buildAnyclickPayload } from "./payload";

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
export { AnyclickClient, createAnyclickClient } from "./client";

// Inspect utilities
export {
  CURATED_STYLE_PROPERTIES,
  ALL_CURATED_PROPERTIES,
  getComputedStyles,
  getAccessibilityInfo,
  getBoxModelInfo,
  getAttributes,
  getElementInspectInfo,
  formatStylesAsCSS,
  formatBoxModel,
} from "./inspect";

export type {
  ComputedStylesInfo,
  AccessibilityInfo,
  BoxModelInfo,
  ElementInspectInfo,
} from "./inspect";
