"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  type ElementInspectInfo,
  captureScreenshot,
  getElementInspectInfo,
} from "@ewjdev/anyclick-core";
import { Camera, Code, Copy, ExternalLink, FileText, X } from "lucide-react";
import {
  clearHighlights,
  findContainerParent,
  highlightContainer,
  highlightTarget,
} from "../highlight";
import {
  AnyclickIconButton,
  AnyclickSurface,
  resolveSlotProps,
  useAnyclickStyle,
} from "../styling";
import {
  type IDEConfig,
  type SourceLocation,
  findSourceLocationInAncestors,
  formatSourceLocation,
  openInIDE,
} from "../ide";
import type { HighlightColors } from "../types";

export type PinnedPosition = "left" | "right" | "top" | "bottom" | "floating";

export interface CompactModeConfig {
  scale: number;
  fonts: {
    base: number;
    title: number;
    tag: number;
    selector: number;
    section: number;
    badge: number;
    property: number;
    styleRow: number;
    button: number;
  };
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
  gaps: {
    headerTitle: string;
    pinButtons: string;
    propertyRow: string;
    propertyValue: string;
    button: string;
    footer: string;
  };
  sizes: {
    dialogWidth: number;
    closeButton: number;
    copyButtonSmall: number;
    styleValueMaxWidth: number;
    categoryMarginBottom: number;
    styleCategoryHeaderMarginBottom: number;
  };
  letterSpacing: {
    sectionTitle: string;
  };
}

export const DEFAULT_COMPACT_CONFIG: CompactModeConfig = {
  scale: 0.5,
  fonts: {
    base: 12,
    title: 14,
    tag: 12,
    selector: 11,
    section: 12,
    badge: 11,
    property: 12,
    styleRow: 11,
    button: 12,
  },
  spacing: {
    headerPadding: "8px 12px",
    identityPadding: "8px 12px",
    sectionHeaderPadding: "6px 12px",
    sectionContentPadding: "8px 12px",
    footerPadding: "8px 12px",
    selectorCodePadding: "6px 10px",
    buttonPadding: "6px 10px",
    buttonPrimaryPadding: "6px 12px",
    buttonDangerPadding: "6px 8px",
    badgePadding: "2px 6px",
    propertyRowPadding: "4px 6px",
    styleRowPadding: "4px 6px",
  },
  gaps: {
    headerTitle: "8px",
    pinButtons: "4px",
    propertyRow: "4px",
    propertyValue: "6px",
    button: "6px",
    footer: "8px",
  },
  sizes: {
    dialogWidth: 420,
    closeButton: 18,
    copyButtonSmall: 16,
    styleValueMaxWidth: 240,
    categoryMarginBottom: 8,
    styleCategoryHeaderMarginBottom: 6,
  },
  letterSpacing: {
    sectionTitle: "0.04em",
  },
};

export interface InspectSimpleProps {
  visible: boolean;
  targetElement: Element | null;
  onClose: () => void;
  onSelectElement?: (element: Element) => void;
  ideConfig?: Partial<IDEConfig>;
  style?: React.CSSProperties;
  className?: string;
  highlightColors?: HighlightColors;
  showBoxModelOverlay?: boolean;
  initialPinnedPosition?: PinnedPosition;
  compactConfig?: Partial<CompactModeConfig>;
}

function copy(text: string): Promise<boolean> {
  if (!text) return Promise.resolve(false);
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return Promise.resolve(false);
  }
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export function InspectSimple({
  visible,
  targetElement,
  onClose,
  ideConfig,
  style,
  className,
  highlightColors,
}: InspectSimpleProps) {
  const adapter = useAnyclickStyle();
  const { tokens } = adapter;
  const [info, setInfo] = useState<ElementInspectInfo | null>(null);
  const [sourceLocation, setSourceLocation] = useState<SourceLocation | null>(
    null,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Auto-dismiss status message after 5 seconds
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 5000);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!visible || !targetElement) return;

    try {
      clearHighlights();
      highlightTarget(targetElement, highlightColors);
      const container = findContainerParent(targetElement);
      if (container) highlightContainer(container, highlightColors);
    } catch {
      // ignore highlight errors
    }

    const nextInfo = getElementInspectInfo(targetElement);
    setInfo(nextInfo);
    setSourceLocation(
      findSourceLocationInAncestors(targetElement) ??
        nextInfo.sourceLocation ??
        null,
    );

    return () => {
      clearHighlights();
    };
  }, [visible, targetElement, highlightColors]);

  // Handle outside click
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay adding the listener to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, onClose]);

  const identityLabel = useMemo(() => {
    if (!info) return "Select an element";
    const classes = info.classNames[0] ? `.${info.classNames[0]}` : "";
    const id = info.id ? `#${info.id}` : "";
    return `${info.tagName}${id}${classes}`;
  }, [info]);

  const handleCopySelector = async () => {
    if (!info?.selector) {
      setStatus("No selector available");
      return;
    }
    const ok = await copy(info.selector);
    setStatus(
      ok ? "✓ Selector copied to clipboard" : "Failed to copy selector",
    );
  };

  const handleCopyText = async () => {
    if (!info?.innerText) {
      setStatus("No text content to copy");
      return;
    }
    const ok = await copy(info.innerText);
    setStatus(
      ok ? "✓ Text content copied to clipboard" : "Failed to copy text",
    );
  };

  const handleSaveScreenshot = async () => {
    if (!targetElement) return;
    setSaving(true);
    setStatus("Capturing screenshot…");
    const result = await captureScreenshot(targetElement, null, "element");
    setSaving(false);
    if (result.capture?.dataUrl) {
      downloadDataUrl(result.capture.dataUrl, "anyclick-inspect.png");
      setStatus("✓ Screenshot saved to downloads");
    } else {
      setStatus(result.error?.message || "Screenshot capture failed");
    }
  };

  const handleCopyOuterHTML = async () => {
    if (!info?.outerHTML) {
      setStatus("No HTML to copy");
      return;
    }
    const ok = await copy(info.outerHTML);
    setStatus(ok ? "✓ HTML markup copied to clipboard" : "Failed to copy HTML");
  };

  const handleOpenIDE = () => {
    if (!sourceLocation) return;
    openInIDE(sourceLocation, ideConfig);
  };

  if (!visible || !targetElement) return null;

  const dialogStyles: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: tokens.zIndexSurface,
        width: "100%",
        maxWidth: "100%",
        color: tokens.text,
        borderTop: `1px solid ${tokens.border}`,
        borderRadius: "16px 16px 0 0",
        boxShadow: tokens.shadowLg,
        fontFamily: tokens.fontFamily,
        fontSize: 13,
        overflow: "hidden",
        ...style,
      }
    : {
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: tokens.zIndexSurface,
        width: 320,
        maxWidth: "90vw",
        color: tokens.text,
        border: `1px solid ${tokens.border}`,
        borderRadius: 12,
        boxShadow: tokens.shadowLg,
        fontFamily: tokens.fontFamily,
        fontSize: 13,
        overflow: "hidden",
        ...style,
      };
  const headerProps = resolveSlotProps(adapter, "inspect.header");
  const contentProps = resolveSlotProps(adapter, "inspect.content");
  const actionState = { size: "sm" as const };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: isMobile ? "rgba(0,0,0,0.5)" : "transparent",
          pointerEvents: isMobile ? "auto" : "none",
        }}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="presentation"
      />

      <AnyclickSurface
        ref={dialogRef}
        className={`anyclick-tiny-inspect ${className ?? ""}`}
        slotName="inspect.surface"
        style={dialogStyles}
      >
        {/* Header with close button */}
        <div
          {...headerProps.attrs}
          className={headerProps.className}
          style={{
            ...headerProps.style,
            padding: isMobile ? "12px 16px" : "8px 10px",
          }}
        >
          {/* Mobile drawer handle */}
          {isMobile && (
            <div
              style={{
                position: "absolute",
                top: 6,
                left: "50%",
                transform: "translateX(-50%)",
                width: 36,
                height: 4,
                borderRadius: 2,
                background: tokens.textMuted,
              }}
            />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 6,
                background: tokens.surfaceMuted,
                color: tokens.text,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: tokens.fontMono,
              }}
            >
              {identityLabel}
            </span>
            {sourceLocation && (
              <AnyclickIconButton
                onClick={handleOpenIDE}
                title={formatSourceLocation(sourceLocation)}
                slotName="inspect.action"
                slotState={actionState}
              >
                <ExternalLink size={14} />
              </AnyclickIconButton>
            )}
          </div>

          <AnyclickIconButton
            onClick={onClose}
            aria-label="Close inspector"
            slotName="inspect.action"
            slotState={actionState}
          >
            <X size={16} />
          </AnyclickIconButton>
        </div>

        {/* Compact content */}
        <div
          {...contentProps.attrs}
          className={contentProps.className}
          style={{
            ...contentProps.style,
            padding: isMobile ? "12px 16px 20px" : "10px",
          }}
        >
          {/* Selector row */}
          {info?.selector && (
            <code
              style={{
                fontSize: 11,
                color: tokens.textMuted,
                background: tokens.surfaceMuted,
                padding: "6px 8px",
                borderRadius: 6,
                wordBreak: "break-all",
                display: "block",
              }}
            >
              {info.selector}
            </code>
          )}

          {/* Status feedback message - above buttons */}
          {status && (
            <div
              style={{
                fontSize: 12,
                color: status.startsWith("✓")
                  ? tokens.success
                  : status.toLowerCase().includes("failed") ||
                      status.toLowerCase().includes("error")
                    ? tokens.danger
                    : tokens.textMuted,
                padding: "4px 0",
                fontWeight: 500,
              }}
            >
              {status}
            </div>
          )}

          {/* Actions - icon-only row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <AnyclickIconButton
              onClick={handleCopySelector}
              title="Copy CSS selector"
              aria-label="Copy CSS selector"
              slotName="inspect.action"
              slotState={actionState}
            >
              <Copy size={15} />
            </AnyclickIconButton>
            <AnyclickIconButton
              onClick={handleCopyText}
              title="Copy text content"
              aria-label="Copy text content"
              slotName="inspect.action"
              slotState={actionState}
            >
              <FileText size={15} />
            </AnyclickIconButton>
            <AnyclickIconButton
              onClick={handleCopyOuterHTML}
              title="Copy HTML markup"
              aria-label="Copy HTML markup"
              slotName="inspect.action"
              slotState={actionState}
            >
              <Code size={15} />
            </AnyclickIconButton>
            <AnyclickIconButton
              onClick={handleSaveScreenshot}
              disabled={saving}
              title="Save screenshot"
              aria-label="Save screenshot"
              slotName="inspect.action"
              slotState={{ ...actionState, disabled: saving, loading: saving }}
            >
              <Camera size={15} />
            </AnyclickIconButton>
          </div>
        </div>
      </AnyclickSurface>
    </>
  );
}
