"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  type ElementInspectInfo,
  captureScreenshot,
  getElementInspectInfo,
} from "@ewjdev/anyclick-core";
import { Copy, Download, ExternalLink, X } from "lucide-react";
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

export interface InspectDialogProps {
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

export function InspectDialog({
  visible,
  targetElement,
  onClose,
  ideConfig,
  style,
  className,
  highlightColors,
}: InspectDialogProps) {
  const [info, setInfo] = useState<ElementInspectInfo | null>(null);
  const [sourceLocation, setSourceLocation] = useState<SourceLocation | null>(
    null,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const identityLabel = useMemo(() => {
    if (!info) return "Select an element";
    const classes = info.classNames[0] ? `.${info.classNames[0]}` : "";
    const id = info.id ? `#${info.id}` : "";
    return `${info.tagName}${id}${classes}`;
  }, [info]);

  const handleCopySelector = async () => {
    if (!info?.selector) return;
    const ok = await copy(info.selector);
    setStatus(ok ? "Selector copied" : "Copy failed");
  };

  const handleCopyText = async () => {
    if (!info?.innerText) return;
    const ok = await copy(info.innerText);
    setStatus(ok ? "Contents copied" : "Copy failed");
  };

  const handleSaveScreenshot = async () => {
    if (!targetElement) return;
    setSaving(true);
    setStatus("Capturing screenshot…");
    const result = await captureScreenshot(targetElement, null, "element");
    setSaving(false);
    if (result.capture?.dataUrl) {
      downloadDataUrl(result.capture.dataUrl, "anyclick-inspect.png");
      setStatus("Screenshot saved");
    } else {
      setStatus(result.error?.message || "Screenshot failed");
    }
  };

  const handleCopyOuterHTML = async () => {
    if (!info?.outerHTML) return;
    const ok = await copy(info.outerHTML);
    setStatus(ok ? "HTML copied" : "Copy failed");
  };

  const handleOpenIDE = () => {
    if (!sourceLocation) return;
    openInIDE(sourceLocation, ideConfig);
  };

  if (!visible || !targetElement) return null;

  return (
    <div
      className={`anyclick-tiny-inspect ${className ?? ""}`}
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        width: 360,
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
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          background: "#0b1220",
          borderBottom: "1px solid #1e293b",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 600, letterSpacing: "0.02em" }}>
              Inspect
            </span>
            <span
              style={{
                padding: "2px 6px",
                borderRadius: 6,
                background: "#1e293b",
                color: "#cbd5e1",
                fontSize: 12,
              }}
            >
              {identityLabel}
            </span>
          </div>
          {info?.selector ? (
            <code
              style={{
                fontSize: 11,
                color: "#94a3b8",
                background: "#111827",
                padding: "4px 6px",
                borderRadius: 6,
              }}
            >
              {info.selector}
            </code>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {sourceLocation ? (
            <button
              type="button"
              onClick={handleOpenIDE}
              title={formatSourceLocation(sourceLocation)}
              style={buttonStyle("ghost")}
            >
              <ExternalLink size={14} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            style={buttonStyle("ghost")}
            aria-label="Close inspector"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div
        style={{
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={cardStyle}>
          <div style={rowStyle}>
            <span style={labelStyle}>Selector</span>
            <button
              type="button"
              onClick={handleCopySelector}
              style={buttonStyle("ghost")}
            >
              <Copy size={14} />
            </button>
          </div>
          <div
            style={{ color: "#cbd5e1", fontSize: 12, wordBreak: "break-all" }}
          >
            {info?.selector ?? "—"}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={rowStyle}>
            <span style={labelStyle}>Contents</span>
            <button
              type="button"
              onClick={handleCopyText}
              style={buttonStyle("ghost")}
            >
              <Copy size={14} />
            </button>
          </div>
          <div
            style={{
              color: "#cbd5e1",
              fontSize: 12,
              maxHeight: 120,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {info?.innerText || "(empty)"}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={rowStyle}>
            <span style={labelStyle}>Actions</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              onClick={handleCopyOuterHTML}
              style={buttonStyle("solid")}
            >
              <Copy size={14} />
              HTML
            </button>
            <button
              type="button"
              onClick={handleSaveScreenshot}
              style={buttonStyle("solid")}
              disabled={saving}
            >
              <Download size={14} />
              {saving ? "Saving…" : "Save screenshot"}
            </button>
          </div>
        </div>

        {status ? (
          <div
            style={{
              fontSize: 12,
              color: "#cbd5e1",
              background: "#0b1220",
              borderRadius: 8,
              padding: "6px 8px",
              border: "1px solid #1e293b",
            }}
          >
            {status}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function buttonStyle(variant: "ghost" | "solid"): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    border: "1px solid transparent",
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "#e2e8f0",
    cursor: "pointer",
    background: "transparent",
  };

  if (variant === "solid") {
    return {
      ...base,
      background: "#2563eb",
      borderColor: "#1d4ed8",
      boxShadow: "0 6px 16px rgba(37, 99, 235, 0.35)",
    };
  }

  return {
    ...base,
    borderColor: "#1e293b",
    background: "#0b1220",
  };
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #1e293b",
  borderRadius: 10,
  padding: 10,
  background: "#0b1220",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
