"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AnyclickType, ScreenshotData } from "@ewjdev/anyclick-core";
import {
  DEFAULT_SCREENSHOT_CONFIG,
  captureAllScreenshots,
  isScreenshotSupported,
} from "@ewjdev/anyclick-core";
import {
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon,
  GripVertical,
  PlusIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { ScreenshotPreview } from "./ScreenshotPreview";
import { applyHighlights, clearHighlights } from "./highlight";
import { getBadgeStyle, menuStyles } from "./styles";
import type { ContextMenuItem, ContextMenuProps } from "./types";

/** Padding from viewport edges in pixels */
const VIEWPORT_PADDING = 10;

/**
 * Default icons for feedback types
 */
const defaultIcons: Record<string, React.ReactNode> = {
  feature: <PlusIcon className="w-4 h-4" />,
  issue: <FlagIcon className="w-4 h-4" />,
  like: <ThumbsUpIcon className="w-4 h-4" />,
};

/**
 * Default header component for the context menu.
 */
const DefaultHeader = ({
  children,
  className,
  styles,
  title = "Send Feedback",
}: {
  children?: React.ReactNode;
  className?: string;
  styles?: React.CSSProperties;
  title?: string;
}) => {
  return (
    <div style={styles} className={className}>
      <span>{title}</span>
      {children}
    </div>
  );
};

/**
 * Menu item component with touch-friendly sizing.
 */
const MenuItem = React.memo(function MenuItem({
  disabled,
  hasChildren,
  item,
  onClick,
}: {
  disabled: boolean;
  hasChildren?: boolean;
  item: ContextMenuItem;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const isComingSoon = item.status === "comingSoon";
  const badgeLabel = item.badge?.label ?? (isComingSoon ? "Coming soon" : null);
  const badgeTone = item.badge?.tone ?? (isComingSoon ? "neutral" : "neutral");

  const badgeStyle = badgeLabel ? getBadgeStyle(badgeTone) : undefined;
  const iconNode = item.icon ?? defaultIcons[item.type];

  return (
    <button
      type="button"
      disabled={disabled || isComingSoon}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onTouchCancel={() => setIsPressed(false)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      style={{
        ...menuStyles.touchFriendly,
        ...menuStyles.item,
        ...(isHovered || isPressed ? menuStyles.itemHover : {}),
        ...(disabled ? menuStyles.itemDisabled : {}),
      }}
    >
      {iconNode ? <span style={menuStyles.itemIcon}>{iconNode}</span> : null}
      <span style={menuStyles.itemLabel}>
        {item.label}
        {badgeLabel && <span style={badgeStyle}>{badgeLabel}</span>}
      </span>
      {hasChildren && (
        <ChevronRightIcon className="w-4 h-4" style={menuStyles.submenuIcon} />
      )}
    </button>
  );
});

/**
 * Back button for submenu navigation with touch-friendly sizing.
 */
const BackButton = React.memo(function BackButton({
  onClick,
}: {
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onTouchCancel={() => setIsPressed(false)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      style={{
        ...menuStyles.item,
        ...menuStyles.backButton,
        ...menuStyles.touchFriendly,
        ...(isHovered || isPressed ? menuStyles.itemHover : {}),
      }}
    >
      <ChevronLeftIcon className="w-4 h-4" style={{ opacity: 0.5 }} />
      <span style={{ opacity: 0.7 }}>Back</span>
    </button>
  );
});

/**
 * Comment form component.
 */
const CommentForm = React.memo(function CommentForm({
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(comment);
  }, [comment, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      } else if (e.key === "Escape") {
        onCancel();
      }
    },
    [handleSubmit, onCancel],
  );

  return (
    <div style={menuStyles.commentSection}>
      <textarea
        ref={inputRef}
        disabled={isSubmitting}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a comment (optional)..."
        style={menuStyles.commentInput}
        value={comment}
      />
      <div style={menuStyles.buttonRow}>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          style={{ ...menuStyles.button, ...menuStyles.cancelButton }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
          style={{
            ...menuStyles.button,
            ...menuStyles.submitButton,
            ...(isSubmitting ? menuStyles.submitButtonDisabled : {}),
          }}
        >
          {isSubmitting ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
});

/** View states for the context menu */
type MenuView = "comment" | "menu" | "screenshot-preview";

/**
 * Calculate adjusted position to keep menu in viewport.
 */
function calculateInViewPosition(
  requestedX: number,
  requestedY: number,
  menuWidth: number,
  menuHeight: number,
): { x: number; y: number } {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  let x = requestedX;
  let y = requestedY;

  // Adjust X if menu would go off the right edge
  if (x + menuWidth > viewportWidth - VIEWPORT_PADDING) {
    x = viewportWidth - menuWidth - VIEWPORT_PADDING;
  }
  // Ensure X doesn't go off the left edge
  if (x < VIEWPORT_PADDING) {
    x = VIEWPORT_PADDING;
  }

  // Adjust Y if menu would go off the bottom edge
  if (y + menuHeight > viewportHeight - VIEWPORT_PADDING) {
    y = viewportHeight - menuHeight - VIEWPORT_PADDING;
  }
  // Ensure Y doesn't go off the top edge
  if (y < VIEWPORT_PADDING) {
    y = VIEWPORT_PADDING;
  }

  return { x, y };
}

/**
 * Context menu component for selecting feedback type.
 *
 * Displays a customizable context menu with support for:
 * - Custom menu items with icons and badges
 * - Submenus for organizing options
 * - Comment input for detailed feedback
 * - Screenshot preview before sending
 * - Touch-friendly interactions
 * - Dynamic positioning modes
 *
 * @since 1.0.0
 */
export function ContextMenu({
  className,
  containerElement,
  footer,
  header,
  highlightConfig,
  isSubmitting,
  items,
  onClose,
  onSelect,
  position,
  positionMode = "inView",
  screenshotConfig,
  style,
  targetElement,
  visible,
}: ContextMenuProps) {
  const [selectedType, setSelectedType] = useState<AnyclickType | null>(null);
  const [currentView, setCurrentView] = useState<MenuView>("menu");
  const [pendingComment, setPendingComment] = useState<string | undefined>();
  const [submenuStack, setSubmenuStack] = useState<ContextMenuItem[][]>([]);
  const [screenshots, setScreenshots] = useState<ScreenshotData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position state for different modes
  const [adjustedPosition, setAdjustedPosition] = useState<{
    x: number;
    y: number;
  }>(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Merge screenshot config with defaults
  const mergedScreenshotConfig = React.useMemo(
    () => ({
      ...DEFAULT_SCREENSHOT_CONFIG,
      ...screenshotConfig,
    }),
    [screenshotConfig],
  );

  const showPreview =
    mergedScreenshotConfig.showPreview && isScreenshotSupported();

  // Current items to display (either root items or submenu items)
  const currentItems =
    submenuStack.length > 0 ? submenuStack[submenuStack.length - 1] : items;

  // Capture screenshots
  const captureScreenshots = useCallback(async () => {
    if (!targetElement || !showPreview) return;

    setIsCapturing(true);
    try {
      const captured = await captureAllScreenshots(
        targetElement,
        containerElement,
        mergedScreenshotConfig,
      );
      setScreenshots(captured);
    } catch (error) {
      console.error("Failed to capture screenshots:", error);
      setScreenshots(null);
    } finally {
      setIsCapturing(false);
    }
  }, [containerElement, mergedScreenshotConfig, showPreview, targetElement]);

  // Reset state when menu closes
  useEffect(() => {
    if (!visible) {
      setSelectedType(null);
      setCurrentView("menu");
      setPendingComment(undefined);
      setSubmenuStack([]);
      setScreenshots(null);
      setIsCapturing(false);
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      dragStartRef.current = null;
    }
  }, [visible]);

  // Apply highlights to target element and container when menu opens
  useEffect(() => {
    if (visible && targetElement) {
      clearHighlights();
      applyHighlights(targetElement, highlightConfig);
    } else {
      clearHighlights();
    }

    return () => {
      clearHighlights();
    };
  }, [highlightConfig, targetElement, visible]);

  // Close menu when clicking outside of it
  useEffect(() => {
    if (!visible) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current) return;

      const target = event.target as Node;
      if ((target as HTMLElement).closest?.("[data-drag-handle]")) {
        return;
      }
      if (!menuRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose, visible]);

  // Reset adjusted position when menu opens at new position
  useEffect(() => {
    if (visible) {
      setAdjustedPosition(position);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [position.x, position.y, visible]);

  // Calculate and apply position based on mode
  useEffect(() => {
    if (!visible || !menuRef.current) return;

    const updatePosition = () => {
      const menuElement = menuRef.current;
      if (!menuElement) return;

      const rect = menuElement.getBoundingClientRect();
      const baseX = position.x + dragOffset.x;
      const baseY = position.y + dragOffset.y;

      if (positionMode === "static") {
        setAdjustedPosition({ x: baseX, y: baseY });
      } else if (positionMode === "inView" || positionMode === "dynamic") {
        const adjusted = calculateInViewPosition(
          baseX,
          baseY,
          rect.width,
          rect.height,
        );
        setAdjustedPosition(adjusted);
      }
    };

    requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [currentView, dragOffset, position, positionMode, visible]);

  // Dragging logic for dynamic mode
  useEffect(() => {
    if (!visible || positionMode !== "dynamic") return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const deltaX = event.clientX - dragStartRef.current.x;
      const deltaY = event.clientY - dragStartRef.current.y;

      setDragOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      dragStartRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("pointercancel", handlePointerUp);

      return () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.removeEventListener("pointercancel", handlePointerUp);
      };
    }
  }, [isDragging, positionMode, visible]);

  // Handle drag start
  const handleDragStart = useCallback(
    (event: React.PointerEvent) => {
      if (positionMode !== "dynamic") return;
      event.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: event.clientX, y: event.clientY };
    },
    [positionMode],
  );

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (currentView === "screenshot-preview") {
          setCurrentView("comment");
        } else if (currentView === "comment") {
          setCurrentView("menu");
          setSelectedType(null);
          setPendingComment(undefined);
        } else if (submenuStack.length > 0) {
          setSubmenuStack((prev) => prev.slice(0, -1));
        } else {
          onClose();
        }
      }
    };

    if (visible) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [currentView, onClose, submenuStack.length, visible]);

  // Prevent touch default behaviors on menu container
  useEffect(() => {
    const menuElement = menuRef.current;
    if (!visible || !menuElement) return;

    const preventTouchDefault = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "TEXTAREA" ||
        target.tagName === "INPUT" ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
    };

    menuElement.addEventListener("touchmove", preventTouchDefault, {
      passive: false,
    });

    return () => {
      menuElement.removeEventListener("touchmove", preventTouchDefault);
    };
  }, [visible]);

  if (!visible || !targetElement) {
    return null;
  }

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.status === "comingSoon") {
      return;
    }

    if (item.children && item.children.length > 0) {
      setSubmenuStack((prev) => [...prev, item.children!]);
      return;
    }

    if (item.onClick) {
      try {
        return item.onClick({
          closeMenu: onClose,
          containerElement,
          targetElement,
        });
      } catch (error) {
        console.error("Anyclick menu onClick error:", error);
        return;
      }
    }

    if (item.showComment) {
      setSelectedType(item.type);
      setCurrentView("comment");
    } else {
      if (showPreview) {
        setSelectedType(item.type);
        setCurrentView("screenshot-preview");
        captureScreenshots();
      } else {
        onSelect(item.type);
      }
    }
  };

  const handleBack = () => {
    setSubmenuStack((prev) => prev.slice(0, -1));
  };

  const handleCommentSubmit = (comment: string) => {
    if (!selectedType) return;

    if (showPreview) {
      setPendingComment(comment || undefined);
      setCurrentView("screenshot-preview");
      captureScreenshots();
    } else {
      onSelect(selectedType, comment || undefined);
    }
  };

  const handleCommentCancel = () => {
    setCurrentView("menu");
    setSelectedType(null);
    setPendingComment(undefined);
  };

  const handleScreenshotConfirm = (confirmedScreenshots: ScreenshotData) => {
    if (selectedType) {
      onSelect(selectedType, pendingComment, confirmedScreenshots);
    }
  };

  const handleScreenshotCancel = () => {
    if (pendingComment !== undefined) {
      setCurrentView("comment");
    } else {
      setCurrentView("menu");
      setSelectedType(null);
    }
    setScreenshots(null);
  };

  const handleRetakeScreenshots = () => {
    captureScreenshots();
  };

  const containerWidth = currentView === "screenshot-preview" ? 360 : undefined;

  return (
    <div
      ref={menuRef}
      aria-label="Feedback options"
      className={className}
      role="menu"
      style={{
        ...menuStyles.container,
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        ...(containerWidth
          ? { minWidth: containerWidth, width: containerWidth }
          : {}),
        touchAction: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        ...(isDragging ? { cursor: "grabbing" } : {}),
        ...style,
      }}
    >
      {!header && currentView !== "screenshot-preview" && (
        <DefaultHeader styles={menuStyles.header} title="Send Feedback">
          {showPreview && (
            <div style={menuStyles.screenshotIndicator}>
              <CameraIcon className="w-3 h-3" />
            </div>
          )}
          {positionMode === "dynamic" && (
            <div
              data-drag-handle
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "0.5";
              }}
              onPointerDown={handleDragStart}
              style={{
                ...menuStyles.dragHandle,
                cursor: isDragging ? "grabbing" : "grab",
              }}
              title="Drag to move"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
        </DefaultHeader>
      )}
      {!!header && header}

      {currentView === "menu" && (
        <div style={menuStyles.itemList}>
          {submenuStack.length > 0 && <BackButton onClick={handleBack} />}
          {currentItems.map((item) => (
            <MenuItem
              key={item.type}
              disabled={isSubmitting}
              hasChildren={item.children && item.children.length > 0}
              item={item}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </div>
      )}

      {currentView === "comment" && (
        <CommentForm
          isSubmitting={isSubmitting}
          onCancel={handleCommentCancel}
          onSubmit={handleCommentSubmit}
        />
      )}

      {currentView === "screenshot-preview" && (
        <ScreenshotPreview
          isLoading={isCapturing}
          isSubmitting={isSubmitting}
          onCancel={handleScreenshotCancel}
          onConfirm={handleScreenshotConfirm}
          onRetake={handleRetakeScreenshots}
          screenshots={screenshots}
        />
      )}
    </div>
  );
}
