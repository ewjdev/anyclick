"use client";

import { CodeBlock } from "@/components/CodePreview";
import { ExampleProvider } from "@/components/ExampleProvider";
import { ExampleStage } from "@/components/ExampleStage";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PointerTheme } from "@ewjdev/anyclick-pointer";
import { PointerProvider, usePointer } from "@ewjdev/anyclick-pointer";
import type { ContextMenuItem } from "@ewjdev/anyclick-react";
import {
  ArrowRight,
  Check,
  Crosshair,
  Hand,
  MousePointer2,
  Palette,
  Pointer,
  RotateCcw,
  Settings,
  Target,
} from "lucide-react";
import Link from "next/link";

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

/** Applies the picker's theme to the live pointer. Must sit inside PointerProvider. */
function PointerStage({
  theme,
  children,
}: {
  theme: PointerTheme;
  children: React.ReactNode;
}) {
  const { setTheme } = usePointer();
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);
  return <>{children}</>;
}

export default function CustomPointerExamplePage() {
  const [pointerColor, setPointerColor] = useState("#3b82f6");
  const [circleColor, setCircleColor] = useState("rgba(59, 130, 246, 0.4)");
  const [pointerSize, setPointerSize] = useState(24);
  const [circleSize, setCircleSize] = useState(44);
  const [selectedIcon, setSelectedIcon] = useState<string>("default");
  const [transparentBackground, setTransparentBackground] = useState(false);

  const iconLabel =
    iconOptions.find((o) => o.id === selectedIcon)?.label || "MousePointer2";

  const theme = useMemo<PointerTheme>(() => {
    const option = iconOptions.find((o) => o.id === selectedIcon);
    const Icon = option?.Icon ?? MousePointer2;
    return {
      colors: {
        pointerColor,
        circleColor,
        circleBorderColor: `${pointerColor}99`,
      },
      sizes: { pointerSize, circleSize, circleBorderWidth: 2 },
      pointerIcon: (
        <Icon
          size={pointerSize}
          strokeWidth={2}
          fill={transparentBackground ? "none" : hexToRgba(pointerColor, 0.3)}
          stroke={pointerColor}
        />
      ),
    };
  }, [
    pointerColor,
    circleColor,
    pointerSize,
    circleSize,
    selectedIcon,
    transparentBackground,
  ]);

  // The exact provider block running inside the Stage, reflecting the picker.
  const liveSource = `'use client';

import { PointerProvider } from '@ewjdev/anyclick-pointer';
import { AnyclickProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';
import { ${iconLabel} } from 'lucide-react';

const adapter = createHttpAdapter({ endpoint: '/api/feedback' });

const theme = {
  colors: {
    pointerColor: '${pointerColor}',
    circleColor: '${circleColor}',
    circleBorderColor: '${pointerColor}99',
  },
  sizes: { pointerSize: ${pointerSize}, circleSize: ${circleSize}, circleBorderWidth: 2 },
  pointerIcon: (
    <${iconLabel}
      size={${pointerSize}}
      strokeWidth={2}
      fill="${transparentBackground ? "none" : hexToRgba(pointerColor, 0.3)}"
      stroke="${pointerColor}"
    />
  ),
};

const menuItems = [
  { type: 'issue', label: 'Report pointer glitch', showComment: true },
  { type: 'copy-theme', label: 'Copy pointer theme',
    onClick: () => navigator.clipboard.writeText(JSON.stringify(theme)) },
  { type: 'feature', label: 'Send feedback', showComment: true },
];

export function Providers({ children }) {
  return (
    <PointerProvider theme={theme}>
      <AnyclickProvider adapter={adapter} scoped menuItems={menuItems}>
        {children}
      </AnyclickProvider>
    </PointerProvider>
  );
}
// This page also calls usePointer().setTheme(theme) when you change a control.`;

  const themeSource = useMemo(
    () =>
      JSON.stringify(
        {
          colors: {
            pointerColor,
            circleColor,
            circleBorderColor: `${pointerColor}99`,
          },
          sizes: { pointerSize, circleSize, circleBorderWidth: 2 },
          pointerIcon: iconLabel,
        },
        null,
        2,
      ),
    [pointerColor, circleColor, pointerSize, circleSize, iconLabel],
  );

  const menuItems = useMemo<ContextMenuItem[]>(
    () => [
      { type: "issue", label: "Report pointer glitch", showComment: true },
      {
        type: "copy-theme",
        label: "Copy pointer theme",
        onClick: ({ closeMenu }) => {
          void navigator.clipboard?.writeText(themeSource);
          closeMenu();
        },
      },
      { type: "feature", label: "Send feedback", showComment: true },
    ],
    [themeSource],
  );

  const resetToDefaults = () => {
    setPointerColor("#3b82f6");
    setCircleColor("rgba(59, 130, 246, 0.4)");
    setPointerSize(24);
    setCircleSize(44);
    setSelectedIcon("default");
    setTransparentBackground(false);
  };

  const applyPreset = (preset: (typeof presetThemes)[0]) => {
    setPointerColor(preset.pointerColor);
    setCircleColor(preset.circleColor);
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Custom Pointer</span>
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Custom Pointer
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          A themed pointer scoped to one region, plus a three-item menu.
        </p>
      </div>

      <ExampleStage
        id="custom-pointer"
        prompt="Move. Then right-click anything here."
        source={liveSource}
        note="What's different: the pointer only exists inside the PointerProvider's region, and the menu is this page's own three items. Change a control and both the pointer and the source below update. The right-click circle animation is not shown inside an anyclick region (the pointer package skips it once the event is handled)."
        reveal="payload"
      >
        <PointerProvider className="block">
          <ExampleProvider menuItems={menuItems}>
            <PointerStage theme={theme}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Live customization</h2>
                <button
                  onClick={resetToDefaults}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 transition-colors text-gray-400"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
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

              {/* Icon */}
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

              {/* Colors + sizes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        setCircleColor(hexToRgba(color, 0.4));
                      }}
                    />
                    <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transparentBackground}
                        onChange={(e) =>
                          setTransparentBackground(e.target.checked)
                        }
                        className="accent-violet-500"
                      />
                      Transparent pointer fill
                    </label>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-3">Sizes</h3>
                  <div className="space-y-4">
                    <label className="block text-xs text-gray-400">
                      Pointer: {pointerSize}px
                      <input
                        type="range"
                        min={16}
                        max={48}
                        value={pointerSize}
                        onChange={(e) => setPointerSize(Number(e.target.value))}
                        className="w-full mt-1 accent-violet-500"
                      />
                    </label>
                    <label className="block text-xs text-gray-400">
                      Circle: {circleSize}px
                      <input
                        type="range"
                        min={24}
                        max={96}
                        value={circleSize}
                        onChange={(e) => setCircleSize(Number(e.target.value))}
                        className="w-full mt-1 accent-violet-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </PointerStage>
          </ExampleProvider>
        </PointerProvider>
      </ExampleStage>

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-white mb-8">
          Implementation details, API and theme options
        </summary>
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

        {/* Integration with AnyclickProvider */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            Integration with AnyclickProvider
          </h2>
          <p className="text-gray-400 mb-4">
            Combine with the feedback system for a complete experience:
          </p>
          <CodeBlock filename="app/providers.tsx">{`'use client';

import { AnyclickProvider } from '@ewjdev/anyclick-react';
import { PointerProvider } from '@ewjdev/anyclick-pointer';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

const adapter = createHttpAdapter({ endpoint: '/api/feedback' });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AnyclickProvider adapter={adapter}>
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
    </AnyclickProvider>
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
                  <th className="text-left py-2 pr-4 text-gray-400">
                    Property
                  </th>
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
                    Trigger states: &apos;normal&apos; | &apos;rightClick&apos;
                    | &apos;pressing&apos;
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Next steps */}
        <div className="p-6 rounded-xl bg-linear-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
          <h3 className="font-semibold mb-2">Your changes are live!</h3>
          <p className="text-gray-400 text-sm mb-4">
            The customizations you made above are applied to the actual pointer
            on this page. Navigate to other pages to see your theme persist, or
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
      </details>
    </div>
  );
}
