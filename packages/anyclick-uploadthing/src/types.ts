/**
 * Configuration options for UploadThing browser adapter
 */
export interface UploadThingAdapterOptions {
  /**
   * API endpoint for uploading via your backend (recommended for production)
   * When set, uploads go through your server instead of directly to UploadThing
   */
  endpoint?: string;

  /**
   * UploadThing API key for direct client uploads (stored in localStorage)
   * Only use this for development/testing - server-side is more secure
   */
  apiKey?: string;

  /**
   * Whether to store the API key in localStorage
   * @default false
   */
  persistApiKey?: boolean;

  /**
   * Custom headers to send with upload requests
   */
  headers?: Record<string, string>;

  /**
   * Timeout for upload requests in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Callback when upload starts
   */
  onUploadStart?: (file: File) => void;

  /**
   * Callback for upload progress
   */
  onUploadProgress?: (progress: number) => void;

  /**
   * Callback when upload completes
   */
  onUploadComplete?: (result: UploadResult) => void;

  /**
   * Callback when upload fails
   */
  onUploadError?: (error: Error) => void;
}

/**
 * Configuration options for UploadThing server adapter
 * Uses the official UTApi from uploadthing/server
 * @see https://docs.uploadthing.com/api-reference/ut-api
 */
export interface UploadThingServerOptions {
  /**
   * UploadThing API token (required)
   * Get this from https://uploadthing.com/dashboard
   */
  token: string;
}

/**
 * Result from an upload operation
 */
export interface UploadResult {
  /** Whether the upload was successful */
  success: boolean;
  /** The URL of the uploaded file */
  url?: string;
  /** The file key/ID from UploadThing */
  key?: string;
  /** The file name */
  name?: string;
  /** The file size in bytes */
  size?: number;
  /** Error message if upload failed */
  error?: string;
}

/**
 * Image detection result
 */
export interface ImageDetectionResult {
  /** Whether the element is an image or contains an image */
  isImage: boolean;
  /** The type of image detected */
  imageType?:
    | "img"
    | "picture"
    | "svg"
    | "canvas"
    | "background"
    | "video-poster";
  /** The image source URL if available */
  src?: string;
  /** The element containing the image */
  element?: Element;
}

/**
 * Screenshot data that can be uploaded
 */
export interface ScreenshotUploadData {
  /** Data URL of the screenshot (base64 encoded) */
  dataUrl: string;
  /** Name for the file */
  name?: string;
  /** Type of screenshot (element, container, viewport) */
  type?: "element" | "container" | "viewport";
}

/**
 * Storage keys used for persisting configuration
 */
export const STORAGE_KEYS = {
  API_KEY: "anyclick-uploadthing-api-key",
} as const;
