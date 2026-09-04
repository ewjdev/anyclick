import { useCallback, useEffect, useRef, useState } from "react";
import CopyButton from "../CopyButton";
import { clearHighlights, highlightTarget } from "../highlight";
import { HighlightColors } from "../types";

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
  },
  lineDisabled: {
    opacity: 0.6,
    fontStyle: "italic",
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
  relationLabel: {
    fontSize: "9px",
    color: "#666",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginRight: "6px",
    minWidth: "50px",
    flexShrink: 0,
  },
  ellipsisButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px 8px",
    margin: "1px 0 1px 8px",
    backgroundColor: "transparent",
    border: "1px dashed #444",
    borderRadius: "3px",
    cursor: "pointer",
    color: "#888",
    fontSize: "14px",
    fontWeight: "bold",
    letterSpacing: "2px",
    transition: "all 0.15s ease",
    minHeight: "24px",
    maxHeight: "24px",
  },
  ellipsisButtonHover: {
    backgroundColor: "rgba(86, 156, 214, 0.15)",
    borderColor: "#569cd6",
    color: "#569cd6",
  },
  ancestorChooser: {
    position: "absolute" as const,
    top: "100%",
    left: "8px",
    right: "8px",
    zIndex: 1000,
    backgroundColor: "#252525",
    border: "1px solid #444",
    borderRadius: "6px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
    maxHeight: "200px",
    overflowY: "auto" as const,
    marginTop: "4px",
  },
  ancestorChooserHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 10px",
    borderBottom: "1px solid #333",
    backgroundColor: "#1e1e1e",
    fontSize: "10px",
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  ancestorChooserClose: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    border: "none",
    backgroundColor: "transparent",
    color: "#888",
    cursor: "pointer",
    fontSize: "14px",
    padding: 0,
    borderRadius: "3px",
  },
  ancestorList: {
    padding: "4px 0",
  },
  ancestorItem: {
    display: "flex",
    alignItems: "center",
    padding: "4px 10px",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    fontSize: "12px",
    borderLeft: "2px solid transparent",
  },
  ancestorItemHover: {
    backgroundColor: "rgba(86, 156, 214, 0.15)",
    borderLeftColor: "#569cd6",
  },
  ancestorItemDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    fontStyle: "italic",
  },
  ancestorItemFocused: {
    backgroundColor: "rgba(86, 156, 214, 0.25)",
    outline: "1px solid #569cd6",
    outlineOffset: "-1px",
  },
  depthIndicator: {
    fontSize: "8px",
    color: "#666",
    marginLeft: "auto",
    paddingLeft: "8px",
  },
};

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

function isProviderBoundary(element: Element | null): boolean {
  if (!element) return true;
  if (element.hasAttribute("data-anyclick-provider")) return true;
  if (element === document.body || element === document.documentElement) {
    return true;
  }
  return false;
}

const ANYCLICK_UI_MARKERS = [
  "data-anyclick-ui",
  "data-anyclick-inspector",
  "data-anyclick-menu",
  "data-anyclick-pointer",
  "data-anyclick-toast",
  "data-anyclick-overlay",
] as const;

export function isAnyclickOwnedUI(element: Element): boolean {
  let current: Element | null = element;
  while (current) {
    for (const marker of ANYCLICK_UI_MARKERS) {
      if (current.hasAttribute(marker)) return true;
    }
    current = current.parentElement;
  }
  return false;
}

export function isStructuralElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  return BLACKLISTED_TAGS.has(tagName);
}

export function isBlacklisted(element: Element): boolean {
  return isStructuralElement(element) || isAnyclickOwnedUI(element);
}

function shouldHideElement(element: Element): boolean {
  // Check computed style first - if display:none or visibility:hidden, definitely hide
  if (typeof window !== 'undefined' && window.getComputedStyle) {
    try {
      const style = window.getComputedStyle(element);
      if (style.display === 'none') return true;
      if (style.visibility === 'hidden') return true;
    } catch {
      // Ignore errors from getComputedStyle
    }
  }
  
  // Check bounding rect - but be lenient
  // Only hide if truly zero-size AND has no text content
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    // Check if element has any text content - if so, it might still be valid
    // (e.g., display:contents elements or inline elements not yet laid out)
    const hasTextContent = element.textContent && element.textContent.trim().length > 0;
    if (!hasTextContent) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if an element is eligible for navigation in the hierarchy.
 * An element is eligible if it's not hidden and not blacklisted.
 * @param element - The element to check
 * @returns True if the element can be navigated to
 */
export function isEligibleForNavigation(element: Element): boolean {
  if (shouldHideElement(element)) return false;
  if (isBlacklisted(element)) return false;
  return true;
}

function getElementInfo(element: Element) {
  const tagName = element.tagName.toLowerCase();
  const id = element.id || null;
  const classNames = Array.from(element.classList);
  return { tagName, id, classNames };
}

/**
 * Find the nearest eligible parent element in the DOM hierarchy.
 * Traverses upward through the DOM tree, stopping at provider boundaries.
 * @param element - The element whose parent to find
 * @returns The first eligible parent element, or null if none found
 */
export function findEligibleParent(
  element: Element
): Element | null {
  let current = element.parentElement;
  while (current && !isProviderBoundary(current)) {
    if (isEligibleForNavigation(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * Find the nearest eligible previous sibling element.
 * Traverses backward through siblings until an eligible element is found.
 * @param element - The element whose previous sibling to find
 * @returns The first eligible previous sibling, or null if none found
 */
export function findEligiblePrevSibling(
  element: Element
): Element | null {
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (isEligibleForNavigation(sibling)) {
      return sibling;
    }
    sibling = sibling.previousElementSibling;
  }
  return null;
}

/**
 * Find the nearest eligible next sibling element.
 * Traverses forward through siblings until an eligible element is found.
 * @param element - The element whose next sibling to find
 * @returns The first eligible next sibling, or null if none found
 */
export function findEligibleNextSibling(
  element: Element
): Element | null {
  let sibling = element.nextElementSibling;
  while (sibling) {
    if (isEligibleForNavigation(sibling)) {
      return sibling;
    }
    sibling = sibling.nextElementSibling;
  }
  return null;
}

/**
 * Find the first eligible child element.
 * Traverses through children until an eligible element is found.
 * @param element - The element whose first child to find
 * @returns The first eligible child element, or null if none found
 */
export function findEligibleFirstChild(
  element: Element
): Element | null {
  let child = element.firstElementChild;
  while (child) {
    if (isEligibleForNavigation(child)) {
      return child;
    }
    child = child.nextElementSibling;
  }
  return null;
}

/**
 * Find all ancestor elements between the parent and provider boundary.
 * These are ancestors not directly shown in the compact navigation view.
 * @param element - The current element
 * @param parentElement - The immediate eligible parent element
 * @returns Array of all ancestor elements above the parent, up to the provider boundary
 */
export function findOmittedAncestors(
  element: Element,
  parentElement: Element | null
): Element[] {
  if (!parentElement) {
    return [];
  }

  const ancestors: Element[] = [];
  let current = parentElement.parentElement;

  while (current && !isProviderBoundary(current)) {
    if (isEligibleForNavigation(current)) {
      ancestors.push(current);
    }
    current = current.parentElement;
  }

  return ancestors;
}

/**
 * Dropdown component that displays omitted ancestor elements for selection.
 * Provides keyboard navigation (Arrow keys, Enter, Escape) and hover highlighting.
 * @param ancestors - Array of ancestor elements to display
 * @param onSelect - Callback when an ancestor is selected
 * @param onClose - Callback when the chooser should be closed
 * @param onMouseEnter - Callback when hovering over an ancestor
 * @param onMouseLeave - Callback when leaving hover over an ancestor
 * @param highlightColors - Optional colors for highlighting elements
 */
function AncestorChooser({
  ancestors,
  onSelect,
  onClose,
  onMouseEnter,
  onMouseLeave,
  highlightColors,
}: {
  ancestors: Element[];
  onSelect: (element: Element) => void;
  onClose: () => void;
  onMouseEnter: (element: Element) => void;
  onMouseLeave: () => void;
  highlightColors?: HighlightColors;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape": {
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev + 1;
            return next >= ancestors.length ? 0 : next;
          });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? ancestors.length - 1 : next;
          });
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          const focusedAncestor = ancestors[focusedIndex];
          if (focusedAncestor && isEligibleForNavigation(focusedAncestor)) {
            onSelect(focusedAncestor);
          }
          break;
        }
        default:
          break;
      }
    };

    const list = listRef.current;
    if (!list) return;

    list.focus();
    list.addEventListener("keydown", handleKeyDown);
    return () => list.removeEventListener("keydown", handleKeyDown);
  }, [ancestors, focusedIndex, onClose, onSelect]);

  useEffect(() => {
    if (ancestors[focusedIndex] && isEligibleForNavigation(ancestors[focusedIndex])) {
      onMouseEnter(ancestors[focusedIndex]);
    }
  }, [focusedIndex, ancestors, onMouseEnter]);

  const handleItemMouseEnter = (element: Element, index: number) => {
    setHoveredIndex(index);
    setFocusedIndex(index);
    if (isEligibleForNavigation(element)) {
      onMouseEnter(element);
    }
  };

  const handleItemMouseLeave = () => {
    setHoveredIndex(null);
    onMouseLeave();
  };

  const handleItemClick = (element: Element) => {
    if (isEligibleForNavigation(element)) {
      onSelect(element);
    }
  };

  return (
    <div
      style={styles.ancestorChooser}
      role="listbox"
      aria-label="Ancestor elements"
      tabIndex={-1}
      ref={listRef}
    >
      <div style={styles.ancestorChooserHeader}>
        <span>Ancestors ({ancestors.length})</span>
        <button
          type="button"
          style={styles.ancestorChooserClose}
          onClick={onClose}
          aria-label="Close ancestor chooser"
        >
          ×
        </button>
      </div>
      <div style={styles.ancestorList} role="presentation">
        {ancestors.map((ancestor, index) => {
          const { tagName, id, classNames } = getElementInfo(ancestor);
          const isEligible = isEligibleForNavigation(ancestor);
          const isHovered = hoveredIndex === index;
          const isFocused = focusedIndex === index;
          const depth = index + 1;

          return (
            <div
              key={index}
              role="option"
              aria-selected={isFocused}
              aria-disabled={!isEligible}
              tabIndex={-1}
              style={{
                ...styles.ancestorItem,
                ...(isHovered && isEligible ? styles.ancestorItemHover : {}),
                ...(isFocused && !isHovered ? styles.ancestorItemFocused : {}),
                ...(!isEligible ? styles.ancestorItemDisabled : {}),
              }}
              onClick={() => handleItemClick(ancestor)}
              onMouseEnter={() => handleItemMouseEnter(ancestor, index)}
              onMouseLeave={handleItemMouseLeave}
            >
              <span style={styles.tag}>&lt;{tagName}</span>
              {id && <span style={styles.id}>#{id}</span>}
              {classNames.length > 0 && (
                <span style={styles.className}>
                  .{classNames.slice(0, 2).join(".")}
                  {classNames.length > 2 ? "..." : ""}
                </span>
              )}
              <span style={styles.tag}>&gt;</span>
              <span style={styles.depthIndicator}>↑{depth}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Renders a single line in the element hierarchy navigation.
 * Displays element tag, id, classes, and relation label (parent/prev/next/child).
 * Supports hover highlighting, selection, and keyboard navigation.
 * @param element - The element to display
 * @param isCurrent - Whether this is the currently selected element
 * @param relation - The relationship of this element to the current element
 * @param selector - Optional CSS selector for the current element
 * @param onSelect - Callback when this element is selected
 * @param onMouseEnter - Callback when mouse enters this element
 * @param onMouseLeave - Callback when mouse leaves this element
 * @param isHovered - Whether this element is currently being hovered
 */
function HierarchyLine({
  element,
  isCurrent,
  relation,
  selector,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  isHovered,
}: {
  element: Element;
  isCurrent: boolean;
  relation: "parent" | "prev" | "current" | "next" | "child";
  selector?: string;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isHovered: boolean;
}) {
  const { tagName, id, classNames } = getElementInfo(element);
  const blacklisted = isBlacklisted(element);
  
  const relationLabels: Record<string, string> = {
    parent: "parent",
    prev: "prev",
    current: "",
    next: "next",
    child: "child",
  };

  const lineStyle = {
    ...styles.line,
    ...(isCurrent ? styles.lineCurrent : {}),
    ...(isHovered && !isCurrent && !blacklisted ? styles.lineHover : {}),
    ...(blacklisted ? styles.lineDisabled : {}),
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!blacklisted) {
      onSelect();
    }
  };

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
      onMouseEnter={blacklisted ? undefined : onMouseEnter}
      onMouseLeave={blacklisted ? undefined : onMouseLeave}
      role={blacklisted ? undefined : "button"}
      tabIndex={blacklisted ? undefined : 0}
      onKeyDown={
        blacklisted
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
      }
      aria-label={
        blacklisted
          ? `${tagName} (not selectable)`
          : `Select ${tagName} element`
      }
    >
      {relation !== "current" && (
        <span style={styles.relationLabel}>{relationLabels[relation]}</span>
      )}
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
 * Compact element hierarchy navigator with selectable ancestor ellipses.
 * Displays parent, previous/next siblings, and first child of the target element.
 * Shows an ellipsis button for omitted ancestors that opens a dropdown chooser.
 * @param targetElement - The currently selected DOM element
 * @param elementInfo - Information about the target element (tag, id, classes, selector)
 * @param onSelectElement - Callback when a different element is selected
 * @param highlightColors - Optional colors for highlighting elements on hover
 * @param isCompact - Whether to use compact display mode (currently unused)
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
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [showAncestorChooser, setShowAncestorChooser] = useState(false);
  const [ellipsisHovered, setEllipsisHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parentElement = findEligibleParent(targetElement);
  const prevSibling = findEligiblePrevSibling(targetElement);
  const nextSibling = findEligibleNextSibling(targetElement);
  const firstChild = findEligibleFirstChild(targetElement);
  const omittedAncestors = findOmittedAncestors(targetElement, parentElement);
  const hasOmittedAncestors = omittedAncestors.length > 0;

  useEffect(() => {
    setShowAncestorChooser(false);
    setHoveredElement(null);
    setEllipsisHovered(false);
  }, [targetElement]);

  const closeAncestorChooser = useCallback(() => {
    setShowAncestorChooser(false);
    clearHighlights();
    highlightTarget(targetElement, highlightColors);
  }, [targetElement, highlightColors]);

  useEffect(() => {
    if (!showAncestorChooser) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAncestorChooser();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAncestorChooser, closeAncestorChooser]);

  const handleMouseEnter = useCallback(
    (element: Element) => {
      if (isBlacklisted(element)) return;
      setHoveredElement(element);
      clearHighlights();
      highlightTarget(element, highlightColors);
    },
    [highlightColors]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredElement(null);
    clearHighlights();
    highlightTarget(targetElement, highlightColors);
  }, [targetElement, highlightColors]);

  const handleSelect = useCallback(
    (element: Element) => {
      if (isBlacklisted(element)) return;
      clearHighlights();
      setShowAncestorChooser(false);
      onSelectElement?.(element);
    },
    [onSelectElement]
  );

  const handleEllipsisClick = useCallback(() => {
    setShowAncestorChooser((prev) => {
      if (prev) {
        clearHighlights();
        highlightTarget(targetElement, highlightColors);
      }
      return !prev;
    });
  }, [targetElement, highlightColors]);

  const handleEllipsisKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && showAncestorChooser) {
        e.preventDefault();
        closeAncestorChooser();
      }
    },
    [showAncestorChooser, closeAncestorChooser]
  );

  const handleAncestorSelect = useCallback(
    (element: Element) => {
      handleSelect(element);
    },
    [handleSelect]
  );

  return (
    <div style={{ ...styles.container, position: "relative" }} ref={containerRef}>
      {hasOmittedAncestors && (
        <button
          type="button"
          style={{
            ...styles.ellipsisButton,
            ...(ellipsisHovered || showAncestorChooser
              ? styles.ellipsisButtonHover
              : {}),
          }}
          onClick={handleEllipsisClick}
          onKeyDown={handleEllipsisKeyDown}
          onMouseEnter={() => setEllipsisHovered(true)}
          onMouseLeave={() => setEllipsisHovered(false)}
          aria-label={`Show ${omittedAncestors.length} omitted ancestor${
            omittedAncestors.length === 1 ? "" : "s"
          }`}
          aria-expanded={showAncestorChooser}
          aria-haspopup="listbox"
        >
          …
        </button>
      )}

      {showAncestorChooser && hasOmittedAncestors && (
        <AncestorChooser
          ancestors={omittedAncestors}
          onSelect={handleAncestorSelect}
          onClose={closeAncestorChooser}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          highlightColors={highlightColors}
        />
      )}

      {parentElement && (
        <HierarchyLine
          element={parentElement}
          isCurrent={false}
          relation="parent"
          onSelect={() => handleSelect(parentElement)}
          onMouseEnter={() => handleMouseEnter(parentElement)}
          onMouseLeave={handleMouseLeave}
          isHovered={hoveredElement === parentElement}
        />
      )}

      {prevSibling && (
        <HierarchyLine
          element={prevSibling}
          isCurrent={false}
          relation="prev"
          onSelect={() => handleSelect(prevSibling)}
          onMouseEnter={() => handleMouseEnter(prevSibling)}
          onMouseLeave={handleMouseLeave}
          isHovered={hoveredElement === prevSibling}
        />
      )}

      <HierarchyLine
        element={targetElement}
        isCurrent={true}
        relation="current"
        selector={elementInfo.selector}
        onSelect={() => {}}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
        isHovered={false}
      />

      {nextSibling && (
        <HierarchyLine
          element={nextSibling}
          isCurrent={false}
          relation="next"
          onSelect={() => handleSelect(nextSibling)}
          onMouseEnter={() => handleMouseEnter(nextSibling)}
          onMouseLeave={handleMouseLeave}
          isHovered={hoveredElement === nextSibling}
        />
      )}

      {firstChild && (
        <HierarchyLine
          element={firstChild}
          isCurrent={false}
          relation="child"
          onSelect={() => handleSelect(firstChild)}
          onMouseEnter={() => handleMouseEnter(firstChild)}
          onMouseLeave={handleMouseLeave}
          isHovered={hoveredElement === firstChild}
        />
      )}

      <div style={styles.selectorRow}>
        <code style={styles.selectorCode}>{elementInfo.selector}</code>
        <CopyButton text={elementInfo.selector} size="small" />
      </div>
    </div>
  );
}

export default ElementHierarchyNav;
