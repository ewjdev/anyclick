/**
 * UploadThing adapter wrapper for extension context.
 *
 * Provides a thin wrapper around upload functionality that works
 * in the extension content script environment.
 *
 * @module content/adapters/uploadthing
 * @since 1.0.0
 */

export interface UploadThingExtensionConfig {
  endpoint?: string;
  apiKey?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a file to UploadThing via the configured endpoint
 */
export async function uploadFile(
  file: File,
  config: UploadThingExtensionConfig,
): Promise<UploadResult> {
  if (!config.endpoint) {
    return { success: false, error: "No upload endpoint configured" };
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (config.apiKey) {
      headers["x-uploadthing-api-key"] = config.apiKey;
    }

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, url: result.url };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload an image from a URL
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  config: UploadThingExtensionConfig,
): Promise<UploadResult> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    const extension = blob.type.split("/")[1] || "png";
    const filename = `image-${Date.now()}.${extension}`;
    const file = new File([blob], filename, { type: blob.type });

    return uploadFile(file, config);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch image",
    };
  }
}

/**
 * Upload a data URL (e.g., from canvas)
 */
export async function uploadDataUrl(
  dataUrl: string,
  filename: string,
  config: UploadThingExtensionConfig,
): Promise<UploadResult> {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });

    return uploadFile(file, config);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to process data URL",
    };
  }
}

/**
 * Detect if an element is an image
 */
export function isImageElement(element: Element): boolean {
  if (element.tagName === "IMG") return true;
  if (element.tagName === "PICTURE") return true;
  if (element.tagName === "CANVAS") return true;
  if (element.tagName === "SVG" || element.tagName === "svg") return true;

  // Check for background image
  if (typeof window !== "undefined") {
    const style = window.getComputedStyle(element);
    if (style.backgroundImage && style.backgroundImage !== "none") {
      return true;
    }
  }

  return false;
}

/**
 * Get image source from an element
 */
export function getImageSource(element: Element): string | null {
  if (element.tagName === "IMG") {
    const img = element as HTMLImageElement;
    return img.src || img.currentSrc || null;
  }

  if (element.tagName === "PICTURE") {
    const img = element.querySelector("img");
    return img?.src || img?.currentSrc || null;
  }

  if (element.tagName === "CANVAS") {
    try {
      return (element as HTMLCanvasElement).toDataURL("image/png");
    } catch {
      return null;
    }
  }

  // Check for background image
  if (typeof window !== "undefined") {
    const style = window.getComputedStyle(element);
    const bgImage = style.backgroundImage;
    if (bgImage && bgImage !== "none") {
      const match = bgImage.match(/url\(["']?(.+?)["']?\)/);
      return match ? match[1] : null;
    }
  }

  return null;
}
