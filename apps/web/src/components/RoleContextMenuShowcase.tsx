"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import {
  AnyclickProvider,
  type PresetRole,
  createPresetMenu,
} from "@ewjdev/anyclick-react";
import { Clock, MousePointerClick } from "lucide-react";

type RoleWithUpcoming = {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  features: Array<{ text: string; available: boolean }>;
  upcoming: Array<{ id: string; title: string }>;
};

const colorMap: Record<
  string,
  {
    gradient: string;
    border: string;
    text: string;
    bg: string;
    chip: string;
    accent: string;
  }
> = {
  emerald: {
    gradient: "from-emerald-500/20 to-emerald-500/5",
    border: "hover:border-emerald-500/30",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    chip: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    accent: "#34d399",
  },
  amber: {
    gradient: "from-amber-500/20 to-amber-500/5",
    border: "hover:border-amber-500/30",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    chip: "bg-amber-500/15 text-amber-100 border-amber-500/30",
    accent: "#fbbf24",
  },
  violet: {
    gradient: "from-violet-500/20 to-violet-500/5",
    border: "hover:border-violet-500/30",
    text: "text-violet-300",
    bg: "bg-violet-500/10",
    chip: "bg-violet-500/15 text-violet-100 border-violet-500/30",
    accent: "#a78bfa",
  },
  cyan: {
    gradient: "from-cyan-500/20 to-cyan-500/5",
    border: "hover:border-cyan-500/30",
    text: "text-cyan-300",
    bg: "bg-cyan-500/10",
    chip: "bg-cyan-500/15 text-cyan-100 border-cyan-500/30",
    accent: "#22d3ee",
  },
  rose: {
    gradient: "from-rose-500/20 to-rose-500/5",
    border: "hover:border-rose-500/30",
    text: "text-rose-300",
    bg: "bg-rose-500/10",
    chip: "bg-rose-500/15 text-rose-100 border-rose-500/30",
    accent: "#fb7185",
  },
  indigo: {
    gradient: "from-indigo-500/20 to-indigo-500/5",
    border: "hover:border-indigo-500/30",
    text: "text-indigo-300",
    bg: "bg-indigo-500/10",
    chip: "bg-indigo-500/15 text-indigo-100 border-indigo-500/30",
    accent: "#818cf8",
  },
};

const adapter = createHttpAdapter({ endpoint: "/api/feedback" });

type PresetKey = PresetRole | "ux" | "customer";

const presetMap: Record<PresetKey, ReturnType<typeof createPresetMenu>> = {
  qa: createPresetMenu("qa"),
  developer: createPresetMenu("developer"),
  pm: createPresetMenu("pm"),
  designer: createPresetMenu("designer"),
  ux: createPresetMenu("designer"),
  customer: createPresetMenu("chrome"),
  chrome: createPresetMenu("chrome"),
};

const integrationLabels: Record<string, string> = {
  qa: "GitHub + rich repro",
  developer: "Cursor + GitHub",
  pm: "Jira + comments",
  customer: "Support desk",
  ux: "Design review",
  designer: "Visual QA",
};

function useRolePreset(roleKey: string) {
  const preset = presetMap[roleKey as PresetKey] ?? presetMap.chrome;
  const integration = integrationLabels[roleKey] ?? "Generic capture";
  return { preset, integration };
}

function RoleCard({ role }: { role: RoleWithUpcoming }) {
  const { preset, integration } = useRolePreset(role.key);
  const colors = colorMap[role.color] ?? colorMap.emerald;

  const quickChatConfig = useMemo(
    () =>
      ["developer", "pm"].includes(role.key)
        ? {
            endpoint: "/api/anyclick/chat",
            model: "gpt-5-nano",
            maxResponseLength: 400,
            title: role.key === "developer" ? "Dev helper" : "PM assistant",
          }
        : undefined,
    [role.key],
  );

  return (
    <AnyclickProvider
      adapter={adapter}
      menuItems={preset.menuItems}
      screenshotConfig={preset.screenshotConfig}
      metadata={{ role: role.key, integration }}
      theme={{
        ...preset.theme,
        contextMenu: {
          ...preset.theme?.contextMenu,
          radius: 12,
          blur: 18,
        },
        highlightConfig: {
          enabled: true,
          colors: {
            targetColor: `rgb(255 255 255 / 0.85)`,
            containerColor: `${colors.accent}73`,
          },
        },
      }}
      header={<></>}
      scoped
      quickChatConfig={quickChatConfig}
    >
      <div
        className={cn(
          "group rounded-2xl border border-white/5 bg-white/2 p-6 transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/4",
          colors.border,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br transition-transform group-hover:scale-110",
                colors.gradient,
              )}
            >
              <MousePointerClick className={cn("h-6 w-6", colors.text)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{role.title}</h3>
                <span
                  className={cn(
                    "text-[10px] px-2 py-1 rounded-full border",
                    colors.chip,
                  )}
                >
                  Right-click me
                </span>
              </div>
              <p className="text-sm text-gray-500">{role.subtitle}</p>
            </div>
          </div>
          <span
            className={cn(
              "text-[11px] px-3 py-1 rounded-full border",
              colors.chip,
            )}
          >
            {integration}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {role.features
            .filter((feature) => feature.available)
            .map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/1 px-3 py-2 text-gray-300"
              >
                <div className={cn("h-2 w-2 rounded-full", colors.bg)} />
                <span className="flex-1">{feature.text}</span>
                <span className="text-[10px] uppercase tracking-wide text-gray-500">
                  tap / right-click
                </span>
              </div>
            ))}
          {role.upcoming.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-amber-500/10 bg-amber-500/5 px-3 py-2 text-amber-200"
            >
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="flex-1">{item.title}</span>
              <span className="text-[10px] uppercase tracking-wide text-amber-300">
                soon
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Right-click inside this card to see how this role&apos;s menu, theme,
          and adapter metadata change together.
        </p>
      </div>
    </AnyclickProvider>
  );
}

export function RoleContextMenuShowcase({
  roles,
  className,
}: {
  roles: RoleWithUpcoming[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-3", className)}>
      {roles.map((role) => (
        <RoleCard key={role.key} role={role} />
      ))}
    </div>
  );
}
