/**
 * @ewjdev/anyclick-extension
 *
 * Chrome MV3 extension for high-performance DOM capture, screenshots, and metadata.
 * This file exports types for programmatic use by consuming applications.
 */

// Export all types for consumers who want to work with extension payloads
export type {
  ExtensionSettings,
  CaptureStatus,
  ActionMetadata,
  BoundingRect,
  AncestorInfo,
  ElementContext,
  PageContext,
  ScreenshotData,
  CapturePayload,
  MessageType,
  BaseMessage,
  ExtensionMessage,
} from "./types";

// Export constants
export { STORAGE_KEYS, DEFAULTS, PERF_LIMITS } from "./types";


