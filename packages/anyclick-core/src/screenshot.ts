/**
 * Screenshot capture utilities using html-to-image
 *
 * Strategy: the viewport is rendered once, honoring the current scroll
 * position, and the element and container captures are cropped out of that
 * render with padding. Every capture therefore keeps the real page background
 * behind it (solid colors, gradients, images, translucent layers) instead of
 * being composited onto a hardcoded white backdrop.
 *
 * Nodes that cannot be cropped from the viewport render (the node extends
 * outside the viewport, sits inside a scrolled ancestor, or the viewport render
 * failed) fall back to a standalone render whose backdrop is the composited
 * background color of the node's ancestors.
 *
 * Supports element, container, and viewport captures with sensitive element
 * masking.
 */
import * as htmlToImage from "html-to-image";
import {
  ELEMENT_CANNOT_BE_CAPTURED_ERROR,
  SCREENSHOT_TIMEOUT_ERROR,
} from "./errors";
import type {
  ScreenshotCapture,
  ScreenshotCaptureMode,
  ScreenshotConfig,
  ScreenshotData,
  ScreenshotError,
  ScreenshotResult,
} from "./types";
import { DEFAULT_SENSITIVE_SELECTORS } from "./types";

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
 * Attribute that marks Anyclick's own UI (context menu, quick chat, preview).
 * Elements carrying it are excluded from every capture so the tooling never
 * appears in the screenshots it produces.
 */
export const ANYCLICK_UI_ATTRIBUTE = "data-anyclick-ui";

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
 * Filter function for html-to-image: drops Anyclick's own UI from the clone.
 * html-to-image calls this for child nodes of every kind, including text
 * nodes, so guard before touching Element APIs.
 */
function excludeAnyclickUi(node: HTMLElement): boolean {
  return !(
    typeof node.hasAttribute === "function" &&
    node.hasAttribute(ANYCLICK_UI_ATTRIBUTE)
  );
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
 * Wrap a capture promise with a timeout
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return Promise.race([
    promise.then((result) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      return result;
    }),
    new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(errorMessage));
      }, ms);
    }),
  ]);
}

/**
 * Map a thrown error to the ScreenshotError shape
 */
function toScreenshotError(error: unknown): ScreenshotError {
  const message = error instanceof Error ? error.message : "Unknown error";
  const name =
    message === ELEMENT_CANNOT_BE_CAPTURED_ERROR.message
      ? ELEMENT_CANNOT_BE_CAPTURED_ERROR.name
      : message === SCREENSHOT_TIMEOUT_ERROR.message
        ? SCREENSHOT_TIMEOUT_ERROR.name
        : "UNKNOWN_ERROR";
  return { message, name };
}

// ---------------------------------------------------------------------------
// Backdrop color resolution
// ---------------------------------------------------------------------------

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Parse a computed CSS color (rgb()/rgba() form) into channels.
 * Returns null for "transparent" or anything unparseable.
 */
function parseColor(value: string): Rgba | null {
  const match = /rgba?\(\s*([^)]+)\)/.exec(value);
  if (!match) return null;
  const parts = match[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
}

/**
 * Source-over compositing of `top` onto `bottom`
 */
function compositeOver(top: Rgba, bottom: Rgba): Rgba {
  const a = top.a + bottom.a * (1 - top.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (channel: "r" | "g" | "b") =>
    (top[channel] * top.a + bottom[channel] * bottom.a * (1 - top.a)) / a;
  return { r: mix("r"), g: mix("g"), b: mix("b"), a };
}

function toCssColor(color: Rgba): string {
  const round = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `rgb(${round(color.r)}, ${round(color.g)}, ${round(color.b)})`;
}

/**
 * Chrome paints the canvas #121212 when the root opts into a dark color scheme
 * and nothing above the element sets a background.
 */
function defaultCanvasColor(): Rgba {
  const scheme = getComputedStyle(document.documentElement).colorScheme || "";
  const dark = /dark/.test(scheme) && !/light/.test(scheme);
  return dark
    ? { r: 18, g: 18, b: 18, a: 1 }
    : { r: 255, g: 255, b: 255, a: 1 };
}

/**
 * Resolve the effective backdrop color behind an element by compositing the
 * background colors of its ancestors, from the nearest opaque one down.
 *
 * Used as the backdrop when an element must be rendered on its own. It is
 * exact for solid and translucent color stacks and an approximation when a
 * gradient or background image sits above the element; those cases are
 * normally handled by cropping from the viewport render instead.
 *
 * @param element - The element whose surroundings are being resolved
 * @returns An opaque CSS color string
 *
 * @since 1.1.0
 */
export function resolveBackdropColor(element: Element): string {
  const layers: Rgba[] = [];
  let current = element.parentElement;
  while (current) {
    const color = parseColor(getComputedStyle(current).backgroundColor);
    if (color && color.a > 0) {
      layers.push(color);
      if (color.a >= 0.999) break;
    }
    current = current.parentElement;
  }

  let result = defaultCanvasColor();
  for (let i = layers.length - 1; i >= 0; i--) {
    result = compositeOver(layers[i], result);
  }
  return toCssColor(result);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

interface ViewportRender {
  canvas: HTMLCanvasElement;
  /** Canvas pixels per CSS pixel */
  ratio: number;
  /** Viewport size in CSS pixels */
  width: number;
  height: number;
}

function baseRenderOptions() {
  return {
    filter: excludeAnyclickUi,
    skipAutoScale: true,
    fontEmbedCSS: "", // Skip font embedding to keep captures small and fast
    // Timeout for individual fetch operations (fonts, images, etc.)
    fetchRequestInit: {
      signal: AbortSignal.timeout(3000),
    },
  };
}

function assertRendered(canvas: HTMLCanvasElement): HTMLCanvasElement {
  if (!canvas || !canvas.width || !canvas.height) {
    throw new Error(ELEMENT_CANNOT_BE_CAPTURED_ERROR.message);
  }
  return canvas;
}

/**
 * Render the current viewport once. The body clone is translated by the
 * scroll offset so the render matches what is on screen rather than the top
 * of the document.
 */
async function renderViewport(): Promise<ViewportRender> {
  const root = document.documentElement;
  const width = root.clientWidth || window.innerWidth;
  const height = root.clientHeight || window.innerHeight;

  const canvas = assertRendered(
    await withTimeout(
      htmlToImage.toCanvas(document.body, {
        ...baseRenderOptions(),
        backgroundColor: resolveBackdropColor(document.body),
        width,
        height,
        style: {
          transform: `translate(${-window.scrollX}px, ${-window.scrollY}px)`,
          transformOrigin: "top left",
        },
      }),
      CAPTURE_TIMEOUT_MS,
      SCREENSHOT_TIMEOUT_ERROR.message,
    ),
  );

  return { canvas, ratio: canvas.width / width, width, height };
}

/**
 * Render a single node on its own, on top of its resolved backdrop color
 */
async function renderNode(node: HTMLElement): Promise<HTMLCanvasElement> {
  return assertRendered(
    await withTimeout(
      htmlToImage.toCanvas(node, {
        ...baseRenderOptions(),
        backgroundColor: resolveBackdropColor(node),
        // html-to-image copies the root node's computed margins into the
        // standalone canvas. Reset them so centered elements are not shifted
        // and clipped inside a canvas sized to their border box.
        style: { margin: "0" },
      }),
      CAPTURE_TIMEOUT_MS,
      SCREENSHOT_TIMEOUT_ERROR.message,
    ),
  );
}

/**
 * Whether the rect lies fully inside the viewport render. Padding is not
 * required to fit; it is clamped by the crop.
 */
function fitsInViewport(rect: DOMRect, render: ViewportRender): boolean {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.left >= 0 &&
    rect.top >= 0 &&
    rect.right <= render.width &&
    rect.bottom <= render.height
  );
}

/**
 * html-to-image clones do not preserve scroll offsets of scrollable
 * ancestors, so a node inside a scrolled container would land at a different
 * position in the render than on screen. Such nodes are rendered standalone.
 */
function hasScrolledAncestor(node: Element): boolean {
  let current = node.parentElement;
  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    if (current.scrollTop || current.scrollLeft) return true;
    current = current.parentElement;
  }
  return false;
}

/**
 * Crop a region (rect plus padding, clamped to the viewport) out of the
 * viewport render.
 */
function cropViewport(
  render: ViewportRender,
  rect: DOMRect,
  padding: number,
): HTMLCanvasElement | null {
  const left = Math.max(0, rect.left - padding);
  const top = Math.max(0, rect.top - padding);
  const right = Math.min(render.width, rect.right + padding);
  const bottom = Math.min(render.height, rect.bottom + padding);
  if (right - left < 1 || bottom - top < 1) return null;

  const { ratio } = render;
  const output = document.createElement("canvas");
  output.width = Math.round((right - left) * ratio);
  output.height = Math.round((bottom - top) * ratio);
  const context = output.getContext("2d");
  if (!context) return null;

  context.drawImage(
    render.canvas,
    Math.round(left * ratio),
    Math.round(top * ratio),
    output.width,
    output.height,
    0,
    0,
    output.width,
    output.height,
  );
  return output;
}

/**
 * Encode a canvas as JPEG, lowering quality until it fits the size budget
 */
function encodeCanvas(
  canvas: HTMLCanvasElement,
  config: Required<ScreenshotConfig>,
): ScreenshotCapture {
  const estimateBytes = (dataUrl: string) =>
    Math.ceil((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75);

  let quality = config.quality;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (!dataUrl || dataUrl.length <= "data:,".length) {
    throw new Error(ELEMENT_CANNOT_BE_CAPTURED_ERROR.message);
  }
  let sizeBytes = estimateBytes(dataUrl);

  while (sizeBytes > config.maxSizeBytes && quality > 0.1) {
    quality = Math.max(0.1, quality - 0.1);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    sizeBytes = estimateBytes(dataUrl);
  }

  return { dataUrl, width: canvas.width, height: canvas.height, sizeBytes };
}

/**
 * Capture a node: cropped from the viewport render when it fits, otherwise
 * rendered standalone on its resolved backdrop color.
 */
async function captureNode(
  node: Element,
  render: ViewportRender | null,
  config: Required<ScreenshotConfig>,
): Promise<ScreenshotResult> {
  if (!(node instanceof HTMLElement)) {
    return {
      error: {
        message: "Element is not an HTML element",
        name: "INVALID_ELEMENT_ERROR",
      },
    };
  }

  try {
    if (render && !hasScrolledAncestor(node)) {
      const rect = node.getBoundingClientRect();
      if (fitsInViewport(rect, render)) {
        const cropped = cropViewport(render, rect, config.padding);
        if (cropped) {
          return { capture: encodeCanvas(cropped, config) };
        }
      }
    }

    return { capture: encodeCanvas(await renderNode(node), config) };
  } catch (error) {
    console.warn("Screenshot capture failed:", error);
    return { error: toScreenshotError(error) };
  }
}

/**
 * Render the viewport, returning either the render or the error to report
 */
async function captureViewport(
  config: Required<ScreenshotConfig>,
): Promise<{ render: ViewportRender | null; result: ScreenshotResult }> {
  try {
    const render = await renderViewport();
    return { render, result: { capture: encodeCanvas(render.canvas, config) } };
  } catch (error) {
    console.warn("Screenshot capture failed:", error);
    return { render: null, result: { error: toScreenshotError(error) } };
  }
}

/**
 * Run `fn` with the sensitive-element mask styles injected
 */
async function withMaskStyles<T>(
  config: Required<ScreenshotConfig>,
  fn: () => Promise<T>,
): Promise<T> {
  const maskStyle = createMaskStyle(
    config.sensitiveSelectors,
    config.maskColor,
  );
  document.head.appendChild(maskStyle);
  try {
    return await fn();
  } finally {
    maskStyle.remove();
  }
}

const NOT_SUPPORTED_ERROR: ScreenshotError = {
  message: "Screenshots not supported in this browser",
  name: "SCREENSHOT_NOT_SUPPORTED_ERROR",
};

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
    return { error: NOT_SUPPORTED_ERROR };
  }

  const mergedConfig: Required<ScreenshotConfig> = {
    ...DEFAULT_SCREENSHOT_CONFIG,
    ...config,
  };

  if (!mergedConfig.enabled) {
    return {};
  }

  try {
    return await withMaskStyles(mergedConfig, async () => {
      const viewport = await captureViewport(mergedConfig);
      if (mode === "viewport") {
        return viewport.result;
      }
      const node =
        mode === "container" && containerElement
          ? containerElement
          : targetElement;
      return captureNode(node, viewport.render, mergedConfig);
    });
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
 * Capture all three screenshot modes from a single viewport render
 */
export async function captureAllScreenshots(
  targetElement: Element,
  containerElement: Element | null,
  config?: Partial<ScreenshotConfig>,
): Promise<ScreenshotData | null> {
  if (!isScreenshotSupported()) {
    return {
      errors: {
        element: NOT_SUPPORTED_ERROR,
        viewport: NOT_SUPPORTED_ERROR,
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

  // Sequential on purpose: the crops share one viewport render, and standalone
  // fallbacks share the injected mask styles.
  const { viewportResult, elementResult, containerResult } =
    await withMaskStyles(mergedConfig, async () => {
      const viewport = await captureViewport(mergedConfig);
      const element = await captureNode(
        targetElement,
        viewport.render,
        mergedConfig,
      );
      const container = containerElement
        ? await captureNode(containerElement, viewport.render, mergedConfig)
        : null;
      return {
        viewportResult: viewport.result,
        elementResult: element,
        containerResult: container,
      };
    });

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
