import type { AncestorInfo, ElementContext } from "./types";

/**
 * Generate a unique CSS selector for an element
 */
export function getUniqueSelector(element: Element): string {
  // If element has an id, use that
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    let selector = current.tagName.toLowerCase();

    // Add id if present
    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      path.unshift(selector);
      break;
    }

    // Add classes if present (limit to first 2 for readability)
    const classes = Array.from(current.classList).slice(0, 2);
    if (classes.length > 0) {
      selector += classes.map((c) => `.${CSS.escape(c)}`).join("");
    }

    // Add nth-child if needed to disambiguate
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(" > ");
}

/**
 * Get ancestor information for an element up to body
 */
export function getAncestors(
  element: Element,
  maxDepth: number = 5,
): AncestorInfo[] {
  const ancestors: AncestorInfo[] = [];
  let current = element.parentElement;
  let depth = 0;

  while (current && current !== document.body && depth < maxDepth) {
    ancestors.push({
      tag: current.tagName.toLowerCase(),
      id: current.id || undefined,
      classes: Array.from(current.classList),
      selector: getUniqueSelector(current),
    });
    current = current.parentElement;
    depth++;
  }

  return ancestors;
}

/**
 * Extract data-* attributes from an element
 */
export function getDataAttributes(element: Element): Record<string, string> {
  const data: Record<string, string> = {};

  if (element instanceof HTMLElement) {
    for (const [key, value] of Object.entries(element.dataset)) {
      if (value !== undefined) {
        data[key] = value;
      }
    }
  }

  return data;
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

/**
 * Strip specified attributes from an HTML string
 */
export function stripAttributesFromHTML(
  html: string,
  attributes: string[],
): string {
  if (attributes.length === 0) return html;

  const pattern = new RegExp(
    `\\s*(${attributes.join("|")})\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]*)`,
    "gi",
  );

  return html.replace(pattern, "");
}

/**
 * Build ElementContext from a DOM element
 */
export function buildElementContext(
  element: Element,
  options: {
    maxInnerTextLength?: number;
    maxOuterHTMLLength?: number;
    maxAncestors?: number;
    stripAttributes?: string[];
  } = {},
): ElementContext {
  const {
    maxInnerTextLength = 500,
    maxOuterHTMLLength = 1000,
    maxAncestors = 5,
    stripAttributes = [],
  } = options;

  const rect = element.getBoundingClientRect();

  let outerHTML = element.outerHTML;
  if (stripAttributes.length > 0) {
    outerHTML = stripAttributesFromHTML(outerHTML, stripAttributes);
  }

  return {
    selector: getUniqueSelector(element),
    tag: element.tagName.toLowerCase(),
    id: element.id || undefined,
    classes: Array.from(element.classList),
    innerText: truncate(
      element instanceof HTMLElement
        ? element.innerText
        : element.textContent || "",
      maxInnerTextLength,
    ),
    outerHTML: truncate(outerHTML, maxOuterHTMLLength),
    boundingRect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    dataAttributes: getDataAttributes(element),
    ancestors: getAncestors(element, maxAncestors),
  };
}
