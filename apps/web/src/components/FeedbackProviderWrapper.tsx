"use client";

import {
  FeedbackProvider,
  filterMenuItemsByRole,
} from "@ewjdev/anyclick-react";
import type { FeedbackMenuItem } from "@ewjdev/anyclick-react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { DEFAULT_SENSITIVE_SELECTORS } from "@ewjdev/anyclick-core";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { CodeIcon, CloudIcon, MonitorIcon } from "lucide-react";

const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

// Check if we're in development mode
const isDev = process.env.NODE_ENV === "development";

/**
 * All available menu items with role requirements
 */
const allMenuItems: FeedbackMenuItem[] = [
  { type: "issue", label: "Report an issue", showComment: true },
  { type: "feature", label: "Request a feature", showComment: true },
  { type: "like", label: "I like this!", showComment: false },
  // Developer-only: Build with Cursor (with submenu for local vs cloud)
  {
    type: "cursor_menu",
    label: "Build with Cursor",
    icon: <CodeIcon className="w-4 h-4" />,
    requiredRoles: ["dev", "esl_admin", "super_admin"],
    children: [
      // Local option only available in development
      ...(isDev
        ? [
            {
              type: "cursor_local" as const,
              label: "Local (cursor-agent)",
              icon: <MonitorIcon className="w-4 h-4" />,
              showComment: true,
            },
          ]
        : []),
      {
        type: "cursor_cloud" as const,
        label: "Cloud Agent",
        icon: <CloudIcon className="w-4 h-4" />,
        showComment: true,
      },
    ],
  },
];

export function FeedbackProviderWrapper({ children }: { children: ReactNode }) {
  const userContext = {};
  // Filter menu items based on user roles
  const menuItems = useMemo(() => {
    return filterMenuItemsByRole(allMenuItems, userContext);
  }, [userContext]);

  return (
    <FeedbackProvider
      adapter={adapter}
      menuItems={menuItems}
      metadata={userContext}
      highlightConfig={{
        enabled: true,
        colors: {
          targetColor: "#3b82f6",
          containerColor: "#8b5cf6",
        },
      }}
      screenshotConfig={{
        enabled: true,
        sensitiveSelectors: DEFAULT_SENSITIVE_SELECTORS,
      }}
    >
      {children}
    </FeedbackProvider>
  );
}
