// Browser-side adapter
export {
  UploadThingAdapter,
  createUploadThingAdapter,
} from "./uploadthingAdapter";

// Utilities
export {
  clearStoredApiKey,
  dataUrlToBlob,
  dataUrlToFile,
  detectImage,
  generateScreenshotFilename,
  getFileExtension,
  getStoredApiKey,
  isImageElement,
  storeApiKey,
  urlToFile,
} from "./utils";

// Types
export type {
  ImageDetectionResult,
  ScreenshotUploadData,
  UploadResult,
  UploadThingAdapterOptions,
  UploadThingServerOptions,
} from "./types";

export { STORAGE_KEYS } from "./types";
