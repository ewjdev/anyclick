import { useCallback, useState } from "react";
import { HighlightColors } from "../types";
import { clearHighlights, highlightTarget } from "../highlight";
import CopyButton from "../CopyButton";

/**
 * Styles for ElementHierarchyNav
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "8px 8px",
    borderBottom: "1px solid #333",
    backgroundColor: "#1a1a1a",
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  },
  line: {
    display: "flex",
    alignItems: "center",
    padding: "2px 4px",
    margin: "1px 0",
    borderRadius: "3px",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    userSelect: "none" as const,
    fontSize: "13px",
    lineHeight: "20px",
    minHeight: "24px",
    maxHeight: "24px",
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
  },
  lineHover: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    outline: "1px solid rgba(86, 156, 214, 0.3)",
  },
  lineCurrent: {
    backgroundColor: "rgba(86, 156, 214, 0.15)",
    borderLeft: "2px solid #569cd6",
    // paddingLeft: "2px",
  },
  lineDisabled: {
    opacity: 0.6,
    fontStyle: "italic",
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
  "br",
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
 * Check if element is blacklisted (can show in hierarchy but details are hidden)
 * Exported so InspectDialog can use it to conditionally hide details
 */
export function isBlacklisted(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  if (BLACKLISTED_TAGS.has(tagName)) return true;

  // Our own UI elements - only check the element itself, not ancestors
  if (element.classList.contains("uifeedback-highlight-target")) return true;
  if (element.classList.contains("uifeedback-highlight-container")) {
    return true;
  }

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
 * Returns both the actual level and a capped display level
 */
function getIndentLevel(
  element: Element,
  targetElement: Element,
): {
  actualLevel: number;
  displayLevel: number;
} {
  let level = 0;
  let current: Element | null = targetElement;

  while (current && current !== element) {
    current = current.parentElement;
    if (current && !isProviderBoundary(current)) {
      level++;
    }
  }

  // Cap display level at 3 to prevent excessive indentation
  const MAX_DISPLAY_LEVEL = 3;
  return {
    actualLevel: level,
    displayLevel: Math.min(level, MAX_DISPLAY_LEVEL),
  };
}

/**
 * Render an ellipsis line to indicate skipped levels
 */
function EllipsisLine({ displayLevel }: { displayLevel: number }) {
  const indentPx = displayLevel * 16;
  return (
    <div
      style={{
        ...styles.line,
        paddingLeft: `${8 + indentPx}px`,
        color: "#666",
        fontSize: "12px",
        cursor: "default",
        pointerEvents: "none",
      }}
    >
      ...
    </div>
  );
}

/**
 * Render a single hierarchy line
 */
function HierarchyLine({
  element,
  isCurrent,
  displayLevel,
  selector,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  isHovered,
}: {
  element: Element;
  isCurrent: boolean;
  displayLevel: number;
  selector?: string;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isHovered: boolean;
}) {
  const { tagName, id, classNames } = getElementInfo(element);
  const blacklisted = isBlacklisted(element);
  const indentPx = displayLevel * 16; // Standard code editor indent

  const lineStyle = {
    ...styles.line,
    paddingLeft: `${8 + indentPx}px`,
    ...(isCurrent ? styles.lineCurrent : {}),
    ...(isHovered && !isCurrent ? styles.lineHover : {}),
    ...(blacklisted ? styles.lineDisabled : {}),
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  // Generate inspect command for console
  const inspectCommand = selector
    ? `inspect(document.querySelector('${selector}'))`
    : "";

  return (
    <div
      style={{
        ...lineStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
      }}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          minWidth: 0,
          flex: 1,
          overflow: "hidden",
        }}
      >
        <span style={{ ...styles.tag, flexShrink: 0 }}>&lt;{tagName}</span>
        {id && (
          <span
            style={{
              ...styles.id,
              flexShrink: 0,
              maxWidth: "150px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            #{id}
          </span>
        )}
        {classNames.length > 0 && (
          <span
            style={{
              ...styles.className,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            .{classNames.join(".")}
          </span>
        )}
        <span style={{ ...styles.tag, flexShrink: 0 }}>&gt;</span>
      </div>
      {isCurrent && selector && (
        <div
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
          title="Copy inspect() command for console"
        >
          <CopyButton text={inspectCommand} size="small" />
        </div>
      )}
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
  // Find previous sibling (line above)
  let prevElement: Element | null = targetElement.previousElementSibling;
  while (prevElement && shouldHideElement(prevElement)) {
    prevElement = prevElement.previousElementSibling;
  }

  // Find next element (line below) - prefer next sibling, then first child
  let nextElement: Element | null = targetElement.nextElementSibling;
  while (nextElement && shouldHideElement(nextElement)) {
    nextElement = nextElement.nextElementSibling;
  }

  // If no next sibling, try first child
  let nextIsChild = false;
  if (!nextElement) {
    nextElement = targetElement.firstElementChild;
    while (nextElement && shouldHideElement(nextElement)) {
      nextElement = nextElement.nextElementSibling;
    }
    if (nextElement) {
      nextIsChild = true;
    }
  }

  // Calculate actual depth of current element from document root
  let currentActualDepth = 0;
  let temp: Element | null = targetElement;
  while (temp && !isProviderBoundary(temp.parentElement)) {
    temp = temp.parentElement;
    if (temp) currentActualDepth++;
  }

  // Determine display levels - show as code editor lines
  const MAX_DISPLAY_LEVEL = 3;
  let needsEllipsis = currentActualDepth > MAX_DISPLAY_LEVEL;

  let prevDisplayLevel: number;
  let currentDisplayLevel: number;
  let nextDisplayLevel: number;

  if (needsEllipsis) {
    // Deeply nested: cap indentation, show ellipsis
    // But if next is a child, we need to keep it visually indented more
    if (nextIsChild) {
      // Show as: prev(2), current(2), child(3)
      prevDisplayLevel = MAX_DISPLAY_LEVEL - 1;
      currentDisplayLevel = MAX_DISPLAY_LEVEL - 1;
      nextDisplayLevel = MAX_DISPLAY_LEVEL;
    } else {
      // Show as: prev(3), current(3), sibling(3)
      prevDisplayLevel = MAX_DISPLAY_LEVEL;
      currentDisplayLevel = MAX_DISPLAY_LEVEL;
      nextDisplayLevel = MAX_DISPLAY_LEVEL;
    }
  } else {
    // Not deeply nested: show actual indentation
    prevDisplayLevel = currentActualDepth; // Sibling at same level
    currentDisplayLevel = currentActualDepth;
    nextDisplayLevel = nextIsChild
      ? currentActualDepth + 1
      : currentActualDepth;
  }

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
      {/* Ellipsis indicator when deeply nested */}
      {needsEllipsis && <EllipsisLine displayLevel={0} />}

      {/* Previous sibling line */}
      {prevElement && (
        <HierarchyLine
          element={prevElement}
          isCurrent={false}
          displayLevel={prevDisplayLevel}
          onSelect={() => handleSelect(prevElement)}
          onMouseEnter={() => handleMouseEnter(prevElement)}
          onMouseLeave={handleMouseLeave}
          isHovered={hoveredElement === prevElement}
        />
      )}

      {/* Current line (selected) */}
      <HierarchyLine
        element={targetElement}
        isCurrent={true}
        displayLevel={currentDisplayLevel}
        selector={elementInfo.selector}
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
          displayLevel={nextDisplayLevel}
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
