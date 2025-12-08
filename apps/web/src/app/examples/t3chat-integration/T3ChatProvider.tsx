"use client";

import type { ReactNode } from "react";
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
    </AnyclickProvider>
  );
}
