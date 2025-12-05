import { useCallback, useState } from "react";
import { HighlightColors } from "../types";
import { clearHighlights, highlightTarget } from "../highlight";
import CopyButton from "../CopyButton";

/**
 * Styles for ElementHierarchyNav
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "10px 12px",
    borderBottom: "1px solid #333",
    backgroundColor: "#1a1a1a",
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  },
  line: {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    margin: "2px 0",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  lineHover: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  lineCurrent: {
    backgroundColor: "rgba(86, 156, 214, 0.15)",
    borderLeft: "2px solid #569cd6",
    paddingLeft: "6px",
  },
  lineDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  tag: {
    color: "#569cd6",
  },
  id: {
    color: "#9cdcfe",
  },
  className: {
    color: "#4ec9b0",
  },
  selectorRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "8px",
    paddingTop: "8px",
    borderTop: "1px solid #2a2a2a",
  },
  selectorCode: {
    flex: 1,
    padding: "5px 8px",
    backgroundColor: "#2d2d2d",
    borderRadius: "4px",
    color: "#ce9178",
    fontSize: "11px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};

// Elements that should not be selectable but can be shown in hierarchy
const BLACKLISTED_TAGS = new Set([
  "svg",
  "path",
  "circle",
  "rect",
  "line",
  "polygon",
  "polyline",
  "ellipse",
  "g",
  "defs",
  "use",
  "symbol",
  "text",
  "tspan",
  "script",
  "style",
  "noscript",
  "template",
  "slot",
  "next-route-announcer",
]);

/**
 * Check if element is at the AnyclickProvider boundary
 */
function isProviderBoundary(element: Element | null): boolean {
  if (!element) return true;
  if (element.hasAttribute("data-anyclick-provider")) return true;
  if (element === document.body || element === document.documentElement) {
    return true;
  }
  return false;
}

/**
 * Check if element is blacklisted (can show but not select)
 */
function isBlacklisted(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  if (BLACKLISTED_TAGS.has(tagName)) return true;

  // Our own UI elements
  if (element.classList.contains("uifeedback-highlight-target")) return true;
  if (element.classList.contains("uifeedback-highlight-container")) {
    return true;
  }
  if (element.closest('[role="dialog"][aria-label="Element Inspector"]')) {
    return true;
  }
  if (element.closest('[role="menu"]')) return true;

  return false;
}

/**
 * Check if element should be completely hidden from hierarchy
 */
function shouldHideElement(element: Element): boolean {
  // Hide zero-size elements
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return true;

  return false;
}

/**
 * Get element info for display
 */
function getElementInfo(element: Element) {
  const tagName = element.tagName.toLowerCase();
  const id = element.id || null;
  const classNames = Array.from(element.classList);

  return { tagName, id, classNames };
}

/**
 * Calculate indentation level by counting parents up to boundary
 */
function getIndentLevel(element: Element, targetElement: Element): number {
  let level = 0;
  let current: Element | null = targetElement;

  while (current && current !== element) {
    current = current.parentElement;
    if (current && !isProviderBoundary(current)) {
      level++;
    }
  }

  return level;
}

/**
 * Render a single hierarchy line
 */
function HierarchyLine({
  element,
  isCurrent,
  indentLevel,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  isHovered,
}: {
  element: Element;
  isCurrent: boolean;
  indentLevel: number;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isHovered: boolean;
}) {
  const { tagName, id, classNames } = getElementInfo(element);
  const blacklisted = isBlacklisted(element);
  const indentPx = indentLevel * 16;

  const lineStyle = {
    ...styles.line,
    paddingLeft: `${8 + indentPx}px`,
    ...(isCurrent ? styles.lineCurrent : {}),
    ...(isHovered && !isCurrent ? styles.lineHover : {}),
    ...(blacklisted ? styles.lineDisabled : {}),
  };

  const handleClick = () => {
    if (!blacklisted) {
      onSelect();
    }
  };

  return (
    <div
      style={lineStyle}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span style={styles.tag}>&lt;{tagName}</span>
      {id && <span style={styles.id}>#{id}</span>}
      {classNames.length > 0 && (
        <span style={styles.className}>
          .{classNames.slice(0, 2).join(".")}
          {classNames.length > 2 && "…"}
        </span>
      )}
      <span style={styles.tag}>&gt;</span>
    </div>
  );
}

/**
 * ElementHierarchyNav - shows parent, current, and next element
 * in a simple HTML structure view with proper indentation
 */
function ElementHierarchyNav({
  targetElement,
  elementInfo,
  onSelectElement,
  highlightColors,
  isCompact = false,
}: {
  targetElement: Element;
  elementInfo: {
    tagName: string;
    id: string | null;
    classNames: string[];
    selector: string;
  };
  onSelectElement?: (element: Element) => void;
  highlightColors?: HighlightColors;
  isCompact?: boolean;
}) {
  // Find parent (line above)
  let parent: Element | null = targetElement.parentElement;
  while (parent && (shouldHideElement(parent) || isProviderBoundary(parent))) {
    if (isProviderBoundary(parent)) {
      parent = null;
      break;
    }
    parent = parent.parentElement;
  }

  // Find next element (line below) - prefer next sibling, then first child
  let nextElement: Element | null = targetElement.nextElementSibling;
  while (nextElement && shouldHideElement(nextElement)) {
    nextElement = nextElement.nextElementSibling;
  }

  // If no sibling, try first child
  let isChild = false;
  if (!nextElement) {
    nextElement = targetElement.firstElementChild;
    while (nextElement && shouldHideElement(nextElement)) {
      nextElement = nextElement.nextElementSibling;
    }
    if (nextElement) {
      isChild = true;
    }
  }

  // Calculate indent levels
  const parentIndent = parent ? getIndentLevel(parent, targetElement) : 0;
  const currentIndent = parent ? parentIndent + 1 : 0;
  const nextIndent = isChild ? currentIndent + 1 : currentIndent;

  // Hover state
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);

  const handleMouseEnter = useCallback(
    (element: Element) => {
      setHoveredElement(element);
      highlightTarget(element, highlightColors);
    },
    [highlightColors],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredElement(null);
    clearHighlights();
    highlightTarget(targetElement, highlightColors);
  }, [targetElement, highlightColors]);

  const handleSelect = useCallback(
    (element: Element) => {
      clearHighlights();
      onSelectElement?.(element);
    },
    [onSelectElement],
  );

  return (
    <div style={styles.container}>
      {/* Parent line */}
      {parent && (
        <HierarchyLine
          element={parent}
          isCurrent={false}
          indentLevel={parentIndent}
          onSelect={() => handleSelect(parent)}
          onMouseEnter={() => handleMouseEnter(parent)}
          onMouseLeave={handleMouseLeave}
          isHovered={hoveredElement === parent}
        />
      )}

      {/* Current line */}
      <HierarchyLine
        element={targetElement}
        isCurrent={true}
        indentLevel={currentIndent}
        onSelect={() => {}}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
        isHovered={false}
      />

      {/* Next line (sibling or child) */}
      {nextElement && (
        <HierarchyLine
          element={nextElement}
          isCurrent={false}
          indentLevel={nextIndent}
          onSelect={() => handleSelect(nextElement)}
          onMouseEnter={() => handleMouseEnter(nextElement)}
          onMouseLeave={handleMouseLeave}
          isHovered={hoveredElement === nextElement}
        />
      )}

      {/* Selector display */}
      <div style={styles.selectorRow}>
        <code style={styles.selectorCode}>{elementInfo.selector}</code>
        <CopyButton text={elementInfo.selector} size="small" />
      </div>
    </div>
  );
}

export default ElementHierarchyNav;
