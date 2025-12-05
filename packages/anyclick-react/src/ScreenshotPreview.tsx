"use client";

import React, { useMemo, useState } from "react";
import type { ScreenshotData, ScreenshotError } from "@ewjdev/anyclick-core";
import { estimateTotalSize, formatBytes } from "@ewjdev/anyclick-core";
import {
  AlertCircleIcon,
  CheckIcon,
  ExpandIcon,
  ImageIcon,
  Loader2Icon,
  RefreshCwIcon,
  ShrinkIcon,
  XIcon,
} from "lucide-react";
import { menuStyles, screenshotPreviewStyles as styles } from "./styles";
import type { ScreenshotPreviewProps } from "./types";

/** Screenshot preview tab types */
type TabType = "container" | "element" | "viewport";

/**
 * Screenshot preview component - shows captured screenshots before sending.
 *
 * Displays a preview of captured screenshots with tabs for element, container,
 * and viewport captures. Allows users to review, retake, or proceed without
 * screenshots.
 *
 * @since 1.0.0
 */
export const ScreenshotPreview = React.memo(function ScreenshotPreview({
  isLoading,
  isSubmitting,
  onCancel,
  onConfirm,
  onRetake,
  screenshots,
}: ScreenshotPreviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("element");
  const [isExpanded, setIsExpanded] = useState(false);

  // Get error for a specific tab
  const getError = (key: TabType): ScreenshotError | undefined => {
    return screenshots?.errors?.[key];
  };

  // Memoize tabs computation
  const tabs = useMemo(() => {
    if (!screenshots) return [];

    const allTabs: {
      data: typeof screenshots.element;
      error?: ScreenshotError;
      key: TabType;
      label: string;
    }[] = [
      {
        data: screenshots.element,
        error: getError("element"),
        key: "element" as const,
        label: "Element",
      },
      {
        data: screenshots.container,
        error: getError("container"),
        key: "container" as const,
        label: "Container",
      },
      {
        data: screenshots.viewport,
        error: getError("viewport"),
        key: "viewport" as const,
        label: "Viewport",
      },
    ];

    // Show tabs that have either data or errors
    return allTabs.filter((tab) => tab.data || tab.error);
  }, [screenshots]);

  // Memoize total size calculation
  const totalSize = useMemo(
    () => (screenshots ? estimateTotalSize(screenshots) : 0),
    [screenshots],
  );

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <Loader2Icon
            className="w-6 h-6 animate-spin"
            style={{ color: "#3b82f6" }}
          />
          <span style={styles.loadingText}>Capturing screenshots...</span>
        </div>
      </div>
    );
  }

  if (!screenshots) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyContainer}>
          <ImageIcon className="w-8 h-8" style={{ color: "#9ca3af" }} />
          <span style={styles.emptyText}>Screenshots unavailable</span>
          <span style={styles.emptySubtext}>
            Some elements can&apos;t be captured (e.g., gradient text)
          </span>
          <div style={styles.emptyActions}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onRetake}
              style={styles.retakeButtonOutline}
            >
              <RefreshCwIcon className="w-4 h-4" />
              Try Again
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                onConfirm({ capturedAt: new Date().toISOString() })
              }
              style={styles.continueButton}
            >
              <CheckIcon className="w-4 h-4" />
              Continue Without
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeScreenshot =
    activeTab === "element"
      ? screenshots.element
      : activeTab === "container"
        ? screenshots.container
        : screenshots.viewport;

  const activeError = getError(activeTab);

  return (
    <div
      style={{
        ...styles.container,
        ...(isExpanded ? styles.containerExpanded : {}),
        padding: "8px",
      }}
    >
      <div style={styles.header}>
        <span style={styles.headerTitle}>Review Screenshots</span>
        <div style={styles.headerActions}>
          <span style={styles.sizeLabel}>{formatBytes(totalSize)}</span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={styles.iconButton}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ShrinkIcon className="w-4 h-4" />
            ) : (
              <ExpandIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.tabActive : {}),
              ...(tab.error && !tab.data ? styles.tabError : {}),
            }}
          >
            {tab.error && !tab.data && (
              <AlertCircleIcon
                className="w-3 h-3"
                style={{ color: "#ef4444" }}
              />
            )}
            {tab.label}
            {tab.data && (
              <span style={styles.tabSize}>
                {formatBytes(tab.data.sizeBytes)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Preview image */}
      <div
        style={{
          ...styles.previewContainer,
          ...(isExpanded ? styles.previewContainerExpanded : {}),
        }}
      >
        {activeScreenshot ? (
          <img
            alt={`${activeTab} screenshot`}
            src={activeScreenshot.dataUrl}
            style={styles.previewImage}
          />
        ) : activeError ? (
          <div style={styles.errorPreview}>
            <AlertCircleIcon className="w-8 h-8" style={{ color: "#ef4444" }} />
            <span style={styles.errorTitle}>Capture Failed</span>
            <span style={styles.errorMessage}>{activeError.message}</span>
          </div>
        ) : (
          <div style={styles.noPreview}>
            <ImageIcon className="w-6 h-6" style={{ color: "#9ca3af" }} />
            <span>No {activeTab} screenshot</span>
          </div>
        )}
      </div>

      {/* Dimensions info */}
      {activeScreenshot && (
        <div style={styles.dimensionsInfo}>
          {activeScreenshot.width} × {activeScreenshot.height}px
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onRetake}
          style={styles.retakeButtonSmall}
        >
          <RefreshCwIcon className="w-3 h-3" />
          Retake
        </button>
        <div style={styles.actionsRight}>
          <button
            type="button"
            className="flex items-center gap-1"
            disabled={isSubmitting}
            onClick={onCancel}
            style={{ ...menuStyles.button, ...menuStyles.cancelButton }}
          >
            <XIcon className="w-3 h-3" />
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onConfirm(screenshots)}
            style={{
              ...menuStyles.button,
              ...menuStyles.submitButton,
              ...(isSubmitting ? menuStyles.submitButtonDisabled : {}),
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="w-3 h-3 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <CheckIcon className="w-3 h-3" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
