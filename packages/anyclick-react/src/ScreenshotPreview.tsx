"use client";

import React, { useState } from "react";
import type { ScreenshotData, ScreenshotError } from "@ewjdev/anyclick-core";
import { formatBytes, estimateTotalSize } from "@ewjdev/anyclick-core";
import type { ScreenshotPreviewProps } from "./types";
import { menuStyles } from "./styles";
import { screenshotPreviewStyles as styles } from "./styles";
import {
  ImageIcon,
  RefreshCwIcon,
  CheckIcon,
  XIcon,
  Loader2Icon,
  ExpandIcon,
  ShrinkIcon,
  AlertCircleIcon,
} from "lucide-react";

type TabType = "element" | "container" | "viewport";

/**
 * Screenshot preview component - shows captured screenshots before sending
 */
export function ScreenshotPreview({
  screenshots,
  isLoading,
  onConfirm,
  onCancel,
  onRetake,
  isSubmitting,
}: ScreenshotPreviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("element");
  const [isExpanded, setIsExpanded] = useState(false);

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
              onClick={onRetake}
              style={styles.retakeButtonOutline}
              disabled={isSubmitting}
            >
              <RefreshCwIcon className="w-4 h-4" />
              Try Again
            </button>
            <button
              type="button"
              onClick={() =>
                onConfirm({ capturedAt: new Date().toISOString() })
              }
              style={styles.continueButton}
              disabled={isSubmitting}
            >
              <CheckIcon className="w-4 h-4" />
              Continue Without
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get error for a specific tab
  const getError = (key: TabType): ScreenshotError | undefined => {
    return screenshots.errors?.[key];
  };

  const allTabs: {
    key: TabType;
    label: string;
    data: typeof screenshots.element;
    error?: ScreenshotError;
  }[] = [
    {
      key: "element" as const,
      label: "Element",
      data: screenshots.element,
      error: getError("element"),
    },
    {
      key: "container" as const,
      label: "Container",
      data: screenshots.container,
      error: getError("container"),
    },
    {
      key: "viewport" as const,
      label: "Viewport",
      data: screenshots.viewport,
      error: getError("viewport"),
    },
  ];
  // Show tabs that have either data or errors
  const tabs = allTabs.filter((tab) => tab.data || tab.error);

  const activeScreenshot =
    activeTab === "element"
      ? screenshots.element
      : activeTab === "container"
        ? screenshots.container
        : screenshots.viewport;

  const activeError = getError(activeTab);

  const totalSize = estimateTotalSize(screenshots);

  console.log({ styles });

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
            src={activeScreenshot.dataUrl}
            alt={`${activeTab} screenshot`}
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
          onClick={onRetake}
          disabled={isSubmitting}
          style={styles.retakeButtonSmall}
        >
          <RefreshCwIcon className="w-3 h-3" />
          Retake
        </button>
        <div style={styles.actionsRight}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center gap-1"
            style={{ ...menuStyles.button, ...menuStyles.cancelButton }}
          >
            <XIcon className="w-3 h-3" />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(screenshots)}
            disabled={isSubmitting}
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
}
