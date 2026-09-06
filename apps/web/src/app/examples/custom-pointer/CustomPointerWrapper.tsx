"use client";

import type { ReactNode } from "react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { PointerProvider } from "@ewjdev/anyclick-pointer";
import { AnyclickProvider } from "@ewjdev/anyclick-react";
import { MousePointer2 } from "lucide-react";

const demoAdapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

/**
 * Wrapper component that provides both AnyclickProvider and PointerProvider
 * for the custom-pointer example page.
 */
export function CustomPointerWrapper({ children }: { children: ReactNode }) {
  return (
    <AnyclickProvider adapter={demoAdapter} scoped>
      <PointerProvider
        theme={{
          colors: {
            pointerColor: "#3b82f6",
            circleColor: "rgba(59, 130, 246, 0.4)",
          },
          pointerIcon: (
            <MousePointer2
              size={24}
              strokeWidth={2}
              fill="rgba(59, 130, 246, 0.3)"
              stroke="#3b82f6"
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
    </AnyclickProvider>
  );
}
