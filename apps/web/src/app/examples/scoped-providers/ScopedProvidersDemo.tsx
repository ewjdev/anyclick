"use client";

import type { CSSProperties } from "react";
import { AnyclickProvider } from "@ewjdev/anyclick-react";
import { PointerProvider } from "@ewjdev/anyclick-pointer";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import {
  Layers,
  Palette,
  ShieldOff,
  Sparkles,
  MousePointer2,
  Paintbrush,
} from "lucide-react";

// Create a mock adapter for the demo (sends to API but we don't need it to actually work)
const demoAdapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

export function ScopedProvidersDemo() {
  return (
    <div className="space-y-6">
      {/* Global section - uses the parent provider from layout */}
      <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-violet-400">
            Global Provider (Blue highlights + Blue pointer)
          </span>
        </div>
        <p className="text-sm text-gray-400 mb-3">
          This area uses the global provider with default blue highlights and
          blue pointer. Right-click to see the blue highlight color.
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded bg-violet-500/20 text-violet-400 text-sm hover:bg-violet-500/30 transition-colors">
            Global Button
          </button>
          <span className="px-3 py-1.5 rounded bg-violet-500/10 text-violet-300 text-sm">
            Click me too!
          </span>
        </div>
      </div>

      {/* Custom themed section - nested provider with rose theme + rose pointer */}
      <AnyclickProvider
        adapter={demoAdapter}
        scoped
        theme={{
          highlightConfig: {
            enabled: true,
            colors: {
              targetColor: "#f43f5e", // Rose
              containerColor: "#ec4899", // Pink
            },
          },
        }}
        menuItems={[
          { type: "issue", label: "Report Issue (Scoped)", showComment: true },
          {
            type: "feature",
            label: "Request Feature (Scoped)",
            showComment: true,
          },
          { type: "like", label: "Love this section!", showComment: false },
        ]}
      >
        <PointerProvider
          theme={{
            colors: {
              pointerColor: "#f43f5e",
              circleColor: "rgba(244, 63, 94, 0.4)",
            },
            pointerIcon: (
              <MousePointer2
                size={24}
                strokeWidth={2}
                fill="rgba(244, 63, 94, 0.3)"
                stroke="#f43f5e"
              />
            ),
          }}
          config={{
            visibility: "always",
            hideDefaultCursor: true,
          }}
        >
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-rose-400">
                Nested Provider (Rose theme + Rose pointer)
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              This section has nested providers with custom rose-colored
              highlights AND rose pointer. Right-click to see the rose/pink
              colors and custom menu items!
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 rounded bg-rose-500/20 text-rose-400 text-sm hover:bg-rose-500/30 transition-colors">
                Scoped Button
              </button>
              <button className="px-3 py-1.5 rounded bg-pink-500/20 text-pink-400 text-sm hover:bg-pink-500/30 transition-colors">
                Another Scoped Element
              </button>
            </div>
          </div>
        </PointerProvider>
      </AnyclickProvider>

      {/* Another nested provider with emerald theme + emerald pointer */}
      <AnyclickProvider
        adapter={demoAdapter}
        scoped
        theme={{
          highlightConfig: {
            enabled: true,
            colors: {
              targetColor: "#10b981", // Emerald
              containerColor: "#06b6d4", // Cyan
            },
          },
        }}
        menuItems={[
          { type: "feature", label: "Suggest Feature", showComment: true },
          { type: "like", label: "This is great!", showComment: false },
        ]}
      >
        <PointerProvider
          theme={{
            colors: {
              pointerColor: "#10b981",
              circleColor: "rgba(16, 185, 129, 0.4)",
            },
            pointerIcon: (
              <MousePointer2
                size={24}
                strokeWidth={2}
                fill="rgba(16, 185, 129, 0.3)"
                stroke="#10b981"
              />
            ),
          }}
          config={{
            visibility: "always",
            hideDefaultCursor: true,
          }}
        >
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                Another Nested Provider (Emerald theme + Emerald pointer)
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Each section can have completely different theming, menu options,
              and pointer colors. This one uses emerald/cyan colors.
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition-colors">
                Emerald Button
              </button>
              <span className="px-3 py-1.5 rounded bg-cyan-500/10 text-cyan-300 text-sm">
                Cyan Element
              </span>
            </div>
          </div>
        </PointerProvider>
      </AnyclickProvider>

      {/* Custom styled menu section - amber theme with glassmorphism menu */}
      <AnyclickProvider
        adapter={demoAdapter}
        scoped
        theme={{
          highlightConfig: {
            enabled: true,
            colors: {
              targetColor: "#f59e0b", // Amber
              containerColor: "#d97706", // Darker amber
            },
          },
          menuStyle: {
            // Override container styles
            background:
              "linear-gradient(135deg, rgba(30, 20, 10, 0.95) 0%, rgba(40, 25, 15, 0.98) 100%)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            borderRadius: "16px",
            boxShadow:
              "0 8px 32px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            // CSS custom properties for internal elements
            "--anyclick-menu-bg": "transparent",
            "--anyclick-menu-text": "#fef3c7",
            "--anyclick-menu-text-muted": "#fbbf24",
            "--anyclick-menu-border": "rgba(245, 158, 11, 0.3)",
            "--anyclick-menu-hover": "rgba(245, 158, 11, 0.15)",
            "--anyclick-menu-accent": "#f59e0b",
            "--anyclick-menu-accent-text": "#1c1917",
            "--anyclick-menu-input-bg": "rgba(0, 0, 0, 0.3)",
            "--anyclick-menu-input-border": "rgba(245, 158, 11, 0.3)",
            "--anyclick-menu-cancel-bg": "rgba(245, 158, 11, 0.2)",
            "--anyclick-menu-cancel-text": "#fef3c7",
          } as CSSProperties,
        }}
        menuItems={[
          { type: "issue", label: "🐛 Report Bug", showComment: true },
          { type: "feature", label: "✨ New Idea", showComment: true },
          { type: "like", label: "🔥 This is fire!", showComment: false },
        ]}
      >
        <PointerProvider
          theme={{
            colors: {
              pointerColor: "#f59e0b",
              circleColor: "rgba(245, 158, 11, 0.4)",
            },
            pointerIcon: (
              <MousePointer2
                size={24}
                strokeWidth={2}
                fill="rgba(245, 158, 11, 0.3)"
                stroke="#f59e0b"
              />
            ),
          }}
          config={{
            visibility: "always",
            hideDefaultCursor: true,
          }}
        >
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Paintbrush className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">
                Custom Styled Menu (Glassmorphism)
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              This section demonstrates a fully custom-styled context menu with
              glassmorphism effect, custom border radius, and emoji icons.
              Right-click to see the custom menu design!
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition-colors">
                Amber Button
              </button>
              <span className="px-3 py-1.5 rounded bg-orange-500/10 text-orange-300 text-sm">
                Orange Element
              </span>
            </div>
          </div>
        </PointerProvider>
      </AnyclickProvider>

      {/* Disabled section - no feedback, no custom pointer */}
      <AnyclickProvider
        adapter={demoAdapter}
        scoped
        disabled
        theme={{ disabled: true }}
      >
        <PointerProvider
          config={{
            visibility: "never", // Disable custom pointer in this section
            hideDefaultCursor: false, // Show default cursor
          }}
        >
          <div className="p-4 rounded-lg bg-gray-500/10 border border-gray-500/30">
            <div className="flex items-center gap-2 mb-2">
              <ShieldOff className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-400">
                Disabled Provider (No feedback, No custom pointer)
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Both feedback AND custom pointer are disabled in this section.
              Right-click shows the native browser menu, and you see the default
              cursor.
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded bg-gray-500/20 text-gray-400 text-sm hover:bg-gray-500/30 transition-colors cursor-not-allowed">
                Disabled Button
              </button>
              <input
                type="text"
                placeholder="Sensitive input (no feedback)"
                className="px-3 py-1.5 rounded bg-gray-800/50 border border-gray-600 text-gray-400 text-sm placeholder:text-gray-600 outline-none"
              />
            </div>
          </div>
        </PointerProvider>
      </AnyclickProvider>

      {/* Info note */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
        <strong>Note:</strong> Each section above has its own{" "}
        <code className="bg-blue-500/20 px-1 rounded">AnyclickProvider</code>{" "}
        AND <code className="bg-blue-500/20 px-1 rounded">PointerProvider</code>
        , demonstrating different highlight colors, menu items, pointer themes,
        custom menu styling, and disabled states.
      </div>
    </div>
  );
}
