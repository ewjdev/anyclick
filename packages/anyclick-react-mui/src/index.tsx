import React, { forwardRef, useMemo } from "react";
import {
  AnyclickStyleProvider,
  type AnyclickBadgeProps,
  type AnyclickButtonProps,
  type AnyclickComponentOverrides,
  type AnyclickInputProps,
  type AnyclickStyleAdapter,
  type AnyclickStyleProviderProps,
  type AnyclickSurfaceProps,
  type AnyclickTabProps,
  type AnyclickTabsProps,
  type AnyclickTextareaProps,
} from "@ewjdev/anyclick-react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Tab,
  TextField,
} from "@mui/material";

export interface MuiAnyclickStyleOptions {
  density?: "comfortable" | "compact";
  elevation?: number;
  useTextField?: boolean;
  variantMapping?: {
    button?: "contained" | "outlined" | "text";
    field?: "filled" | "outlined" | "standard";
  };
}

function toneToColor(tone: AnyclickButtonProps["slotState"] extends infer T
  ? T extends { tone?: infer Tone }
    ? Tone
    : never
  : never) {
  if (tone === "danger") return "error";
  if (tone === "success") return "success";
  if (tone === "warning") return "warning";
  return "primary";
}

function createMuiComponentOverrides(
  options: MuiAnyclickStyleOptions = {},
): Partial<AnyclickComponentOverrides> {
  const density = options.density ?? "comfortable";
  const elevation = options.elevation ?? 3;
  const buttonVariant = options.variantMapping?.button ?? "contained";
  const fieldVariant = options.variantMapping?.field ?? "outlined";
  const size = density === "compact" ? "small" : "medium";

  const Surface = forwardRef<HTMLDivElement, AnyclickSurfaceProps>(
    ({ children, className, slotState, style, ...props }, ref) => (
      <Paper
        ref={ref}
        className={className}
        elevation={slotState?.expanded ? elevation + 1 : elevation}
        style={style}
        {...props}
      >
        {children}
      </Paper>
    ),
  );

  const ActionButton = forwardRef<HTMLButtonElement, AnyclickButtonProps>(
    ({ children, className, slotState, style, ...props }, ref) => (
      <Button
        ref={ref}
        className={className}
        color={toneToColor(slotState?.tone) as "primary"}
        disabled={props.disabled}
        size={size}
        startIcon={
          slotState?.loading ? <CircularProgress color="inherit" size={14} /> : undefined
        }
        style={style}
        variant={slotState?.tone === "neutral" ? "outlined" : buttonVariant}
        {...props}
      >
        {children}
      </Button>
    ),
  );

  const ActionIconButton = forwardRef<HTMLButtonElement, AnyclickButtonProps>(
    ({ children, className, slotState, style, ...props }, ref) => (
      <IconButton
        ref={ref}
        className={className}
        color={toneToColor(slotState?.tone) as "primary"}
        disabled={props.disabled}
        size={size}
        style={style}
        {...props}
      >
        {slotState?.loading ? (
          <CircularProgress color="inherit" size={14} />
        ) : (
          children
        )}
      </IconButton>
    ),
  );

  const Input = forwardRef<HTMLInputElement, AnyclickInputProps>(
    ({ className, slotState, style, ...props }, ref) => (
      <TextField
        className={className}
        disabled={props.disabled}
        error={slotState?.error}
        inputRef={ref}
        size={size}
        style={style}
        variant={fieldVariant}
        {...props}
      />
    ),
  );

  const Textarea = forwardRef<HTMLTextAreaElement, AnyclickTextareaProps>(
    ({ className, slotState, style, ...props }, ref) => (
      <TextField
        className={className}
        disabled={props.disabled}
        error={slotState?.error}
        inputRef={ref}
        minRows={props.rows ?? 3}
        multiline
        size={size}
        style={style}
        variant={fieldVariant}
        {...props}
      />
    ),
  );

  const Tabs = forwardRef<HTMLDivElement, AnyclickTabsProps>(
    ({ children, className, style, ...props }, ref) => (
      <Box
        ref={ref}
        className={className}
        style={{ display: "flex", gap: 4, ...style }}
        {...props}
      >
        {children}
      </Box>
    ),
  );

  const TabButton = forwardRef<HTMLButtonElement, AnyclickTabProps>(
    ({ children, className, slotState, style, ...props }, ref) => (
      <Tab
        ref={ref}
        className={className}
        component="button"
        label={children}
        selected={slotState?.selected}
        style={style}
        {...props}
      />
    ),
  );

  const Badge = forwardRef<HTMLSpanElement, AnyclickBadgeProps>(
    ({ children, className, style, ...props }, ref) => (
      <Chip
        ref={ref}
        className={className}
        label={children}
        size="small"
        style={style}
        {...props}
      />
    ),
  );

  return {
    Badge,
    Button: ActionButton,
    IconButton: ActionIconButton,
    Input,
    Surface,
    Tab: TabButton,
    Tabs,
    Textarea,
  };
}

export function createMuiAnyclickStyleAdapter(
  options: MuiAnyclickStyleOptions = {},
): AnyclickStyleAdapter {
  return {
    components: createMuiComponentOverrides(options),
    name: "mui-companion",
    tokens: {
      accent: "#1976d2",
      accentMuted: "#e3f2fd",
      border: "#d0d7de",
      danger: "#d32f2f",
      fontFamily:
        '"Roboto","Helvetica","Arial",sans-serif',
      radiusMd: "12px",
      radiusSm: "8px",
      shadowLg: "0 18px 40px rgba(25, 118, 210, 0.16)",
      shadowMd: "0 10px 24px rgba(15, 23, 42, 0.12)",
      surface: "#ffffff",
      surfaceMuted: "#f7f9fc",
      text: "#111827",
      textMuted: "#6b7280",
    },
  };
}

export interface MuiAnyclickStyleProviderProps
  extends AnyclickStyleProviderProps {
  options?: MuiAnyclickStyleOptions;
}

export function MuiAnyclickStyleProvider({
  children,
  options,
  ...rest
}: MuiAnyclickStyleProviderProps) {
  const adapter = useMemo(() => createMuiAnyclickStyleAdapter(options), [
    options?.density,
    options?.elevation,
    options?.useTextField,
    options?.variantMapping?.button,
    options?.variantMapping?.field,
  ]);

  return (
    <AnyclickStyleProvider styleAdapter={adapter}>
      <AnyclickStyleProvider {...rest}>{children}</AnyclickStyleProvider>
    </AnyclickStyleProvider>
  );
}
