/**
 * IDE protocol handler integration for opening files directly in IDEs.
 * Supports VS Code, Cursor, WebStorm, and other IDEs that support URL protocols.
 */

/**
 * Supported IDE protocol types
 */
export type IDEProtocol =
  | "vscode"
  | "cursor"
  | "webstorm"
  | "intellij"
  | "phpstorm"
  | "sublime"
  | "atom"
  | "custom";

/**
 * Configuration for IDE integration
 */
export interface IDEConfig {
  /** The IDE protocol to use */
  protocol: IDEProtocol;
  /** Custom protocol string (only used when protocol is 'custom') */
  customProtocol?: string;
  /** Base path to prepend to file paths (for mapping web paths to file system) */
  basePath?: string;
  /** Path transformations to apply (regex find/replace) */
  pathTransforms?: Array<{
    find: string | RegExp;
    replace: string;
  }>;
}

/**
 * Source location information
 */
export interface SourceLocation {
  /** File path */
  file: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (1-indexed, optional) */
  column?: number;
}

/**
 * Default IDE configuration
 */
const DEFAULT_IDE_CONFIG: IDEConfig = {
  protocol: "cursor",
};

/**
 * Protocol URL templates for different IDEs
 * {file} = file path, {line} = line number, {column} = column number
 */
const PROTOCOL_TEMPLATES: Record<IDEProtocol, string> = {
  vscode: "vscode://file/{file}:{line}:{column}",
  cursor: "cursor://file/{file}:{line}:{column}",
  webstorm: "webstorm://open?file={file}&line={line}&column={column}",
  intellij: "idea://open?file={file}&line={line}&column={column}",
  phpstorm: "phpstorm://open?file={file}&line={line}&column={column}",
  sublime: "subl://open?url=file://{file}&line={line}&column={column}",
  atom: "atom://open?url=file://{file}&line={line}&column={column}",
  custom: "", // Placeholder, will use customProtocol
};

/**
 * Build the URL for opening a file in an IDE
 */
export function buildIDEUrl(
  location: SourceLocation,
  config: Partial<IDEConfig> = {},
): string {
  const mergedConfig: IDEConfig = { ...DEFAULT_IDE_CONFIG, ...config };
  let filePath = location.file;

  // Apply base path if provided
  if (mergedConfig.basePath) {
    // Remove leading slash from file path if base path doesn't end with one
    if (!mergedConfig.basePath.endsWith("/") && filePath.startsWith("/")) {
      filePath = filePath.slice(1);
    }
    filePath = `${mergedConfig.basePath}/${filePath}`.replace(/\/+/g, "/");
  }

  // Apply path transformations
  if (mergedConfig.pathTransforms) {
    for (const transform of mergedConfig.pathTransforms) {
      filePath = filePath.replace(transform.find, transform.replace);
    }
  }

  // Get the template
  let template =
    mergedConfig.protocol === "custom"
      ? mergedConfig.customProtocol || ""
      : PROTOCOL_TEMPLATES[mergedConfig.protocol];

  // Replace placeholders
  const url = template
    .replace("{file}", encodeURIComponent(filePath))
    .replace("{line}", String(location.line))
    .replace("{column}", String(location.column || 1));

  return url;
}

/**
 * Open a file in the IDE using the protocol handler
 */
export function openInIDE(
  location: SourceLocation,
  config: Partial<IDEConfig> = {},
): boolean {
  if (typeof window === "undefined") {
    console.warn("openInIDE: Cannot open IDE in non-browser environment");
    return false;
  }

  try {
    const url = buildIDEUrl(location, config);

    // Use window.open with a short timeout to avoid popup blockers
    // The protocol handler should intercept this
    window.location.href = url;

    return true;
  } catch (error) {
    console.error("Failed to open file in IDE:", error);
    return false;
  }
}

/**
 * Check if the current environment likely supports IDE protocol handlers
 * Note: This is a heuristic and may not be 100% accurate
 */
export function isIDEProtocolSupported(): boolean {
  if (typeof window === "undefined") return false;

  // Protocol handlers are generally supported on desktop browsers
  // but not on mobile or in some restricted environments
  const userAgent = navigator.userAgent.toLowerCase();

  // Mobile browsers generally don't support custom protocol handlers well
  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    return false;
  }

  return true;
}

/**
 * Detect the most likely IDE based on environment
 * This is a heuristic based on common development setups
 */
export function detectPreferredIDE(): IDEProtocol {
  if (typeof window === "undefined") return "vscode";

  // Check for Cursor-specific indicators
  // Cursor sets some specific user agent or environment hints
  const userAgent = navigator.userAgent;

  // For now, default to Cursor since this is the anyclick project
  // In production, this could be enhanced with better detection
  return "cursor";
}

/**
 * Try to extract source location from element data attributes
 */
export function getSourceLocationFromElement(
  element: Element,
): SourceLocation | null {
  const htmlElement = element as HTMLElement;
  const dataset = htmlElement.dataset || {};

  // Try different data attribute conventions
  const file =
    dataset.sourceFile ||
    dataset["source-file"] ||
    element.getAttribute("data-source-file") ||
    dataset.file ||
    element.getAttribute("data-file");

  const line =
    dataset.sourceLine ||
    dataset["source-line"] ||
    element.getAttribute("data-source-line") ||
    dataset.line ||
    element.getAttribute("data-line");

  if (!file || !line) {
    return null;
  }

  const column =
    dataset.sourceColumn ||
    dataset["source-column"] ||
    element.getAttribute("data-source-column") ||
    dataset.column ||
    element.getAttribute("data-column");

  return {
    file,
    line: parseInt(line, 10),
    column: column ? parseInt(column, 10) : undefined,
  };
}

/**
 * Walk up the DOM tree to find source location from any ancestor
 */
export function findSourceLocationInAncestors(
  element: Element,
  maxDepth: number = 10,
): SourceLocation | null {
  let current: Element | null = element;
  let depth = 0;

  while (current && depth < maxDepth) {
    const location = getSourceLocationFromElement(current);
    if (location) {
      return location;
    }
    current = current.parentElement;
    depth++;
  }

  return null;
}

/**
 * Create a configured IDE opener function
 */
export function createIDEOpener(
  config: Partial<IDEConfig> = {},
): (location: SourceLocation) => boolean {
  return (location: SourceLocation) => openInIDE(location, config);
}

/**
 * Format a source location as a readable string
 */
export function formatSourceLocation(location: SourceLocation): string {
  const { file, line, column } = location;
  if (column !== undefined) {
    return `${file}:${line}:${column}`;
  }
  return `${file}:${line}`;
}
