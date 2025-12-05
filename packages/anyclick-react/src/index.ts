// Components
"use client";

// New exports
export { AnyclickProvider } from "./AnyclickProvider";
export { FunModeBridge } from "./FunModeBridge";
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
  FunModeThemeConfig,
  AnyclickMenuItem,
  ContextMenuProps,
  HighlightColors,
  HighlightConfig,
  AnyclickUserContext,
  ScreenshotPreviewProps,
  MenuPositionMode,
} from "./types";

// Utilities
export { filterMenuItemsByRole } from "./types";

// Re-export core types for convenience
export type {
  AnyclickType,
  AnyclickPayload,
  AnyclickAdapter,
  ElementContext,
  PageContext,
  ScreenshotData,
  ScreenshotConfig,
  ScreenshotCapture,
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
export { menuStyles, darkMenuStyles, menuCSSVariables } from "./styles";

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
