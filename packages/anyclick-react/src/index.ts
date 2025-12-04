// Components
"use client";

// New exports
export { AnyclickProvider } from "./AnyclickProvider";
export { ContextMenu } from "./ContextMenu";
export { ScreenshotPreview } from "./ScreenshotPreview";

// Deprecated exports (for backward compatibility)
export { FeedbackProvider } from "./AnyclickProvider";

// Context and hooks (new)
export { AnyclickContext, useAnyclick } from "./context";

// Context and hooks (deprecated, for backward compatibility)
export { FeedbackContext, useFeedback } from "./context";

// Store exports (for advanced use cases)
export {
  useProviderStore,
  generateProviderId,
  dispatchContextMenuEvent,
  type ProviderInstance,
} from "./store";

// Types (new)
export type {
  AnyclickProviderProps,
  AnyclickContextValue,
  AnyclickTheme,
  FeedbackMenuItem,
  ContextMenuProps,
  HighlightColors,
  HighlightConfig,
  FeedbackUserContext,
  ScreenshotPreviewProps,
} from "./types";

// Types (deprecated, for backward compatibility)
export type {
  FeedbackProviderProps,
  FeedbackContextValue,
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
