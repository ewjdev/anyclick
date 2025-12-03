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
} from './types';

export { DEFAULT_SENSITIVE_SELECTORS } from './types';

// DOM utilities
export {
  getUniqueSelector,
  getAncestors,
  getDataAttributes,
  truncate,
  stripAttributesFromHTML,
  buildElementContext,
} from './dom';

// Payload building
export { buildPageContext, buildFeedbackPayload } from './payload';

// Screenshot utilities
export {
  DEFAULT_SCREENSHOT_CONFIG,
  isScreenshotSupported,
  captureScreenshot,
  captureAllScreenshots,
  estimateTotalSize,
  formatBytes,
} from './screenshot';

// Client
export { FeedbackClient, createFeedbackClient } from './client';

