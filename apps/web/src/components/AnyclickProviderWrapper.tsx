"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  InspectDialogManager,
  ModificationIndicator,
} from "@ewjdev/anyclick-devtools";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { PointerProvider } from "@ewjdev/anyclick-pointer";
import {
  AnyclickProvider,
  FunModeBridge,
  createPresetMenu,
} from "@ewjdev/anyclick-react";
import { MousePointer2 } from "lucide-react";

const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

export function AnyclickProviderWrapper({ children }: { children: ReactNode }) {
  // Use chrome preset for developer-focused menu with inspect, copy, etc.
  const chromePreset = useMemo(() => createPresetMenu("chrome"), []);

  return (
    <AnyclickProvider
      adapter={adapter}
      menuItems={chromePreset.menuItems}
      metadata={chromePreset.metadata}
      header={<></>}
      quickChatConfig={{
        endpoint: "/api/anyclick/chat",
        model: "gpt-5-nano",
        maxResponseLength: 500,
        showRedactionUI: true,
        showSuggestions: true,
        placeholder: "Ask about this element...",
        title: "Quick Ask",
      }}
      theme={{
        highlightConfig: {
          enabled: true,
          colors: {
            targetColor: "#3b82f6",
            containerColor: "#8b5cf6",
          },
        },
        screenshotConfig: chromePreset.screenshotConfig,
        ...chromePreset.theme,
      }}
    >
      <PointerProvider
        theme={{
          colors: {
            pointerColor: "#3b82f6",
            circleColor: "rgba(59, 130, 246, 0.4)",
          },
          // Semi-transparent fill (30% opacity of pointer color)
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
        <FunModeBridge />
        <InspectDialogManager
          ideConfig={{
            protocol: "cursor",
            basePath: "/Users/ericjohnson/Desktop/projects/anyclick",
          }}
        />
        <ModificationIndicator
          position="bottom-right"
          size={48}
          autoApply
          primaryColor="#3b82f6"
        />
        {children}
      </PointerProvider>
    </AnyclickProvider>
  );
}

/**
 * @deprecated Use AnyclickProviderWrapper instead
 */
export const FeedbackProviderWrapper = AnyclickProviderWrapper;
