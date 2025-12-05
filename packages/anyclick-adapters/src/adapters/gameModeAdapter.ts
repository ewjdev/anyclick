import type { FunModeConfig, PointerConfig } from "@ewjdev/anyclick-pointer";
import type { PointerAdapter } from "../types";
import { createWarnOnce } from "../utils";

export interface GameModeAdapterOptions {
  /**
   * Base fun mode configuration to merge.
   */
  funConfig?: FunModeConfig;
  /**
   * Optional track resolver override.
   */
  trackElement?: () => HTMLElement | null;
  /**
   * Optional obstacle resolver override.
   */
  obstacles?: () => DOMRect[];
  /**
   * Custom warning message.
   */
  warnMessage?: string;
}

/**
 * Experimental adapter that toggles the pointer into fun/game mode.
 */
export function createGameModeAdapter(
  options: GameModeAdapterOptions = {},
): PointerAdapter {
  const warn = createWarnOnce(
    options.warnMessage ??
      "[Anyclick] Game mode adapter is experimental; APIs may change.",
  );

  return {
    meta: {
      name: "game-mode",
      version: "0.1.0",
      description: "Experimental fun/game pointer adapter for Anyclick.",
      experimental: true,
      tags: ["pointer", "experimental"],
    },
    activate: ({ setConfig }) => {
      warn();
      const funConfig: FunModeConfig = {
        ...(options.funConfig ?? {}),
        getTrackElement:
          options.trackElement ?? options.funConfig?.getTrackElement,
        getObstacles: options.obstacles ?? options.funConfig?.getObstacles,
      };
      const patch: Partial<PointerConfig> = {
        mode: "fun",
        funConfig,
      };
      setConfig(patch);
    },
    deactivate: ({ setConfig }) => {
      setConfig({ mode: "normal" });
    },
  };
}
