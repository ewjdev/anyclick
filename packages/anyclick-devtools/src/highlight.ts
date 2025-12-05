/**
 * Highlight utilities for feedback target elements.
 *
 * Provides functions to visually highlight DOM elements during feedback selection.
 * Highlights are applied using CSS classes and dynamically generated styles.
 *
 * @module highlight
 * @since 1.0.0
 */
import type { HighlightColors, HighlightConfig } from "./types";

/** CSS class applied to highlighted target elements */
const HIGHLIGHT_TARGET_CLASS = "uifeedback-highlight-target";

/** CSS class applied to highlighted container elements */
const HIGHLIGHT_CONTAINER_CLASS = "uifeedback-highlight-container";

/** ID of the dynamically injected style element */
const STYLE_ID = "uifeedback-highlight-styles";

/**
 * Default highlight colors used when no custom colors are specified.
 *
 * @example
 * ```ts
 * // Override specific colors
 * const customColors = {
 *   ...defaultHighlightColors,
 *   targetColor: "#ef4444", // Red instead of blue
 * };
 * ```
 *
 * @since 1.0.0
 */
export const defaultHighlightColors: Required<HighlightColors> = {
  containerColor: "#8b5cf6",
  containerShadowOpacity: 0.1,
  targetColor: "#3b82f6",
  targetShadowOpacity: 0.25,
};

/**
 * Default CSS selectors used to identify container elements.
 *
 * These selectors are checked when traversing up the DOM tree to find
 * a suitable container element to highlight alongside the target.
 *
 * @example
 * ```ts
 * // Add custom selectors
 * const customSelectors = [
 *   ...defaultContainerSelectors,
 *   "[data-component]",
 *   ".my-custom-container",
 * ];
 * ```
 *
 * @since 1.0.0
 */
export const defaultContainerSelectors: string[] = [
  ".box",
  ".card",
  ".container",
  ".dialog",
  ".drawer",
  ".modal",
  ".panel",
  ".section",
  ".wrapper",
  '[role="article"]',
  '[role="dialog"]',
  '[role="main"]',
  '[role="region"]',
  "article",
  "aside",
  "footer",
  "header",
  "main",
  "nav",
  "section",
];

/**
 * Generates CSS for highlight effects based on color configuration.
 *
 * @param colors - The highlight color configuration
 * @returns CSS string to be injected into the document
 * @internal
 */
function generateHighlightCSS(colors: Required<HighlightColors>): string {
  const {
    containerColor,
    containerShadowOpacity,
    targetColor,
    targetShadowOpacity,
  } = colors;

  /**
   * Converts a hex color to rgba format.
   * @param hex - Hex color string (with or without #)
   * @param alpha - Alpha transparency value
   */
  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
  };

  return `
.${HIGHLIGHT_TARGET_CLASS} {
  border-radius: 4px !important;
  box-shadow: 0 0 0 4px ${hexToRgba(targetColor, targetShadowOpacity)}, 0 4px 12px ${hexToRgba(targetColor, targetShadowOpacity * 0.6)} !important;
  outline: 2px dashed ${targetColor} !important;
  outline-offset: 2px !important;
  position: relative;
  top: 0;
  z-index: 9997;
}

/* SVG elements need special handling - don't apply styles that break their rendering */
svg.${HIGHLIGHT_TARGET_CLASS},
.${HIGHLIGHT_TARGET_CLASS} > svg {
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  position: static !important;
  z-index: auto !important;
}

.${HIGHLIGHT_CONTAINER_CLASS} {
  border-radius: 6px !important;
  box-shadow: 0 0 0 6px ${hexToRgba(containerColor, containerShadowOpacity)} !important;
  outline: 2px dashed ${hexToRgba(containerColor, 0.6)} !important;
  outline-offset: 4px !important;
  position: relative;
  z-index: 9996;
}

/* SVG elements in containers also need protection */
svg.${HIGHLIGHT_CONTAINER_CLASS},
.${HIGHLIGHT_CONTAINER_CLASS} > svg {
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  position: static !important;
  z-index: auto !important;
}
`;
}

/**
 * Injects or updates highlight styles in the document head.
 *
 * @param colors - The highlight color configuration
 * @internal
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
 * Finds the closest container parent element for a given target element.
 *
 * Traverses up the DOM tree looking for elements that match container selectors
 * or have multiple meaningful child elements.
 *
 * @param element - The target element to find a container for
 * @param config - Optional highlight configuration with custom selectors
 * @returns The found container element, or null if none found
 *
 * @example
 * ```ts
 * const target = document.querySelector(".my-button");
 * const container = findContainerParent(target, {
 *   containerSelectors: [".card", ".panel"],
 *   minChildrenForContainer: 3,
 * });
 * ```
 *
 * @since 1.0.0
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
 * Applies highlight styling to a target element.
 *
 * Injects the necessary CSS styles and adds the highlight class to the element.
 *
 * @param element - The element to highlight
 * @param colors - Optional custom highlight colors
 *
 * @example
 * ```ts
 * const target = document.querySelector(".my-button");
 * highlightTarget(target, { targetColor: "#ef4444" });
 * ```
 *
 * @since 1.0.0
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
 * Applies highlight styling to a container element.
 *
 * Container highlights are visually distinct from target highlights,
 * typically with a larger outline offset and different color.
 *
 * @param element - The container element to highlight
 * @param colors - Optional custom highlight colors
 *
 * @example
 * ```ts
 * const container = document.querySelector(".card");
 * highlightContainer(container, { containerColor: "#22c55e" });
 * ```
 *
 * @since 1.0.0
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
 * Removes all highlight styling from the document.
 *
 * Clears both target and container highlights from all elements.
 *
 * @example
 * ```ts
 * // Remove highlights when closing the context menu
 * clearHighlights();
 * ```
 *
 * @since 1.0.0
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
 * Applies highlights to both a target element and its container parent.
 *
 * This is the main function for applying highlights during feedback selection.
 * It automatically finds the container parent and applies appropriate styling.
 *
 * @param targetElement - The element to highlight as the target
 * @param config - Optional highlight configuration
 * @returns Object containing the target and container elements
 *
 * @example
 * ```ts
 * const result = applyHighlights(clickedElement, {
 *   enabled: true,
 *   colors: { targetColor: "#3b82f6", containerColor: "#8b5cf6" },
 *   containerSelectors: [".card", ".modal"],
 * });
 *
 * console.log(result.target);    // The highlighted target
 * console.log(result.container); // The highlighted container (or null)
 * ```
 *
 * @since 1.0.0
 */
export function applyHighlights(
  targetElement: Element,
  config?: HighlightConfig,
): {
  container: Element | null;
  target: Element;
} {
  // If highlights are disabled, don't apply anything
  if (config?.enabled === false) {
    return { container: null, target: targetElement };
  }

  clearHighlights();

  const colors = { ...defaultHighlightColors, ...config?.colors };

  highlightTarget(targetElement, colors);

  const container = findContainerParent(targetElement, config);
  if (container && container !== targetElement) {
    highlightContainer(container, colors);
  }

  return { container, target: targetElement };
}
