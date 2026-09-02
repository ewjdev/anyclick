"use client";

import { feedbackAdapter } from "@/lib/adapters";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { InspectDialogManager } from "@ewjdev/anyclick-devtools";
import { AnyclickProvider, createPresetMenu } from "@ewjdev/anyclick-react";
import { usePathname } from "next/navigation";

/**
 * Routes that mount their own providers. The site-wide provider must not run
 * here, otherwise right-click opens the generic developer menu instead of the
 * page's own customization. One page, one provider.
 */
const SELF_PROVIDED_PREFIXES = ["/examples", "/docs"];

export function AnyclickProviderWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Chrome preset: developer-focused menu with inspect, copy, etc.
  const chromePreset = useMemo(() => createPresetMenu("chrome"), []);

  if (SELF_PROVIDED_PREFIXES.some((p) => pathname?.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <AnyclickProvider
      adapter={feedbackAdapter}
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
          basePath: process.env.NEXT_PUBLIC_ANYCLICK_IDE_BASE_PATH,
        }}
      />
    </AnyclickProvider>
  );
}
