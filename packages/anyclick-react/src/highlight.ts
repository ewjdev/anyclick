/**
 * Highlight utilities for feedback target elements
 */

import type { HighlightConfig, HighlightColors } from "./types";

const HIGHLIGHT_TARGET_CLASS = "uifeedback-highlight-target";
const HIGHLIGHT_CONTAINER_CLASS = "uifeedback-highlight-container";
const STYLE_ID = "uifeedback-highlight-styles";

/**
 * Default highlight colors
 */
export const defaultHighlightColors: Required<HighlightColors> = {
  targetColor: "#3b82f6",
  containerColor: "#8b5cf6",
  targetShadowOpacity: 0.25,
  containerShadowOpacity: 0.1,
};

/**
 * Default container selectors
 */
export const defaultContainerSelectors: string[] = [
  ".container",
  ".card",
  ".panel",
  ".section",
  ".wrapper",
  ".box",
  ".modal",
  ".dialog",
  ".drawer",
  '[role="dialog"]',
  '[role="region"]',
  '[role="article"]',
  '[role="main"]',
  "article",
  "section",
  "main",
  "aside",
  "nav",
  "header",
  "footer",
];

/**
 * Generate CSS for highlight effects based on configuration
 */
function generateHighlightCSS(colors: Required<HighlightColors>): string {
  const {
    targetColor,
    containerColor,
    targetShadowOpacity,
    containerShadowOpacity,
  } = colors;

  // Convert hex to rgba for shadows
  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
  };

  return `
.${HIGHLIGHT_TARGET_CLASS} {
  outline: 2px dashed ${targetColor} !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 4px ${hexToRgba(targetColor, targetShadowOpacity)}, 0 4px 12px ${hexToRgba(targetColor, targetShadowOpacity * 0.6)} !important;
  border-radius: 4px !important;
  position: relative;
  z-index: 9997;
  top: 0;
}

/* SVG elements need special handling - don't apply styles that break their rendering */
svg.${HIGHLIGHT_TARGET_CLASS},
.${HIGHLIGHT_TARGET_CLASS} > svg {
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  position: static !important;
  z-index: auto !important;
}

.${HIGHLIGHT_CONTAINER_CLASS} {
  outline: 2px dashed ${hexToRgba(containerColor, 0.6)} !important;
  outline-offset: 4px !important;
  box-shadow: 0 0 0 6px ${hexToRgba(containerColor, containerShadowOpacity)} !important;
  border-radius: 6px !important;
  position: relative;
  z-index: 9996;
}

/* SVG elements in containers also need protection */
svg.${HIGHLIGHT_CONTAINER_CLASS},
.${HIGHLIGHT_CONTAINER_CLASS} > svg {
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  position: static !important;
  z-index: auto !important;
}
`;
}

/**
 * Inject or update highlight styles in document head
 */
function injectStyles(colors: Required<HighlightColors>): void {
  if (typeof document === "undefined") return;

  // Remove existing styles if present
  const existingStyle = document.getElementById(STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = generateHighlightCSS(colors);
  document.head.appendChild(style);
}

/**
 * Find the closest container parent element
 */
export function findContainerParent(
  element: Element,
  config?: HighlightConfig,
): Element | null {
  const containerSelectors =
    config?.containerSelectors ?? defaultContainerSelectors;
  const minChildren = config?.minChildrenForContainer ?? 2;

  let current = element.parentElement;
  let fallbackContainer: Element | null = null;

  while (current && current !== document.body) {
    // Check if element matches any container selector
    for (const selector of containerSelectors) {
      try {
        if (current.matches(selector)) {
          return current;
        }
      } catch {
        // Invalid selector, skip
      }
    }

    // Check if parent has multiple meaningful children (not just text nodes)
    const meaningfulChildren = Array.from(current.children).filter((child) => {
      const tag = child.tagName.toLowerCase();
      // Exclude script, style, and hidden elements
      if (tag === "script" || tag === "style" || tag === "noscript") {
        return false;
      }
      // Check if element is visible
      const style = window.getComputedStyle(child);
      if (style.display === "none" || style.visibility === "hidden") {
        return false;
      }
      return true;
    });

    // If this parent has enough children, it's likely a container
    if (meaningfulChildren.length >= minChildren && !fallbackContainer) {
      fallbackContainer = current;
    }

    // If parent has 3+ children, strongly consider it a container
    if (meaningfulChildren.length >= 3) {
      return current;
    }

    current = current.parentElement;
  }

  return fallbackContainer;
}

/**
 * Apply highlight to target element
 */
export function highlightTarget(
  element: Element,
  colors?: HighlightColors,
): void {
  const mergedColors = { ...defaultHighlightColors, ...colors };
  injectStyles(mergedColors);
  element.classList.add(HIGHLIGHT_TARGET_CLASS);
}

/**
 * Apply highlight to container element
 */
export function highlightContainer(
  element: Element,
  colors?: HighlightColors,
): void {
  const mergedColors = { ...defaultHighlightColors, ...colors };
  injectStyles(mergedColors);
  element.classList.add(HIGHLIGHT_CONTAINER_CLASS);
}

/**
 * Remove all highlights from the document
 */
export function clearHighlights(): void {
  if (typeof document === "undefined") return;

  document.querySelectorAll(`.${HIGHLIGHT_TARGET_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_TARGET_CLASS);
  });

  document.querySelectorAll(`.${HIGHLIGHT_CONTAINER_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CONTAINER_CLASS);
  });
}

/**
 * Apply highlights to target element and its container parent
 */
export function applyHighlights(
  targetElement: Element,
  config?: HighlightConfig,
): {
  target: Element;
  container: Element | null;
} {
  // If highlights are disabled, don't apply anything
  if (config?.enabled === false) {
    return { target: targetElement, container: null };
  }

  clearHighlights();

  const colors = { ...defaultHighlightColors, ...config?.colors };

  highlightTarget(targetElement, colors);

  const container = findContainerParent(targetElement, config);
  if (container && container !== targetElement) {
    highlightContainer(container, colors);
  }

  return { target: targetElement, container };
}
