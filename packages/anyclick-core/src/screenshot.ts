/**
 * Screenshot capture utilities using html-to-image
 * Supports element, container, and viewport captures with sensitive element masking
 */

import * as htmlToImage from 'html-to-image';
import type {
  ScreenshotCapture,
  ScreenshotData,
  ScreenshotConfig,
  ScreenshotCaptureMode,
} from './types';
import { DEFAULT_SENSITIVE_SELECTORS } from './types';

/**
 * Default screenshot configuration
 */
export const DEFAULT_SCREENSHOT_CONFIG: Required<ScreenshotConfig> = {
  enabled: true,
  quality: 0.7,
  maxSizeBytes: 500 * 1024, // 500KB
  padding: 20,
  sensitiveSelectors: DEFAULT_SENSITIVE_SELECTORS,
  maskColor: '#1a1a1a',
  showPreview: true,
};

/**
 * Check if screenshot capture is supported in the current browser
 */
export function isScreenshotSupported(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  // Check for canvas support
  const canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
}

/**
 * Filter function for html-to-image to mask sensitive elements
 */
function createFilter(
  sensitiveSelectors: string[]
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
function createMaskStyle(selectors: string[], maskColor: string): HTMLStyleElement {
  const style = document.createElement('style');
  const rules = selectors.map(selector => `
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
  `).join('\n');
  
  style.textContent = rules;
  return style;
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
  } = {}
): Promise<ScreenshotCapture | null> {
  try {
    // Prepare options for html-to-image
    const imageOptions: any = {
      quality: config.quality,
      backgroundColor: '#ffffff',
      width: options.width,
      height: options.height,
      style: options.style,
      filter: createFilter(config.sensitiveSelectors),
      skipAutoScale: true,
      // Inject masking styles
      fontEmbedCSS: '', // Optional: reduce size by not embedding all fonts if not needed
    };

    // We need to manually handle masking because the filter option just excludes nodes
    // We want to show them as masked blocks
    
    // Create data URL
    let dataUrl = await htmlToImage.toJpeg(node, imageOptions);
    
    // Calculate size
    let sizeBytes = Math.ceil((dataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75);

    // If too large, try reducing quality
    let quality = config.quality;
    while (sizeBytes > config.maxSizeBytes && quality > 0.1) {
      quality -= 0.1;
      imageOptions.quality = quality;
      dataUrl = await htmlToImage.toJpeg(node, imageOptions);
      sizeBytes = Math.ceil((dataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75);
    }

    // Get actual dimensions
    const img = new Image();
    img.src = dataUrl;
    await new Promise(resolve => { img.onload = resolve; });

    return {
      dataUrl,
      width: img.width,
      height: img.height,
      sizeBytes,
    };
  } catch (error) {
    console.warn('Screenshot capture failed:', error);
    return null;
  }
}

/**
 * Capture a single screenshot
 */
export async function captureScreenshot(
  targetElement: Element,
  containerElement: Element | null,
  mode: ScreenshotCaptureMode,
  config?: Partial<ScreenshotConfig>
): Promise<ScreenshotCapture | null> {
  if (!isScreenshotSupported()) {
    return null;
  }

  const mergedConfig: Required<ScreenshotConfig> = {
    ...DEFAULT_SCREENSHOT_CONFIG,
    ...config,
  };

  if (!mergedConfig.enabled) {
    return null;
  }

  try {
    // Temporarily inject masking styles
    const maskStyle = createMaskStyle(mergedConfig.sensitiveSelectors, mergedConfig.maskColor);
    document.head.appendChild(maskStyle);

    let result: ScreenshotCapture | null = null;

    if (mode === 'viewport') {
      // Capture entire body
      result = await captureNode(document.body, mergedConfig, {
        width: window.innerWidth,
        height: window.innerHeight,
        style: {
          transform: 'none', // Reset transform to avoid capturing scaled down versions
          height: '100vh',
          overflow: 'hidden',
        }
      });
    } else {
      const elementToCapture = (mode === 'container' && containerElement) 
        ? containerElement 
        : targetElement;

      if (!(elementToCapture instanceof HTMLElement)) {
        document.head.removeChild(maskStyle);
        return null;
      }

      // Add padding via style
      const padding = mergedConfig.padding;
      
      // For element/container capture, we might need to handle padding manually
      // html-to-image captures the node as is.
      // To add padding, we can capture the node with a wrapper logic, 
      // but simpler is to just capture the node and accept no padding, 
      // OR use the style prop to add padding and negative margin?
      // Actually, html-to-image doesn't support 'padding' option easily for single node.
      // Let's capture the node directly for now to ensure accuracy.
      
      result = await captureNode(elementToCapture, mergedConfig);
    }

    // Clean up
    document.head.removeChild(maskStyle);
    return result;
  } catch (error) {
    console.warn('Screenshot capture failed:', error);
    return null;
  }
}

/**
 * Capture all three screenshot modes
 */
export async function captureAllScreenshots(
  targetElement: Element,
  containerElement: Element | null,
  config?: Partial<ScreenshotConfig>
): Promise<ScreenshotData | null> {
  if (!isScreenshotSupported()) {
    return null;
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
  
  const element = await captureScreenshot(targetElement, containerElement, 'element', mergedConfig);
  
  const container = containerElement 
    ? await captureScreenshot(targetElement, containerElement, 'container', mergedConfig)
    : null;
    
  const viewport = await captureScreenshot(targetElement, containerElement, 'viewport', mergedConfig);

  // Return null if no screenshots were captured
  if (!element && !container && !viewport) {
    return null;
  }

  return {
    element: element ?? undefined,
    container: container ?? undefined,
    viewport: viewport ?? undefined,
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
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
