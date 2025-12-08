import type { ImageDetectionResult, STORAGE_KEYS } from "./types";

/**
 * Detect if an element is or contains an image
 * @param element - The element to check
 * @returns ImageDetectionResult with details about the image
 */
export function detectImage(element: Element): ImageDetectionResult {
  // Check if element itself is an image
  if (element.tagName === "IMG") {
    const img = element as HTMLImageElement;
    return {
      isImage: true,
      imageType: "img",
      src: img.src || img.currentSrc,
      element,
    };
  }

  // Check if element is a picture element
  if (element.tagName === "PICTURE") {
    const img = element.querySelector("img");
    return {
      isImage: true,
      imageType: "picture",
      src: img?.src || img?.currentSrc,
      element,
    };
  }

  // Check if element is an SVG
  if (element.tagName === "SVG" || element.tagName === "svg") {
    return {
      isImage: true,
      imageType: "svg",
      element,
    };
  }

  // Check if element is a canvas
  if (element.tagName === "CANVAS") {
    return {
      isImage: true,
      imageType: "canvas",
      element,
    };
  }

  // Check for video poster
  if (element.tagName === "VIDEO") {
    const video = element as HTMLVideoElement;
    if (video.poster) {
      return {
        isImage: true,
        imageType: "video-poster",
        src: video.poster,
        element,
      };
    }
  }

  // Check for CSS background image
  if (typeof window !== "undefined") {
    const computedStyle = window.getComputedStyle(element);
    const backgroundImage = computedStyle.backgroundImage;

    if (backgroundImage && backgroundImage !== "none") {
      // Extract URL from background-image
      const urlMatch = backgroundImage.match(/url\(["']?(.+?)["']?\)/);
      if (urlMatch) {
        return {
          isImage: true,
          imageType: "background",
          src: urlMatch[1],
          element,
        };
      }
    }
  }

  // Check if any child is an image
  const imgChild = element.querySelector("img");
  if (imgChild) {
    return {
      isImage: true,
      imageType: "img",
      src: imgChild.src || imgChild.currentSrc,
      element: imgChild,
    };
  }

  return { isImage: false };
}

/**
 * Check if an element is an image element
 * @param element - The element to check
 * @returns true if the element is or contains an image
 */
export function isImageElement(element: Element): boolean {
  return detectImage(element).isImage;
}

/**
 * Convert a data URL to a File object
 * @param dataUrl - The data URL to convert
 * @param filename - The filename to use
 * @returns File object
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Convert a data URL to a Blob
 * @param dataUrl - The data URL to convert
 * @returns Blob object
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Fetch an image from a URL and convert to a File
 * @param url - The image URL
 * @param filename - The filename to use
 * @returns Promise resolving to File object
 */
export async function urlToFile(url: string, filename: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  const extension = blob.type.split("/")[1] || "png";
  const finalFilename = filename.includes(".")
    ? filename
    : `${filename}.${extension}`;

  return new File([blob], finalFilename, { type: blob.type });
}

/**
 * Get stored API key from localStorage
 * @returns The stored API key or null
 */
export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem("anyclick-uploadthing-api-key");
  } catch {
    return null;
  }
}

/**
 * Store API key in localStorage
 * @param apiKey - The API key to store
 */
export function storeApiKey(apiKey: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("anyclick-uploadthing-api-key", apiKey);
  } catch {
    console.warn("[anyclick-uploadthing] Failed to store API key in localStorage");
  }
}

/**
 * Clear stored API key from localStorage
 */
export function clearStoredApiKey(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("anyclick-uploadthing-api-key");
  } catch {
    // Ignore errors
  }
}

/**
 * Generate a unique filename for screenshots
 * @param type - The type of screenshot
 * @returns Unique filename
 */
export function generateScreenshotFilename(
  type: "element" | "container" | "viewport" = "element"
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `screenshot-${type}-${timestamp}.png`;
}

/**
 * Extract the file extension from a URL or filename
 * @param urlOrFilename - The URL or filename
 * @returns The file extension (without dot) or 'png' as default
 */
export function getFileExtension(urlOrFilename: string): string {
  const match = urlOrFilename.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : "png";
}
