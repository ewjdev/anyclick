"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  type PointerConfig,
  type FunModeConfig,
  usePointer,
} from "@ewjdev/anyclick-pointer";
import { useProviderStore } from "./store";
import type { AnyclickTheme, FunModeThemeConfig } from "./types";

function isFunModeEnabled(theme?: AnyclickTheme | null): theme is AnyclickTheme {
  if (!theme) return false;
  if (theme.funMode === undefined) return false;
  if (typeof theme.funMode === "boolean") return theme.funMode;
  return theme.funMode.enabled ?? true;
}

function buildFunConfig(
  theme: AnyclickTheme | null | undefined,
  container: Element,
): FunModeConfig {
  const funTheme =
    typeof theme?.funMode === "object" ? (theme.funMode as FunModeThemeConfig) : {};
  const resolveTrackElement = (): HTMLElement => {
    // Some scoped containers use display: contents and report zero bounds.
    // Walk up to the first ancestor with a real box; fall back to body.
    let el: HTMLElement | null = container as HTMLElement | null;
    while (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return el;
      }
      el = el.parentElement;
    }
    return document.body;
  };

  const getTrackElement = () => resolveTrackElement();
  return {
    maxSpeed: funTheme.maxSpeed,
    acceleration: funTheme.acceleration,
    getTrackElement,
    getObstacles: () => {
      // Obstacles = siblings + children (lightweight bounding boxes)
      const trackElement = getTrackElement();
      const obstacles: DOMRect[] = [];
      const parent = trackElement.parentElement;
      if (parent) {
        Array.from(parent.children).forEach((sibling) => {
          if (sibling !== trackElement) {
            obstacles.push(sibling.getBoundingClientRect());
          }
        });
      }
      Array.from(trackElement.children).forEach((child) => {
        obstacles.push(child.getBoundingClientRect());
      });
      return obstacles;
    },
  };
}

/**
 * FunModeBridge watches Anyclick scoped providers and toggles the pointer
 * into fun mode (go-kart) when the cursor is within a provider with funMode enabled.
 * Requires a PointerProvider higher in the tree.
 */
export function FunModeBridge() {
  const { setConfig } = usePointer();
  const providerStore = useProviderStore();
  const activeProviderRef = useRef<string | null>(null);
  const cachedConfigs = useRef<Record<string, PointerConfig>>({});

  const findActiveFunProvider = useMemo(() => {
    return (el: Element | null) => {
      if (!el) return null;
      const providers = providerStore.findProvidersForElement(el);
      for (const provider of providers) {
        if (
          provider.scoped &&
          !provider.disabled &&
          isFunModeEnabled(provider.theme)
        ) {
          return provider;
        }
      }
      return null;
    };
  }, [providerStore]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const provider = findActiveFunProvider(el as Element | null);

      if (!provider || !provider.containerRef.current) {
        if (activeProviderRef.current !== null) {
          activeProviderRef.current = null;
          setConfig({ mode: "normal" });
        }
        return;
      }

      if (activeProviderRef.current === provider.id) {
        return;
      }

      activeProviderRef.current = provider.id;
      if (!cachedConfigs.current[provider.id]) {
        cachedConfigs.current[provider.id] = {
          mode: "fun",
          funConfig: buildFunConfig(provider.theme, provider.containerRef.current),
        };
      }
      setConfig(cachedConfigs.current[provider.id]);
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
    };
  }, [findActiveFunProvider, setConfig]);

  return null;
}

export default FunModeBridge;

