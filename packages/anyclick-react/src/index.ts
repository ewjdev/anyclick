// Components
"use client";

export { FeedbackProvider } from "./FeedbackProvider";
export { ContextMenu } from "./ContextMenu";
export { ScreenshotPreview } from "./ScreenshotPreview";

// Context and hooks
export { FeedbackContext, useFeedback } from "./context";

// Types
export type {
  FeedbackMenuItem,
  FeedbackProviderProps,
  FeedbackContextValue,
  ContextMenuProps,
  HighlightColors,
  HighlightConfig,
  FeedbackUserContext,
  ScreenshotPreviewProps,
  MenuPositionMode,
} from "./types";

// Utilities
export { filterMenuItemsByRole } from "./types";

// Re-export core types for convenience
export type {
  FeedbackType,
  FeedbackPayload,
  FeedbackAdapter,
  ElementContext,
  PageContext,
  ScreenshotData,
  ScreenshotCapture,
  ScreenshotConfig,
  ScreenshotCaptureMode,
} from "@ewjdev/anyclick-core";

// Re-export screenshot utilities from core
export {
  captureAllScreenshots,
  captureScreenshot,
  isScreenshotSupported,
  formatBytes,
  estimateTotalSize,
  DEFAULT_SCREENSHOT_CONFIG,
  DEFAULT_SENSITIVE_SELECTORS,
} from "@ewjdev/anyclick-core";

// Styles (for customization)
export { menuStyles, darkMenuStyles } from "./styles";

// Highlight utilities (for customization)
export {
  findContainerParent,
  highlightTarget,
  highlightContainer,
  clearHighlights,
  applyHighlights,
  defaultHighlightColors,
  defaultContainerSelectors,
} from "./highlight";
