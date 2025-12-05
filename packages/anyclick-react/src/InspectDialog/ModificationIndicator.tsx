"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useInspectStore, useHasHydrated } from "./inspectStore";
import { AnyclickLogo } from "../AnyclickLogo";
import { openInspectDialog } from "./InspectDialogManager";
import { X, RotateCcw } from "lucide-react";

export interface ModificationIndicatorProps {
  /** Position of the indicator. Defaults to "bottom-right" */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Size of the logo in pixels. Defaults to 48 */
  size?: number;
  /** Whether to auto-apply persisted modifications on mount. Defaults to true */
  autoApply?: boolean;
  /** Offset from edge in pixels. Defaults to 16 */
  offset?: number;
  /** Primary color for the logo */
  primaryColor?: string;
  /** Background color for the logo */
  backgroundColor?: string;
}

/**
 * ModificationIndicator - Shows the Anyclick logo when modifications are active
 *
 * This component:
 * 1. Waits for Zustand hydration before applying modifications
 * 2. Auto-applies persisted modifications on mount (if autoApply is true)
 * 3. Shows the Anyclick logo in the corner when modifications are active
 * 4. Clicking the logo opens a quick menu to view/reset modifications
 */
export function ModificationIndicator({
  position = "bottom-right",
  size = 48,
  autoApply = true,
  offset = 16,
  primaryColor = "#3b82f6",
  backgroundColor = "rgba(59, 130, 246, 0.15)",
}: ModificationIndicatorProps) {
  const {
    modifiedElements,
    deletedElements,
    hasAutoAppliedModifications,
    applyPersistedModifications,
    resetAllElements,
    getModifiedElementsInDOM,
    setHasAutoAppliedModifications,
  } = useInspectStore();

  // Track hydration state to prevent SSR mismatches
  const hasHydrated = useHasHydrated();

  const [showMenu, setShowMenu] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);

  // Auto-apply modifications after hydration completes
  useEffect(() => {
    if (!hasHydrated || !autoApply || typeof window === "undefined") {
      return;
    }

    // Wait a tick for DOM to be ready after hydration
    const timer = setTimeout(() => {
      const count = applyPersistedModifications();
      setAppliedCount(count);
    }, 50);

    return () => clearTimeout(timer);
  }, [hasHydrated, autoApply, applyPersistedModifications]);

  const modCount = Object.keys(modifiedElements).length;
  const deletedCount = Object.keys(deletedElements).length;
  const totalCount = modCount + deletedCount;

  // Check if there are any elements that can be inspected
  // Modified elements that exist in DOM, or hidden (deleted) elements
  const hasInspectableElements = hasHydrated && totalCount > 0;

  // Don't render until hydrated to prevent SSR mismatches
  const isVisible = hasHydrated && totalCount > 0;

  const handleReset = useCallback(() => {
    resetAllElements();
    setShowMenu(false);
    setHasAutoAppliedModifications(false);
  }, [resetAllElements, setHasAutoAppliedModifications]);

  const handleInspectFirst = useCallback(() => {
    // First try hidden (deleted) elements - they're still in DOM
    for (const deleted of Object.values(deletedElements)) {
      try {
        const element = document.querySelector(deleted.selector);
        if (element) {
          openInspectDialog(element);
          setShowMenu(false);
          return;
        }
      } catch {
        // Invalid selector
      }
    }

    // Then try modified elements
    const elements = getModifiedElementsInDOM();
    const firstValidModified = elements.find(
      (e) => e.element !== null && !e.modification.isDeleted,
    );
    if (firstValidModified?.element) {
      openInspectDialog(firstValidModified.element);
      setShowMenu(false);
      return;
    }

    setShowMenu(false);
  }, [getModifiedElementsInDOM, deletedElements]);

  if (!isVisible) {
    return null;
  }

  const positionStyles: React.CSSProperties = {
    position: "fixed",
    zIndex: 9998,
    ...(position.includes("bottom") ? { bottom: offset } : { top: offset }),
    ...(position.includes("right") ? { right: offset } : { left: offset }),
  };

  return (
    <div style={positionStyles}>
      {/* Menu popup */}
      {showMenu && (
        <div
          style={{
            ...indicatorStyles.menu,
            ...(position.includes("bottom")
              ? { bottom: size + 8 }
              : { top: size + 8 }),
            ...(position.includes("right") ? { right: 0 } : { left: 0 }),
          }}
        >
          <div style={indicatorStyles.menuHeader}>
            <span style={indicatorStyles.menuTitle}>
              {totalCount} Change{totalCount !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => setShowMenu(false)}
              style={indicatorStyles.closeButton}
            >
              <X size={14} />
            </button>
          </div>
          <div style={indicatorStyles.menuStats}>
            {modCount > 0 && (
              <span style={indicatorStyles.statBadge}>{modCount} modified</span>
            )}
            {deletedCount > 0 && (
              <span
                style={{
                  ...indicatorStyles.statBadge,
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "#ef4444",
                }}
              >
                {deletedCount} hidden
              </span>
            )}
          </div>
          {hasAutoAppliedModifications && (
            <div style={indicatorStyles.autoAppliedBadge}>
              Auto-applied {appliedCount} change{appliedCount !== 1 ? "s" : ""}
            </div>
          )}
          <div style={indicatorStyles.menuActions}>
            {hasInspectableElements && (
              <button
                type="button"
                onClick={handleInspectFirst}
                style={indicatorStyles.menuButton}
              >
                View in Inspector
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              style={indicatorStyles.menuButtonDanger}
            >
              <RotateCcw size={12} />
              Reset All {deletedCount > 0 && "(show hidden)"}
            </button>
          </div>
        </div>
      )}

      {/* Logo button */}
      <div
        style={{
          ...indicatorStyles.logoContainer,
          width: size,
          height: size,
        }}
      >
        <AnyclickLogo
          size={size}
          primaryColor={primaryColor}
          backgroundColor={backgroundColor}
          onClick={() => setShowMenu(!showMenu)}
          style={{
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
            transition: "transform 0.15s ease",
          }}
        />
        {/* Badge showing count */}
        <div
          style={{
            ...indicatorStyles.badge,
            backgroundColor: deletedCount > 0 ? "#ef4444" : primaryColor,
          }}
        >
          {totalCount}
        </div>
      </div>
    </div>
  );
}

const indicatorStyles: Record<string, React.CSSProperties> = {
  logoContainer: {
    position: "relative",
    cursor: "pointer",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 600,
    color: "white",
    padding: "0 4px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  menu: {
    position: "absolute",
    width: 220,
    backgroundColor: "#1e1e1e",
    border: "1px solid #333",
    borderRadius: 8,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    overflow: "hidden",
  },
  menuHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    borderBottom: "1px solid #333",
    backgroundColor: "#252525",
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#e0e0e0",
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    border: "none",
    backgroundColor: "transparent",
    color: "#888",
    cursor: "pointer",
    borderRadius: 4,
  },
  autoAppliedBadge: {
    padding: "6px 12px",
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    color: "#3b82f6",
    fontSize: 10,
    borderBottom: "1px solid #333",
  },
  menuStats: {
    display: "flex",
    gap: 6,
    padding: "6px 10px",
    borderBottom: "1px solid #333",
  },
  statBadge: {
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 500,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    color: "#3b82f6",
  },
  menuActions: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 10,
  },
  menuButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 12px",
    border: "none",
    backgroundColor: "#333",
    color: "#e0e0e0",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    transition: "background-color 0.15s",
  },
  menuButtonDanger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 12px",
    border: "none",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    transition: "background-color 0.15s",
  },
};

export default ModificationIndicator;
