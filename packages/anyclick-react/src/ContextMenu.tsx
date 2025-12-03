"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { ContextMenuProps, FeedbackMenuItem } from "./types";
import type { FeedbackType, ScreenshotData } from "@ewjdev/anyclick-core";
import {
  captureAllScreenshots,
  isScreenshotSupported,
  DEFAULT_SCREENSHOT_CONFIG,
} from "@ewjdev/anyclick-core";
import { menuStyles } from "./styles";
import { applyHighlights, clearHighlights } from "./highlight";
import { ScreenshotPreview } from "./ScreenshotPreview";
import {
  FlagIcon,
  PlusIcon,
  ThumbsUpIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CameraIcon,
} from "lucide-react";

/**
 * Default icons for feedback types
 */
const defaultIcons: Record<string, React.ReactNode> = {
  issue: <FlagIcon className="w-4 h-4" />,
  feature: <PlusIcon className="w-4 h-4" />,
  like: <ThumbsUpIcon className="w-4 h-4" />,
};

/**
 * Menu item component with touch-friendly sizing
 */
function MenuItem({
  item,
  onClick,
  disabled,
  hasChildren,
}: {
  item: FeedbackMenuItem;
  onClick: () => void;
  disabled: boolean;
  hasChildren?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      style={{
        ...menuStyles.item,
        // Apply hover/pressed state for both mouse and touch
        ...(isHovered || isPressed ? menuStyles.itemHover : {}),
        ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
        // Ensure minimum touch target size (44px is recommended)
        minHeight: "44px",
        // Prevent text selection on touch
        WebkitUserSelect: "none",
        userSelect: "none",
        // Prevent touch callout on iOS
        WebkitTouchCallout: "none",
      }}
    >
      <span style={menuStyles.itemIcon}>
        {item.icon ?? defaultIcons[item.type]}
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {hasChildren && (
        <ChevronRightIcon
          className="w-4 h-4"
          style={{ marginLeft: "auto", opacity: 0.5 }}
        />
      )}
    </button>
  );
}

/**
 * Back button for submenu navigation with touch-friendly sizing
 */
function BackButton({ onClick }: { onClick: () => void }) {
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
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      style={{
        ...menuStyles.item,
        ...(isHovered || isPressed ? menuStyles.itemHover : {}),
        borderBottom: "1px solid #e5e5e5",
        marginBottom: "4px",
        // Ensure minimum touch target size
        minHeight: "44px",
        // Prevent text selection on touch
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      <ChevronLeftIcon className="w-4 h-4" style={{ opacity: 0.5 }} />
      <span style={{ opacity: 0.7 }}>Back</span>
    </button>
  );
}

/**
 * Comment form component
 */
function CommentForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (comment: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [comment, setComment] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    onSubmit(comment);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div style={menuStyles.commentSection}>
      <textarea
        ref={inputRef}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a comment (optional)..."
        style={menuStyles.commentInput}
        disabled={isSubmitting}
      />
      <div style={menuStyles.buttonRow}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{ ...menuStyles.button, ...menuStyles.cancelButton }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
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
}

/** View states for the context menu */
type MenuView = "menu" | "comment" | "screenshot-preview";

/**
 * Context menu component for selecting feedback type
 */
export function ContextMenu({
  visible,
  position,
  targetElement,
  containerElement,
  items,
  onSelect,
  onClose,
  isSubmitting,
  style,
  className,
  highlightConfig,
  screenshotConfig,
}: ContextMenuProps) {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [currentView, setCurrentView] = useState<MenuView>("menu");
  const [pendingComment, setPendingComment] = useState<string | undefined>();
  const [submenuStack, setSubmenuStack] = useState<FeedbackMenuItem[][]>([]);
  const [screenshots, setScreenshots] = useState<ScreenshotData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Merge screenshot config with defaults
  const mergedScreenshotConfig = {
    ...DEFAULT_SCREENSHOT_CONFIG,
    ...screenshotConfig,
  };

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
  }, [targetElement, containerElement, mergedScreenshotConfig, showPreview]);

  // Reset state when menu closes
  useEffect(() => {
    if (!visible) {
      setSelectedType(null);
      setCurrentView("menu");
      setPendingComment(undefined);
      setSubmenuStack([]);
      setScreenshots(null);
      setIsCapturing(false);
    }
  }, [visible]);

  // Apply highlights to target element and container when menu opens
  useEffect(() => {
    if (visible && targetElement) {
      // Clear any existing highlights first to ensure clean state
      clearHighlights();
      // Apply highlights to the new target element
      applyHighlights(targetElement, highlightConfig);
    } else {
      // Clear highlights when menu is not visible
      clearHighlights();
    }

    return () => {
      clearHighlights();
    };
  }, [visible, targetElement, highlightConfig]);

  // Close menu when clicking outside of it
  useEffect(() => {
    if (!visible) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current) return;

      const target = event.target as Node;
      if (!menuRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [visible, onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (visible && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      if (adjustedX !== position.x || adjustedY !== position.y) {
        menuRef.current.style.left = `${adjustedX}px`;
        menuRef.current.style.top = `${adjustedY}px`;
      }
    }
  }, [visible, position]);

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
          // Go back one level in submenu
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
  }, [visible, currentView, submenuStack.length, onClose]);

  // Prevent touch default behaviors on menu container
  useEffect(() => {
    const menuElement = menuRef.current;
    if (!visible || !menuElement) return;

    // Prevent touch scrolling and other default behaviors within the menu
    const preventTouchDefault = (e: TouchEvent) => {
      // Allow touches within interactive elements (inputs, textareas)
      const target = e.target as HTMLElement;
      if (
        target.tagName === "TEXTAREA" ||
        target.tagName === "INPUT" ||
        target.isContentEditable
      ) {
        return;
      }
      // Prevent default to stop scroll/zoom behaviors
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

  const handleItemClick = (item: FeedbackMenuItem) => {
    // If item has children, navigate to submenu
    if (item.children && item.children.length > 0) {
      setSubmenuStack((prev) => [...prev, item.children!]);
      return;
    }

    // Otherwise, handle selection
    if (item.showComment) {
      setSelectedType(item.type);
      setCurrentView("comment");
    } else {
      // If preview is enabled, capture and show preview
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

    // If preview is enabled, capture and show preview
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
    // Go back to comment or menu
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

  // Determine container width based on view
  const containerWidth = currentView === "screenshot-preview" ? 360 : undefined;

  return (
    <div
      ref={menuRef}
      className={className}
      style={{
        ...menuStyles.container,
        left: position.x,
        top: position.y,
        ...(containerWidth
          ? { width: containerWidth, minWidth: containerWidth }
          : {}),
        // Touch-specific styles
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
        touchAction: "none", // Prevent default touch behaviors
        ...style,
      }}
      role="menu"
      aria-label="Feedback options"
    >
      {currentView !== "screenshot-preview" && (
        <div style={menuStyles.header}>Send Feedback</div>
      )}

      {currentView === "menu" && (
        <div style={menuStyles.itemList}>
          {submenuStack.length > 0 && <BackButton onClick={handleBack} />}
          {currentItems.map((item) => (
            <MenuItem
              key={item.type}
              item={item}
              onClick={() => handleItemClick(item)}
              disabled={isSubmitting}
              hasChildren={item.children && item.children.length > 0}
            />
          ))}
          {showPreview && (
            <div style={screenshotIndicatorStyle}>
              <CameraIcon className="w-3 h-3" />
              <span>Screenshots will be captured</span>
            </div>
          )}
        </div>
      )}

      {currentView === "comment" && (
        <CommentForm
          onSubmit={handleCommentSubmit}
          onCancel={handleCommentCancel}
          isSubmitting={isSubmitting}
        />
      )}

      {currentView === "screenshot-preview" && (
        <ScreenshotPreview
          screenshots={screenshots}
          isLoading={isCapturing}
          onConfirm={handleScreenshotConfirm}
          onCancel={handleScreenshotCancel}
          onRetake={handleRetakeScreenshots}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

const screenshotIndicatorStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 12px",
  fontSize: "11px",
  color: "#9ca3af",
  borderTop: "1px solid #f3f4f6",
  marginTop: "4px",
};
