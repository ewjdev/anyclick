/**
 * @ewjdev/anyclick-react
 *
 * React provider and context menu UI for UI feedback capture.
 * Enables right-click context menus for submitting feedback, capturing screenshots,
 * and integrating with various adapters (GitHub, AI agents, etc.)
 *
 * @packageDocumentation
 * @module @ewjdev/anyclick-react
 * @since 1.0.0
 *
 * @example
 * ```tsx
 * import { AnyclickProvider } from "@ewjdev/anyclick-react";
 * import { createHttpAdapter } from "@ewjdev/anyclick-github";
 *
 * const adapter = createHttpAdapter({ endpoint: "/api/feedback" });
 *
 * function App() {
 *   return (
 *     <AnyclickProvider adapter={adapter}>
 *       <YourApp />
 *     </AnyclickProvider>
 *   );
 * }
 * ```
 */
"use client";
// Shared styles (prefixed, no preflight) for anyclick react surfaces.
import "./styles/tailwind.css";

// ============================================================================
// Core Components
// ============================================================================

/**
 * Main provider component for anyclick functionality.
 * Wraps your app to enable right-click feedback capture.
 * @see {@link AnyclickProviderProps} for configuration options
 */
export { AnyclickProvider } from "./AnyclickProvider";

/**
 * Bridge component for enabling fun mode (go-kart cursor) within a scoped provider.
 * @tag {experimental}
 */
export { FunModeBridge } from "./FunModeBridge";

/**
 * Standalone context menu component for custom implementations.
 * @see {@link ContextMenuProps} for configuration options
 */
export { ContextMenu } from "./ContextMenu";

/**
 * Screenshot preview component displayed before sending feedback.
 * @see {@link ScreenshotPreviewProps} for configuration options
 */
export { ScreenshotPreview } from "./ScreenshotPreview";

// ============================================================================
// Deprecated Exports (Backward Compatibility)
// ============================================================================

/**
 * @deprecated Use {@link AnyclickProvider} instead. Will be removed in v2.0.0.
 */
export { FeedbackProvider } from "./AnyclickProvider";

// ============================================================================
// Context and Hooks
// ============================================================================

/**
 * React context for anyclick functionality.
 * Use with `useContext` for custom implementations.
 */
export { AnyclickContext } from "./context";

/**
 * Hook to access anyclick context values.
 * @throws {Error} When used outside of AnyclickProvider
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { openMenu, isSubmitting } = useAnyclick();
 *   // ...
 * }
 * ```
 */
export { useAnyclick } from "./context";

/**
 * @deprecated Use {@link AnyclickContext} instead. Will be removed in v2.0.0.
 */
export { FeedbackContext } from "./context";

/**
 * @deprecated Use {@link useAnyclick} instead. Will be removed in v2.0.0.
 */
export { useFeedback } from "./context";

// ============================================================================
// Store (Advanced Use Cases)
// ============================================================================

/**
 * Zustand store hook for managing provider instances.
 * For advanced use cases like custom provider hierarchies.
 */
export { useProviderStore } from "./store";

/**
 * Generates a unique ID for a provider instance.
 */
export { generateProviderId } from "./store";

/**
 * Dispatches a context menu event to matching providers.
 */
export { dispatchContextMenuEvent } from "./store";

// ============================================================================
// UI primitives (shadcn-inspired, prefixed Tailwind)
// ============================================================================
export * from "./ui";

/**
 * Provider instance type for advanced store management.
 */
export type { ProviderInstance, DynamicMenuItemGetter } from "./store";

/**
 * Generates a unique ID for a dynamic menu getter.
 * Useful when manually registering dynamic menu getters via the store.
 */
export { generateDynamicMenuGetterId } from "./store";

// ============================================================================
// Types
// ============================================================================

export type {
  /** Props for AnyclickProvider component */
  AnyclickProviderProps,
  /** Context value exposed by AnyclickProvider */
  AnyclickContextValue,
  /** Theme configuration for AnyclickProvider */
  AnyclickTheme,
  /** Menu item configuration */
  ContextMenuItem,
  /** Fun mode theme configuration */
  FunModeThemeConfig,
  /** Props for ContextMenu component */
  ContextMenuProps,
  /** Highlight color configuration */
  HighlightColors,
  /** Highlight behavior configuration */
  HighlightConfig,
  /** User context for role-based filtering */
  AnyclickUserContext,
  /** Props for ScreenshotPreview component */
  ScreenshotPreviewProps,
  /** Menu positioning modes */
  MenuPositionMode,
  /** Visual badge for menu items */
  FeedbackMenuBadge,
  /** Status of a menu item */
  FeedbackMenuStatus,
} from "./types";

// ============================================================================
// Presets
// ============================================================================

/**
 * Creates a preset menu configuration for a specific role.
 * @param role - The preset role (qa, pm, designer, developer, chrome)
 * @param options - Optional configuration overrides
 * @returns A complete preset configuration
 * @example
 * ```tsx
 * const qaPreset = createPresetMenu("qa");
 * <AnyclickProvider
 *   adapter={adapter}
 *   menuItems={qaPreset.menuItems}
 *   screenshotConfig={qaPreset.screenshotConfig}
 * />
 * ```
 */
export { createPresetMenu } from "./presets";

/**
 * Lists all available preset configurations.
 */
export { listPresets } from "./presets";

/**
 * Default preset configurations by role.
 */
export { presetDefaults } from "./presets";

/**
 * Creates a menu item for sending selected text to t3.chat.
 * @param options - Optional customization (label, baseUrl)
 * @returns A ContextMenuItem configured for t3.chat
 * @example
 * ```tsx
 * const menuItems = [
 *   { label: "Bug", type: "bug", showComment: true },
 *   createT3ChatMenuItem(),
 * ];
 * ```
 */
export { createT3ChatMenuItem } from "./presets";

/**
 * Gets the currently selected text on the page.
 * @returns The selected text, or empty string if nothing is selected
 */
export { getSelectedText } from "./presets";

/**
 * Checks if there is currently any text selected on the page.
 * @returns true if text is selected
 */
export { hasTextSelection } from "./presets";

/**
 * Detects if an element is or contains an image.
 * @param element - The element to check
 * @returns Object with isImage flag and optional image source
 */
export { detectImageElement } from "./presets";

/**
 * Creates a menu item for uploading images to UploadThing.
 * @param options - Configuration options
 * @returns A ContextMenuItem configured for image uploads
 */
export { createUploadThingMenuItem } from "./presets";

/**
 * Creates a menu item for uploading screenshots to UploadThing.
 * @param options - Configuration options
 * @returns A ContextMenuItem configured for screenshot uploads
 */
export { createUploadScreenshotMenuItem } from "./presets";

export type {
  /** Available preset roles */
  PresetRole,
  /** Preset configuration structure */
  PresetConfig,
  /** Options for creating preset menus */
  CreatePresetMenuOptions,
} from "./presets";

// ============================================================================
// Utilities
// ============================================================================

/**
 * Filters menu items based on user roles.
 * @param items - Menu items to filter
 * @param userContext - User context with roles
 * @returns Filtered menu items visible to the user
 */
export { filterMenuItemsByRole } from "./types";

// ============================================================================
// Core Re-exports
// ============================================================================

export type {
  /** Feedback type identifier */
  AnyclickType,
  /** Feedback submission payload */
  AnyclickPayload,
  /** Adapter interface for submitting feedback */
  AnyclickAdapter,
  /** DOM element context information */
  ElementContext,
  /** Page-level context information */
  PageContext,
  /** Captured screenshot data */
  ScreenshotData,
  /** Screenshot capture configuration */
  ScreenshotConfig,
  /** Individual screenshot capture */
  ScreenshotCapture,
  /** Screenshot capture mode */
  ScreenshotCaptureMode,
} from "@ewjdev/anyclick-core";

export {
  /** Captures all configured screenshots */
  captureAllScreenshots,
  /** Captures a single screenshot */
  captureScreenshot,
  /** Checks if screenshot capture is supported */
  isScreenshotSupported,
  /** Formats bytes to human-readable string */
  formatBytes,
  /** Estimates total size of screenshot data */
  estimateTotalSize,
  /** Default screenshot configuration */
  DEFAULT_SCREENSHOT_CONFIG,
  /** Default sensitive element selectors */
  DEFAULT_SENSITIVE_SELECTORS,
} from "@ewjdev/anyclick-core";

// ============================================================================
// Styles
// ============================================================================

/**
 * Default menu styles for customization.
 */
export { menuStyles } from "./styles";

/**
 * Dark mode menu styles.
 */
export { darkMenuStyles } from "./styles";

/**
 * CSS custom properties for menu theming.
 * Override these via the `style` prop on AnyclickProvider.
 */
export { menuCSSVariables } from "./styles";

/**
 * Gets badge styles for a specific tone.
 */
export { getBadgeStyle } from "./styles";

// ============================================================================
// Highlight Utilities
// ============================================================================

/**
 * Finds the closest container parent element based on configuration.
 */
export { findContainerParent } from "./highlight";

/**
 * Applies highlight styling to target element.
 */
export { highlightTarget } from "./highlight";

/**
 * Applies highlight styling to container element.
 */
export { highlightContainer } from "./highlight";

/**
 * Removes all highlight styling from the document.
 */
export { clearHighlights } from "./highlight";

/**
 * Applies highlights to both target and container elements.
 */
export { applyHighlights } from "./highlight";

/**
 * Default highlight colors.
 */
export { defaultHighlightColors } from "./highlight";

/**
 * Default CSS selectors for identifying container elements.
 */
export { defaultContainerSelectors } from "./highlight";

// ============================================================================
// Inspect Simple (Lightweight Inspector)
// ============================================================================

/**
 * Lightweight element inspector component for mobile-friendly inspection.
 */
export { InspectSimple } from "./InspectDialog/InspectSimple";

/**
 * Default compact mode configuration for InspectSimple.
 */
export { DEFAULT_COMPACT_CONFIG } from "./InspectDialog/InspectSimple";

export type {
  /** Props for InspectSimple component */
  InspectSimpleProps,
  /** Dialog pinned position options */
  PinnedPosition,
  /** Compact mode configuration */
  CompactModeConfig,
} from "./InspectDialog/InspectSimple";

/**
 * Manager component that listens for inspect events and renders InspectSimple.
 * Place this component once in your app to enable inspect functionality.
 */
export { InspectDialogManager } from "./InspectDialog/InspectDialogManager";

/**
 * Opens the inspect dialog for a given element.
 */
export { openInspectDialog } from "./InspectDialog/InspectDialogManager";

/**
 * Event name for inspect dialog events.
 */
export { INSPECT_DIALOG_EVENT } from "./InspectDialog/InspectDialogManager";

export type {
  /** Props for InspectDialogManager component */
  InspectDialogManagerProps,
  /** Event detail for inspect dialog events */
  InspectDialogEventDetail,
} from "./InspectDialog/InspectDialogManager";

// ============================================================================
// Branding
// ============================================================================

/**
 * Anyclick logo component for branding.
 */
export { AnyclickLogo } from "./AnyclickLogo";

export type {
  /** Props for AnyclickLogo component */
  AnyclickLogoProps,
} from "./AnyclickLogo";

// ============================================================================
// QuickChat
// ============================================================================

/**
 * Lightweight AI chat component for the context menu.
 * Provides quick answers about elements with streaming responses.
 */
export { QuickChat } from "./QuickChat";

/**
 * Hook for managing QuickChat state and logic.
 */
export { useQuickChat } from "./QuickChat";

/**
 * QuickChat component styles.
 */
export { quickChatStyles, quickChatKeyframes } from "./QuickChat";

/**
 * Default QuickChat configuration.
 */
export { DEFAULT_QUICK_CHAT_CONFIG } from "./QuickChat";

export type {
  /** QuickChat component props */
  QuickChatProps,
  /** QuickChat configuration options */
  QuickChatConfig,
  /** Chat message structure */
  ChatMessage,
  /** Context chunk for redaction UI */
  ContextChunk,
  /** Quick action for AI responses */
  QuickAction,
  /** Suggested prompt from pre-pass */
  SuggestedPrompt,
  /** QuickChat hook state */
  QuickChatState,
  /** t3.chat integration configuration */
  T3ChatIntegrationConfig,
} from "./QuickChat";

// ============================================================================
// IDE Integration
// ============================================================================

/**
 * Opens a source file in the preferred IDE.
 */
export { openInIDE } from "./ide";

/**
 * Builds a URL for opening a file in an IDE.
 */
export { buildIDEUrl } from "./ide";

/**
 * Checks if an IDE protocol is supported.
 */
export { isIDEProtocolSupported } from "./ide";

/**
 * Detects the user's preferred IDE from environment.
 */
export { detectPreferredIDE } from "./ide";

/**
 * Extracts source location from element's data attributes.
 */
export { getSourceLocationFromElement } from "./ide";

/**
 * Finds source location by searching ancestor elements.
 */
export { findSourceLocationInAncestors } from "./ide";

/**
 * Creates a configured IDE opener function.
 */
export { createIDEOpener } from "./ide";

/**
 * Formats source location as a readable string.
 */
export { formatSourceLocation } from "./ide";

export type {
  /** Supported IDE protocols */
  IDEProtocol,
  /** IDE configuration options */
  IDEConfig,
  /** Source file location information */
  SourceLocation,
} from "./ide";

// ============================================================================
// Inspect Utilities (Core Re-exports)
// ============================================================================

export {
  /** Gets computed styles for an element */
  getComputedStyles,
  /** Gets accessibility information for an element */
  getAccessibilityInfo,
  /** Gets box model information for an element */
  getBoxModelInfo,
  /** Gets element attributes */
  getAttributes,
  /** Gets comprehensive element inspect information */
  getElementInspectInfo,
  /** Formats styles as CSS string */
  formatStylesAsCSS,
  /** Formats box model as readable string */
  formatBoxModel,
  /** Curated list of important CSS properties */
  CURATED_STYLE_PROPERTIES,
  /** All curated CSS properties */
  ALL_CURATED_PROPERTIES,
} from "@ewjdev/anyclick-core";

export type {
  /** Computed styles information */
  ComputedStylesInfo,
  /** Accessibility information */
  AccessibilityInfo,
  /** Box model information */
  BoxModelInfo,
  /** Element inspection information */
  ElementInspectInfo,
} from "@ewjdev/anyclick-core";
