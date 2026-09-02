"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { InspectDialogManager } from "@ewjdev/anyclick-devtools";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { AnyclickProvider, createPresetMenu } from "@ewjdev/anyclick-react";

const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

export function AnyclickProviderWrapper({ children }: { children: ReactNode }) {
  // Use chrome preset for developer-focused menu with inspect, copy, etc.
  const chromePreset = useMemo(() => createPresetMenu("chrome"), []);

  console.count("AnyclickProviderWrapper");

  // Option: Use this hook if you want to hide cursor without custom pointer
  // useHideCursor(true);

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
          enabled: false,
        },
      }}
    >
      {children}
      <InspectDialogManager
        ideConfig={{
          protocol: "cursor",
        }}
      />
      {/* Optional: Enable custom pointer with PointerProvider
      <PointerProvider
        theme={{
          colors: {
            pointerColor: "#3b82f6",
            circleColor: "rgba(59, 130, 246, 0.4)",
          },
        }}
        config={{
          visibility: "always",
          hideDefaultCursor: true,
        }}
      >
        <InspectDialogManager ideConfig={{ protocol: "cursor" }} />
      </PointerProvider> */}
    </AnyclickProvider>
  );
}

