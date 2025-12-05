/**
 * Inspect element utilities for extracting computed styles,
 * accessibility info, and comprehensive element data.
 */

/**
 * Curated list of CSS properties that are most useful for inspection.
 * Grouped by category for organized display.
 */
export const CURATED_STYLE_PROPERTIES = {
  layout: [
    "display",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "float",
    "clear",
    "zIndex",
    "overflow",
    "overflowX",
    "overflowY",
  ],
  box: [
    "width",
    "height",
    "minWidth",
    "minHeight",
    "maxWidth",
    "maxHeight",
    "boxSizing",
  ],
  spacing: [
    "margin",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
  ],
  border: [
    "border",
    "borderWidth",
    "borderStyle",
    "borderColor",
    "borderRadius",
    "borderTopLeftRadius",
    "borderTopRightRadius",
    "borderBottomLeftRadius",
    "borderBottomRightRadius",
  ],
  background: [
    "background",
    "backgroundColor",
    "backgroundImage",
    "backgroundSize",
    "backgroundPosition",
    "backgroundRepeat",
  ],
  typography: [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "lineHeight",
    "letterSpacing",
    "textAlign",
    "textDecoration",
    "textTransform",
    "color",
  ],
  flexbox: [
    "flexDirection",
    "flexWrap",
    "justifyContent",
    "alignItems",
    "alignContent",
    "gap",
    "rowGap",
    "columnGap",
    "flex",
    "flexGrow",
    "flexShrink",
    "flexBasis",
    "alignSelf",
    "order",
  ],
  grid: [
    "gridTemplateColumns",
    "gridTemplateRows",
    "gridColumn",
    "gridRow",
    "gridGap",
    "gridAutoFlow",
  ],
  effects: [
    "opacity",
    "visibility",
    "boxShadow",
    "textShadow",
    "transform",
    "transition",
    "cursor",
    "pointerEvents",
  ],
} as const;

/**
 * All curated style property names as a flat array
 */
export const ALL_CURATED_PROPERTIES = Object.values(
  CURATED_STYLE_PROPERTIES,
).flat();

/**
 * Computed styles organized by category
 */
export interface ComputedStylesInfo {
  layout: Record<string, string>;
  box: Record<string, string>;
  spacing: Record<string, string>;
  border: Record<string, string>;
  background: Record<string, string>;
  typography: Record<string, string>;
  flexbox: Record<string, string>;
  grid: Record<string, string>;
  effects: Record<string, string>;
}

/**
 * Accessibility information for an element
 */
export interface AccessibilityInfo {
  /** The computed ARIA role */
  role: string | null;
  /** Accessible name (aria-label, aria-labelledby, etc.) */
  accessibleName: string | null;
  /** Accessible description (aria-describedby) */
  accessibleDescription: string | null;
  /** Whether the element is keyboard focusable */
  keyboardFocusable: boolean;
  /** Tab index value */
  tabIndex: number | null;
  /** All aria-* attributes */
  ariaAttributes: Record<string, string>;
  /** Whether element is hidden from accessibility tree */
  hidden: boolean;
  /** Live region settings */
  liveRegion: {
    live: string | null;
    atomic: string | null;
    relevant: string | null;
  };
}

/**
 * Box model dimensions
 */
export interface BoxModelInfo {
  /** Content box dimensions */
  content: { width: number; height: number };
  /** Padding values */
  padding: { top: number; right: number; bottom: number; left: number };
  /** Border values */
  border: { top: number; right: number; bottom: number; left: number };
  /** Margin values */
  margin: { top: number; right: number; bottom: number; left: number };
  /** Total dimensions including all box model parts */
  total: { width: number; height: number };
  /** Position on screen */
  position: { top: number; left: number };
}

/**
 * Comprehensive element inspection info
 */
export interface ElementInspectInfo {
  /** Element tag name */
  tagName: string;
  /** Element ID if present */
  id: string | null;
  /** Element class names */
  classNames: string[];
  /** Unique CSS selector */
  selector: string;
  /** Box model information */
  boxModel: BoxModelInfo;
  /** Computed styles by category */
  computedStyles: ComputedStylesInfo;
  /** Accessibility information */
  accessibility: AccessibilityInfo;
  /** Data attributes */
  dataAttributes: Record<string, string>;
  /** All regular attributes */
  attributes: Record<string, string>;
  /** Element's outer HTML (truncated) */
  outerHTML: string;
  /** Element's inner text (truncated) */
  innerText: string;
  /** Event listeners if available (browser-dependent) */
  eventListeners?: string[];
  /** Source file location if available */
  sourceLocation?: {
    file: string;
    line: number;
    column?: number;
  };
}

/**
 * Extract computed styles for an element, organized by category
 */
export function getComputedStyles(element: Element): ComputedStylesInfo {
  if (typeof window === "undefined") {
    return createEmptyComputedStyles();
  }

  const styles = window.getComputedStyle(element);
  const result: ComputedStylesInfo = {
    layout: {},
    box: {},
    spacing: {},
    border: {},
    background: {},
    typography: {},
    flexbox: {},
    grid: {},
    effects: {},
  };

  // Extract styles by category
  for (const [category, properties] of Object.entries(
    CURATED_STYLE_PROPERTIES,
  )) {
    const categoryKey = category as keyof ComputedStylesInfo;
    for (const prop of properties) {
      const value = styles.getPropertyValue(camelToKebab(prop));
      // Only include non-empty, non-default values
      if (value && value !== "none" && value !== "normal" && value !== "auto") {
        result[categoryKey][prop] = value;
      }
    }
  }

  return result;
}

/**
 * Extract accessibility information from an element
 */
export function getAccessibilityInfo(element: Element): AccessibilityInfo {
  const htmlElement = element as HTMLElement;

  // Get computed role
  let role: string | null = element.getAttribute("role");
  if (!role) {
    // Infer implicit role from tag name
    role = getImplicitRole(element);
  }

  // Get accessible name
  const accessibleName = getAccessibleName(element);

  // Get accessible description
  const describedById = element.getAttribute("aria-describedby");
  let accessibleDescription: string | null = null;
  if (describedById && typeof document !== "undefined") {
    const descElement = document.getElementById(describedById);
    if (descElement) {
      accessibleDescription = descElement.textContent;
    }
  }

  // Check keyboard focusability
  const tabIndex = htmlElement.tabIndex;
  const keyboardFocusable = isKeyboardFocusable(element);

  // Extract all aria attributes
  const ariaAttributes: Record<string, string> = {};
  for (const attr of Array.from(element.attributes)) {
    if (attr.name.startsWith("aria-")) {
      ariaAttributes[attr.name] = attr.value;
    }
  }

  // Check if hidden from accessibility tree
  const hidden =
    element.getAttribute("aria-hidden") === "true" ||
    htmlElement.hidden ||
    (typeof window !== "undefined" &&
      window.getComputedStyle(element).display === "none");

  // Live region settings
  const liveRegion = {
    live: element.getAttribute("aria-live"),
    atomic: element.getAttribute("aria-atomic"),
    relevant: element.getAttribute("aria-relevant"),
  };

  return {
    role,
    accessibleName,
    accessibleDescription,
    keyboardFocusable,
    tabIndex:
      tabIndex !== -1 || element.hasAttribute("tabindex") ? tabIndex : null,
    ariaAttributes,
    hidden,
    liveRegion,
  };
}

/**
 * Get box model information for an element
 */
export function getBoxModelInfo(element: Element): BoxModelInfo {
  if (typeof window === "undefined") {
    return createEmptyBoxModel();
  }

  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);

  const parseValue = (value: string): number => {
    return parseFloat(value) || 0;
  };

  const padding = {
    top: parseValue(styles.paddingTop),
    right: parseValue(styles.paddingRight),
    bottom: parseValue(styles.paddingBottom),
    left: parseValue(styles.paddingLeft),
  };

  const border = {
    top: parseValue(styles.borderTopWidth),
    right: parseValue(styles.borderRightWidth),
    bottom: parseValue(styles.borderBottomWidth),
    left: parseValue(styles.borderLeftWidth),
  };

  const margin = {
    top: parseValue(styles.marginTop),
    right: parseValue(styles.marginRight),
    bottom: parseValue(styles.marginBottom),
    left: parseValue(styles.marginLeft),
  };

  // Calculate content dimensions
  const contentWidth =
    rect.width - padding.left - padding.right - border.left - border.right;
  const contentHeight =
    rect.height - padding.top - padding.bottom - border.top - border.bottom;

  return {
    content: {
      width: Math.round(contentWidth * 100) / 100,
      height: Math.round(contentHeight * 100) / 100,
    },
    padding,
    border,
    margin,
    total: {
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100,
    },
    position: {
      top: Math.round(rect.top * 100) / 100,
      left: Math.round(rect.left * 100) / 100,
    },
  };
}

/**
 * Get all attributes from an element (excluding data-* which are separate)
 */
export function getAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(element.attributes)) {
    if (!attr.name.startsWith("data-")) {
      attrs[attr.name] = attr.value;
    }
  }
  return attrs;
}

/**
 * Get comprehensive element inspection information
 */
export function getElementInspectInfo(
  element: Element,
  options: {
    maxOuterHTMLLength?: number;
    maxInnerTextLength?: number;
  } = {},
): ElementInspectInfo {
  const { maxOuterHTMLLength = 2000, maxInnerTextLength = 500 } = options;

  const htmlElement = element as HTMLElement;

  // Get data attributes
  const dataAttributes: Record<string, string> = {};
  if (htmlElement.dataset) {
    for (const [key, value] of Object.entries(htmlElement.dataset)) {
      if (value !== undefined) {
        dataAttributes[key] = value;
      }
    }
  }

  // Check for source location in data attributes
  let sourceLocation: ElementInspectInfo["sourceLocation"];
  const sourceFile = dataAttributes.sourceFile || dataAttributes["source-file"];
  const sourceLine = dataAttributes.sourceLine || dataAttributes["source-line"];
  if (sourceFile && sourceLine) {
    sourceLocation = {
      file: sourceFile,
      line: parseInt(sourceLine, 10),
      column: dataAttributes.sourceColumn
        ? parseInt(dataAttributes.sourceColumn, 10)
        : undefined,
    };
  }

  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || null,
    classNames: Array.from(element.classList),
    selector: generateUniqueSelector(element),
    boxModel: getBoxModelInfo(element),
    computedStyles: getComputedStyles(element),
    accessibility: getAccessibilityInfo(element),
    dataAttributes,
    attributes: getAttributes(element),
    outerHTML: truncateString(element.outerHTML, maxOuterHTMLLength),
    innerText: truncateString(
      htmlElement.innerText || element.textContent || "",
      maxInnerTextLength,
    ),
    sourceLocation,
  };
}

/**
 * Format computed styles as a CSS string
 */
export function formatStylesAsCSS(
  styles: ComputedStylesInfo,
  options: { includeCategories?: boolean; indent?: string } = {},
): string {
  const { includeCategories = true, indent = "  " } = options;
  const lines: string[] = [];

  for (const [category, properties] of Object.entries(styles)) {
    const entries = Object.entries(properties);
    if (entries.length === 0) continue;

    if (includeCategories) {
      lines.push(`/* ${category} */`);
    }

    for (const [prop, value] of entries) {
      lines.push(`${indent}${camelToKebab(prop)}: ${value};`);
    }

    if (includeCategories) {
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

/**
 * Format box model as a readable string
 */
export function formatBoxModel(boxModel: BoxModelInfo): string {
  const { content, padding, border, margin, position } = boxModel;
  const lines = [
    `Position: ${position.left}px, ${position.top}px`,
    `Size: ${content.width} × ${content.height}px (content)`,
    `Padding: ${padding.top} ${padding.right} ${padding.bottom} ${padding.left}`,
    `Border: ${border.top} ${border.right} ${border.bottom} ${border.left}`,
    `Margin: ${margin.top} ${margin.right} ${margin.bottom} ${margin.left}`,
  ];
  return lines.join("\n");
}

// Helper functions

function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

/**
 * Check if a class name is a utility class (Tailwind, Bootstrap, etc.)
 * These are typically unstable and should be avoided in selectors
 */
function isUtilityClass(className: string): boolean {
  // Tailwind-style utility patterns
  const utilityPatterns = [
    /^(p|m|pt|pr|pb|pl|px|py|mt|mr|mb|ml|mx|my)-/, // spacing
    /^(w|h|min-w|min-h|max-w|max-h)-/, // sizing
    /^(text|font|leading|tracking|text-)-/, // typography
    /^(bg|border|ring|shadow|outline)-/, // colors/borders
    /^(flex|grid|inline|block|hidden|visible)-/, // display
    /^(absolute|relative|fixed|sticky|static)$/, // position
    /^(top|right|bottom|left|inset)-/, // position values
    /^(rounded|opacity|cursor|pointer|select)-/, // misc utilities
    /^(hover|focus|active|disabled|group):/, // state modifiers
    /^(sm|md|lg|xl|2xl):/, // breakpoint modifiers
    /^\[.*\]$/, // arbitrary values like bg-[#000]
  ];

  return utilityPatterns.some((pattern) => pattern.test(className));
}

/**
 * Get meaningful classes for selector (non-utility classes)
 */
function getMeaningfulClasses(element: Element): string[] {
  return Array.from(element.classList)
    .filter((c) => !isUtilityClass(c))
    .slice(0, 2); // Max 2 meaningful classes
}

function generateUniqueSelector(element: Element): string {
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

    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      path.unshift(selector);
      break;
    }

    // Only include meaningful classes (not utility classes)
    const meaningfulClasses = getMeaningfulClasses(current);
    if (meaningfulClasses.length > 0) {
      selector += meaningfulClasses.map((c) => `.${CSS.escape(c)}`).join("");
    }

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

function getImplicitRole(element: Element): string | null {
  const tagName = element.tagName.toLowerCase();
  const type = element.getAttribute("type");

  const roleMap: Record<string, string> = {
    a: element.hasAttribute("href") ? "link" : "generic",
    article: "article",
    aside: "complementary",
    button: "button",
    dialog: "dialog",
    footer: "contentinfo",
    form: "form",
    h1: "heading",
    h2: "heading",
    h3: "heading",
    h4: "heading",
    h5: "heading",
    h6: "heading",
    header: "banner",
    img: "img",
    input:
      type === "checkbox"
        ? "checkbox"
        : type === "radio"
          ? "radio"
          : type === "submit" || type === "button"
            ? "button"
            : "textbox",
    li: "listitem",
    main: "main",
    nav: "navigation",
    ol: "list",
    option: "option",
    progress: "progressbar",
    section: "region",
    select: "combobox",
    table: "table",
    td: "cell",
    textarea: "textbox",
    th: "columnheader",
    tr: "row",
    ul: "list",
  };

  return roleMap[tagName] || null;
}

function getAccessibleName(element: Element): string | null {
  // Check aria-label first
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const labelledById = element.getAttribute("aria-labelledby");
  if (labelledById && typeof document !== "undefined") {
    const ids = labelledById.split(/\s+/);
    const texts = ids
      .map((id) => document.getElementById(id)?.textContent)
      .filter(Boolean);
    if (texts.length > 0) return texts.join(" ");
  }

  // Check for associated label
  if (element.id && typeof document !== "undefined") {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent;
  }

  // Check alt attribute for images
  const alt = element.getAttribute("alt");
  if (alt) return alt;

  // Check title attribute
  const title = element.getAttribute("title");
  if (title) return title;

  // For buttons and links, use text content
  const tagName = element.tagName.toLowerCase();
  if (tagName === "button" || tagName === "a") {
    return element.textContent?.trim() || null;
  }

  return null;
}

function isKeyboardFocusable(element: Element): boolean {
  const htmlElement = element as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  const tabIndex = htmlElement.tabIndex;

  // Negative tabindex means focusable via script but not keyboard
  if (tabIndex < 0) return false;

  // Positive tabindex means explicitly focusable
  if (tabIndex > 0) return true;

  // tabIndex of 0 - check if naturally focusable
  const focusableTags = ["a", "button", "input", "select", "textarea"];
  if (focusableTags.includes(tagName)) {
    // Links need href to be focusable
    if (tagName === "a" && !element.hasAttribute("href")) return false;
    // Check if disabled
    if (htmlElement.hasAttribute("disabled")) return false;
    return true;
  }

  // Has tabIndex=0 explicitly set
  if (element.hasAttribute("tabindex") && tabIndex === 0) return true;

  return false;
}

function createEmptyComputedStyles(): ComputedStylesInfo {
  return {
    layout: {},
    box: {},
    spacing: {},
    border: {},
    background: {},
    typography: {},
    flexbox: {},
    grid: {},
    effects: {},
  };
}

function createEmptyBoxModel(): BoxModelInfo {
  return {
    content: { width: 0, height: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    border: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    total: { width: 0, height: 0 },
    position: { top: 0, left: 0 },
  };
}
