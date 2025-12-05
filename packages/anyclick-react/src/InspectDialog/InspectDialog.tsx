"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import {
  getElementInspectInfo,
  formatStylesAsCSS,
  type ElementInspectInfo,
  type BoxModelInfo,
} from "@ewjdev/anyclick-core";
import {
  openInIDE,
  findSourceLocationInAncestors,
  formatSourceLocation,
  type IDEConfig,
  type SourceLocation,
} from "../ide";
import { highlightTarget, clearHighlights } from "../highlight";
import { generateCompactStyles, type HighlightColors } from "../types";
import {
  useInspectStore,
  generateElementId,
  getElementDescription as getModElementDescription,
  type ElementModification,
} from "./inspectStore";
import {
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code,
  Accessibility,
  Palette,
  Box,
  Type,
  Layout,
  Trash2,
  GripVertical,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  Maximize2,
  FileCode,
  Layers,
  ArrowDown,
  RotateCcw,
  History,
} from "lucide-react";
import ElementHierarchyNav, { isBlacklisted } from "./ElementHierarchyNav";

/**
 * Types of style origins
 */
type StyleOriginType =
  | "inline"
  | "stylesheet"
  | "inherited"
  | "user-agent"
  | "initial";

/**
 * Information about where a style comes from
 */
interface StyleOrigin {
  type: StyleOriginType;
  selector?: string;
  specificity?: string;
  sourceFile?: string;
  lineNumber?: number;
  inherited?: boolean;
  inheritedFrom?: string;
  rulePriority?: number;
  isImportant?: boolean;
}

/**
 * Get the origin of a computed style property
 */
function getStyleOrigin(element: Element, property: string): StyleOrigin {
  const kebabProperty = property.replace(/([A-Z])/g, "-$1").toLowerCase();

  // Check if it's an inline style
  if (element instanceof HTMLElement) {
    const inlineValue = element.style.getPropertyValue(kebabProperty);
    if (inlineValue) {
      return {
        type: "inline",
        selector: "element.style",
        isImportant:
          element.style.getPropertyPriority(kebabProperty) === "important",
      };
    }
  }

  // Try to find the style in stylesheets
  const matchedRules = findMatchingCSSRules(element, kebabProperty);
  if (matchedRules.length > 0) {
    // Get the highest priority rule (last one wins in CSS, unless !important)
    const winningRule = matchedRules[matchedRules.length - 1];
    return {
      type: "stylesheet",
      selector: winningRule.selector,
      specificity: winningRule.specificity,
      sourceFile: winningRule.sourceFile,
      isImportant: winningRule.isImportant,
      rulePriority: matchedRules.length,
    };
  }

  // Check if inherited from parent
  const inheritedOrigin = checkInheritedStyle(element, kebabProperty);
  if (inheritedOrigin) {
    return inheritedOrigin;
  }

  // Default to user-agent or initial
  return {
    type: "user-agent",
    selector: "browser default",
  };
}

/**
 * Find CSS rules that match an element and contain a property
 */
function findMatchingCSSRules(
  element: Element,
  property: string,
): Array<{
  selector: string;
  specificity: string;
  sourceFile?: string;
  isImportant: boolean;
}> {
  const matchedRules: Array<{
    selector: string;
    specificity: string;
    sourceFile?: string;
    isImportant: boolean;
  }> = [];

  try {
    // Iterate through all stylesheets
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      let rules: CSSRuleList;

      try {
        rules = sheet.cssRules || sheet.rules;
      } catch {
        // Cross-origin stylesheets throw security errors
        continue;
      }

      if (!rules) continue;

      const sourceFile = sheet.href
        ? new URL(sheet.href).pathname.split("/").pop()
        : "inline <style>";

      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j];
        if (rule instanceof CSSStyleRule) {
          try {
            if (element.matches(rule.selectorText)) {
              const value = rule.style.getPropertyValue(property);
              if (value) {
                matchedRules.push({
                  selector: rule.selectorText,
                  specificity: calculateSpecificity(rule.selectorText),
                  sourceFile,
                  isImportant:
                    rule.style.getPropertyPriority(property) === "important",
                });
              }
            }
          } catch {
            // Invalid selector, skip
          }
        }
      }
    }
  } catch {
    // Fallback if stylesheet access fails
  }

  // Sort by specificity (simplified)
  return matchedRules.sort((a, b) => {
    if (a.isImportant !== b.isImportant) {
      return a.isImportant ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Calculate CSS specificity (simplified version)
 */
function calculateSpecificity(selector: string): string {
  let ids = 0;
  let classes = 0;
  let elements = 0;

  // Count IDs
  ids = (selector.match(/#[\w-]+/g) || []).length;
  // Count classes, attributes, pseudo-classes
  classes = (selector.match(/\.[\w-]+|\[.*?\]|:(?!:)[\w-]+/g) || []).length;
  // Count elements and pseudo-elements
  elements = (selector.match(/^[\w-]+|[\s>+~][\w-]+|::[\w-]+/g) || []).length;

  return `(${ids},${classes},${elements})`;
}

/**
 * Check if a style is inherited from a parent element
 */
function checkInheritedStyle(
  element: Element,
  property: string,
): StyleOrigin | null {
  // List of inheritable properties
  const inheritableProperties = [
    "color",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "letter-spacing",
    "line-height",
    "text-align",
    "text-indent",
    "text-transform",
    "visibility",
    "white-space",
    "word-spacing",
    "cursor",
    "direction",
    "quotes",
    "list-style",
    "list-style-type",
    "list-style-position",
    "list-style-image",
  ];

  if (!inheritableProperties.includes(property)) {
    return null;
  }

  let parent = element.parentElement;
  let depth = 0;
  const maxDepth = 10;

  while (parent && depth < maxDepth) {
    // Check inline style on parent
    if (parent instanceof HTMLElement) {
      const parentInlineValue = parent.style.getPropertyValue(property);
      if (parentInlineValue) {
        return {
          type: "inherited",
          inheritedFrom: getElementDescription(parent),
          selector: "element.style",
        };
      }
    }

    // Check stylesheets for parent
    const parentRules = findMatchingCSSRules(parent, property);
    if (parentRules.length > 0) {
      const winningRule = parentRules[parentRules.length - 1];
      return {
        type: "inherited",
        inheritedFrom: getElementDescription(parent),
        selector: winningRule.selector,
        sourceFile: winningRule.sourceFile,
      };
    }

    parent = parent.parentElement;
    depth++;
  }

  return null;
}

/**
 * Get a short description of an element
 */
function getElementDescription(element: Element): string {
  let desc = element.tagName.toLowerCase();
  if (element.id) {
    desc += `#${element.id}`;
  } else if (element.className && typeof element.className === "string") {
    const firstClass = element.className.split(" ")[0];
    if (firstClass) {
      desc += `.${firstClass}`;
    }
  }
  return desc;
}

/**
 * Position where the dialog is pinned
 */
export type PinnedPosition = "left" | "right" | "top" | "bottom" | "floating";

/**
 * Compact mode configuration type
 * Adjust these values to control compact styling
 */
export interface CompactModeConfig {
  /** Base scaling factor (0.75 = 75% of normal size) */
  scale: number;
  /** Font sizes in pixels */
  fonts: {
    base: number; // Dialog base font
    title: number; // Header title
    tag: number; // Element tag/id/classes
    selector: number; // Selector code
    section: number; // Section headers
    badge: number; // Badges
    property: number; // Property labels/values
    styleRow: number; // Style property rows
    button: number; // Action buttons
  };
  /** Spacing (padding/margins) as CSS values */
  spacing: {
    headerPadding: string;
    identityPadding: string;
    sectionHeaderPadding: string;
    sectionContentPadding: string;
    footerPadding: string;
    selectorCodePadding: string;
    buttonPadding: string;
    buttonPrimaryPadding: string;
    buttonDangerPadding: string;
    badgePadding: string;
    propertyRowPadding: string;
    styleRowPadding: string;
  };
  /** Gap values as CSS values */
  gaps: {
    headerTitle: string;
    pinButtons: string;
    propertyRow: string;
    propertyValue: string;
    button: string;
    footer: string;
  };
  /** Size values in pixels */
  sizes: {
    dialogWidth: number;
    closeButton: number;
    copyButtonSmall: number;
    styleValueMaxWidth: number;
    categoryMarginBottom: number;
    styleCategoryHeaderMarginBottom: number;
  };
  /** Letter spacing values */
  letterSpacing: {
    sectionTitle: string;
  };
}

/**
 * Default compact mode configuration
 * Use this as a base to create custom configurations
 */
export const DEFAULT_COMPACT_CONFIG: CompactModeConfig = {
  scale: 0.5,
  fonts: {
    base: 9,
    title: 11,
    tag: 10,
    selector: 9,
    section: 9,
    badge: 8,
    property: 9,
    styleRow: 8,
    button: 9,
  },
  spacing: {
    headerPadding: "4px 8px",
    identityPadding: "8px 12px",
    sectionHeaderPadding: "4px 10px",
    sectionContentPadding: "0 10px 6px 20px",
    footerPadding: "6px 10px",
    selectorCodePadding: "4px 8px",
    buttonPadding: "4px 8px",
    buttonPrimaryPadding: "4px 10px",
    buttonDangerPadding: "4px 6px",
    badgePadding: "1px 4px",
    propertyRowPadding: "2px 0",
    styleRowPadding: "1px 0",
  },
  gaps: {
    headerTitle: "6px",
    pinButtons: "1px",
    propertyRow: "8px",
    propertyValue: "4px",
    button: "3px",
    footer: "6px",
  },
  sizes: {
    dialogWidth: 320,
    closeButton: 24,
    copyButtonSmall: 18,
    styleValueMaxWidth: 150,
    categoryMarginBottom: 8,
    styleCategoryHeaderMarginBottom: 2,
  },
  letterSpacing: {
    sectionTitle: "0.3px",
  },
};

/**
 * Context for compact mode (when pinned to edges)
 */
interface CompactModeContextValue {
  isCompact: boolean;
  styles: Record<string, React.CSSProperties>;
}

const CompactModeContext = createContext<CompactModeContextValue>({
  isCompact: false,
  styles: {}, // Empty default, will be provided by Provider
});

const useCompactMode = () => {
  const { isCompact, styles } = useContext(CompactModeContext);
  return { isCompact, compactStyles: styles };
};

/**
 * Context for target element editing
 */
interface TargetElementContextValue {
  element: Element | null;
  refreshInfo: () => void;
}

const TargetElementContext = createContext<TargetElementContextValue>({
  element: null,
  refreshInfo: () => {},
});

const useTargetElement = () => useContext(TargetElementContext);

/**
 * Editable value component - click to edit inline
 */
function EditableValue({
  value,
  onSave,
  mono = false,
  placeholder = "value",
}: {
  value: string;
  onSave: (newValue: string) => void;
  mono?: boolean;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isCompact, compactStyles } = useCompactMode();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          ...editableStyles.input,
          ...(isCompact ? editableStyles.inputCompact : {}),
          ...(mono ? inspectStyles.mono : {}),
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      style={{
        ...editableStyles.value,
        ...(mono ? inspectStyles.mono : {}),
        cursor: "pointer",
      }}
      title="Click to edit"
    >
      {value || <span style={{ opacity: 0.5 }}>{placeholder}</span>}
    </span>
  );
}

/**
 * Editable style row - for editing CSS properties
 */
function EditableStyleRow({
  prop,
  value,
  onValueChange,
  onDelete,
}: {
  prop: string;
  value: string;
  onValueChange: (prop: string, newValue: string) => void;
  onDelete?: (prop: string) => void;
}) {
  const { isCompact, compactStyles } = useCompactMode();

  return (
    <div
      style={{
        ...inspectStyles.styleRow,
        ...(isCompact ? compactStyles.styleRow : {}),
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span style={{ ...inspectStyles.styleProp, flex: "0 0 auto" }}>
        {camelToKebab(prop)}:
      </span>
      <EditableValue
        value={value}
        onSave={(newValue) => onValueChange(prop, newValue)}
        mono
        placeholder="value"
      />
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(prop)}
          style={editableStyles.deleteButton}
          title="Remove style"
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * Add new style/attribute row
 */
function AddNewRow({
  onAdd,
  propPlaceholder = "property",
  valuePlaceholder = "value",
}: {
  onAdd: (prop: string, value: string) => void;
  propPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newProp, setNewProp] = useState("");
  const [newValue, setNewValue] = useState("");
  const propInputRef = useRef<HTMLInputElement>(null);
  const { isCompact, compactStyles } = useCompactMode();

  useEffect(() => {
    if (isAdding && propInputRef.current) {
      propInputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = () => {
    if (newProp.trim() && newValue.trim()) {
      onAdd(newProp.trim(), newValue.trim());
      setNewProp("");
      setNewValue("");
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      setNewProp("");
      setNewValue("");
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        style={editableStyles.addButton}
      >
        + Add {propPlaceholder}
      </button>
    );
  }

  return (
    <div
      style={{
        ...inspectStyles.styleRow,
        ...(isCompact ? compactStyles.styleRow : {}),
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <input
        ref={propInputRef}
        type="text"
        value={newProp}
        onChange={(e) => setNewProp(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={propPlaceholder}
        style={{
          ...editableStyles.input,
          ...(isCompact ? editableStyles.inputCompact : {}),
          width: "80px",
          flex: "0 0 auto",
        }}
      />
      <span style={{ color: "#666" }}>:</span>
      <input
        type="text"
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={valuePlaceholder}
        style={{
          ...editableStyles.input,
          ...(isCompact ? editableStyles.inputCompact : {}),
          flex: 1,
        }}
      />
      <button
        type="button"
        onClick={handleAdd}
        style={editableStyles.confirmButton}
        title="Add"
      >
        ✓
      </button>
      <button
        type="button"
        onClick={() => {
          setNewProp("");
          setNewValue("");
          setIsAdding(false);
        }}
        style={editableStyles.cancelButton}
        title="Cancel"
      >
        ×
      </button>
    </div>
  );
}

/**
 * Editable attribute row
 */
function EditableAttributeRow({
  name,
  value,
  onValueChange,
  onDelete,
}: {
  name: string;
  value: string;
  onValueChange: (name: string, newValue: string) => void;
  onDelete?: (name: string) => void;
}) {
  const { isCompact, compactStyles } = useCompactMode();

  return (
    <div
      style={{
        ...inspectStyles.propertyRow,
        ...(isCompact ? compactStyles.propertyRow : {}),
        display: "flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          ...inspectStyles.propertyLabel,
          ...(isCompact ? compactStyles.propertyLabel : {}),
          flex: "0 0 auto",
        }}
      >
        {name}
      </span>
      <span
        style={{
          ...inspectStyles.propertyValue,
          ...(isCompact ? compactStyles.propertyValue : {}),
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <EditableValue
          value={value}
          onSave={(newValue) => onValueChange(name, newValue)}
          mono
          placeholder="value"
        />
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(name)}
            style={editableStyles.deleteButton}
            title="Remove attribute"
          >
            ×
          </button>
        )}
      </span>
    </div>
  );
}

/**
 * Props for the InspectDialog component
 */
export interface InspectDialogProps {
  /** Whether the dialog is visible */
  visible: boolean;
  /** The element being inspected */
  targetElement: Element | null;
  /** Callback when dialog is closed */
  onClose: () => void;
  /** Callback when selecting a different element (e.g., from modified elements list) */
  onSelectElement?: (element: Element) => void;
  /** IDE configuration for "Open in IDE" feature */
  ideConfig?: Partial<IDEConfig>;
  /** Custom styles for the dialog */
  style?: React.CSSProperties;
  /** Custom class name */
  className?: string;
  /** Custom highlight colors */
  highlightColors?: HighlightColors;
  /** Whether to show box model overlay (padding/margin visualization) */
  showBoxModelOverlay?: boolean;
  /** Initial pinned position. Defaults to "floating" (centered) */
  initialPinnedPosition?: PinnedPosition;
  /** Custom compact mode configuration. Partially override DEFAULT_COMPACT_CONFIG */
  compactConfig?: Partial<CompactModeConfig>;
}

/**
 * Box Model Overlay - renders visual padding and margin indicators
 */
function BoxModelOverlay({
  boxModel,
  visible,
}: {
  boxModel: BoxModelInfo;
  visible: boolean;
}) {
  if (!visible) return null;

  const { position, content, padding, margin } = boxModel;

  // Calculate positions for each layer
  const marginRect = {
    top: position.top - margin.top,
    left: position.left - margin.left,
    width:
      content.width + padding.left + padding.right + margin.left + margin.right,
    height:
      content.height +
      padding.top +
      padding.bottom +
      margin.top +
      margin.bottom,
  };

  const paddingRect = {
    top: position.top,
    left: position.left,
    width: content.width + padding.left + padding.right,
    height: content.height + padding.top + padding.bottom,
  };

  const contentRect = {
    top: position.top + padding.top,
    left: position.left + padding.left,
    width: content.width,
    height: content.height,
  };

  return (
    <div style={boxModelOverlayStyles.container}>
      {/* Margin layer (orange) */}
      {(margin.top > 0 ||
        margin.right > 0 ||
        margin.bottom > 0 ||
        margin.left > 0) && (
        <>
          {/* Top margin */}
          {margin.top > 0 && (
            <div
              style={{
                ...boxModelOverlayStyles.marginBox,
                top: marginRect.top,
                left: marginRect.left,
                width: marginRect.width,
                height: margin.top,
              }}
            />
          )}
          {/* Right margin */}
          {margin.right > 0 && (
            <div
              style={{
                ...boxModelOverlayStyles.marginBox,
                top: position.top,
                left: position.left + paddingRect.width,
                width: margin.right,
                height: paddingRect.height,
              }}
            />
          )}
          {/* Bottom margin */}
          {margin.bottom > 0 && (
            <div
              style={{
                ...boxModelOverlayStyles.marginBox,
                top: position.top + paddingRect.height,
                left: marginRect.left,
                width: marginRect.width,
                height: margin.bottom,
              }}
            />
          )}
          {/* Left margin */}
          {margin.left > 0 && (
            <div
              style={{
                ...boxModelOverlayStyles.marginBox,
                top: position.top,
                left: marginRect.left,
                width: margin.left,
                height: paddingRect.height,
              }}
            />
          )}
        </>
      )}

      {/* Padding layer (green) */}
      {(padding.top > 0 ||
        padding.right > 0 ||
        padding.bottom > 0 ||
        padding.left > 0) && (
        <>
          {/* Top padding */}
          {padding.top > 0 && (
            <div
              style={{
                ...boxModelOverlayStyles.paddingBox,
                top: paddingRect.top,
                left: paddingRect.left,
                width: paddingRect.width,
                height: padding.top,
              }}
            />
          )}
          {/* Right padding */}
          {padding.right > 0 && (
            <div
              style={{
                ...boxModelOverlayStyles.paddingBox,
                top: paddingRect.top + padding.top,
                left: paddingRect.left + padding.left + content.width,
                width: padding.right,
                height: content.height,
              }}
            />
          )}
          {/* Bottom padding */}
          {padding.bottom > 0 && (
            <div
              style={{
                ...boxModelOverlayStyles.paddingBox,
                top: contentRect.top + content.height,
                left: paddingRect.left,
                width: paddingRect.width,
                height: padding.bottom,
              }}
            />
          )}
          {/* Left padding */}
          {padding.left > 0 && (
            <div
              style={{
                ...boxModelOverlayStyles.paddingBox,
                top: paddingRect.top + padding.top,
                left: paddingRect.left,
                width: padding.left,
                height: content.height,
              }}
            />
          )}
        </>
      )}

      {/* Content layer (blue) */}
      <div
        style={{
          ...boxModelOverlayStyles.contentBox,
          top: contentRect.top,
          left: contentRect.left,
          width: content.width,
          height: content.height,
        }}
      />
    </div>
  );
}

const boxModelOverlayStyles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: 9998,
  },
  marginBox: {
    position: "fixed",
    backgroundColor: "rgba(255, 155, 0, 0.3)",
    pointerEvents: "none",
  },
  paddingBox: {
    position: "fixed",
    backgroundColor: "rgba(125, 200, 100, 0.4)",
    pointerEvents: "none",
  },
  contentBox: {
    position: "fixed",
    backgroundColor: "rgba(100, 150, 255, 0.25)",
    pointerEvents: "none",
  },
};

/**
 * Collapsible section component
 */
function Section({
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isCompact, compactStyles } = useCompactMode();

  return (
    <div style={inspectStyles.section}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...inspectStyles.sectionHeader,
          ...(isCompact ? compactStyles.sectionHeader : {}),
        }}
      >
        <span style={inspectStyles.sectionHeaderLeft}>
          {isOpen ? (
            <ChevronDown size={isCompact ? 12 : 14} />
          ) : (
            <ChevronRight size={isCompact ? 12 : 14} />
          )}
          {icon && <span style={inspectStyles.sectionIcon}>{icon}</span>}
          <span
            style={{
              ...inspectStyles.sectionTitle,
              ...(isCompact ? compactStyles.sectionTitle : {}),
            }}
          >
            {title}
          </span>
        </span>
        {badge && (
          <span
            style={{
              ...inspectStyles.badge,
              ...(isCompact ? compactStyles.badge : {}),
            }}
          >
            {badge}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          style={{
            ...inspectStyles.sectionContent,
            ...(isCompact ? compactStyles.sectionContent : {}),
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Copy button component with feedback
 */
function CopyButton({
  text,
  label,
  size = "small",
}: {
  text: string;
  label?: string;
  size?: "small" | "medium";
}) {
  const [copied, setCopied] = useState(false);
  const { isCompact, compactStyles } = useCompactMode();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const buttonStyle =
    size === "small" ? inspectStyles.copyButtonSmall : inspectStyles.copyButton;
  const iconSize = isCompact
    ? size === "small"
      ? 10
      : 12
    : size === "small"
      ? 12
      : 14;

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        ...buttonStyle,
        ...(isCompact ? compactStyles.copyButtonSmall : {}),
      }}
      title={`Copy ${label || "to clipboard"}`}
    >
      {copied ? (
        <>
          <Check size={iconSize} />
          {label && size !== "small" && <span>Copied!</span>}
        </>
      ) : (
        <>
          <Copy size={iconSize} />
          {label && size !== "small" && <span>{label}</span>}
        </>
      )}
    </button>
  );
}

/**
 * Property row component
 */
function PropertyRow({
  label,
  value,
  mono = false,
  copyable = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const { isCompact, compactStyles } = useCompactMode();

  return (
    <div
      style={{
        ...inspectStyles.propertyRow,
        ...(isCompact ? compactStyles.propertyRow : {}),
      }}
    >
      <span
        style={{
          ...inspectStyles.propertyLabel,
          ...(isCompact ? compactStyles.propertyLabel : {}),
        }}
      >
        {label}
      </span>
      <span
        style={{
          ...inspectStyles.propertyValue,
          ...(isCompact ? compactStyles.propertyValue : {}),
          ...(mono ? inspectStyles.mono : {}),
        }}
      >
        {value}
        {copyable && <CopyButton text={value} size="small" />}
      </span>
    </div>
  );
}

/**
 * Style origin badge colors and icons
 */
const styleOriginConfig: Record<
  StyleOriginType,
  { color: string; bgColor: string; label: string }
> = {
  inline: {
    color: "#f97316",
    bgColor: "rgba(249, 115, 22, 0.15)",
    label: "inline",
  },
  stylesheet: {
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.15)",
    label: "css",
  },
  inherited: {
    color: "#a855f7",
    bgColor: "rgba(168, 85, 247, 0.15)",
    label: "inherited",
  },
  "user-agent": {
    color: "#6b7280",
    bgColor: "rgba(107, 114, 128, 0.15)",
    label: "default",
  },
  initial: {
    color: "#6b7280",
    bgColor: "rgba(107, 114, 128, 0.15)",
    label: "initial",
  },
};

/**
 * Style origin badge component
 */
function StyleOriginBadge({
  origin,
  compact = false,
}: {
  origin: StyleOrigin;
  compact?: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const config = styleOriginConfig[origin.type];

  const getIcon = () => {
    switch (origin.type) {
      case "inline":
        return <Code size={compact ? 8 : 10} />;
      case "stylesheet":
        return <FileCode size={compact ? 8 : 10} />;
      case "inherited":
        return <ArrowDown size={compact ? 8 : 10} />;
      default:
        return <Layers size={compact ? 8 : 10} />;
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        style={{
          ...styleOriginStyles.badge,
          backgroundColor: config.bgColor,
          color: config.color,
          fontSize: compact ? "7px" : "8px",
          padding: compact ? "1px 3px" : "2px 4px",
        }}
        title={`Click for details - ${origin.type}`}
      >
        {getIcon()}
        {!compact && <span>{config.label}</span>}
      </button>

      {showDetails && (
        <div style={styleOriginStyles.tooltip}>
          <div style={styleOriginStyles.tooltipHeader}>
            <span style={{ color: config.color, fontWeight: 600 }}>
              {origin.type.charAt(0).toUpperCase() + origin.type.slice(1)}
            </span>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              style={styleOriginStyles.tooltipClose}
            >
              ×
            </button>
          </div>
          <div style={styleOriginStyles.tooltipContent}>
            {origin.selector && (
              <div style={styleOriginStyles.tooltipRow}>
                <span style={styleOriginStyles.tooltipLabel}>Selector:</span>
                <code style={styleOriginStyles.tooltipCode}>
                  {origin.selector}
                </code>
              </div>
            )}
            {origin.sourceFile && (
              <div style={styleOriginStyles.tooltipRow}>
                <span style={styleOriginStyles.tooltipLabel}>Source:</span>
                <code style={styleOriginStyles.tooltipCode}>
                  {origin.sourceFile}
                </code>
              </div>
            )}
            {origin.specificity && (
              <div style={styleOriginStyles.tooltipRow}>
                <span style={styleOriginStyles.tooltipLabel}>Specificity:</span>
                <code style={styleOriginStyles.tooltipCode}>
                  {origin.specificity}
                </code>
              </div>
            )}
            {origin.inheritedFrom && (
              <div style={styleOriginStyles.tooltipRow}>
                <span style={styleOriginStyles.tooltipLabel}>From:</span>
                <code style={styleOriginStyles.tooltipCode}>
                  {origin.inheritedFrom}
                </code>
              </div>
            )}
            {origin.isImportant && (
              <div style={styleOriginStyles.tooltipRow}>
                <span style={{ color: "#ef4444", fontSize: "9px" }}>
                  !important
                </span>
              </div>
            )}
            {origin.rulePriority && origin.rulePriority > 1 && (
              <div style={styleOriginStyles.tooltipRow}>
                <span style={styleOriginStyles.tooltipLabel}>Rules:</span>
                <span style={{ fontSize: "9px", color: "#888" }}>
                  {origin.rulePriority} matching rules
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Computed style row with origin tracing
 */
function ComputedStyleRow({
  prop,
  value,
  element,
}: {
  prop: string;
  value: string;
  element: Element | null;
}) {
  const { isCompact, compactStyles } = useCompactMode();
  const [origin, setOrigin] = useState<StyleOrigin | null>(null);

  useEffect(() => {
    if (element) {
      const styleOrigin = getStyleOrigin(element, prop);
      setOrigin(styleOrigin);
    }
  }, [element, prop]);

  return (
    <div
      style={{
        ...inspectStyles.styleRow,
        ...(isCompact ? compactStyles.styleRow : {}),
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span style={{ ...inspectStyles.styleProp, flex: "0 0 auto" }}>
        {camelToKebab(prop)}
      </span>
      <span
        style={{
          ...inspectStyles.styleValue,
          ...(isCompact ? compactStyles.styleValue : {}),
          flex: 1,
        }}
      >
        {value}
      </span>
      {origin && <StyleOriginBadge origin={origin} compact={isCompact} />}
    </div>
  );
}

/**
 * Editable styles section for computed styles display
 */
function StylesSection({
  styles,
  category,
  editable = false,
  showOrigin = false,
}: {
  styles: Record<string, string>;
  category: string;
  editable?: boolean;
  showOrigin?: boolean;
}) {
  const entries = Object.entries(styles);
  const { isCompact, compactStyles } = useCompactMode();
  const { element, refreshInfo } = useTargetElement();

  const handleStyleChange = useCallback(
    (prop: string, newValue: string) => {
      if (!element || !(element instanceof HTMLElement)) return;
      const kebabProp = camelToKebab(prop);
      element.style.setProperty(kebabProp, newValue);
      refreshInfo();
    },
    [element, refreshInfo],
  );

  const handleStyleDelete = useCallback(
    (prop: string) => {
      if (!element || !(element instanceof HTMLElement)) return;
      const kebabProp = camelToKebab(prop);
      element.style.removeProperty(kebabProp);
      refreshInfo();
    },
    [element, refreshInfo],
  );

  const handleAddStyle = useCallback(
    (prop: string, value: string) => {
      if (!element || !(element instanceof HTMLElement)) return;
      element.style.setProperty(prop, value);
      refreshInfo();
    },
    [element, refreshInfo],
  );

  if (entries.length === 0 && !editable) return null;

  return (
    <div
      style={{
        ...inspectStyles.styleCategory,
        ...(isCompact ? compactStyles.styleCategory : {}),
      }}
    >
      <div
        style={{
          ...inspectStyles.styleCategoryHeader,
          ...(isCompact ? compactStyles.styleCategoryHeader : {}),
        }}
      >
        {category}
      </div>
      {entries.map(([prop, value]) =>
        editable ? (
          <EditableStyleRow
            key={prop}
            prop={prop}
            value={value}
            onValueChange={handleStyleChange}
            onDelete={handleStyleDelete}
          />
        ) : showOrigin ? (
          <ComputedStyleRow
            key={prop}
            prop={prop}
            value={value}
            element={element}
          />
        ) : (
          <div
            key={prop}
            style={{
              ...inspectStyles.styleRow,
              ...(isCompact ? compactStyles.styleRow : {}),
            }}
          >
            <span style={inspectStyles.styleProp}>{camelToKebab(prop)}</span>
            <span
              style={{
                ...inspectStyles.styleValue,
                ...(isCompact ? compactStyles.styleValue : {}),
              }}
            >
              {value}
            </span>
          </div>
        ),
      )}
      {editable && (
        <AddNewRow
          onAdd={handleAddStyle}
          propPlaceholder="property"
          valuePlaceholder="value"
        />
      )}
    </div>
  );
}

function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Editable inline styles section
 */
function EditableStylesSection({
  targetElement,
  refreshInfo,
}: {
  targetElement: Element | null;
  refreshInfo: () => void;
}) {
  const { isCompact, compactStyles } = useCompactMode();
  const [inlineStyles, setInlineStyles] = useState<Record<string, string>>({});
  const { trackModification } = useInspectStore();

  // Extract inline styles from element
  useEffect(() => {
    if (!targetElement || !(targetElement instanceof HTMLElement)) {
      setInlineStyles({});
      return;
    }

    const styles: Record<string, string> = {};
    const styleAttr = targetElement.getAttribute("style");
    if (styleAttr) {
      const declarations = styleAttr.split(";").filter(Boolean);
      for (const decl of declarations) {
        const [prop, ...valueParts] = decl.split(":");
        if (prop && valueParts.length) {
          const cleanProp = prop.trim();
          const cleanValue = valueParts.join(":").trim();
          if (cleanProp && cleanValue) {
            styles[kebabToCamel(cleanProp)] = cleanValue;
          }
        }
      }
    }
    setInlineStyles(styles);
  }, [targetElement]);

  const handleStyleChange = useCallback(
    (prop: string, newValue: string) => {
      if (!targetElement || !(targetElement instanceof HTMLElement)) return;
      const kebabProp = camelToKebab(prop);
      const oldValue = targetElement.style.getPropertyValue(kebabProp);
      targetElement.style.setProperty(kebabProp, newValue);
      setInlineStyles((prev) => ({ ...prev, [prop]: newValue }));
      // Track the modification
      trackModification(targetElement, "style", kebabProp, oldValue, newValue);
      refreshInfo();
    },
    [targetElement, refreshInfo, trackModification],
  );

  const handleStyleDelete = useCallback(
    (prop: string) => {
      if (!targetElement || !(targetElement instanceof HTMLElement)) return;
      const kebabProp = camelToKebab(prop);
      const oldValue = targetElement.style.getPropertyValue(kebabProp);
      targetElement.style.removeProperty(kebabProp);
      setInlineStyles((prev) => {
        const next = { ...prev };
        delete next[prop];
        return next;
      });
      // Track the modification (null for deleted)
      trackModification(targetElement, "style", kebabProp, oldValue, null);
      refreshInfo();
    },
    [targetElement, refreshInfo, trackModification],
  );

  const handleAddStyle = useCallback(
    (prop: string, value: string) => {
      if (!targetElement || !(targetElement instanceof HTMLElement)) return;
      targetElement.style.setProperty(prop, value);
      setInlineStyles((prev) => ({ ...prev, [kebabToCamel(prop)]: value }));
      // Track the modification (null for original since it's new)
      trackModification(targetElement, "style", prop, null, value);
      refreshInfo();
    },
    [targetElement, refreshInfo, trackModification],
  );

  const entries = Object.entries(inlineStyles);

  return (
    <Section
      title="Inline Styles"
      icon={<Palette size={14} />}
      badge={entries.length > 0 ? `${entries.length}` : "editable"}
      defaultOpen
    >
      <div
        style={{
          ...inspectStyles.styleCategory,
          ...(isCompact ? compactStyles.styleCategory : {}),
        }}
      >
        {entries.map(([prop, value]) => (
          <EditableStyleRow
            key={prop}
            prop={prop}
            value={value}
            onValueChange={handleStyleChange}
            onDelete={handleStyleDelete}
          />
        ))}
        <AddNewRow
          onAdd={handleAddStyle}
          propPlaceholder="css-property"
          valuePlaceholder="value"
        />
      </div>
    </Section>
  );
}

/**
 * Editable data attributes section
 */
function EditableDataAttributesSection({
  targetElement,
  dataAttributes,
  refreshInfo,
}: {
  targetElement: Element | null;
  dataAttributes: Record<string, string>;
  refreshInfo: () => void;
}) {
  const { trackModification } = useInspectStore();

  const handleAttributeChange = useCallback(
    (name: string, newValue: string) => {
      if (!targetElement) return;
      const oldValue = targetElement.getAttribute(name);
      // name comes as "data-xxx" so we can use it directly
      targetElement.setAttribute(name, newValue);
      trackModification(targetElement, "attribute", name, oldValue, newValue);
      refreshInfo();
    },
    [targetElement, refreshInfo, trackModification],
  );

  const handleAttributeDelete = useCallback(
    (name: string) => {
      if (!targetElement) return;
      const oldValue = targetElement.getAttribute(name);
      targetElement.removeAttribute(name);
      trackModification(targetElement, "attribute", name, oldValue, null);
      refreshInfo();
    },
    [targetElement, refreshInfo, trackModification],
  );

  const handleAddAttribute = useCallback(
    (name: string, value: string) => {
      if (!targetElement) return;
      const attrName = name.startsWith("data-") ? name : `data-${name}`;
      targetElement.setAttribute(attrName, value);
      trackModification(targetElement, "attribute", attrName, null, value);
      refreshInfo();
    },
    [targetElement, refreshInfo, trackModification],
  );

  const entries = Object.entries(dataAttributes);

  return (
    <Section
      title="Data Attributes"
      icon={<Layout size={14} />}
      badge={entries.length > 0 ? `${entries.length}` : "editable"}
    >
      {entries.map(([key, value]) => (
        <EditableAttributeRow
          key={key}
          name={`data-${key}`}
          value={value}
          onValueChange={handleAttributeChange}
          onDelete={handleAttributeDelete}
        />
      ))}
      <AddNewRow
        onAdd={handleAddAttribute}
        propPlaceholder="data-name"
        valuePlaceholder="value"
      />
    </Section>
  );
}

/**
 * Editable attributes section
 */
function EditableAttributesSection({
  targetElement,
  attributes,
  refreshInfo,
}: {
  targetElement: Element | null;
  attributes: Record<string, string>;
  refreshInfo: () => void;
}) {
  const { trackModification } = useInspectStore();

  // Filter out special attributes that shouldn't be edited
  const editableAttributes = Object.entries(attributes).filter(
    ([key]) =>
      !key.startsWith("aria-") &&
      !key.startsWith("data-") &&
      key !== "class" &&
      key !== "style" &&
      key !== "id",
  );

  const handleAttributeChange = useCallback(
    (name: string, newValue: string) => {
      if (!targetElement) return;
      const oldValue = targetElement.getAttribute(name);
      targetElement.setAttribute(name, newValue);
      trackModification(targetElement, "attribute", name, oldValue, newValue);
      refreshInfo();
    },
    [targetElement, refreshInfo, trackModification],
  );

  const handleAttributeDelete = useCallback(
    (name: string) => {
      if (!targetElement) return;
      const oldValue = targetElement.getAttribute(name);
      targetElement.removeAttribute(name);
      trackModification(targetElement, "attribute", name, oldValue, null);
      refreshInfo();
    },
    [targetElement, refreshInfo, trackModification],
  );

  const handleAddAttribute = useCallback(
    (name: string, value: string) => {
      if (!targetElement) return;
      targetElement.setAttribute(name, value);
      trackModification(targetElement, "attribute", name, null, value);
      refreshInfo();
    },
    [targetElement, refreshInfo, trackModification],
  );

  return (
    <Section
      title="Attributes"
      icon={<Type size={14} />}
      badge={
        editableAttributes.length > 0
          ? `${editableAttributes.length}`
          : "editable"
      }
    >
      {editableAttributes.slice(0, 15).map(([key, value]) => (
        <EditableAttributeRow
          key={key}
          name={key}
          value={value}
          onValueChange={handleAttributeChange}
          onDelete={handleAttributeDelete}
        />
      ))}
      <AddNewRow
        onAdd={handleAddAttribute}
        propPlaceholder="attribute"
        valuePlaceholder="value"
      />
    </Section>
  );
}

/**
 * Pin button component for docking the dialog
 */
function PinButton({
  position,
  currentPosition,
  onClick,
}: {
  position: PinnedPosition;
  currentPosition: PinnedPosition;
  onClick: (position: PinnedPosition) => void;
}) {
  const isActive = currentPosition === position;
  const icons: Record<PinnedPosition, React.ReactNode> = {
    left: <PanelLeft size={14} />,
    right: <PanelRight size={14} />,
    top: <PanelTop size={14} />,
    bottom: <PanelBottom size={14} />,
    floating: <Maximize2 size={14} />,
  };

  return (
    <button
      type="button"
      onClick={() => onClick(position)}
      style={{
        ...inspectStyles.pinButton,
        backgroundColor: isActive ? "rgba(59, 130, 246, 0.2)" : "transparent",
        color: isActive ? "#3b82f6" : "#666",
      }}
      title={`Pin to ${position}`}
    >
      {icons[position]}
    </button>
  );
}

/**
 * InspectDialog component - displays element inspection information
 */
/**
 * Modified elements panel - shows list of elements with modifications
 */
function ModifiedElementsPanel({
  onSelectElement,
  onClose,
  highlightColors,
  currentElement,
}: {
  onSelectElement: (element: Element | null) => void;
  onClose: () => void;
  highlightColors?: HighlightColors;
  currentElement?: Element | null;
}) {
  const { isCompact, compactStyles } = useCompactMode();
  const {
    modifiedElements,
    deletedElements,
    resetElement,
    getModifiedElementsInDOM,
  } = useInspectStore();

  // Track hovered element for highlighting
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);

  // Get modified elements (excluding deleted ones, which are handled separately)
  const modifiedInDOM = getModifiedElementsInDOM().filter(
    (m) => !m.modification.isDeleted,
  );

  // Get hidden (deleted) elements with their DOM references
  const hiddenElements = Object.values(deletedElements).map((deleted) => {
    let element: Element | null = null;
    try {
      element = document.querySelector(deleted.selector);
    } catch {
      // Invalid selector
    }
    return { deleted, element };
  });

  const totalCount = modifiedInDOM.length + hiddenElements.length;

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Handle hover highlighting
  const handleMouseEnter = useCallback(
    (element: Element | null) => {
      if (element) {
        setHoveredElement(element);
        highlightTarget(element, highlightColors);
      }
    },
    [highlightColors],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredElement(null);
    clearHighlights();
  }, []);

  return (
    <div style={modifiedPanelStyles.container}>
      <div style={modifiedPanelStyles.header}>
        <div style={modifiedPanelStyles.headerTitle}>
          <History size={12} />
          <span>Changed Elements ({totalCount})</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={modifiedPanelStyles.closeButton}
        >
          <X size={12} />
        </button>
      </div>
      <div style={modifiedPanelStyles.list}>
        {totalCount === 0 ? (
          <div style={modifiedPanelStyles.empty}>No changed elements</div>
        ) : (
          <>
            {/* Hidden (deleted) elements */}
            {hiddenElements.map(({ deleted, element }) => {
              const isSelected = element && currentElement === element;
              const isHovered = hoveredElement === element;
              return (
                <div
                  key={deleted.elementId}
                  style={{
                    ...modifiedPanelStyles.item,
                    ...(isSelected ? modifiedPanelStyles.itemSelected : {}),
                    ...(isHovered && !isSelected
                      ? modifiedPanelStyles.itemHovered
                      : {}),
                  }}
                  onMouseEnter={() => handleMouseEnter(element)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div style={modifiedPanelStyles.itemMain}>
                    <button
                      type="button"
                      onClick={() => onSelectElement(element)}
                      style={{
                        ...modifiedPanelStyles.itemSelector,
                        opacity: element ? 1 : 0.5,
                      }}
                      disabled={!element}
                      title={
                        element
                          ? "Click to inspect"
                          : "Element not found in DOM"
                      }
                    >
                      <code>{deleted.description}</code>
                    </button>
                    <div style={modifiedPanelStyles.itemMeta}>
                      <span
                        style={{
                          ...modifiedPanelStyles.badge,
                          backgroundColor: "rgba(239, 68, 68, 0.15)",
                          color: "#ef4444",
                        }}
                      >
                        hidden
                      </span>
                      <span style={modifiedPanelStyles.time}>
                        {formatTimestamp(deleted.deletedAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetElement(deleted.elementId)}
                    style={modifiedPanelStyles.resetButton}
                    title="Show this element"
                  >
                    <RotateCcw size={10} />
                  </button>
                </div>
              );
            })}

            {/* Modified elements */}
            {modifiedInDOM.map(({ modification, element }) => {
              const styleCount = Object.keys(
                modification.modifiedStyles,
              ).length;
              const attrCount = Object.keys(
                modification.modifiedAttributes,
              ).length;
              const isSelected = element && currentElement === element;
              const isHovered = hoveredElement === element;

              return (
                <div
                  key={modification.elementId}
                  style={{
                    ...modifiedPanelStyles.item,
                    ...(isSelected ? modifiedPanelStyles.itemSelected : {}),
                    ...(isHovered && !isSelected
                      ? modifiedPanelStyles.itemHovered
                      : {}),
                  }}
                  onMouseEnter={() => handleMouseEnter(element)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div style={modifiedPanelStyles.itemMain}>
                    <button
                      type="button"
                      onClick={() => onSelectElement(element)}
                      style={{
                        ...modifiedPanelStyles.itemSelector,
                        opacity: element ? 1 : 0.5,
                      }}
                      disabled={!element}
                      title={
                        element
                          ? "Click to inspect"
                          : "Element not found in DOM"
                      }
                    >
                      <code>{modification.description}</code>
                    </button>
                    <div style={modifiedPanelStyles.itemMeta}>
                      {styleCount > 0 && (
                        <span style={modifiedPanelStyles.badge}>
                          {styleCount} style{styleCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {attrCount > 0 && (
                        <span style={modifiedPanelStyles.badge}>
                          {attrCount} attr{attrCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span style={modifiedPanelStyles.time}>
                        {formatTimestamp(modification.lastModified)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetElement(modification.elementId)}
                    style={modifiedPanelStyles.resetButton}
                    title="Reset this element"
                  >
                    <RotateCcw size={10} />
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export function InspectDialog({
  visible,
  targetElement,
  onClose,
  onSelectElement,
  ideConfig,
  style,
  className,
  highlightColors,
  showBoxModelOverlay = true,
  initialPinnedPosition = "floating",
  compactConfig,
}: InspectDialogProps) {
  const [elementInfo, setElementInfo] = useState<ElementInspectInfo | null>(
    null,
  );
  const [sourceLocation, setSourceLocation] = useState<SourceLocation | null>(
    null,
  );
  const dialogRef = useRef<HTMLDivElement>(null);

  // Compute compact styles from config (memoized)
  const computedCompactStyles = React.useMemo(() => {
    if (!compactConfig) return compactStyles;
    const mergedConfig = mergeCompactConfig(
      DEFAULT_COMPACT_CONFIG,
      compactConfig,
    );
    return generateCompactStyles(mergedConfig);
  }, [compactConfig]);

  // Use Zustand store for persisted state
  const {
    pinnedPosition: storedPinnedPosition,
    setPinnedPosition: setStoredPinnedPosition,
    modifiedElements,
    deletedElements,
    trackModification,
    resetAllElements,
    getModifiedElementsInDOM,
  } = useInspectStore();

  // Use store position or fall back to initial prop
  const pinnedPosition = storedPinnedPosition || initialPinnedPosition;
  const setPinnedPosition = setStoredPinnedPosition;

  // Show modified elements panel
  const [showModifiedElements, setShowModifiedElements] = useState(false);

  // Drag state (local, not persisted)
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    dialogX: number;
    dialogY: number;
  } | null>(null);

  // Reset drag position when dialog becomes visible (but keep pinned position)
  useEffect(() => {
    if (visible) {
      setDragPosition(null);
    }
  }, [visible]);

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      if (pinnedPosition !== "floating") return;

      e.preventDefault();
      setIsDragging(true);

      const rect = dialogRef.current?.getBoundingClientRect();
      if (rect) {
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          dialogX: rect.left,
          dialogY: rect.top,
        };
      }
    },
    [pinnedPosition],
  );

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setDragPosition({
        x: dragStartRef.current.dialogX + deltaX,
        y: dragStartRef.current.dialogY + deltaY,
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  // Handle pin position change
  const handlePinChange = useCallback((position: PinnedPosition) => {
    setPinnedPosition(position);
    setDragPosition(null);
  }, []);

  // Function to refresh element info (used for real-time DOM editing)
  const refreshElementInfo = useCallback(() => {
    if (targetElement) {
      const info = getElementInspectInfo(targetElement);
      setElementInfo(info);
    }
  }, [targetElement]);

  // Get element info when target changes
  useEffect(() => {
    if (visible && targetElement) {
      refreshElementInfo();

      // Try to find source location
      const location = findSourceLocationInAncestors(targetElement);
      setSourceLocation(location);
    } else {
      setElementInfo(null);
      setSourceLocation(null);
    }
  }, [visible, targetElement, refreshElementInfo]);

  // Apply highlight to target element when visible (not container)
  useEffect(() => {
    if (visible && targetElement) {
      highlightTarget(targetElement, highlightColors);
    }

    return () => {
      if (visible) {
        clearHighlights();
      }
    };
  }, [visible, targetElement, highlightColors]);

  // Handle escape key
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearHighlights();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!visible) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    // Delay to prevent immediate close from the same click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [visible]);

  // Close handler that also clears highlights
  const handleClose = useCallback(() => {
    clearHighlights();
    onClose();
  }, [onClose]);

  const handleOpenInIDE = useCallback(() => {
    if (sourceLocation) {
      openInIDE(sourceLocation, ideConfig);
    }
  }, [sourceLocation, ideConfig]);

  // Get trackDeletion from store
  const { trackDeletion } = useInspectStore();

  const handleRemoveElement = useCallback(() => {
    if (targetElement) {
      // Track the deletion - this hides the element with display:none
      // Element stays in DOM for easy recovery
      trackDeletion(targetElement);
      onClose();
    }
  }, [targetElement, onClose, trackDeletion]);

  const handleCopySelector = useCallback(() => {
    if (elementInfo) {
      navigator.clipboard.writeText(elementInfo.selector);
    }
  }, [elementInfo]);

  const handleCopyHTML = useCallback(() => {
    if (elementInfo) {
      navigator.clipboard.writeText(elementInfo.outerHTML);
    }
  }, [elementInfo]);

  const handleCopyStyles = useCallback(() => {
    if (elementInfo) {
      const cssText = formatStylesAsCSS(elementInfo.computedStyles);
      navigator.clipboard.writeText(cssText);
    }
  }, [elementInfo]);

  if (!visible || !elementInfo || !targetElement) {
    return null;
  }

  const {
    boxModel,
    computedStyles,
    accessibility,
    dataAttributes,
    attributes,
  } = elementInfo;

  // Count non-empty style categories
  const styleCategories = Object.entries(computedStyles).filter(
    ([_, styles]) => Object.keys(styles).length > 0,
  );

  // Calculate dialog position styles based on pinned position and drag state
  const getDialogPositionStyle = (): React.CSSProperties => {
    if (dragPosition && pinnedPosition === "floating") {
      return {
        top: dragPosition.y,
        left: dragPosition.x,
        transform: "none",
      };
    }

    switch (pinnedPosition) {
      case "left":
        return {
          top: 0,
          left: 0,
          bottom: 0,
          transform: "none",
          borderRadius: "0 12px 12px 0",
          maxHeight: "100vh",
          height: "100vh",
        };
      case "right":
        return {
          top: 0,
          right: 0,
          bottom: 0,
          left: "auto",
          transform: "none",
          borderRadius: "12px 0 0 12px",
          maxHeight: "100vh",
          height: "100vh",
        };
      case "top":
        return {
          top: 0,
          left: 0,
          right: 0,
          transform: "none",
          borderRadius: "0 0 12px 12px",
          width: "100%",
          maxWidth: "100%",
          maxHeight: "50vh",
        };
      case "bottom":
        return {
          bottom: 0,
          left: 0,
          right: 0,
          top: "auto",
          transform: "none",
          borderRadius: "12px 12px 0 0",
          width: "100%",
          maxWidth: "100%",
          maxHeight: "50vh",
        };
      case "floating":
      default:
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
    }
  };

  // Determine if we should use compact mode (when pinned to any edge)
  const isCompact = pinnedPosition !== "floating";

  return (
    <>
      {/* Box Model Overlay */}
      {showBoxModelOverlay && (
        <BoxModelOverlay boxModel={boxModel} visible={visible} />
      )}

      <TargetElementContext.Provider
        value={{ element: targetElement, refreshInfo: refreshElementInfo }}
      >
        <CompactModeContext.Provider
          value={{ isCompact, styles: computedCompactStyles }}
        >
          <div
            ref={dialogRef}
            className={className}
            style={{
              ...inspectStyles.dialog,
              ...(isCompact ? computedCompactStyles.dialog : {}),
              ...getDialogPositionStyle(),
              ...style,
              cursor: isDragging ? "grabbing" : undefined,
            }}
            role="dialog"
            aria-label="Element Inspector"
          >
            {/* Header */}
            <div
              style={{
                ...inspectStyles.header,
                ...(isCompact ? computedCompactStyles.header : {}),
              }}
            >
              {/* Drag handle */}
              {pinnedPosition === "floating" && (
                <div
                  style={inspectStyles.dragHandle}
                  onPointerDown={handleDragStart}
                  title="Drag to move"
                >
                  <GripVertical size={16} />
                </div>
              )}
              <div
                style={{
                  ...inspectStyles.headerTitle,
                  ...(isCompact ? computedCompactStyles.headerTitle : {}),
                }}
              >
                <Code size={isCompact ? 14 : 16} />
                <span>Inspect Element</span>
              </div>
              <div style={inspectStyles.headerActions}>
                {/* Pin buttons */}
                <div
                  style={{
                    ...inspectStyles.pinButtons,
                    ...(isCompact ? computedCompactStyles.pinButtons : {}),
                  }}
                >
                  <PinButton
                    position="left"
                    currentPosition={pinnedPosition}
                    onClick={handlePinChange}
                  />
                  <PinButton
                    position="top"
                    currentPosition={pinnedPosition}
                    onClick={handlePinChange}
                  />
                  <PinButton
                    position="bottom"
                    currentPosition={pinnedPosition}
                    onClick={handlePinChange}
                  />
                  <PinButton
                    position="right"
                    currentPosition={pinnedPosition}
                    onClick={handlePinChange}
                  />
                  <PinButton
                    position="floating"
                    currentPosition={pinnedPosition}
                    onClick={handlePinChange}
                  />
                </div>
                {/* Modified elements indicator and actions */}
                {(Object.keys(modifiedElements).length > 0 ||
                  Object.keys(deletedElements).length > 0) && (
                  <div style={inspectStyles.modifiedIndicator}>
                    <button
                      type="button"
                      onClick={() =>
                        setShowModifiedElements(!showModifiedElements)
                      }
                      style={{
                        ...inspectStyles.modifiedButton,
                        ...(showModifiedElements
                          ? inspectStyles.modifiedButtonActive
                          : {}),
                      }}
                      title={`${Object.keys(modifiedElements).length + Object.keys(deletedElements).length} changed element(s)`}
                    >
                      <History size={isCompact ? 12 : 14} />
                      <span style={{ fontSize: isCompact ? "9px" : "10px" }}>
                        {Object.keys(modifiedElements).length +
                          Object.keys(deletedElements).length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetAllElements();
                        refreshElementInfo();
                      }}
                      style={inspectStyles.resetAllButton}
                      title="Reset all changes"
                    >
                      <RotateCcw size={isCompact ? 12 : 14} />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    ...inspectStyles.closeButton,
                    ...(isCompact ? computedCompactStyles.closeButton : {}),
                  }}
                  aria-label="Close"
                >
                  <X size={isCompact ? 16 : 18} />
                </button>
              </div>
            </div>

            {/* Modified Elements Panel */}
            {showModifiedElements &&
              (Object.keys(modifiedElements).length > 0 ||
                Object.keys(deletedElements).length > 0) && (
                <ModifiedElementsPanel
                  onSelectElement={(element) => {
                    if (element && onSelectElement) {
                      onSelectElement(element);
                    }
                  }}
                  onClose={() => setShowModifiedElements(false)}
                  highlightColors={highlightColors}
                  currentElement={targetElement}
                />
              )}

            {/* Element Hierarchy Navigation */}
            <ElementHierarchyNav
              targetElement={targetElement}
              elementInfo={elementInfo}
              onSelectElement={onSelectElement}
              highlightColors={highlightColors}
              isCompact={isCompact}
            />

            {/* Scrollable Content - only show for non-blacklisted elements */}
            {!isBlacklisted(targetElement) && (
              <div style={inspectStyles.content}>
              {/* Quick Info */}
              <Section title="Layout" icon={<Box size={14} />} defaultOpen>
                <PropertyRow
                  label="Size"
                  value={`${boxModel.total.width} × ${boxModel.total.height}px`}
                />
                <PropertyRow
                  label="Position"
                  value={`${boxModel.position.left}, ${boxModel.position.top}`}
                />
                <PropertyRow
                  label="Padding"
                  value={`${boxModel.padding.top} ${boxModel.padding.right} ${boxModel.padding.bottom} ${boxModel.padding.left}`}
                />
                <PropertyRow
                  label="Margin"
                  value={`${boxModel.margin.top} ${boxModel.margin.right} ${boxModel.margin.bottom} ${boxModel.margin.left}`}
                />
              </Section>

              {/* Accessibility */}
              <Section
                title="Accessibility"
                icon={<Accessibility size={14} />}
                badge={accessibility.hidden ? "Hidden" : undefined}
              >
                {accessibility.role && (
                  <PropertyRow label="Role" value={accessibility.role} />
                )}
                {accessibility.accessibleName && (
                  <PropertyRow
                    label="Name"
                    value={accessibility.accessibleName}
                  />
                )}
                <PropertyRow
                  label="Focusable"
                  value={accessibility.keyboardFocusable ? "Yes" : "No"}
                />
                {accessibility.tabIndex !== null && (
                  <PropertyRow
                    label="Tab Index"
                    value={String(accessibility.tabIndex)}
                  />
                )}
                {Object.entries(accessibility.ariaAttributes).length > 0 && (
                  <div style={inspectStyles.subSection}>
                    <div style={inspectStyles.subSectionHeader}>
                      ARIA Attributes
                    </div>
                    {Object.entries(accessibility.ariaAttributes).map(
                      ([attr, value]) => (
                        <PropertyRow
                          key={attr}
                          label={attr}
                          value={value}
                          mono
                        />
                      ),
                    )}
                  </div>
                )}
              </Section>

              {/* Inline Styles (Editable) */}
              <EditableStylesSection
                targetElement={targetElement}
                refreshInfo={refreshElementInfo}
              />

              {/* Computed Styles with Origin Tracing */}
              <Section
                title="Computed Styles"
                icon={<Palette size={14} />}
                badge={`${styleCategories.length} categories`}
              >
                {styleCategories.map(([category, styles]) => (
                  <StylesSection
                    key={category}
                    category={category}
                    styles={styles as Record<string, string>}
                    showOrigin
                  />
                ))}
              </Section>

              {/* Data Attributes (Editable) */}
              <EditableDataAttributesSection
                targetElement={targetElement}
                dataAttributes={dataAttributes}
                refreshInfo={refreshElementInfo}
              />

              {/* Attributes (Editable) */}
              <EditableAttributesSection
                targetElement={targetElement}
                attributes={attributes}
                refreshInfo={refreshElementInfo}
              />

              {/* Source Location */}
              {sourceLocation && (
                <Section title="Source" icon={<Code size={14} />} defaultOpen>
                  <PropertyRow
                    label="File"
                    value={formatSourceLocation(sourceLocation)}
                    mono
                    copyable
                  />
                </Section>
              )}
              </div>
            )}

            {/* Actions Footer */}
            <div
              style={{
                ...inspectStyles.footer,
                ...(isCompact ? computedCompactStyles.footer : {}),
              }}
            >
              <div style={inspectStyles.footerActions}>
                <button
                  type="button"
                  onClick={handleCopySelector}
                  style={{
                    ...inspectStyles.actionButton,
                    ...(isCompact ? computedCompactStyles.actionButton : {}),
                  }}
                  title="Copy CSS selector"
                >
                  <Copy size={isCompact ? 12 : 14} />
                  <span>Selector</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyHTML}
                  style={{
                    ...inspectStyles.actionButton,
                    ...(isCompact ? computedCompactStyles.actionButton : {}),
                  }}
                  title="Copy outer HTML"
                >
                  <Copy size={isCompact ? 12 : 14} />
                  <span>HTML</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyStyles}
                  style={{
                    ...inspectStyles.actionButton,
                    ...(isCompact ? computedCompactStyles.actionButton : {}),
                  }}
                  title="Copy computed styles as CSS"
                >
                  <Copy size={isCompact ? 12 : 14} />
                  <span>Styles</span>
                </button>
              </div>
              <div style={inspectStyles.footerActions}>
                {sourceLocation && (
                  <button
                    type="button"
                    onClick={handleOpenInIDE}
                    style={{
                      ...inspectStyles.actionButtonPrimary,
                      ...(isCompact
                        ? computedCompactStyles.actionButtonPrimary
                        : {}),
                    }}
                    title="Open in IDE"
                  >
                    <ExternalLink size={isCompact ? 12 : 14} />
                    <span>Open in IDE</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRemoveElement}
                  style={{
                    ...inspectStyles.actionButtonDanger,
                    ...(isCompact
                      ? computedCompactStyles.actionButtonDanger
                      : {}),
                  }}
                  title="Hide element (can be restored)"
                >
                  <Trash2 size={isCompact ? 12 : 14} />
                </button>
              </div>
            </div>
          </div>
        </CompactModeContext.Provider>
      </TargetElementContext.Provider>
    </>
  );
}

/**
 * Styles for the InspectDialog
 */
const inspectStyles: Record<string, React.CSSProperties> = {
  dialog: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "420px",
    maxWidth: "95vw",
    maxHeight: "85vh",
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    boxShadow:
      "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "13px",
    color: "#e0e0e0",
    zIndex: 10001,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    borderBottom: "1px solid #333",
    backgroundColor: "#252525",
    gap: "8px",
  },
  dragHandle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    color: "#555",
    cursor: "grab",
    borderRadius: "4px",
    transition: "all 0.15s",
    flexShrink: 0,
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
    color: "#fff",
    flex: 1,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  pinButtons: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "2px",
    backgroundColor: "#1a1a1a",
    borderRadius: "6px",
  },
  pinButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "26px",
    height: "26px",
    border: "none",
    backgroundColor: "transparent",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  modifiedIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "2px",
    backgroundColor: "#1a1a1a",
    borderRadius: "6px",
  },
  modifiedButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    border: "none",
    backgroundColor: "transparent",
    color: "#a855f7",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  modifiedButtonActive: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
  },
  resetAllButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    border: "none",
    backgroundColor: "transparent",
    color: "#ef4444",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    border: "none",
    backgroundColor: "transparent",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#888",
    transition: "all 0.15s",
  },
  identity: {
    padding: "12px 16px",
    borderBottom: "1px solid #333",
    backgroundColor: "#1a1a1a",
  },
  tagLine: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  tag: {
    color: "#569cd6",
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: "14px",
  },
  id: {
    color: "#9cdcfe",
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: "14px",
  },
  classes: {
    color: "#4ec9b0",
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: "14px",
  },
  selectorRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  selectorCode: {
    flex: 1,
    padding: "6px 10px",
    backgroundColor: "#2d2d2d",
    borderRadius: "4px",
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: "11px",
    color: "#ce9178",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 0",
  },
  section: {
    borderBottom: "1px solid #2a2a2a",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px 16px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    color: "#e0e0e0",
    fontSize: "12px",
    fontWeight: 500,
    textAlign: "left",
    transition: "background-color 0.15s",
  },
  sectionHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionIcon: {
    display: "flex",
    alignItems: "center",
    color: "#888",
  },
  sectionTitle: {
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  badge: {
    padding: "2px 6px",
    backgroundColor: "#333",
    borderRadius: "4px",
    fontSize: "10px",
    color: "#888",
  },
  sectionContent: {
    padding: "0 16px 12px 32px",
  },
  propertyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
    gap: "12px",
  },
  propertyLabel: {
    color: "#888",
    fontSize: "12px",
    flexShrink: 0,
  },
  propertyValue: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#e0e0e0",
    fontSize: "12px",
    textAlign: "right",
  },
  mono: {
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: "11px",
  },
  subSection: {
    marginTop: "8px",
    paddingTop: "8px",
    borderTop: "1px solid #2a2a2a",
  },
  subSectionHeader: {
    fontSize: "10px",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "6px",
  },
  styleCategory: {
    marginBottom: "12px",
  },
  styleCategoryHeader: {
    fontSize: "11px",
    color: "#569cd6",
    textTransform: "capitalize",
    marginBottom: "4px",
    fontWeight: 500,
  },
  styleRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "2px 0",
    fontSize: "11px",
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  },
  styleProp: {
    color: "#9cdcfe",
  },
  styleValue: {
    color: "#ce9178",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderTop: "1px solid #333",
    backgroundColor: "#252525",
    gap: "8px",
  },
  footerActions: {
    display: "flex",
    gap: "6px",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 10px",
    border: "1px solid #444",
    backgroundColor: "transparent",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#aaa",
    fontSize: "11px",
    transition: "all 0.15s",
  },
  actionButtonPrimary: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    border: "none",
    backgroundColor: "#0066cc",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 500,
    transition: "all 0.15s",
  },
  actionButtonDanger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 8px",
    border: "1px solid #5c2828",
    backgroundColor: "transparent",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#e57373",
    fontSize: "11px",
    transition: "all 0.15s",
  },
  copyButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    border: "1px solid #444",
    backgroundColor: "transparent",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#aaa",
    fontSize: "11px",
    transition: "all 0.15s",
  },
  copyButtonSmall: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    border: "none",
    backgroundColor: "transparent",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#666",
    transition: "all 0.15s",
    flexShrink: 0,
  },
};

/**
 * Deep merge helper for compact configs
 */
function mergeCompactConfig(
  base: CompactModeConfig,
  overrides?: Partial<CompactModeConfig>,
): CompactModeConfig {
  if (!overrides) return base;
  return {
    scale: overrides.scale ?? base.scale,
    fonts: { ...base.fonts, ...overrides.fonts },
    spacing: { ...base.spacing, ...overrides.spacing },
    gaps: { ...base.gaps, ...overrides.gaps },
    sizes: { ...base.sizes, ...overrides.sizes },
    letterSpacing: { ...base.letterSpacing, ...overrides.letterSpacing },
  };
}

// Generate default compact styles
const compactStyles = generateCompactStyles(DEFAULT_COMPACT_CONFIG);

/**
 * Styles for editable components
 */
const editableStyles: Record<string, React.CSSProperties> = {
  value: {
    padding: "2px 4px",
    borderRadius: "3px",
    transition: "background-color 0.15s",
  },
  input: {
    padding: "2px 6px",
    border: "1px solid #4a9eff",
    borderRadius: "3px",
    backgroundColor: "#2d2d2d",
    color: "#e0e0e0",
    fontSize: "inherit",
    fontFamily: "inherit",
    outline: "none",
    minWidth: "60px",
    flex: 1,
  },
  inputCompact: {
    padding: "1px 4px",
    fontSize: "10px",
  },
  deleteButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    border: "none",
    backgroundColor: "transparent",
    color: "#888",
    cursor: "pointer",
    borderRadius: "3px",
    fontSize: "14px",
    lineHeight: 1,
    padding: 0,
    flexShrink: 0,
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    border: "1px dashed #444",
    backgroundColor: "transparent",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#888",
    fontSize: "10px",
    marginTop: "4px",
    transition: "all 0.15s",
  },
  confirmButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    border: "none",
    backgroundColor: "#2d5a2d",
    color: "#4ade80",
    cursor: "pointer",
    borderRadius: "3px",
    fontSize: "12px",
    padding: 0,
    flexShrink: 0,
  },
  cancelButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    border: "none",
    backgroundColor: "#5c2828",
    color: "#f87171",
    cursor: "pointer",
    borderRadius: "3px",
    fontSize: "14px",
    padding: 0,
    flexShrink: 0,
  },
};

/**
 * Styles for style origin components
 */
const styleOriginStyles: Record<string, React.CSSProperties> = {
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "2px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    flexShrink: 0,
    transition: "opacity 0.15s",
  },
  tooltip: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "4px",
    minWidth: "200px",
    maxWidth: "300px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "6px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    zIndex: 1000,
    overflow: "hidden",
  },
  tooltipHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    borderBottom: "1px solid #333",
    backgroundColor: "#252525",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tooltipClose: {
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
  },
  tooltipContent: {
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  tooltipRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    fontSize: "10px",
  },
  tooltipLabel: {
    color: "#888",
    flexShrink: 0,
    minWidth: "55px",
  },
  tooltipCode: {
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    color: "#9cdcfe",
    fontSize: "9px",
    wordBreak: "break-all",
    backgroundColor: "#2d2d2d",
    padding: "2px 4px",
    borderRadius: "3px",
  },
};

/**
 * Styles for modified elements panel
 */
const modifiedPanelStyles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: "#1e1e1e",
    borderBottom: "1px solid #333",
    maxHeight: "200px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 12px",
    backgroundColor: "#252525",
    borderBottom: "1px solid #333",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "10px",
    color: "#a855f7",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "18px",
    height: "18px",
    border: "none",
    backgroundColor: "transparent",
    color: "#888",
    cursor: "pointer",
    borderRadius: "3px",
  },
  list: {
    flex: 1,
    overflow: "auto",
    padding: "4px 0",
  },
  empty: {
    padding: "12px",
    textAlign: "center",
    color: "#666",
    fontSize: "11px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 12px",
    gap: "8px",
    borderBottom: "1px solid #2a2a2a",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  itemHovered: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  itemSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.25)",
    borderLeft: "2px solid #3b82f6",
    paddingLeft: "10px",
  },
  itemMain: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    minWidth: 0,
  },
  itemSelector: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    border: "none",
    backgroundColor: "transparent",
    color: "#e0e0e0",
    cursor: "pointer",
    padding: "2px 4px",
    borderRadius: "3px",
    fontSize: "10px",
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    textAlign: "left",
  },
  itemMeta: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  badge: {
    padding: "1px 4px",
    backgroundColor: "#333",
    borderRadius: "3px",
    fontSize: "8px",
    color: "#888",
  },
  time: {
    fontSize: "8px",
    color: "#666",
  },
  resetButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    border: "none",
    backgroundColor: "transparent",
    color: "#888",
    cursor: "pointer",
    borderRadius: "3px",
    flexShrink: 0,
  },
};

export default InspectDialog;
