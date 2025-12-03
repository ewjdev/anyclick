"use client";

import React, { useState } from "react";
import type { ScreenshotData } from "@anyclick/core";
import { formatBytes, estimateTotalSize } from "@anyclick/core";
import type { ScreenshotPreviewProps } from "./types";
import { menuStyles } from "./styles";
import {
  ImageIcon,
  RefreshCwIcon,
  CheckIcon,
  XIcon,
  Loader2Icon,
  ExpandIcon,
  ShrinkIcon,
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
          <span style={styles.emptyText}>No screenshots captured</span>
          <button
            type="button"
            onClick={onRetake}
            style={styles.retakeButton}
            disabled={isSubmitting}
          >
            <RefreshCwIcon className="w-4 h-4" />
            Capture Screenshots
          </button>
        </div>
      </div>
    );
  }

  const allTabs: {
    key: TabType;
    label: string;
    data: typeof screenshots.element;
  }[] = [
    { key: "element" as const, label: "Element", data: screenshots.element },
    {
      key: "container" as const,
      label: "Container",
      data: screenshots.container,
    },
    { key: "viewport" as const, label: "Viewport", data: screenshots.viewport },
  ];
  const tabs = allTabs.filter((tab) => tab.data);

  const activeScreenshot =
    activeTab === "element"
      ? screenshots.element
      : activeTab === "container"
        ? screenshots.container
        : screenshots.viewport;

  const totalSize = estimateTotalSize(screenshots);

  return (
    <div
      style={{
        ...styles.container,
        ...(isExpanded ? styles.containerExpanded : {}),
      }}
    >
      <div style={styles.header}>
        <span style={styles.headerTitle}>Screenshot Preview</span>
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
            }}
          >
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  containerExpanded: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90vw",
    maxWidth: "800px",
    maxHeight: "90vh",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    padding: "16px",
    zIndex: 10000,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "24px",
  },
  loadingText: {
    fontSize: "13px",
    color: "#6b7280",
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "24px",
  },
  emptyText: {
    fontSize: "13px",
    color: "#9ca3af",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 4px",
  },
  headerTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#374151",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sizeLabel: {
    fontSize: "11px",
    color: "#9ca3af",
  },
  iconButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    border: "none",
    background: "transparent",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#6b7280",
  },
  tabContainer: {
    display: "flex",
    gap: "4px",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "8px",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 10px",
    fontSize: "12px",
    color: "#6b7280",
    background: "transparent",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  tabActive: {
    backgroundColor: "#eff6ff",
    color: "#3b82f6",
    fontWeight: "500",
  },
  tabSize: {
    fontSize: "10px",
    color: "#9ca3af",
  },
  previewContainer: {
    position: "relative",
    width: "100%",
    height: "150px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainerExpanded: {
    height: "60vh",
    maxHeight: "500px",
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
  noPreview: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#9ca3af",
  },
  dimensionsInfo: {
    fontSize: "11px",
    color: "#9ca3af",
    textAlign: "center" as const,
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "8px",
    borderTop: "1px solid #e5e7eb",
  },
  actionsRight: {
    display: "flex",
    gap: "8px",
  },
  retakeButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    fontSize: "13px",
    color: "#fff",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  retakeButtonSmall: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    fontSize: "11px",
    color: "#6b7280",
    backgroundColor: "transparent",
    border: "1px solid #e5e7eb",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
