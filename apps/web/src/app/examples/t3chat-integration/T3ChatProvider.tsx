"use client";

import type { ReactNode } from "react";
import { InspectDialogManager } from "@ewjdev/anyclick-devtools";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { AnyclickProvider, createPresetMenu } from "@ewjdev/anyclick-react";

const chromePreset = createPresetMenu("chrome");
const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

export default function T3ChatProvider({ children }: { children: ReactNode }) {
  return (
    <AnyclickProvider
      adapter={adapter}
      menuItems={chromePreset.menuItems}
      theme={chromePreset.theme}
      quickChatConfig={{
        endpoint: "/api/anyclick/chat",
        t3chat: {
          enabled: true,
          baseUrl: "https://t3.chat",
        },
      }}
    >
      {children}
      {/* The chrome preset's "Inspect" item needs this manager. The site-wide
          one is not mounted under /examples, so mount it here. Remove if the
          root wrapper is ever un-gated for /examples. */}
      <InspectDialogManager />
    </AnyclickProvider>
  );
}
