"use client";

import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { AnyclickProvider } from "@ewjdev/anyclick-react";
import {
  Bug,
  Code,
  Heart,
  Lightbulb,
  Palette,
} from "lucide-react";

const demoAdapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

const customMenuItems = [
  {
    type: "bug" as const,
    label: "Report Bug",
    icon: <Bug className="w-4 h-4 text-rose-400" />,
    showComment: true,
  },
  {
    type: "feature" as const,
    label: "Suggest Feature",
    icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    showComment: true,
  },
  {
    type: "like" as const,
    label: "Love It!",
    icon: <Heart className="w-4 h-4 text-pink-400" />,
    showComment: false,
  },
  {
    type: "developer_menu" as const,
    label: "Developer Tools",
    icon: <Code className="w-4 h-4 text-cyan-400" />,
    children: [
      {
        type: "copy_selector" as const,
        label: "Copy CSS Selector",
        showComment: false,
      },
      {
        type: "inspect" as const,
        label: "Inspect Element",
        showComment: false,
      },
    ],
  },
];

export function CustomMenuDemoArea() {
  return (
    <AnyclickProvider
      adapter={demoAdapter}
      scoped
      menuItems={customMenuItems}
      theme={{
        menuStyle: {
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        },
      }}
    >
      <div className="mb-12 p-8 rounded-2xl bg-linear-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-cyan-400" />
          Try Custom Menu
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Right-click anywhere in this area to see the customized feedback menu
          with icons and custom labels:
        </p>

        <div className="space-y-4">
          <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors">
            Primary Button
          </button>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-medium mb-1">Sample Card</h3>
            <p className="text-sm text-gray-400">
              Right-click this card to see the custom menu with developer tools
              submenu.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-sm">
              Bug
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
              Feature
            </span>
            <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-sm">
              Like
            </span>
          </div>
        </div>
      </div>
    </AnyclickProvider>
  );
}
