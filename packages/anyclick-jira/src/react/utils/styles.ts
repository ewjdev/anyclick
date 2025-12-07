import type { CSSProperties } from "react";

// Color palette
export const colors = {
  primary: "#0d3b3e",
  primaryHover: "rgba(13, 59, 62, 0.9)",
  accent: "#0d6e7c",
  accentLight: "rgba(13, 110, 124, 0.1)",
  accentLighter: "rgba(13, 110, 124, 0.2)",
  background: "#eef3f3",
  success: "#0d7a5d",
  successLight: "rgba(13, 122, 93, 0.1)",
  error: "#dc2626",
  errorLight: "#fef2f2",
  errorBorder: "#fecaca",
  warning: "#f59e0b",
  warningLight: "#fffbeb",
  warningBorder: "#fde68a",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
  white: "#ffffff",
  black: "#000000",
  amber100: "#fef3c7",
  amber200: "#fde68a",
  amber600: "#d97706",
  amber800: "#92400e",
  red100: "#fee2e2",
  red200: "#fecaca",
  red500: "#ef4444",
  red600: "#dc2626",
  red700: "#b91c1c",
  red900: "#7f1d1d",
} as const;

// Base styles
export const baseStyles = {
  // Layout
  flexCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as CSSProperties,

  flexColumn: {
    display: "flex",
    flexDirection: "column",
  } as CSSProperties,

  flexRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  } as CSSProperties,

  flexBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as CSSProperties,

  flex1: {
    flex: 1,
  } as CSSProperties,

  // Container
  container: {
    padding: "24px",
  } as CSSProperties,

  containerSm: {
    padding: "16px",
  } as CSSProperties,

  // Cards
  card: {
    padding: "16px",
    backgroundColor: colors.background,
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  } as CSSProperties,

  cardHover: {
    backgroundColor: colors.accentLight,
  } as CSSProperties,

  // Inputs
  input: {
    width: "100%",
    padding: "12px 16px",
    border: `1px solid ${colors.gray200}`,
    borderRadius: "12px",
    outline: "none",
    fontSize: "16px",
    color: colors.gray900,
    backgroundColor: colors.white,
  } as CSSProperties,

  inputLarge: {
    padding: "16px",
    fontSize: "18px",
  } as CSSProperties,

  inputError: {
    borderColor: colors.red500,
  } as CSSProperties,

  textarea: {
    width: "100%",
    padding: "16px",
    border: `1px solid ${colors.gray200}`,
    borderRadius: "12px",
    outline: "none",
    fontSize: "16px",
    color: colors.gray900,
    resize: "none",
    backgroundColor: colors.white,
  } as CSSProperties,

  // Buttons
  buttonPrimary: {
    padding: "12px 16px",
    backgroundColor: colors.primary,
    color: colors.white,
    borderRadius: "12px",
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  } as CSSProperties,

  buttonSecondary: {
    padding: "12px 16px",
    backgroundColor: "transparent",
    color: colors.gray500,
    border: "none",
    cursor: "pointer",
    transition: "color 0.2s",
  } as CSSProperties,

  buttonOutline: {
    padding: "12px 16px",
    backgroundColor: "transparent",
    color: colors.gray700,
    border: `1px solid ${colors.gray300}`,
    borderRadius: "12px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.2s",
  } as CSSProperties,

  // Text
  heading: {
    fontSize: "20px",
    fontWeight: 500,
    color: colors.primary,
    marginBottom: "8px",
  } as CSSProperties,

  subheading: {
    fontSize: "14px",
    color: colors.gray500,
  } as CSSProperties,

  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    color: colors.gray700,
    marginBottom: "4px",
  } as CSSProperties,

  errorText: {
    fontSize: "14px",
    color: colors.red500,
  } as CSSProperties,

  errorTextSmall: {
    fontSize: "12px",
    color: colors.red500,
    marginTop: "4px",
  } as CSSProperties,

  // Alerts
  alertError: {
    padding: "16px",
    backgroundColor: colors.errorLight,
    border: `1px solid ${colors.errorBorder}`,
    borderRadius: "12px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  } as CSSProperties,

  alertWarning: {
    padding: "16px",
    backgroundColor: colors.warningLight,
    border: `1px solid ${colors.warningBorder}`,
    borderRadius: "12px",
  } as CSSProperties,

  // Misc
  divider: {
    borderTop: `1px solid ${colors.gray100}`,
  } as CSSProperties,

  footer: {
    display: "flex",
    gap: "12px",
    padding: "16px 24px",
    borderTop: `1px solid ${colors.gray100}`,
    backgroundColor: colors.white,
  } as CSSProperties,

  badge: {
    fontSize: "12px",
    fontWeight: "normal",
    backgroundColor: colors.accentLighter,
    color: colors.accent,
    padding: "2px 8px",
    borderRadius: "9999px",
  } as CSSProperties,

  // Icon containers
  iconContainer: {
    padding: "8px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as CSSProperties,

  // Spinner keyframes need to be added via a style tag
  spinner: {
    animation: "jira-feedback-spin 1s linear infinite",
  } as CSSProperties,
} as const;

// Merge style objects
export function mergeStyles(
  ...styles: (CSSProperties | undefined | false | null)[]
): CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}

// CSS keyframes for spinner - needs to be injected
export const spinnerKeyframes = `
@keyframes jira-feedback-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;
