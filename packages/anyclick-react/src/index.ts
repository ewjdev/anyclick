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
  ContextMenuItem,
  FunModeThemeConfig,
  ContextMenuProps,
  HighlightColors,
  HighlightConfig,
  AnyclickUserContext,
  ScreenshotPreviewProps,
  MenuPositionMode,
  FeedbackMenuBadge,
  FeedbackMenuStatus,
} from "./types";

// Presets
export {
  createPresetMenu,
  listPresets,
  presetDefaults,
  type PresetRole,
  type PresetConfig,
  type CreatePresetMenuOptions,
} from "./presets";

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

// Inspect Dialog
export {
  InspectDialog,
  type InspectDialogProps,
  type PinnedPosition,
  type CompactModeConfig,
  DEFAULT_COMPACT_CONFIG,
} from "./InspectDialog/InspectDialog";
export {
  InspectDialogManager,
  openInspectDialog,
  INSPECT_DIALOG_EVENT,
  type InspectDialogManagerProps,
  type InspectDialogEventDetail,
} from "./InspectDialog/InspectDialogManager";

// Inspect Store (for modification tracking)
export {
  useInspectStore,
  useHasHydrated,
  waitForHydration,
  generateElementId,
  getElementDescription,
  type ElementModification,
  type DeletedElement,
} from "./InspectDialog/inspectStore";

// Anyclick Logo
export { AnyclickLogo, type AnyclickLogoProps } from "./AnyclickLogo";

// Modification Indicator
export {
  ModificationIndicator,
  type ModificationIndicatorProps,
} from "./InspectDialog/ModificationIndicator";

// IDE Integration
export {
  openInIDE,
  buildIDEUrl,
  isIDEProtocolSupported,
  detectPreferredIDE,
  getSourceLocationFromElement,
  findSourceLocationInAncestors,
  createIDEOpener,
  formatSourceLocation,
  type IDEProtocol,
  type IDEConfig,
  type SourceLocation,
} from "./ide";

// Re-export inspect utilities from core
export {
  getComputedStyles,
  getAccessibilityInfo,
  getBoxModelInfo,
  getAttributes,
  getElementInspectInfo,
  formatStylesAsCSS,
  formatBoxModel,
  CURATED_STYLE_PROPERTIES,
  ALL_CURATED_PROPERTIES,
} from "@ewjdev/anyclick-core";

export type {
  ComputedStylesInfo,
  AccessibilityInfo,
  BoxModelInfo,
  ElementInspectInfo,
} from "@ewjdev/anyclick-core";
