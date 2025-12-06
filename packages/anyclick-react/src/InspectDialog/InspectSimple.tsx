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
        zIndex: 9999,
        width: "100%",
        maxWidth: "100%",
        background: "#0f172a",
        color: "#e2e8f0",
        borderTop: "1px solid #1e293b",
        borderRadius: "16px 16px 0 0",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: 13,
        overflow: "hidden",
        ...style,
      }
    : {
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        width: 320,
        maxWidth: "90vw",
        background: "#0f172a",
        color: "#e2e8f0",
        border: "1px solid #1e293b",
        borderRadius: 12,
        boxShadow: "0 18px 48px rgba(0,0,0,0.45)",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: 13,
        overflow: "hidden",
        ...style,
      };

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

      <div
        ref={dialogRef}
        className={`anyclick-tiny-inspect ${className ?? ""}`}
        style={dialogStyles}
      >
        {/* Header with close button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "12px 16px" : "8px 10px",
            background: "#0b1220",
            borderBottom: "1px solid #1e293b",
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
                background: "#475569",
              }}
            />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 6,
                background: "#1e293b",
                color: "#e2e8f0",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "monospace",
              }}
            >
              {identityLabel}
            </span>
            {sourceLocation && (
              <button
                type="button"
                onClick={handleOpenIDE}
                title={formatSourceLocation(sourceLocation)}
                style={iconBtnStyle}
              >
                <ExternalLink size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={iconBtnStyle}
            aria-label="Close inspector"
          >
            <X size={16} />
          </button>
        </div>

        {/* Compact content */}
        <div
          style={{
            padding: isMobile ? "12px 16px 20px" : "10px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Selector row */}
          {info?.selector && (
            <code
              style={{
                fontSize: 11,
                color: "#94a3b8",
                background: "#111827",
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
                  ? "#4ade80"
                  : status.toLowerCase().includes("failed") ||
                      status.toLowerCase().includes("error")
                    ? "#f87171"
                    : "#94a3b8",
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
            <button
              type="button"
              onClick={handleCopySelector}
              style={iconActionStyle}
              title="Copy CSS selector"
              aria-label="Copy CSS selector"
            >
              <Copy size={15} />
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              style={iconActionStyle}
              title="Copy text content"
              aria-label="Copy text content"
            >
              <FileText size={15} />
            </button>
            <button
              type="button"
              onClick={handleCopyOuterHTML}
              style={iconActionStyle}
              title="Copy HTML markup"
              aria-label="Copy HTML markup"
            >
              <Code size={15} />
            </button>
            <button
              type="button"
              onClick={handleSaveScreenshot}
              style={{
                ...iconActionStyle,
                ...(saving ? { opacity: 0.5, cursor: "wait" } : {}),
              }}
              disabled={saving}
              title="Save screenshot"
              aria-label="Save screenshot"
            >
              <Camera size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const iconBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid #1e293b",
  background: "#0b1220",
  color: "#94a3b8",
  cursor: "pointer",
  padding: 0,
};

const iconActionStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "1px solid #1e293b",
  background: "#0b1220",
  color: "#94a3b8",
  cursor: "pointer",
  padding: 0,
  transition: "background 0.15s, color 0.15s, border-color 0.15s",
};
