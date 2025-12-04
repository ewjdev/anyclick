"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePointer } from "@ewjdev/anyclick-pointer";
import {
  ArrowRight,
  MousePointer2,
  Check,
  Crosshair,
  Target,
  Hand,
  Pointer,
  Palette,
  Settings,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { CodeBlock } from "@/components/CodePreview";

// Interactive color picker
function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-white/10"
      />
      <span className="text-sm text-gray-400">{label}</span>
    </div>
  );
}

// Icon options with their components
const iconOptions = [
  { id: "default", label: "Default", Icon: MousePointer2 },
  { id: "crosshair", label: "Crosshair", Icon: Crosshair },
  { id: "target", label: "Target", Icon: Target },
  { id: "hand", label: "Hand", Icon: Hand },
  { id: "pointer", label: "Pointer", Icon: Pointer },
];

// Preset themes
const presetThemes = [
  {
    name: "Blue (Default)",
    pointerColor: "#3b82f6",
    circleColor: "rgba(59, 130, 246, 0.4)",
  },
  {
    name: "Emerald",
    pointerColor: "#10b981",
    circleColor: "rgba(16, 185, 129, 0.4)",
  },
  {
    name: "Rose",
    pointerColor: "#f43f5e",
    circleColor: "rgba(244, 63, 94, 0.4)",
  },
  {
    name: "Amber",
    pointerColor: "#f59e0b",
    circleColor: "rgba(245, 158, 11, 0.4)",
  },
  {
    name: "Violet",
    pointerColor: "#8b5cf6",
    circleColor: "rgba(139, 92, 246, 0.4)",
  },
  {
    name: "Cyan",
    pointerColor: "#06b6d4",
    circleColor: "rgba(6, 182, 212, 0.4)",
  },
];

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function CustomPointerExamplePage() {
  // Get the pointer context to dynamically update the theme
  const { setTheme, theme, setInteractionState } = usePointer();

  // Local state for the UI
  const [pointerColor, setPointerColor] = useState("#3b82f6");
  const [circleColor, setCircleColor] = useState("rgba(59, 130, 246, 0.4)");
  const [pointerSize, setPointerSize] = useState(24);
  const [circleSize, setCircleSize] = useState(44);
  const [selectedIcon, setSelectedIcon] = useState<string>("default");
  const [transparentBackground, setTransparentBackground] = useState(false);

  // Get the fill color based on transparent setting
  const getFillColor = useCallback((color: string, isTransparent: boolean) => {
    if (isTransparent) return "none";
    return hexToRgba(color, 0.3);
  }, []);

  // Create icon element based on selection
  const createPointerIcon = useCallback(
    (iconId: string, color: string, size: number, isTransparent: boolean) => {
      const option = iconOptions.find((o) => o.id === iconId);
      if (!option) return undefined;
      const { Icon } = option;
      const fillColor = getFillColor(color, isTransparent);
      return (
        <Icon size={size} strokeWidth={2} fill={fillColor} stroke={color} />
      );
    },
    [getFillColor],
  );

  // Update the real pointer when settings change
  useEffect(() => {
    setTheme({
      colors: {
        pointerColor,
        circleColor,
        circleBorderColor: `${pointerColor}99`,
      },
      sizes: {
        pointerSize,
        circleSize,
        circleBorderWidth: 2,
      },
      pointerIcon: createPointerIcon(
        selectedIcon,
        pointerColor,
        pointerSize,
        transparentBackground,
      ),
    });
  }, [
    pointerColor,
    circleColor,
    pointerSize,
    circleSize,
    selectedIcon,
    transparentBackground,
    setTheme,
    createPointerIcon,
  ]);

  // Reset to defaults
  const resetToDefaults = () => {
    setPointerColor("#3b82f6");
    setCircleColor("rgba(59, 130, 246, 0.4)");
    setPointerSize(24);
    setCircleSize(44);
    setSelectedIcon("default");
    setTransparentBackground(true);
  };

  // Apply preset theme
  const applyPreset = (preset: (typeof presetThemes)[0]) => {
    setPointerColor(preset.pointerColor);
    setCircleColor(preset.circleColor);
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Custom Pointer</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Custom Pointer
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Replace the default cursor with a beautiful, themed pointer that
          transforms on interactions. Includes right-click circle animation and
          press effects.
        </p>
      </div>

      {/* Live Interactive Demo */}
      <div className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Live Customization
          </h2>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 transition-colors text-gray-400"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        <div className="p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-emerald-400 text-sm font-medium mb-1">
            ✨ Changes apply to the real cursor!
          </p>
          <p className="text-gray-400 text-xs">
            Move your mouse around to see the customized pointer. Right-click
            anywhere to see the circle animation.
          </p>
        </div>

        {/* Test Interaction States */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setInteractionState("normal")}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 transition-colors"
          >
            Normal State
          </button>
          <button
            onClick={() => setInteractionState("rightClick")}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 transition-colors"
          >
            Trigger Circle
          </button>
          <button
            onClick={() => setInteractionState("pressing")}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 transition-colors"
          >
            Press State
          </button>
        </div>

        {/* Preset Themes */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-400" />
            Preset Themes
          </h3>
          <div className="flex flex-wrap gap-2">
            {presetThemes.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                  pointerColor === preset.pointerColor
                    ? "bg-violet-500/30 border border-violet-500/50 text-white"
                    : "bg-white/5 hover:bg-white/10 text-gray-300"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: preset.pointerColor }}
                />
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Icon Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <MousePointer2 className="w-4 h-4 text-gray-400" />
            Pointer Icon
          </h3>
          <div className="flex flex-wrap gap-2">
            {iconOptions.map((option) => {
              const { Icon } = option;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedIcon(option.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedIcon === option.id
                      ? "bg-violet-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Settings */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-400" />
              Colors
            </h3>
            <div className="space-y-3">
              <ColorPicker
                label="Pointer Color"
                value={pointerColor}
                onChange={(color) => {
                  setPointerColor(color);
                  // Auto-update circle color with transparency
                  const r = parseInt(color.slice(1, 3), 16);
                  const g = parseInt(color.slice(3, 5), 16);
                  const b = parseInt(color.slice(5, 7), 16);
                  setCircleColor(`rgba(${r}, ${g}, ${b}, 0.4)`);
                }}
              />
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded border border-white/10"
                  style={{ backgroundColor: circleColor }}
                />
                <span className="text-sm text-gray-400">
                  Circle (auto-matched)
                </span>
              </div>
              {/* Transparent Background Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() =>
                    setTransparentBackground(!transparentBackground)
                  }
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    transparentBackground ? "bg-white/20" : "bg-violet-500"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      transparentBackground ? "left-0.5" : "left-5"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-400">
                  {transparentBackground ? "Transparent" : "Filled"} Background
                </span>
              </div>
              {!transparentBackground && (
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div
                    className="w-6 h-6 rounded border border-white/10"
                    style={{ backgroundColor: hexToRgba(pointerColor, 0.15) }}
                  />
                  <span>Fill: {pointerColor} @ 15% opacity</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Sizes</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">
                  Pointer: {pointerSize}px
                </label>
                <input
                  type="range"
                  min="16"
                  max="48"
                  value={pointerSize}
                  onChange={(e) => setPointerSize(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Circle: {circleSize}px
                </label>
                <input
                  type="range"
                  min="24"
                  max="80"
                  value={circleSize}
                  onChange={(e) => setCircleSize(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current Config Display */}
        <div className="mt-6 p-4 rounded-lg bg-[#0d1117] border border-white/10">
          <div className="text-xs text-gray-500 mb-2">
            Current Configuration
          </div>
          <pre className="text-xs text-cyan-400 overflow-x-auto">
            {`{
  colors: {
    pointerColor: "${pointerColor}",
    circleColor: "${circleColor}",
  },
  sizes: {
    pointerSize: ${pointerSize},
    circleSize: ${circleSize},
  },
  pointerIcon: <${iconOptions.find((o) => o.id === selectedIcon)?.label || "MousePointer2"} 
    fill="${transparentBackground ? "none" : hexToRgba(pointerColor, 0.15)}"
    stroke="${pointerColor}"
  />
}`}
          </pre>
        </div>
      </div>

      {/* What you get */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">What You Get</h2>
        <ul className="space-y-3">
          {[
            "Custom themed cursor that follows mouse movement",
            "Smooth right-click animation with expanding circle",
            "Press effect when clicking (scaled pointer + faint circle)",
            "Menu-aware: shows pointer over menus, circle elsewhere when menu open",
            "High z-index to appear above all UI elements",
            "Respects prefers-reduced-motion for accessibility",
            "Direct DOM manipulation for 60fps performance",
            "Dynamic theme updates via usePointer hook",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Implementation */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Implementation</h2>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          1. Install the Package
        </h3>
        <CodeBlock>{`npm install @ewjdev/anyclick-pointer
# or
yarn add @ewjdev/anyclick-pointer`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          2. Basic Setup with PointerProvider
        </h3>
        <CodeBlock filename="app/providers.tsx">{`'use client';

import { PointerProvider } from '@ewjdev/anyclick-pointer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PointerProvider>
      {children}
    </PointerProvider>
  );
}`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">3. Wrap Your App</h3>
        <CodeBlock filename="app/layout.tsx">{`import { Providers } from './providers';

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}`}</CodeBlock>
      </div>

      {/* Custom Theme */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Custom Theme</h2>
        <p className="text-gray-400 mb-4">
          Customize colors, sizes, and even replace the pointer icon. Use{" "}
          <code className="text-cyan-400">fill=&quot;none&quot;</code> for
          transparent background or a semi-transparent color for filled:
        </p>
        <CodeBlock filename="app/providers.tsx">{`import { PointerProvider } from '@ewjdev/anyclick-pointer';
import { ${iconOptions.find((o) => o.id === selectedIcon)?.label || "MousePointer2"} } from 'lucide-react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PointerProvider
      theme={{
        colors: {
          pointerColor: '${pointerColor}',
          circleColor: '${circleColor}',
          circleBorderColor: '${pointerColor}99',
        },
        sizes: {
          pointerSize: ${pointerSize},
          circleSize: ${circleSize},
          circleBorderWidth: 2,
        },
        // fill="none" for transparent, or use rgba for semi-transparent fill
        pointerIcon: <${iconOptions.find((o) => o.id === selectedIcon)?.label || "MousePointer2"} 
          size={${pointerSize}} 
          fill="${transparentBackground ? "none" : hexToRgba(pointerColor, 0.15)}" 
          stroke="${pointerColor}" 
        />,
      }}
      config={{
        visibility: 'always',
        hideDefaultCursor: true,
        zIndex: 10001,
      }}
    >
      {children}
    </PointerProvider>
  );
}`}</CodeBlock>
      </div>

      {/* Dynamic Theme Updates */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Dynamic Theme Updates</h2>
        <p className="text-gray-400 mb-4">
          Update the pointer theme at runtime using the{" "}
          <code className="text-cyan-400">usePointer</code> hook:
        </p>
        <CodeBlock>{`import { usePointer } from '@ewjdev/anyclick-pointer';
import { Crosshair } from 'lucide-react';

function ThemeSwitcher() {
  const { setTheme, setInteractionState } = usePointer();

  const applyDarkTheme = () => {
    setTheme({
      colors: {
        pointerColor: '#8b5cf6',
        circleColor: 'rgba(139, 92, 246, 0.4)',
      },
      sizes: {
        pointerSize: 28,
        circleSize: 50,
      },
      pointerIcon: <Crosshair size={28} fill="white" stroke="#8b5cf6" />,
    });
  };

  const triggerCircle = () => {
    setInteractionState('rightClick');
  };

  return (
    <div>
      <button onClick={applyDarkTheme}>Apply Dark Theme</button>
      <button onClick={triggerCircle}>Show Circle</button>
    </div>
  );
}`}</CodeBlock>
      </div>

      {/* Integration with FeedbackProvider */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          Integration with FeedbackProvider
        </h2>
        <p className="text-gray-400 mb-4">
          Combine with the feedback system for a complete experience:
        </p>
        <CodeBlock filename="app/providers.tsx">{`'use client';

import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { PointerProvider } from '@ewjdev/anyclick-pointer';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

const adapter = createHttpAdapter({ endpoint: '/api/feedback' });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider adapter={adapter}>
      <PointerProvider
        theme={{
          colors: {
            pointerColor: '#3b82f6',
            circleColor: 'rgba(59, 130, 246, 0.4)',
          },
        }}
        config={{
          visibility: 'always',
          hideDefaultCursor: true,
        }}
      >
        {children}
      </PointerProvider>
    </FeedbackProvider>
  );
}`}</CodeBlock>
      </div>

      {/* Configuration Reference */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Configuration Reference</h2>

        <h3 className="text-lg font-semibold mb-3">Theme Options</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-4 text-gray-400">Property</th>
                <th className="text-left py-2 pr-4 text-gray-400">Default</th>
                <th className="text-left py-2 text-gray-400">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-cyan-400">
                  colors.pointerColor
                </td>
                <td className="py-2 pr-4">currentColor</td>
                <td className="py-2">Pointer icon color</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-cyan-400">
                  colors.circleColor
                </td>
                <td className="py-2 pr-4">rgba(59, 130, 246, 0.4)</td>
                <td className="py-2">Circle background</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-cyan-400">
                  sizes.pointerSize
                </td>
                <td className="py-2 pr-4">24</td>
                <td className="py-2">Pointer icon size (px)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-cyan-400">
                  sizes.circleSize
                </td>
                <td className="py-2 pr-4">44</td>
                <td className="py-2">Circle size (px)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-cyan-400">
                  pointerIcon
                </td>
                <td className="py-2 pr-4">MousePointer2</td>
                <td className="py-2">Custom icon component</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-semibold mb-3 mt-8">Hook Methods</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-4 text-gray-400">Method</th>
                <th className="text-left py-2 text-gray-400">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-cyan-400">
                  setTheme(theme)
                </td>
                <td className="py-2">Update theme colors, sizes, and icon</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-cyan-400">
                  setConfig(config)
                </td>
                <td className="py-2">Update behavior config</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-cyan-400">
                  setEnabled(bool)
                </td>
                <td className="py-2">Enable/disable the pointer</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-cyan-400">
                  setInteractionState(state)
                </td>
                <td className="py-2">
                  Trigger states: &apos;normal&apos; | &apos;rightClick&apos; |
                  &apos;pressing&apos;
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <h3 className="font-semibold mb-2">Your changes are live!</h3>
        <p className="text-gray-400 text-sm mb-4">
          The customizations you made above are applied to the actual pointer on
          this page. Navigate to other pages to see your theme persist, or
          refresh to reset.
        </p>
        <Link
          href="/examples/basic"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
        >
          Basic Setup Example
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
