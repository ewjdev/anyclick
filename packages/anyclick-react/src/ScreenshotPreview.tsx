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
import {
  AnyclickButton,
  AnyclickIconButton,
  AnyclickSurface,
  AnyclickTab,
  AnyclickTabs,
  resolveSlotProps,
  useAnyclickStyle,
} from "./styling";
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
  const adapter = useAnyclickStyle();
  const headerProps = resolveSlotProps(adapter, "screenshot.header");
  const previewProps = resolveSlotProps(adapter, "screenshot.preview", {
    expanded: isExpanded,
  });
  const emptyProps = resolveSlotProps(adapter, "screenshot.empty");
  const errorProps = resolveSlotProps(adapter, "screenshot.error", {
    error: true,
  });
  const metaProps = resolveSlotProps(adapter, "screenshot.meta");

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
      <AnyclickSurface slotName="screenshot.surface" style={{ gap: "12px", padding: "12px" }}>
        <div
          {...emptyProps.attrs}
          className={emptyProps.className}
          style={emptyProps.style}
        >
          <Loader2Icon
            className="w-6 h-6 animate-spin"
            style={{ color: "#3b82f6" }}
          />
          <span>Capturing screenshots...</span>
        </div>
      </AnyclickSurface>
    );
  }

  if (!screenshots) {
    return (
      <AnyclickSurface slotName="screenshot.surface" style={{ gap: "12px", padding: "12px" }}>
        <div
          {...emptyProps.attrs}
          className={emptyProps.className}
          style={emptyProps.style}
        >
          <ImageIcon className="w-8 h-8" style={{ color: "#9ca3af" }} />
          <span>Screenshots unavailable</span>
          <span style={{ color: adapter.tokens.textMuted, fontSize: adapter.tokens.fontSizeXs }}>
            Some elements can&apos;t be captured (e.g., gradient text)
          </span>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <AnyclickButton
              disabled={isSubmitting}
              onClick={onRetake}
              slotName="screenshot.action"
              slotState={{ disabled: isSubmitting }}
            >
              <RefreshCwIcon className="w-4 h-4" />
              Try Again
            </AnyclickButton>
            <AnyclickButton
              disabled={isSubmitting}
              onClick={() =>
                onConfirm({ capturedAt: new Date().toISOString() })
              }
              slotName="screenshot.action"
              slotState={{ disabled: isSubmitting, tone: "accent" }}
            >
              <CheckIcon className="w-4 h-4" />
              Continue Without
            </AnyclickButton>
          </div>
        </div>
      </AnyclickSurface>
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
    <AnyclickSurface
      slotName="screenshot.surface"
      slotState={{ expanded: isExpanded }}
      style={{
        gap: "8px",
        padding: "8px",
        ...(isExpanded
          ? {
              left: "50%",
              maxHeight: "90vh",
              maxWidth: "800px",
              position: "fixed",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "90vw",
              zIndex: 10000,
            }
          : {}),
      }}
    >
      <div
        {...headerProps.attrs}
        className={headerProps.className}
        style={headerProps.style}
      >
        <span>Review Screenshots</span>
        <div style={{ alignItems: "center", display: "flex", gap: "8px" }}>
          <span
            {...metaProps.attrs}
            className={metaProps.className}
            style={metaProps.style}
          >
            {formatBytes(totalSize)}
          </span>
          <AnyclickIconButton
            onClick={() => setIsExpanded(!isExpanded)}
            slotName="screenshot.action"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ShrinkIcon className="w-4 h-4" />
            ) : (
              <ExpandIcon className="w-4 h-4" />
            )}
          </AnyclickIconButton>
        </div>
      </div>

      {/* Tabs */}
      <AnyclickTabs
        slotName="screenshot.header"
        style={{ borderBottom: `1px solid ${adapter.tokens.border}`, gap: "4px", paddingBottom: "8px" }}
      >
        {tabs.map((tab) => (
          <AnyclickTab
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            slotName={activeTab === tab.key ? "screenshot.tabActive" : "screenshot.tab"}
            slotState={{
              error: Boolean(tab.error && !tab.data),
              selected: activeTab === tab.key,
              size: "sm",
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
              <span style={{ fontSize: adapter.tokens.fontSizeXs, opacity: 0.7 }}>
                {formatBytes(tab.data.sizeBytes)}
              </span>
            )}
          </AnyclickTab>
        ))}
      </AnyclickTabs>

      {/* Preview image */}
      <div
        {...previewProps.attrs}
        className={previewProps.className}
        style={previewProps.style}
      >
        {activeScreenshot ? (
          <img
            alt={`${activeTab} screenshot`}
            src={activeScreenshot.dataUrl}
            style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
          />
        ) : activeError ? (
          <div
            {...errorProps.attrs}
            className={errorProps.className}
            style={errorProps.style}
          >
            <AlertCircleIcon className="w-8 h-8" style={{ color: "#ef4444" }} />
            <span style={{ fontWeight: 700 }}>Capture Failed</span>
            <span style={{ maxWidth: "250px" }}>{activeError.message}</span>
          </div>
        ) : (
          <div
            {...emptyProps.attrs}
            className={emptyProps.className}
            style={{ ...emptyProps.style, padding: "16px" }}
          >
            <ImageIcon className="w-6 h-6" style={{ color: "#9ca3af" }} />
            <span>No {activeTab} screenshot</span>
          </div>
        )}
      </div>

      {/* Dimensions info */}
      {activeScreenshot && (
        <div
          {...metaProps.attrs}
          className={metaProps.className}
          style={metaProps.style}
        >
          {activeScreenshot.width} × {activeScreenshot.height}px
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          alignItems: "center",
          borderTop: `1px solid ${adapter.tokens.border}`,
          display: "flex",
          justifyContent: "space-between",
          paddingTop: "8px",
        }}
      >
        <AnyclickButton
          disabled={isSubmitting}
          onClick={onRetake}
          slotName="screenshot.action"
          slotState={{ disabled: isSubmitting }}
        >
          <RefreshCwIcon className="w-3 h-3" />
          Retake
        </AnyclickButton>
        <div style={{ display: "flex", gap: "8px" }}>
          <AnyclickButton
            disabled={isSubmitting}
            onClick={onCancel}
            slotName="screenshot.action"
            slotState={{ disabled: isSubmitting }}
          >
            <XIcon className="w-3 h-3" />
            Cancel
          </AnyclickButton>
          <AnyclickButton
            disabled={isSubmitting}
            onClick={() => onConfirm(screenshots)}
            slotName="screenshot.action"
            slotState={{
              disabled: isSubmitting,
              loading: isSubmitting,
              tone: "accent",
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
          </AnyclickButton>
        </div>
      </div>
    </AnyclickSurface>
  );
});
