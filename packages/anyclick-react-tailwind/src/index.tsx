import React, { useMemo } from "react";
import {
  AnyclickStyleProvider,
  type AnyclickStyleAdapter,
  type AnyclickStyleProviderProps,
  type AnyclickStyleSlot,
} from "@ewjdev/anyclick-react";

export interface TailwindAnyclickStyleOptions {
  classNamePrefix?: string;
}

function classNameMap(prefix: string): Record<AnyclickStyleSlot, string> {
  return {
    "comment.primaryAction": `${prefix}-action ${prefix}-action-primary`,
    "comment.secondaryAction": `${prefix}-action`,
    "comment.section": `${prefix}-comment-section`,
    "comment.textarea": `${prefix}-field ${prefix}-textarea`,
    "inspect.action": `${prefix}-action`,
    "inspect.content": `${prefix}-inspect-content`,
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
    "menu.list": `${prefix}-menu-list`,
    "menu.overlay": `${prefix}-overlay`,
    "menu.submenuIndicator": `${prefix}-submenu-indicator`,
    "menu.surface": `${prefix}-surface ${prefix}-menu-surface`,
    "quickChat.header": `${prefix}-header`,
    "quickChat.input": `${prefix}-field ${prefix}-textarea`,
    "quickChat.messageList": `${prefix}-message-list`,
    "quickChat.submit": `${prefix}-icon-button`,
    "quickChat.surface": `${prefix}-surface`,
    "screenshot.action": `${prefix}-action`,
    "screenshot.empty": `${prefix}-empty`,
    "screenshot.error": `${prefix}-empty ${prefix}-error`,
    "screenshot.header": `${prefix}-header ${prefix}-screenshot-header`,
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

export function createTailwindAnyclickStyleAdapter(
  options: TailwindAnyclickStyleOptions = {},
): AnyclickStyleAdapter {
  const prefix = options.classNamePrefix ?? "ac-anyclick-tw";
  const classes = classNameMap(prefix);

  return {
    name: "tailwind-companion",
    resolveSlot: ({ slot }) => ({
      className: classes[slot],
    }),
  };
}

export interface TailwindAnyclickStyleProviderProps
  extends AnyclickStyleProviderProps {
  options?: TailwindAnyclickStyleOptions;
}

export function TailwindAnyclickStyleProvider({
  children,
  options,
  ...rest
}: TailwindAnyclickStyleProviderProps) {
  const adapter = useMemo(
    () => createTailwindAnyclickStyleAdapter(options),
    [options?.classNamePrefix],
  );

  return (
    <AnyclickStyleProvider styleAdapter={adapter}>
      <AnyclickStyleProvider {...rest}>{children}</AnyclickStyleProvider>
    </AnyclickStyleProvider>
  );
}
