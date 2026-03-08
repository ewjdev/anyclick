"use client";

import React, { createContext, useContext, useMemo } from "react";
import { fallbackAnyclickStyleAdapter } from "./defaults";
import type {
  AnyclickResolvedStyleAdapter,
  AnyclickSlotProps,
  AnyclickSlotState,
  AnyclickStyleAdapter,
  AnyclickStyleProviderProps,
  AnyclickStyleSlot,
} from "./types";

function toStyleAdapter(
  adapter: AnyclickResolvedStyleAdapter,
): AnyclickStyleAdapter {
  return {
    components: adapter.components,
    isFallback: adapter.isFallback,
    name: adapter.name,
    resolveSlot: ({ slot, state }) => adapter.resolveSlot(slot, state),
    tokens: adapter.tokens,
  };
}

export function composeClassNames(
  ...values: Array<string | null | undefined | false>
): string | undefined {
  const resolved = values
    .flatMap((value) => (typeof value === "string" ? value.split(/\s+/) : []))
    .map((value) => value.trim())
    .filter(Boolean);

  return resolved.length > 0 ? resolved.join(" ") : undefined;
}

export function composeInlineStyles(
  ...values: Array<React.CSSProperties | null | undefined>
): React.CSSProperties | undefined {
  const merged = Object.assign({}, ...values.filter(Boolean));
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function createSlotOverrideAdapter(
  props: Pick<
    AnyclickStyleProviderProps,
    "components" | "slotClassNames" | "slotStyles"
  >,
): AnyclickStyleAdapter | null {
  const hasClassNames =
    props.slotClassNames && Object.keys(props.slotClassNames).length > 0;
  const hasStyles = props.slotStyles && Object.keys(props.slotStyles).length > 0;
  const hasComponents =
    props.components && Object.keys(props.components).length > 0;

  if (!hasClassNames && !hasStyles && !hasComponents) {
    return null;
  }

  return {
    components: props.components,
    name: "slot-overrides",
    resolveSlot: ({ slot }) => ({
      className: props.slotClassNames?.[slot],
      style: props.slotStyles?.[slot],
    }),
  };
}

export function mergeStyleAdapters(
  ...adapters: Array<AnyclickStyleAdapter | null | undefined>
): AnyclickResolvedStyleAdapter {
  const activeAdapters = adapters.filter(Boolean) as AnyclickStyleAdapter[];
  const tokens = Object.assign(
    {},
    fallbackAnyclickStyleAdapter.tokens,
    ...activeAdapters.map((adapter) => adapter.tokens ?? {}),
  );
  const components = Object.assign(
    {},
    ...activeAdapters.map((adapter) => adapter.components ?? {}),
  );

  const resolvers = activeAdapters
    .map((adapter) => adapter.resolveSlot)
    .filter(Boolean) as NonNullable<AnyclickStyleAdapter["resolveSlot"]>[];

  const name =
    activeAdapters.map((adapter) => adapter.name).filter(Boolean).join(" + ") ||
    "unstyled-fallback";

  return {
    components,
    isFallback: activeAdapters.every((adapter) => adapter.isFallback),
    name,
    resolveSlot: (
      slot: AnyclickStyleSlot,
      state: AnyclickSlotState = {},
      overrides?: Pick<AnyclickSlotProps, "className" | "style">,
    ) => {
      const merged: AnyclickSlotProps = {
        attrs: { "data-anyclick-slot": slot },
      };

      for (const resolve of resolvers) {
        const next = resolve({ slot, state, tokens });
        if (!next) continue;
        merged.attrs = { ...merged.attrs, ...next.attrs };
        merged.className = composeClassNames(merged.className, next.className);
        merged.style = composeInlineStyles(merged.style, next.style);
      }

      return {
        attrs: {
          ...merged.attrs,
          ...(state.active ? { "data-active": true } : {}),
          ...(state.disabled ? { "data-disabled": true } : {}),
          ...(state.error ? { "data-error": true } : {}),
          ...(state.expanded ? { "data-expanded": true } : {}),
          ...(state.loading ? { "data-loading": true } : {}),
          ...(state.pressed ? { "data-pressed": true } : {}),
          ...(state.selected ? { "data-selected": true } : {}),
          ...(state.size ? { "data-size": state.size } : {}),
          ...(state.tone ? { "data-tone": state.tone } : {}),
        },
        className: composeClassNames(merged.className, overrides?.className),
        style: composeInlineStyles(merged.style, overrides?.style),
      };
    },
    tokens,
  };
}

const AnyclickStyleContext = createContext<AnyclickResolvedStyleAdapter | null>(
  null,
);

export function resolveSlotProps(
  adapter: AnyclickResolvedStyleAdapter,
  slot: AnyclickStyleSlot,
  state: AnyclickSlotState = {},
  overrides?: Pick<AnyclickSlotProps, "className" | "style">,
): AnyclickSlotProps {
  return adapter.resolveSlot(slot, state, overrides);
}

export function useAnyclickStyle(): AnyclickResolvedStyleAdapter {
  const context = useContext(AnyclickStyleContext);
  return context ?? mergeStyleAdapters(fallbackAnyclickStyleAdapter);
}

export function AnyclickStyleProvider({
  children,
  components,
  slotClassNames,
  slotStyles,
  styleAdapter,
}: AnyclickStyleProviderProps) {
  const parentStyle = useContext(AnyclickStyleContext);

  const value = useMemo(
    () =>
      mergeStyleAdapters(
        parentStyle ? toStyleAdapter(parentStyle) : fallbackAnyclickStyleAdapter,
        styleAdapter,
        createSlotOverrideAdapter({ components, slotClassNames, slotStyles }),
      ),
    [components, parentStyle, slotClassNames, slotStyles, styleAdapter],
  );

  return (
    <AnyclickStyleContext.Provider value={value}>
      {children}
    </AnyclickStyleContext.Provider>
  );
}
