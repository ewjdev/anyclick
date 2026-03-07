import type {
  ButtonHTMLAttributes,
  CSSProperties,
  ComponentType,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export const ANYCLICK_STYLE_SLOTS = [
  "menu.overlay",
  "menu.surface",
  "menu.header",
  "menu.headerAction",
  "menu.list",
  "menu.item",
  "menu.itemIcon",
  "menu.itemLabel",
  "menu.itemBadge",
  "menu.submenuIndicator",
  "menu.backButton",
  "menu.dragHandle",
  "comment.section",
  "comment.textarea",
  "comment.primaryAction",
  "comment.secondaryAction",
  "screenshot.surface",
  "screenshot.header",
  "screenshot.tab",
  "screenshot.tabActive",
  "screenshot.preview",
  "screenshot.empty",
  "screenshot.error",
  "screenshot.meta",
  "screenshot.action",
  "quickChat.surface",
  "quickChat.header",
  "quickChat.messageList",
  "quickChat.input",
  "quickChat.submit",
  "inspect.surface",
  "inspect.header",
  "inspect.content",
  "inspect.action",
  "shared.button",
  "shared.input",
  "shared.textarea",
  "shared.badge",
] as const;

export type AnyclickStyleSlot = (typeof ANYCLICK_STYLE_SLOTS)[number];

export interface AnyclickStyleTokens {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceSubtle: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  accentText: string;
  danger: string;
  dangerMuted: string;
  success: string;
  warning: string;
  focusRing: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusFull: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  fontFamily: string;
  fontMono: string;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeMd: string;
  fontSizeLg: string;
  lineHeightTight: number;
  lineHeightBase: number;
  spacing2xs: string;
  spacingXs: string;
  spacingSm: string;
  spacingMd: string;
  spacingLg: string;
  spacingXl: string;
  minTouchTarget: string;
  zIndexOverlay: number;
  zIndexSurface: number;
  zIndexPinned: number;
}

export interface AnyclickSlotState {
  active?: boolean;
  disabled?: boolean;
  hovered?: boolean;
  pressed?: boolean;
  expanded?: boolean;
  selected?: boolean;
  error?: boolean;
  loading?: boolean;
  tone?:
    | "accent"
    | "danger"
    | "info"
    | "neutral"
    | "success"
    | "warning"
    | (string & {});
  size?: "sm" | "md" | "lg" | (string & {});
}

export interface AnyclickSlotProps {
  attrs?: Record<string, string | number | boolean | undefined>;
  className?: string;
  style?: CSSProperties;
}

export interface AnyclickResolveSlotInput {
  slot: AnyclickStyleSlot;
  state: AnyclickSlotState;
  tokens: AnyclickStyleTokens;
}

export interface AnyclickSlotComponentProps {
  children?: ReactNode;
  className?: string;
  slotName?: AnyclickStyleSlot;
  slotState?: AnyclickSlotState;
  style?: CSSProperties;
}

export type AnyclickSurfaceProps = HTMLAttributes<HTMLDivElement> &
  AnyclickSlotComponentProps;

export type AnyclickButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  AnyclickSlotComponentProps;

export type AnyclickInputProps = InputHTMLAttributes<HTMLInputElement> &
  AnyclickSlotComponentProps;

export type AnyclickTextareaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement> & AnyclickSlotComponentProps;

export type AnyclickTabsProps = HTMLAttributes<HTMLDivElement> &
  AnyclickSlotComponentProps;

export type AnyclickTabProps = ButtonHTMLAttributes<HTMLButtonElement> &
  AnyclickSlotComponentProps;

export type AnyclickBadgeProps = HTMLAttributes<HTMLSpanElement> &
  AnyclickSlotComponentProps;

export interface AnyclickComponentOverrides {
  Surface: ComponentType<AnyclickSurfaceProps>;
  Button: ComponentType<AnyclickButtonProps>;
  IconButton: ComponentType<AnyclickButtonProps>;
  Input: ComponentType<AnyclickInputProps>;
  Textarea: ComponentType<AnyclickTextareaProps>;
  Tabs: ComponentType<AnyclickTabsProps>;
  Tab: ComponentType<AnyclickTabProps>;
  Badge: ComponentType<AnyclickBadgeProps>;
}

export interface AnyclickStyleAdapter {
  components?: Partial<AnyclickComponentOverrides>;
  isFallback?: boolean;
  name?: string;
  resolveSlot?: (
    input: AnyclickResolveSlotInput,
  ) => AnyclickSlotProps | null | undefined;
  tokens?: Partial<AnyclickStyleTokens>;
}

export interface AnyclickStyleProviderProps {
  children: ReactNode;
  components?: Partial<AnyclickComponentOverrides>;
  slotClassNames?: Partial<Record<AnyclickStyleSlot, string>>;
  slotStyles?: Partial<Record<AnyclickStyleSlot, CSSProperties>>;
  styleAdapter?: AnyclickStyleAdapter;
}

export interface AnyclickResolvedStyleAdapter {
  components: Partial<AnyclickComponentOverrides>;
  isFallback: boolean;
  name: string;
  resolveSlot: (
    slot: AnyclickStyleSlot,
    state?: AnyclickSlotState,
    overrides?: Pick<AnyclickSlotProps, "className" | "style">,
  ) => AnyclickSlotProps;
  tokens: AnyclickStyleTokens;
}
