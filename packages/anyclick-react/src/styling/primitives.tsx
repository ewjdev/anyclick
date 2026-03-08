"use client";

import React, { forwardRef } from "react";
import { resolveSlotProps, useAnyclickStyle } from "./context";
import type {
  AnyclickBadgeProps,
  AnyclickButtonProps,
  AnyclickInputProps,
  AnyclickSurfaceProps,
  AnyclickTabProps,
  AnyclickTabsProps,
  AnyclickTextareaProps,
} from "./types";

const DefaultSurface = forwardRef<HTMLDivElement, AnyclickSurfaceProps>(
  (
    { className, slotName = "menu.surface", slotState, style, ...props },
    ref,
  ) => {
    const adapter = useAnyclickStyle();
    const resolved = resolveSlotProps(adapter, slotName, slotState, {
      className,
      style,
    });

    return <div ref={ref} {...resolved.attrs} {...props} className={resolved.className} style={resolved.style} />;
  },
);

DefaultSurface.displayName = "DefaultAnyclickSurface";

const DefaultButton = forwardRef<HTMLButtonElement, AnyclickButtonProps>(
  (
    { className, slotName = "shared.button", slotState, style, ...props },
    ref,
  ) => {
    const adapter = useAnyclickStyle();
    const resolved = resolveSlotProps(adapter, slotName, slotState, {
      className,
      style,
    });

    return <button ref={ref} type="button" {...resolved.attrs} {...props} className={resolved.className} style={resolved.style} />;
  },
);

DefaultButton.displayName = "DefaultAnyclickButton";

const DefaultInput = forwardRef<HTMLInputElement, AnyclickInputProps>(
  (
    { className, slotName = "shared.input", slotState, style, ...props },
    ref,
  ) => {
    const adapter = useAnyclickStyle();
    const resolved = resolveSlotProps(adapter, slotName, slotState, {
      className,
      style,
    });

    return <input ref={ref} {...resolved.attrs} {...props} className={resolved.className} style={resolved.style} />;
  },
);

DefaultInput.displayName = "DefaultAnyclickInput";

const DefaultTextarea = forwardRef<HTMLTextAreaElement, AnyclickTextareaProps>(
  (
    { className, slotName = "shared.textarea", slotState, style, ...props },
    ref,
  ) => {
    const adapter = useAnyclickStyle();
    const resolved = resolveSlotProps(adapter, slotName, slotState, {
      className,
      style,
    });

    return <textarea ref={ref} {...resolved.attrs} {...props} className={resolved.className} style={resolved.style} />;
  },
);

DefaultTextarea.displayName = "DefaultAnyclickTextarea";

const DefaultTabs = forwardRef<HTMLDivElement, AnyclickTabsProps>(
  (
    {
      className,
      slotName = "screenshot.header",
      slotState,
      style,
      ...props
    },
    ref,
  ) => {
    const adapter = useAnyclickStyle();
    const resolved = resolveSlotProps(adapter, slotName, slotState, {
      className,
      style,
    });

    return <div ref={ref} {...resolved.attrs} {...props} className={resolved.className} style={resolved.style} />;
  },
);

DefaultTabs.displayName = "DefaultAnyclickTabs";

const DefaultTab = forwardRef<HTMLButtonElement, AnyclickTabProps>(
  (
    { className, slotName = "screenshot.tab", slotState, style, ...props },
    ref,
  ) => {
    const adapter = useAnyclickStyle();
    const resolved = resolveSlotProps(adapter, slotName, slotState, {
      className,
      style,
    });

    return <button ref={ref} type="button" {...resolved.attrs} {...props} className={resolved.className} style={resolved.style} />;
  },
);

DefaultTab.displayName = "DefaultAnyclickTab";

const DefaultBadge = forwardRef<HTMLSpanElement, AnyclickBadgeProps>(
  (
    { className, slotName = "shared.badge", slotState, style, ...props },
    ref,
  ) => {
    const adapter = useAnyclickStyle();
    const resolved = resolveSlotProps(adapter, slotName, slotState, {
      className,
      style,
    });

    return <span ref={ref} {...resolved.attrs} {...props} className={resolved.className} style={resolved.style} />;
  },
);

DefaultBadge.displayName = "DefaultAnyclickBadge";

export const AnyclickSurface = forwardRef<HTMLDivElement, AnyclickSurfaceProps>(
  (props, ref) => {
    const { components } = useAnyclickStyle();
    const Component = components.Surface ?? DefaultSurface;

    return <Component ref={ref} {...props} />;
  },
);

AnyclickSurface.displayName = "AnyclickSurface";

export const AnyclickButton = forwardRef<HTMLButtonElement, AnyclickButtonProps>(
  (props, ref) => {
    const { components } = useAnyclickStyle();
    const Component = components.Button ?? DefaultButton;

    return <Component ref={ref} {...props} />;
  },
);

AnyclickButton.displayName = "AnyclickButton";

export const AnyclickIconButton = forwardRef<
  HTMLButtonElement,
  AnyclickButtonProps
>((props, ref) => {
  const { components } = useAnyclickStyle();
  const Component = components.IconButton ?? DefaultButton;

  return <Component ref={ref} {...props} />;
});

AnyclickIconButton.displayName = "AnyclickIconButton";

export const AnyclickInput = forwardRef<HTMLInputElement, AnyclickInputProps>(
  (props, ref) => {
    const { components } = useAnyclickStyle();
    const Component = components.Input ?? DefaultInput;

    return <Component ref={ref} {...props} />;
  },
);

AnyclickInput.displayName = "AnyclickInput";

export const AnyclickTextarea = forwardRef<
  HTMLTextAreaElement,
  AnyclickTextareaProps
>((props, ref) => {
  const { components } = useAnyclickStyle();
  const Component = components.Textarea ?? DefaultTextarea;

  return <Component ref={ref} {...props} />;
});

AnyclickTextarea.displayName = "AnyclickTextarea";

export const AnyclickTabs = forwardRef<HTMLDivElement, AnyclickTabsProps>(
  (props, ref) => {
    const { components } = useAnyclickStyle();
    const Component = components.Tabs ?? DefaultTabs;

    return <Component ref={ref} {...props} />;
  },
);

AnyclickTabs.displayName = "AnyclickTabs";

export const AnyclickTab = forwardRef<HTMLButtonElement, AnyclickTabProps>(
  (props, ref) => {
    const { components } = useAnyclickStyle();
    const Component = components.Tab ?? DefaultTab;

    return <Component ref={ref} {...props} />;
  },
);

AnyclickTab.displayName = "AnyclickTab";

export const AnyclickBadge = forwardRef<HTMLSpanElement, AnyclickBadgeProps>(
  (props, ref) => {
    const { components } = useAnyclickStyle();
    const Component = components.Badge ?? DefaultBadge;

    return <Component ref={ref} {...props} />;
  },
);

AnyclickBadge.displayName = "AnyclickBadge";
