"use client";

import { ExampleProvider } from "@/components/ExampleProvider";
import type { ReactNode } from "react";
import type { ContextMenuItem } from "@ewjdev/anyclick-react";
import { Bug, Cloud, Code, Heart, Lightbulb, Monitor } from "lucide-react";

const menuItems: ContextMenuItem[] = [
  {
    type: "bug",
    label: "Report Bug",
    icon: <Bug className="w-4 h-4 text-rose-400" />,
    showComment: true,
  },
  {
    type: "feature",
    label: "Suggest Feature",
    icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    showComment: true,
  },
  {
    type: "like",
    label: "Love It!",
    icon: <Heart className="w-4 h-4 text-pink-400" />,
    showComment: false,
  },
  {
    type: "dev-tools",
    label: "Developer Tools",
    icon: <Code className="w-4 h-4 text-cyan-400" />,
    children: [
      {
        type: "dev-local",
        label: "Fix locally",
        icon: <Monitor className="w-4 h-4 text-gray-400" />,
        showComment: true,
      },
      {
        type: "dev-cloud",
        label: "Send to cloud agent",
        icon: <Cloud className="w-4 h-4 text-gray-400" />,
        showComment: true,
      },
    ],
  },
];

/** The custom menu this page documents, mounted live around its demo. */
export function CustomMenuDemo({ children }: { children: ReactNode }) {
  return <ExampleProvider menuItems={menuItems}>{children}</ExampleProvider>;
}
