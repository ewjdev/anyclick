"use client";

import type { ReactNode } from "react";
import { AnyclickProvider, createPresetMenu } from "@ewjdev/anyclick-react";

const chromePreset = createPresetMenu("chrome");

export default function T3ChatProvider({ children }: { children: ReactNode }) {
  return (
    <AnyclickProvider
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
