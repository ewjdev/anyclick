/**
 * Anyclick Browser Extension
 *
 * Provides right-click context menu integration with t3.chat and UploadThing
 * for any webpage.
 *
 * @packageDocumentation
 * @module @ewjdev/anyclick-extension
 * @since 1.0.0
 */

// Types
export type {
  ExtensionConfig,
  ExtensionMessage,
  ExtensionResponse,
  ExtensionSettings,
  CapturePayload,
  CaptureStatus,
  ElementContext,
  PageContext,
  ActionMetadata,
  ScreenshotData,
  QueuedPayload,
  MessageType,
} from "./types";

export {
  CONTEXT_MENU_IDS,
  DEFAULT_EXTENSION_CONFIG,
  STORAGE_KEYS,
  DEFAULTS,
  PERF_LIMITS,
  createMessage,
} from "./types";

// Content script adapters
export {
  hasSelection,
  sendSelectionToT3Chat,
  sendToT3Chat,
  type T3ChatExtensionConfig,
} from "./content/adapters/t3chat";

export {
  getImageSource,
  isImageElement,
  uploadDataUrl,
  uploadFile,
  uploadImageFromUrl,
  type UploadResult,
  type UploadThingExtensionConfig,
} from "./content/adapters/uploadthing";
