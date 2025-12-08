import type {
  ImageDetectionResult,
  ScreenshotUploadData,
  UploadResult,
  UploadThingAdapterOptions,
} from "./types";
import {
  dataUrlToFile,
  detectImage,
  generateScreenshotFilename,
  getStoredApiKey,
  storeApiKey,
  urlToFile,
} from "./utils";

/**
 * UploadThing Browser Adapter
 *
 * Client-side adapter for uploading images and screenshots to UploadThing.
 * Supports both direct uploads (with API key) and proxied uploads through your backend.
 *
 * @example
 * ```ts
 * import { UploadThingAdapter } from "@ewjdev/anyclick-uploadthing";
 *
 * // Using backend endpoint (recommended)
 * const adapter = new UploadThingAdapter({
 *   endpoint: "/api/uploadthing",
 * });
 *
 * // Upload a screenshot
 * const result = await adapter.uploadScreenshot({
 *   dataUrl: "data:image/png;base64,...",
 *   name: "my-screenshot",
 * });
 * ```
 */
export class UploadThingAdapter {
  private endpoint?: string;
  private apiKey?: string;
  private persistApiKey: boolean;
  private headers: Record<string, string>;
  private timeout: number;
  private onUploadStart?: (file: File) => void;
  private onUploadProgress?: (progress: number) => void;
  private onUploadComplete?: (result: UploadResult) => void;
  private onUploadError?: (error: Error) => void;

  constructor(options: UploadThingAdapterOptions = {}) {
    this.endpoint = options.endpoint;
    this.apiKey = options.apiKey;
    this.persistApiKey = options.persistApiKey ?? false;
    this.headers = options.headers ?? {};
    this.timeout = options.timeout ?? 30000;
    this.onUploadStart = options.onUploadStart;
    this.onUploadProgress = options.onUploadProgress;
    this.onUploadComplete = options.onUploadComplete;
    this.onUploadError = options.onUploadError;

    // Load stored API key if persistence is enabled
    if (this.persistApiKey && !this.apiKey) {
      this.apiKey = getStoredApiKey() ?? undefined;
    }
  }

  /**
   * Set the API key (and optionally persist it)
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    if (this.persistApiKey) {
      storeApiKey(apiKey);
    }
  }

  /**
   * Get the current API key
   */
  getApiKey(): string | undefined {
    return this.apiKey;
  }

  /**
   * Check if the adapter is configured (has endpoint or API key)
   */
  isConfigured(): boolean {
    return Boolean(this.endpoint || this.apiKey);
  }

  /**
   * Upload a file to UploadThing
   * @param file - The file to upload
   * @returns Upload result
   */
  async uploadFile(file: File): Promise<UploadResult> {
    this.onUploadStart?.(file);

    try {
      if (this.endpoint) {
        return await this.uploadViaEndpoint(file);
      } else if (this.apiKey) {
        return await this.uploadDirect(file);
      } else {
        throw new Error(
          "UploadThing adapter not configured. Set either endpoint or apiKey.",
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.onUploadError?.(err);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Upload via backend endpoint
   */
  private async uploadViaEndpoint(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.endpoint!, {
        method: "POST",
        headers: this.headers,
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      const uploadResult: UploadResult = {
        success: true,
        url: result.url,
        key: result.key,
        name: result.name || file.name,
        size: result.size || file.size,
      };

      this.onUploadComplete?.(uploadResult);
      return uploadResult;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Upload directly to UploadThing (client-side)
   * Note: This is less secure - prefer using endpoint for production
   */
  private async uploadDirect(file: File): Promise<UploadResult> {
    // For direct uploads, we need to use the UploadThing presigned URL flow
    // This is a simplified implementation - the full implementation would use
    // the UploadThing client SDK

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Step 1: Get presigned URL from UploadThing
      const presignedResponse = await fetch(
        "https://uploadthing.com/api/uploadFiles",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-uploadthing-api-key": this.apiKey!,
          },
          body: JSON.stringify({
            files: [
              {
                name: file.name,
                size: file.size,
                type: file.type,
              },
            ],
            acl: "public-read",
          }),
          signal: controller.signal,
        },
      );

      if (!presignedResponse.ok) {
        throw new Error(
          `Failed to get presigned URL: ${presignedResponse.status}`,
        );
      }

      const presignedData = await presignedResponse.json();
      const uploadData = presignedData.data?.[0];

      if (!uploadData?.presignedUrls?.url) {
        throw new Error("Invalid presigned URL response");
      }

      // Step 2: Upload file to presigned URL
      const uploadResponse = await fetch(uploadData.presignedUrls.url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
        signal: controller.signal,
      });

      if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.status}`);
      }

      const uploadResult: UploadResult = {
        success: true,
        url: uploadData.fileUrl,
        key: uploadData.key,
        name: file.name,
        size: file.size,
      };

      this.onUploadComplete?.(uploadResult);
      return uploadResult;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Upload a screenshot from a data URL
   * @param screenshot - Screenshot data
   * @returns Upload result
   */
  async uploadScreenshot(
    screenshot: ScreenshotUploadData,
  ): Promise<UploadResult> {
    const filename =
      screenshot.name || generateScreenshotFilename(screenshot.type);
    const file = dataUrlToFile(screenshot.dataUrl, filename);
    return this.uploadFile(file);
  }

  /**
   * Upload an image from a URL
   * @param imageUrl - The image URL
   * @param filename - Optional filename
   * @returns Upload result
   */
  async uploadFromUrl(
    imageUrl: string,
    filename?: string,
  ): Promise<UploadResult> {
    try {
      const finalFilename = filename || `image-${Date.now()}`;
      const file = await urlToFile(imageUrl, finalFilename);
      return this.uploadFile(file);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.onUploadError?.(err);
      return {
        success: false,
        error: `Failed to fetch image: ${err.message}`,
      };
    }
  }

  /**
   * Upload an image from an element
   * @param element - The element containing the image
   * @returns Upload result
   */
  async uploadFromElement(element: Element): Promise<UploadResult> {
    const detection = detectImage(element);

    if (!detection.isImage) {
      return {
        success: false,
        error: "Element is not an image",
      };
    }

    // Handle canvas elements
    if (detection.imageType === "canvas") {
      const canvas = detection.element as HTMLCanvasElement;
      const dataUrl = canvas.toDataURL("image/png");
      return this.uploadScreenshot({ dataUrl, name: "canvas-capture" });
    }

    // Handle SVG elements
    if (detection.imageType === "svg") {
      const svg = detection.element as SVGElement;
      const svgString = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const file = new File([blob], `svg-${Date.now()}.svg`, {
        type: "image/svg+xml",
      });
      return this.uploadFile(file);
    }

    // Handle URL-based images
    if (detection.src) {
      return this.uploadFromUrl(detection.src);
    }

    return {
      success: false,
      error: "Could not extract image from element",
    };
  }

  /**
   * Detect if an element contains an uploadable image
   */
  detectImage(element: Element): ImageDetectionResult {
    return detectImage(element);
  }
}

/**
 * Create an UploadThingAdapter instance
 * @param options - Configuration options
 * @returns Configured UploadThingAdapter
 */
export function createUploadThingAdapter(
  options: UploadThingAdapterOptions = {},
): UploadThingAdapter {
  return new UploadThingAdapter(options);
}
