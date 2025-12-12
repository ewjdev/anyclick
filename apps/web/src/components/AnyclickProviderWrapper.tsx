"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { PointerProvider, useHideCursor } from "@ewjdev/anyclick-pointer";
import { AnyclickProvider, createPresetMenu } from "@ewjdev/anyclick-react";

const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

export function AnyclickProviderWrapper({ children }: { children: ReactNode }) {
  // Use chrome preset for developer-focused menu with inspect, copy, etc.
  const chromePreset = useMemo(() => createPresetMenu("chrome"), []);

  console.count("AnyclickProviderWrapper");

  // Clean up any stale cursor hiding styles when PointerProvider is not used
  // This ensures the default cursor is restored if PointerProvider was removed
  useEffect(() => {
    // Remove any existing cursor hiding style element
    const cursorHideStyle = document.getElementById(
      "anyclick-pointer-cursor-hide",
    );
    if (cursorHideStyle) {
      cursorHideStyle.remove();
    }

    // Also check periodically for any stale styles (for debugging)
    const interval = setInterval(() => {
      const staleStyle = document.getElementById(
        "anyclick-pointer-cursor-hide",
      );
      if (staleStyle) {
        console.warn(
          "[AnyclickProviderWrapper] Found stale cursor hiding style, removing it",
        );
        staleStyle.remove();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
      // theme={{
      //   highlightConfig: {
      //     enabled: true,
      //     colors: {
      //       targetColor: "#3b82f6",
      //       containerColor: "#8b5cf6",
      //     },
      //   },
      //   screenshotConfig: chromePreset.screenshotConfig,
      //   ...chromePreset.theme,
      // }}
    >
      {children}
      {/* <PointerProvider
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
      </PointerProvider> */}
    </AnyclickProvider>
  );
}

/**
 * @deprecated Use AnyclickProviderWrapper instead
 */
export const FeedbackProviderWrapper = AnyclickProviderWrapper;
