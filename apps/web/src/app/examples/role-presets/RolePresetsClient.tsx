"use client";

/* eslint-disable no-console */

import Link from "next/link";
import { CodeBlock } from "@/components/CodePreview";
import {
  Sparkles,
  ShieldCheck,
  Bug,
  Lightbulb,
  Paintbrush,
  Laptop2,
  MousePointer2,
} from "lucide-react";
import {
  AnyclickProvider,
  createPresetMenu,
  type AnyclickAdapter,
  type AnyclickPayload,
  type PresetRole,
} from "@ewjdev/anyclick-react";

const presetSnippet = `'use client';

import { AnyclickProvider, createPresetMenu } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

const adapter = createHttpAdapter({ endpoint: '/api/feedback' });

// Pull a preset
const qaPreset = createPresetMenu('qa');

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AnyclickProvider
      adapter={adapter}
      menuItems={qaPreset.menuItems}
      screenshotConfig={qaPreset.screenshotConfig}
      metadata={qaPreset.metadata}
      theme={qaPreset.theme}
    >
      {children}
    </AnyclickProvider>
  );
}
`;

const demoAdapter: AnyclickAdapter = {
  async submitAnyclick(payload: AnyclickPayload) {
    console.log("[preset demo] submitted", payload.type, {
      comment: payload.comment,
      role: payload.metadata,
    });
  },
};

const presets: Record<PresetRole, ReturnType<typeof createPresetMenu>> = {
  qa: createPresetMenu("qa"),
  pm: createPresetMenu("pm"),
  designer: createPresetMenu("designer"),
  developer: createPresetMenu("developer"),
  chrome: createPresetMenu("chrome"),
};

const roles: Array<{
  id: PresetRole;
  title: string;
  icon: typeof Bug;
  color: string;
  items: string[];
}> = [
  {
    id: "qa",
    title: "QA",
    icon: Bug,
    color: "violet",
    items: [
      "Bug / defect, UX papercut, repro steps",
      "Performance trace (coming soon badge)",
      "Screenshots + console/network metadata",
    ],
  },
  {
    id: "pm",
    title: "PM",
    icon: Lightbulb,
    color: "amber",
    items: [
      "Feature idea, UX papercut, customer quote",
      "Impact sizing (coming soon badge)",
      "Lighter screenshots, sentiment metadata",
    ],
  },
  {
    id: "designer",
    title: "Designer",
    icon: Paintbrush,
    color: "cyan",
    items: [
      "Visual bug, accessibility, copy/tone",
      "Motion glitch (coming soon badge)",
      "High-padding screenshots, contrast metadata",
    ],
  },
  {
    id: "developer",
    title: "Developer",
    icon: Laptop2,
    color: "emerald",
    items: [
      "Bug, refactor request",
      "Diagnostics submenu: console/network traces (coming soon) + Copy selector",
      "Debug-friendly highlight colors",
    ],
  },
  {
    id: "chrome",
    title: "Chrome default",
    icon: MousePointer2,
    color: "slate",
    items: [
      "Reload page, Print…, Search Google, Share…, Inspect",
      "Native-like styling with dark Chrome palette",
      "Uses real browser actions and falls back to clipboard for share",
    ],
  },
];

export default function RolePresetsClient() {
  return (
    <div className="max-w-3xl">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Role-based Presets</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Role-based presets
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Ship sensible menus for QA, PM, Designer, and Developer without
          rebuilding item lists. Coming-soon actions remain visible with a badge
          and are disabled so users know what’s next.
        </p>
      </div>

      <div className="mb-10 p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold mb-2">Drop-in defaults</h2>
          <p className="text-gray-400 text-sm mb-2">
            Presets return menu items, screenshot defaults, metadata hints, and
            theme tweaks per role. Coming-soon items render with a badge and are
            disabled by default.
          </p>
          <p className="text-gray-400 text-sm">
            Prefer a leaner menu? Pass{" "}
            <code className="text-cyan-400">includeComingSoon: false</code> or
            override any field via{" "}
            <code className="text-cyan-400">overrides</code>.
          </p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Usage</h2>
        <CodeBlock filename="app/providers.tsx">{presetSnippet}</CodeBlock>
      </div>

      <div className="grid gap-4 mb-12">
        {roles.map((role) => {
          const Icon = role.icon;
          const preset = presets[role.id];
          return (
            <AnyclickProvider
              key={role.id}
              adapter={demoAdapter}
              menuItems={preset.menuItems}
              metadata={{ preset: role.id }}
              screenshotConfig={preset.screenshotConfig}
              theme={preset.theme}
              header={<></>}
              scoped
            >
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                    style={{
                      background: `linear-gradient(135deg, rgb(var(--color-${role.color}-500) / 0.2), rgb(var(--color-${role.color}-500) / 0.05))`,
                    }}
                  >
                    <Icon className={`w-5 h-5 text-${role.color}-400`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{role.title}</h3>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                        Preset
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Right-click inside this card to see the {role.title} menu.
                    </p>
                  </div>
                </div>
                <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                  {role.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </AnyclickProvider>
          );
        })}
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-emerald-500/10 border border-violet-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Coming-soon badges</h3>
            <p className="text-gray-400 text-sm">
              Items marked as coming soon stay visible in the menu with a badge
              and are disabled. Users see the roadmap; your backend stays clean.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
