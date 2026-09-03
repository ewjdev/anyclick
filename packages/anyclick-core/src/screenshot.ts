/**
 * Screenshot capture utilities using html-to-image
 * Supports element, container, and viewport captures with sensitive element masking
 */

import * as htmlToImage from "html-to-image";
import type {
  ScreenshotCapture,
  ScreenshotData,
  ScreenshotConfig,
  ScreenshotCaptureMode,
  ScreenshotResult,
  ScreenshotError,
} from "./types";
import { DEFAULT_SENSITIVE_SELECTORS } from "./types";
import {
  ELEMENT_CANNOT_BE_CAPTURED_ERROR,
  SCREENSHOT_TIMEOUT_ERROR,
} from "./errors";

/**
 * Default screenshot configuration
 */
export const DEFAULT_SCREENSHOT_CONFIG: Required<ScreenshotConfig> = {
  enabled: true,
  quality: 0.7,
  maxSizeBytes: 500 * 1024, // 500KB
  padding: 20,
  sensitiveSelectors: DEFAULT_SENSITIVE_SELECTORS,
  maskColor: "#1a1a1a",
  showPreview: true,
};

/**
 * Parse a CSS color string and determine if it's transparent or semi-transparent.
 * Returns the color if it's opaque enough to use as a background, otherwise null.
 */
function parseOpaqueColor(colorStr: string): string | null {
  if (!colorStr || colorStr === "transparent") {
    return null;
  }

  // Handle rgba/rgb colors
  const rgbaMatch = colorStr.match(
    /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i,
  );
  if (rgbaMatch) {
    const alpha = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    // Consider colors with alpha >= 0.5 as "opaque enough" to use
    if (alpha >= 0.5) {
      const r = parseInt(rgbaMatch[1], 10);
      const g = parseInt(rgbaMatch[2], 10);
      const b = parseInt(rgbaMatch[3], 10);
      // Return as rgb (html-to-image handles rgb well)
      return `rgb(${r}, ${g}, ${b})`;
    }
    return null;
  }

  // Handle hex colors (always opaque)
  if (colorStr.startsWith("#")) {
    return colorStr;
  }

  // Handle named colors (always opaque)
  if (/^[a-z]+$/i.test(colorStr) && colorStr !== "transparent") {
    return colorStr;
  }

  return null;
}

/**
 * Check if an element has a background image (including gradients).
 * Returns true if the element has a non-none background-image.
 */
function hasBackgroundImage(style: CSSStyleDeclaration): boolean {
  const bgImage = style.backgroundImage;
  return bgImage !== "none" && bgImage !== "";
}

/**
 * Resolve the effective background color by walking up the ancestor tree.
 * This finds the first ancestor (or the element itself) with a solid background color,
 * or falls back to white if no background is found.
 *
 * @param element - The element to start from
 * @returns The resolved background color string
 */
function resolveEffectiveBackground(element: HTMLElement): string {
  let current: HTMLElement | null = element;
  const MAX_ANCESTORS = 50; // Prevent infinite loops
  let depth = 0;

  while (current && depth < MAX_ANCESTORS) {
    const style = window.getComputedStyle(current);
    const bgColor = style.backgroundColor;

    // Check for a solid (opaque) background color
    const opaqueColor = parseOpaqueColor(bgColor);
    if (opaqueColor) {
      return opaqueColor;
    }

    // If element has a background-image (gradient), we can't easily extract a color,
    // but we should still continue looking for a solid color behind it
    // unless the background-image covers the whole element
    if (hasBackgroundImage(style)) {
      // Check if there's also a solid fallback color
      // In CSS, background-color renders behind background-image
      // So we continue looking up the tree for a solid color
    }

    // Move to parent
    current = current.parentElement;
    depth++;
  }

  // Check document body as final fallback
  if (document.body) {
    const bodyStyle = window.getComputedStyle(document.body);
    const bodyColor = parseOpaqueColor(bodyStyle.backgroundColor);
    if (bodyColor) {
      return bodyColor;
    }
  }

  // Check html element
  if (document.documentElement) {
    const htmlStyle = window.getComputedStyle(document.documentElement);
    const htmlColor = parseOpaqueColor(htmlStyle.backgroundColor);
    if (htmlColor) {
      return htmlColor;
    }
  }

  // Ultimate fallback: white (matches browser default)
  return "#ffffff";
}

/**
 * Check if screenshot capture is supported in the current browser
 */
export function isScreenshotSupported(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  // Check for canvas support
  const canvas = document.createElement("canvas");
  return !!(canvas.getContext && canvas.getContext("2d"));
}

/**
 * Filter function for html-to-image to mask sensitive elements
 */
function createFilter(
  sensitiveSelectors: string[],
): (node: HTMLElement) => boolean {
  return (node: HTMLElement) => {
    // We don't filter out nodes here, instead we'll rely on the
    // maskSensitiveElements function to style them before capture
    // or use the filter to exclude specific nodes if needed
    return true;
  };
}

/**
 * Create a style element to mask sensitive elements
 * This is injected into the cloned document by html-to-image
 */
function createMaskStyle(
  selectors: string[],
  maskColor: string,
): HTMLStyleElement {
  const style = document.createElement("style");
  const rules = selectors
    .map(
      (selector) => `
    ${selector} {
      color: transparent !important;
      background-image: none !important;
      background-color: ${maskColor} !important;
      border-color: ${maskColor} !important;
      text-shadow: none !important;
      box-shadow: none !important;
    }
    ${selector}::placeholder {
      color: transparent !important;
    }
    ${selector} * {
      visibility: hidden !important;
    }
  `,
    )
    .join("\n");

  style.textContent = rules;
  return style;
}

/**
 * Default timeout for screenshot capture (5 seconds)
 */
const CAPTURE_TIMEOUT_MS = 5000;

/**
 * Wrap a screenshot capture promise with a timeout
 * Also validates that the result is not an empty/minimal data URL
 */
function withTimeout(
  promise: Promise<string>,
  ms: number,
  errorMessage: string,
): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return Promise.race([
    promise.then((result) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Check if the result is an empty or minimal data URL (capture failed)
      if (!result || result.length <= "data:,".length) {
        throw new Error(ELEMENT_CANNOT_BE_CAPTURED_ERROR.message);
      }
      return result;
    }),
    new Promise<string>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(errorMessage));
      }, ms);
    }),
  ]);
}

/**
 * Capture a specific DOM element or viewport
 */
async function captureNode(
  node: HTMLElement,
  config: Required<ScreenshotConfig>,
  options: {
    width?: number;
    height?: number;
    style?: Partial<CSSStyleDeclaration>;
    isViewport?: boolean;
  } = {},
): Promise<ScreenshotResult> {
  try {
    // Resolve the effective background color from ancestor elements
    // For viewport captures, use the body's background; for element captures,
    // walk up from the element to find the first solid background
    const backgroundColor = options.isViewport
      ? resolveEffectiveBackground(document.body)
      : resolveEffectiveBackground(node);

    // Prepare options for html-to-image
    const imageOptions: any = {
      quality: config.quality,
      backgroundColor,
      width: options.width,
      height: options.height,
      style: options.style,
      filter: createFilter(config.sensitiveSelectors),
      skipAutoScale: true,
      // Inject masking styles
      fontEmbedCSS: "", // Optional: reduce size by not embedding all fonts if not needed
      // Add timeout for individual fetch operations (fonts, images, etc.)
      fetchRequestInit: {
        signal: AbortSignal.timeout(3000),
      },
    };

    // We need to manually handle masking because the filter option just excludes nodes
    // We want to show them as masked blocks

    // Create data URL with timeout to prevent hanging on problematic CSS (e.g., background-clip: text)
    let dataUrl = await withTimeout(
      htmlToImage.toJpeg(node, imageOptions),
      CAPTURE_TIMEOUT_MS,
      SCREENSHOT_TIMEOUT_ERROR.message,
    );

    // Calculate size
    let sizeBytes = Math.ceil(
      (dataUrl.length - "data:image/jpeg;base64,".length) * 0.75,
    );

    // If too large, try reducing quality (with timeout for each attempt)
    let quality = config.quality;
    while (sizeBytes > config.maxSizeBytes && quality > 0.1) {
      quality -= 0.1;
      imageOptions.quality = quality;
      dataUrl = await withTimeout(
        htmlToImage.toJpeg(node, imageOptions),
        CAPTURE_TIMEOUT_MS,
        SCREENSHOT_TIMEOUT_ERROR.message,
      );
      sizeBytes = Math.ceil(
        (dataUrl.length - "data:image/jpeg;base64,".length) * 0.75,
      );
    }

    // Get actual dimensions
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    return {
      capture: {
        dataUrl,
        width: img.width,
        height: img.height,
        sizeBytes,
      },
    };
  } catch (error) {
    console.warn("Screenshot capture failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorName =
      errorMessage === ELEMENT_CANNOT_BE_CAPTURED_ERROR.message
        ? ELEMENT_CANNOT_BE_CAPTURED_ERROR.name
        : errorMessage === SCREENSHOT_TIMEOUT_ERROR.message
          ? SCREENSHOT_TIMEOUT_ERROR.name
          : "UNKNOWN_ERROR";
    return {
      error: {
        message: errorMessage,
        name: errorName,
      },
    };
  }
}

/**
 * Capture a single screenshot
 */
export async function captureScreenshot(
  targetElement: Element,
  containerElement: Element | null,
  mode: ScreenshotCaptureMode,
  config?: Partial<ScreenshotConfig>,
): Promise<ScreenshotResult> {
  if (!isScreenshotSupported()) {
    return {
      error: {
        message: "Screenshots not supported in this browser",
        name: "SCREENSHOT_NOT_SUPPORTED_ERROR",
      },
    };
  }

  const mergedConfig: Required<ScreenshotConfig> = {
    ...DEFAULT_SCREENSHOT_CONFIG,
    ...config,
  };

  if (!mergedConfig.enabled) {
    return {};
  }

  try {
    // Temporarily inject masking styles
    const maskStyle = createMaskStyle(
      mergedConfig.sensitiveSelectors,
      mergedConfig.maskColor,
    );
    document.head.appendChild(maskStyle);

    let result: ScreenshotResult;

    if (mode === "viewport") {
      // Capture entire body
      result = await captureNode(document.body, mergedConfig, {
        width: window.innerWidth,
        height: window.innerHeight,
        style: {
          transform: "none", // Reset transform to avoid capturing scaled down versions
          height: "100vh",
          overflow: "hidden",
        },
        isViewport: true,
      });
    } else {
      const elementToCapture =
        mode === "container" && containerElement
          ? containerElement
          : targetElement;

      if (!(elementToCapture instanceof HTMLElement)) {
        document.head.removeChild(maskStyle);
        return {
          error: {
            message: "Element is not an HTML element",
            name: "INVALID_ELEMENT_ERROR",
          },
        };
      }

      // For element/container capture, we might need to handle padding manually
      // html-to-image captures the node as is.
      // Let's capture the node directly for now to ensure accuracy.

      result = await captureNode(elementToCapture, mergedConfig);
    }

    // Clean up
    document.head.removeChild(maskStyle);
    return result;
  } catch (error) {
    console.warn("Screenshot capture failed:", error);
    return {
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        name: "CAPTURE_ERROR",
      },
    };
  }
}

/**
 * Capture all three screenshot modes
 */
export async function captureAllScreenshots(
  targetElement: Element,
  containerElement: Element | null,
  config?: Partial<ScreenshotConfig>,
): Promise<ScreenshotData | null> {
  if (!isScreenshotSupported()) {
    return {
      errors: {
        element: {
          message: "Screenshots not supported in this browser",
          name: "SCREENSHOT_NOT_SUPPORTED_ERROR",
        },
        viewport: {
          message: "Screenshots not supported in this browser",
          name: "SCREENSHOT_NOT_SUPPORTED_ERROR",
        },
      },
      capturedAt: new Date().toISOString(),
    };
  }

  const mergedConfig: Required<ScreenshotConfig> = {
    ...DEFAULT_SCREENSHOT_CONFIG,
    ...config,
  };

  if (!mergedConfig.enabled) {
    return null;
  }

  // Capture strictly sequentially to avoid race conditions with the masking styles
  // and to reduce memory pressure

  const elementResult = await captureScreenshot(
    targetElement,
    containerElement,
    "element",
    mergedConfig,
  );

  const containerResult = containerElement
    ? await captureScreenshot(
        targetElement,
        containerElement,
        "container",
        mergedConfig,
      )
    : null;

  const viewportResult = await captureScreenshot(
    targetElement,
    containerElement,
    "viewport",
    mergedConfig,
  );

  // Collect errors
  const errors: ScreenshotData["errors"] = {};
  if (elementResult.error) errors.element = elementResult.error;
  if (containerResult?.error) errors.container = containerResult.error;
  if (viewportResult.error) errors.viewport = viewportResult.error;

  return {
    element: elementResult.capture,
    container: containerResult?.capture,
    viewport: viewportResult.capture,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Estimate the total size of screenshot data
 */
export function estimateTotalSize(screenshots: ScreenshotData): number {
  let total = 0;
  if (screenshots.element) total += screenshots.element.sizeBytes;
  if (screenshots.container) total += screenshots.container.sizeBytes;
  if (screenshots.viewport) total += screenshots.viewport.sizeBytes;
  return total;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
