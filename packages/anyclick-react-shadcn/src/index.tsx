import React, { useMemo } from "react";
import {
  AnyclickStyleProvider,
  type AnyclickComponentOverrides,
  type AnyclickStyleAdapter,
  type AnyclickStyleProviderProps,
  type AnyclickStyleSlot,
} from "@ewjdev/anyclick-react";

export interface ShadcnAnyclickStyleOptions {
  classNamePrefix?: string;
}

function classNameMap(prefix: string): Record<AnyclickStyleSlot, string> {
  return {
    "comment.primaryAction": `${prefix}-action ${prefix}-action-primary`,
    "comment.secondaryAction": `${prefix}-action`,
    "comment.section": `${prefix}-section`,
    "comment.textarea": `${prefix}-field ${prefix}-textarea`,
    "inspect.action": `${prefix}-action`,
    "inspect.content": `${prefix}-section`,
    "inspect.header": `${prefix}-header`,
    "inspect.surface": `${prefix}-surface`,
    "menu.backButton": `${prefix}-menu-item ${prefix}-menu-back`,
    "menu.dragHandle": `${prefix}-icon-button`,
    "menu.header": `${prefix}-header`,
    "menu.headerAction": `${prefix}-icon-button`,
    "menu.item": `${prefix}-menu-item`,
    "menu.itemBadge": `${prefix}-badge`,
    "menu.itemIcon": `${prefix}-menu-icon`,
    "menu.itemLabel": `${prefix}-menu-label`,
    "menu.list": `${prefix}-list`,
    "menu.overlay": `${prefix}-overlay`,
    "menu.submenuIndicator": `${prefix}-submenu-indicator`,
    "menu.surface": `${prefix}-surface`,
    "quickChat.header": `${prefix}-header`,
    "quickChat.input": `${prefix}-field ${prefix}-textarea`,
    "quickChat.messageList": `${prefix}-section`,
    "quickChat.submit": `${prefix}-icon-button`,
    "quickChat.surface": `${prefix}-surface`,
    "screenshot.action": `${prefix}-action`,
    "screenshot.empty": `${prefix}-empty`,
    "screenshot.error": `${prefix}-empty ${prefix}-error`,
    "screenshot.header": `${prefix}-header`,
    "screenshot.meta": `${prefix}-meta`,
    "screenshot.preview": `${prefix}-preview`,
    "screenshot.surface": `${prefix}-surface`,
    "screenshot.tab": `${prefix}-tab`,
    "screenshot.tabActive": `${prefix}-tab ${prefix}-tab-active`,
    "shared.badge": `${prefix}-badge`,
    "shared.button": `${prefix}-action`,
    "shared.input": `${prefix}-field`,
    "shared.textarea": `${prefix}-field ${prefix}-textarea`,
  };
}

export function createShadcnAnyclickStyleAdapter(
  options: ShadcnAnyclickStyleOptions = {},
): AnyclickStyleAdapter {
  const prefix = options.classNamePrefix ?? "ac-anyclick-shadcn";
  const classes = classNameMap(prefix);

  return {
    name: "shadcn-companion",
    resolveSlot: ({ slot }) => ({
      className: classes[slot],
    }),
  };
}

export function createShadcnComponentOverrides(
  overrides: Partial<AnyclickComponentOverrides>,
): Partial<AnyclickComponentOverrides> {
  return overrides;
}

export interface ShadcnAnyclickStyleProviderProps
  extends AnyclickStyleProviderProps {
  options?: ShadcnAnyclickStyleOptions;
}

export function ShadcnAnyclickStyleProvider({
  children,
  options,
  ...rest
}: ShadcnAnyclickStyleProviderProps) {
  const adapter = useMemo(
    () => createShadcnAnyclickStyleAdapter(options),
    [options?.classNamePrefix],
  );

  return (
    <AnyclickStyleProvider styleAdapter={adapter}>
      <AnyclickStyleProvider {...rest}>{children}</AnyclickStyleProvider>
    </AnyclickStyleProvider>
  );
}
