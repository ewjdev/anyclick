"use client";

import type { ReactNode } from "react";
import { PointerProvider } from "@ewjdev/anyclick-pointer";
import { MousePointer2 } from "lucide-react";

/**
 * Wrapper component that provides PointerProvider for the modes example page.
 * This is needed because the page uses usePointer() hook for the game mode demo.
 */
export function PointerModesWrapper({ children }: { children: ReactNode }) {
  return (
    <PointerProvider
      theme={{
        colors: {
          pointerColor: "#ec4899", // Pink to match the fun mode theme
          circleColor: "rgba(236, 72, 153, 0.4)",
        },
        pointerIcon: (
          <MousePointer2
            size={24}
            strokeWidth={2}
            fill="rgba(236, 72, 153, 0.3)"
            stroke="#ec4899"
          />
        ),
      }}
      config={{
        visibility: "always",
        hideDefaultCursor: true,
      }}
    >
      {children}
    </PointerProvider>
  );
}
