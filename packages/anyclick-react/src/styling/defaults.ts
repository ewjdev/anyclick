import type { CSSProperties } from "react";
import type {
  AnyclickResolveSlotInput,
  AnyclickStyleAdapter,
  AnyclickStyleTokens,
} from "./types";

export const defaultAnyclickStyleTokens: AnyclickStyleTokens = {
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceMuted: "#f1f5f9",
  surfaceSubtle: "#e2e8f0",
  border: "#cbd5e1",
  text: "#0f172a",
  textMuted: "#475569",
  accent: "#2563eb",
  accentMuted: "#dbeafe",
  accentText: "#ffffff",
  danger: "#dc2626",
  dangerMuted: "#fee2e2",
  success: "#16a34a",
  warning: "#d97706",
  focusRing: "rgba(37, 99, 235, 0.35)",
  radiusSm: "6px",
  radiusMd: "10px",
  radiusLg: "14px",
  radiusFull: "9999px",
  shadowSm: "0 1px 2px rgba(15, 23, 42, 0.08)",
  shadowMd: "0 10px 24px rgba(15, 23, 42, 0.16)",
  shadowLg: "0 20px 48px rgba(15, 23, 42, 0.2)",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontMono:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  fontSizeXs: "11px",
  fontSizeSm: "12px",
  fontSizeMd: "14px",
  fontSizeLg: "16px",
  lineHeightTight: 1.2,
  lineHeightBase: 1.45,
  spacing2xs: "2px",
  spacingXs: "4px",
  spacingSm: "8px",
  spacingMd: "12px",
  spacingLg: "16px",
  spacingXl: "24px",
  minTouchTarget: "38px",
  zIndexOverlay: 9998,
  zIndexSurface: 9999,
  zIndexPinned: 9998,
};

function withInteractiveState(
  style: CSSProperties,
  input: AnyclickResolveSlotInput,
): CSSProperties {
  const { state, tokens } = input;
  return {
    ...style,
    opacity: state.disabled ? 0.6 : style.opacity,
    cursor: state.disabled ? "not-allowed" : style.cursor,
    backgroundColor:
      state.error && style.backgroundColor === tokens.surface
        ? tokens.dangerMuted
        : state.selected || state.active || state.hovered || state.pressed
          ? tokens.surfaceMuted
          : style.backgroundColor,
    borderColor: state.error ? tokens.danger : style.borderColor,
  };
}

function baseButtonStyle(input: AnyclickResolveSlotInput): CSSProperties {
  const { state, tokens } = input;
  const tone = state.tone ?? "neutral";
  const emphasized = tone === "accent";
  const destructive = tone === "danger";

  return withInteractiveState(
    {
      alignItems: "center",
      appearance: "none",
      backgroundColor: destructive
        ? tokens.danger
        : emphasized
          ? tokens.accent
          : tokens.surface,
      border: `1px solid ${destructive || emphasized ? "transparent" : tokens.border}`,
      borderRadius: tokens.radiusSm,
      color: destructive || emphasized ? tokens.accentText : tokens.text,
      cursor: "pointer",
      display: "inline-flex",
      fontFamily: tokens.fontFamily,
      fontSize: state.size === "sm" ? tokens.fontSizeXs : tokens.fontSizeSm,
      fontWeight: 600,
      gap: tokens.spacingXs,
      justifyContent: "center",
      minHeight:
        state.size === "sm" ? "28px" : state.size === "lg" ? "42px" : "34px",
      padding:
        state.size === "sm"
          ? `0 ${tokens.spacingSm}`
          : `0 ${tokens.spacingMd}`,
      transition:
        "background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
    },
    input,
  );
}

function baseFieldStyle(input: AnyclickResolveSlotInput): CSSProperties {
  const { state, tokens } = input;
  return withInteractiveState(
    {
      appearance: "none",
      backgroundColor: state.disabled ? tokens.surfaceMuted : tokens.surface,
      border: `1px solid ${state.error ? tokens.danger : tokens.border}`,
      borderRadius: tokens.radiusSm,
      boxSizing: "border-box",
      color: tokens.text,
      fontFamily: tokens.fontFamily,
      fontSize: tokens.fontSizeMd,
      lineHeight: tokens.lineHeightBase,
      outline: "none",
      padding: `${tokens.spacingSm} ${tokens.spacingMd}`,
      width: "100%",
    },
    input,
  );
}

function slotStyle(input: AnyclickResolveSlotInput): CSSProperties {
  const { slot, state, tokens } = input;

  switch (slot) {
    case "menu.overlay":
      return {
        inset: 0,
        position: "fixed",
        zIndex: tokens.zIndexOverlay,
      };
    case "menu.surface":
      return {
        backgroundColor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: tokens.radiusMd,
        boxShadow: tokens.shadowMd,
        color: tokens.text,
        fontFamily: tokens.fontFamily,
        fontSize: tokens.fontSizeMd,
        minWidth: "220px",
        overflow: "hidden",
        position: "fixed",
        zIndex: tokens.zIndexSurface,
      };
    case "menu.header":
    case "quickChat.header":
    case "screenshot.header":
    case "inspect.header":
      return {
        alignItems: "center",
        borderBottom:
          slot === "quickChat.header" ? undefined : `1px solid ${tokens.border}`,
        color: tokens.textMuted,
        display: "flex",
        fontSize: tokens.fontSizeXs,
        fontWeight: 700,
        gap: tokens.spacingSm,
        justifyContent: "space-between",
        letterSpacing: "0.08em",
        padding: `${tokens.spacingSm} ${tokens.spacingMd}`,
        textTransform: "uppercase",
      };
    case "menu.headerAction":
    case "menu.dragHandle":
    case "screenshot.action":
    case "quickChat.submit":
    case "inspect.action":
      return baseButtonStyle(input);
    case "menu.list":
      return {
        display: "flex",
        flexDirection: "column",
        padding: 0,
      };
    case "menu.item":
    case "menu.backButton":
      return withInteractiveState(
        {
          alignItems: "center",
          appearance: "none",
          backgroundColor: "transparent",
          border: "none",
          color: tokens.text,
          cursor: "pointer",
          display: "flex",
          fontFamily: tokens.fontFamily,
          fontSize: tokens.fontSizeMd,
          gap: tokens.spacingMd,
          minHeight: tokens.minTouchTarget,
          padding: `${tokens.spacingSm} ${tokens.spacingLg}`,
          textAlign: "left",
          width: "100%",
        },
        input,
      );
    case "menu.itemIcon":
      return {
        alignItems: "center",
        display: "inline-flex",
        height: "20px",
        justifyContent: "center",
        width: "20px",
      };
    case "menu.itemLabel":
      return {
        alignItems: "center",
        display: "inline-flex",
        flex: 1,
        gap: tokens.spacingSm,
      };
    case "menu.itemBadge":
    case "shared.badge":
      return {
        alignItems: "center",
        backgroundColor:
          state.tone === "success"
            ? "rgba(22, 163, 74, 0.12)"
            : state.tone === "warning"
              ? "rgba(217, 119, 6, 0.12)"
              : state.tone === "info" || state.tone === "accent"
                ? tokens.accentMuted
                : tokens.surfaceMuted,
        border: `1px solid ${tokens.border}`,
        borderRadius: tokens.radiusFull,
        color:
          state.tone === "success"
            ? tokens.success
            : state.tone === "warning"
              ? tokens.warning
              : state.tone === "info" || state.tone === "accent"
                ? tokens.accent
                : tokens.textMuted,
        display: "inline-flex",
        fontSize: tokens.fontSizeXs,
        fontWeight: 600,
        gap: tokens.spacing2xs,
        lineHeight: tokens.lineHeightTight,
        padding: `2px ${tokens.spacingSm}`,
      };
    case "menu.submenuIndicator":
      return {
        marginLeft: "auto",
        opacity: 0.6,
      };
    case "comment.section":
      return {
        borderTop: `1px solid ${tokens.border}`,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingSm,
        padding: `${tokens.spacingMd} ${tokens.spacingLg}`,
      };
    case "comment.textarea":
    case "shared.textarea":
    case "quickChat.input":
      return {
        ...baseFieldStyle(input),
        minHeight: slot === "quickChat.input" ? "40px" : "88px",
        resize: slot === "quickChat.input" ? "none" : "vertical",
      };
    case "comment.primaryAction":
      return baseButtonStyle({
        ...input,
        state: { ...state, tone: "accent" },
      });
    case "comment.secondaryAction":
      return baseButtonStyle(input);
    case "screenshot.surface":
    case "quickChat.surface":
    case "inspect.surface":
      return {
        backgroundColor: tokens.surface,
        border:
          slot === "quickChat.surface" && state.expanded
            ? `1px solid ${tokens.border}`
            : `1px solid ${tokens.border}`,
        borderRadius: state.expanded ? "0" : tokens.radiusMd,
        boxShadow: state.expanded ? tokens.shadowLg : tokens.shadowSm,
        color: tokens.text,
        display: "flex",
        flexDirection: "column",
        fontFamily: tokens.fontFamily,
        fontSize: tokens.fontSizeMd,
        overflow: "hidden",
        width: "100%",
      };
    case "screenshot.tab":
    case "screenshot.tabActive":
      return baseButtonStyle({
        ...input,
        state: {
          ...state,
          tone: slot === "screenshot.tabActive" || state.selected
            ? "accent"
            : "neutral",
          size: "sm",
        },
      });
    case "screenshot.preview":
      return {
        alignItems: "center",
        backgroundColor: tokens.surfaceMuted,
        border: `1px solid ${tokens.border}`,
        borderRadius: tokens.radiusSm,
        display: "flex",
        justifyContent: "center",
        minHeight: state.expanded ? "60vh" : "160px",
        overflow: "hidden",
        padding: tokens.spacingSm,
      };
    case "screenshot.empty":
    case "screenshot.error":
      return {
        alignItems: "center",
        color: slot === "screenshot.error" ? tokens.danger : tokens.textMuted,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingSm,
        justifyContent: "center",
        padding: tokens.spacingXl,
        textAlign: "center",
      };
    case "screenshot.meta":
      return {
        color: tokens.textMuted,
        fontSize: tokens.fontSizeXs,
        textAlign: "center",
      };
    case "quickChat.messageList":
      return {
        display: "flex",
        flex: 1,
        flexDirection: "column",
        gap: tokens.spacingSm,
        maxHeight: state.expanded ? undefined : "180px",
        minHeight: "48px",
        overflowY: "auto",
        padding: state.expanded ? tokens.spacingLg : `${tokens.spacingSm} ${tokens.spacingMd}`,
      };
    case "inspect.content":
      return {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingSm,
        padding: tokens.spacingMd,
      };
    case "shared.button":
      return baseButtonStyle(input);
    case "shared.input":
      return baseFieldStyle(input);
    default:
      return {};
  }
}

export const fallbackAnyclickStyleAdapter: AnyclickStyleAdapter = {
  isFallback: true,
  name: "unstyled-fallback",
  resolveSlot: (input) => ({
    style: slotStyle(input),
  }),
  tokens: defaultAnyclickStyleTokens,
};

