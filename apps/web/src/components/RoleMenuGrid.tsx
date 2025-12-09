"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import {
  Box,
  Camera,
  Check,
  Clock,
  Eye,
  GitBranch,
  Layers,
  LucideIcon,
  MousePointerClick,
  Palette,
  Sparkles,
  Target,
  Terminal,
  TestTube,
  Users,
} from "lucide-react";
import Link from "next/link";

type RoleMenuCardData = {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  features: Array<{ text: string; available: boolean }>;
  upcoming: Array<{ id: string; title: string }>;
};

type MenuTone = "accent" | "outline" | "muted";

type LinkMenuItem = {
  type: "link";
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone?: MenuTone;
  badge?: string;
};

type MockMenuItem = {
  type: "mock";
  label: string;
  description: string;
  result: string;
  icon: LucideIcon;
  tone?: MenuTone;
  badge?: string;
};

type RoleMenuItem = LinkMenuItem | MockMenuItem;

const iconMap: Record<string, LucideIcon> = {
  TestTube,
  Terminal,
  Target,
  Users,
  Palette,
  Eye,
};

const colorMap: Record<
  string,
  { gradient: string; border: string; text: string; bg: string }
> = {
  emerald: {
    gradient: "from-emerald-500/20 to-emerald-500/5",
    border: "hover:border-emerald-500/30",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  amber: {
    gradient: "from-amber-500/20 to-amber-500/5",
    border: "hover:border-amber-500/30",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  violet: {
    gradient: "from-violet-500/20 to-violet-500/5",
    border: "hover:border-violet-500/30",
    text: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  cyan: {
    gradient: "from-cyan-500/20 to-cyan-500/5",
    border: "hover:border-cyan-500/30",
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  rose: {
    gradient: "from-rose-500/20 to-rose-500/5",
    border: "hover:border-rose-500/30",
    text: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  indigo: {
    gradient: "from-indigo-500/20 to-indigo-500/5",
    border: "hover:border-indigo-500/30",
    text: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
};

const roleMenuConfig: Record<string, RoleMenuItem[]> = {
  qa: [
    {
      type: "link",
      label: "Log GitHub bug",
      description: "Prefilled DOM context, ready to submit",
      href: "/examples/github-integration",
      icon: GitBranch,
      tone: "accent",
      badge: "live",
    },
    {
      type: "mock",
      label: "Capture screenshot",
      description: "Mask PII, include element bounds",
      result: "QA captured screenshot + DOM payload",
      icon: Camera,
      tone: "outline",
    },
    {
      type: "mock",
      label: "Assert CSS state",
      description: "Freeze hover/focus for triage",
      result: "State frozen for selectors + repro notes",
      icon: Palette,
      tone: "muted",
    },
    {
      type: "link",
      label: "Open inspector",
      description: "Jump into the pointer inspector",
      href: "/examples/custom-pointer",
      icon: Eye,
      tone: "outline",
    },
  ],
  developer: [
    {
      type: "link",
      label: "Cursor auto-fix",
      description: "Send context to Cursor agent",
      href: "/docs/getting-started",
      icon: Terminal,
      tone: "accent",
      badge: "dev",
    },
    {
      type: "mock",
      label: "Trace stack",
      description: "Capture stack + network cues",
      result: "Stack trace pinned for this card",
      icon: Layers,
      tone: "muted",
    },
    {
      type: "link",
      label: "DOM replay",
      description: "See pointer replay in action",
      href: "/examples/custom-pointer",
      icon: MousePointerClick,
      tone: "outline",
    },
    {
      type: "mock",
      label: "Generate test",
      description: "Draft Playwright snippet",
      result: "Playwright script staged with selectors",
      icon: TestTube,
      tone: "outline",
    },
  ],
  pm: [
    {
      type: "link",
      label: "Draft Jira story",
      description: "Use the Jira adapter preview",
      href: "/examples/jira-integration",
      icon: Target,
      tone: "accent",
      badge: "flow",
    },
    {
      type: "mock",
      label: "Prioritize roadmap",
      description: "Slot into the next release",
      result: "Added to the priority lane",
      icon: Box,
      tone: "outline",
    },
    {
      type: "link",
      label: "Share quick summary",
      description: "Hand off context to chat",
      href: "/examples/quick-chat",
      icon: Users,
      tone: "outline",
    },
    {
      type: "mock",
      label: "Record voice note",
      description: "Lightweight async note drop",
      result: "Voice note stub saved for follow-up",
      icon: Sparkles,
      tone: "muted",
    },
  ],
  customer: [
    {
      type: "mock",
      label: "Send friction note",
      description: "One-tap feedback with masking",
      result: "Friction note captured with context",
      icon: MousePointerClick,
      tone: "accent",
      badge: "gentle",
    },
    {
      type: "link",
      label: "Open support chat",
      description: "Try the inline assistant",
      href: "/examples/quick-chat",
      icon: Users,
      tone: "outline",
    },
    {
      type: "link",
      label: "Email support",
      description: "hello@anyclick.dev",
      href: "mailto:hello@anyclick.dev",
      icon: Box,
      tone: "outline",
    },
    {
      type: "mock",
      label: "Request callback",
      description: "Schedule a human follow-up",
      result: "Callback request queued with timestamp",
      icon: Clock,
      tone: "muted",
    },
  ],
  ux: [
    {
      type: "link",
      label: "Custom menu layout",
      description: "See menu variants live",
      href: "/examples/custom-menu",
      icon: Palette,
      tone: "accent",
      badge: "new",
    },
    {
      type: "link",
      label: "Swap pointer",
      description: "Preview cursor shapes",
      href: "/examples/custom-pointer",
      icon: MousePointerClick,
      tone: "outline",
    },
    {
      type: "mock",
      label: "Change icon set",
      description: "Swap to a different glyph set",
      result: "Icon set toggled for this card",
      icon: Sparkles,
      tone: "muted",
    },
    {
      type: "mock",
      label: "Run contrast check",
      description: "Simulated contrast audit",
      result: "Contrast audit results pinned",
      icon: Eye,
      tone: "outline",
    },
  ],
  designer: [
    {
      type: "mock",
      label: "Capture visual diff",
      description: "Snapshot before/after state",
      result: "Visual diff generated for review",
      icon: Camera,
      tone: "accent",
      badge: "preview",
    },
    {
      type: "link",
      label: "Inspect overlay",
      description: "Open pointer inspector demo",
      href: "/examples/custom-pointer",
      icon: Eye,
      tone: "outline",
    },
    {
      type: "mock",
      label: "Annotate layer",
      description: "Drop a marker on the canvas",
      result: "Annotation added to the layer stack",
      icon: Layers,
      tone: "muted",
    },
    {
      type: "link",
      label: "Export board",
      description: "View the basic capture flow",
      href: "/examples/basic",
      icon: Box,
      tone: "outline",
    },
  ],
};

const defaultMenu: RoleMenuItem[] = [
  {
    type: "link",
    label: "Open docs",
    description: "See how adapters wire up",
    href: "/docs",
    icon: Terminal,
    tone: "accent",
  },
  {
    type: "mock",
    label: "Simulate capture",
    description: "Pretend we just grabbed context",
    result: "Context captured for this role",
    icon: MousePointerClick,
    tone: "outline",
  },
];

function toneClasses(tone: MenuTone | undefined, accent: string) {
  if (tone === "accent") {
    return `border-white/10 bg-white/[0.03] ${accent} shadow-[0_0_0_1px_rgba(255,255,255,0.05)]`;
  }
  if (tone === "outline") {
    return "border-white/10 bg-transparent hover:border-white/30";
  }
  return "border-white/5 bg-white/[0.01] hover:border-white/20";
}

type ActionButtonProps = {
  item: RoleMenuItem;
  accentText: string;
  accentBg: string;
  onMock: (result: string, label: string) => void;
};

function MenuActionButton({
  item,
  accentText,
  accentBg,
  onMock,
}: ActionButtonProps) {
  const Icon = item.icon;
  const commonClasses =
    "flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70";
  const badge = item.badge ? (
    <span
      className={cn(
        "text-[10px] px-2 py-1 rounded-full border",
        accentText,
        accentBg,
        "border-white/10",
      )}
    >
      {item.badge}
    </span>
  ) : null;

  if (item.type === "link") {
    return (
      <Link
        href={item.href}
        className={cn(commonClasses, toneClasses(item.tone, accentText))}
        aria-label={`${item.label} for this role`}
      >
        <span className={cn("mt-0.5 rounded-md p-2", accentBg)}>
          <Icon className={cn("h-4 w-4", accentText)} />
        </span>
        <span className="flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {item.label}
            </span>
            {badge}
          </span>
          <span className="block text-xs text-gray-400">
            {item.description}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onMock(item.result, item.label)}
      className={cn(commonClasses, toneClasses(item.tone, accentText))}
      aria-label={`${item.label} (simulated)`}
    >
      <span className={cn("mt-0.5 rounded-md p-2", accentBg)}>
        <Icon className={cn("h-4 w-4", accentText)} />
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{item.label}</span>
          {badge}
        </span>
        <span className="block text-xs text-gray-400">{item.description}</span>
      </span>
    </button>
  );
}

type RoleCardProps = {
  role: RoleMenuCardData;
};

function RoleCard({ role }: RoleCardProps) {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const accent = colorMap[role.color] || colorMap.emerald;
  const menuItems = useMemo(
    () => roleMenuConfig[role.key] ?? defaultMenu,
    [role.key],
  );
  const Icon = iconMap[role.icon] || Sparkles;

  const handleMock = (result: string, label: string) => {
    setLastAction(`${label}: ${result}`);
  };

  const navItems = menuItems.slice(0, 2);

  return (
    <div
      className={cn(
        "group rounded-2xl border border-white/5 bg-white/2 p-6 transition-all hover:bg-white/4",
        accent.border,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br transition-transform group-hover:scale-110",
              accent.gradient,
            )}
          >
            <Icon className={cn("h-6 w-6", accent.text)} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{role.title}</h3>
            <p className="text-sm text-gray-500">{role.subtitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {navItems.map((item, idx) => {
            const NavIcon = item.icon;

            if (item.type === "link") {
              return (
                <Link
                  key={`${role.key}-nav-${idx}`}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-gray-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
                    accent.bg,
                  )}
                >
                  <NavIcon className={cn("h-3.5 w-3.5", accent.text)} />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={`${role.key}-nav-${idx}`}
                type="button"
                onClick={() => handleMock(item.result, item.label)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-gray-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
                  accent.bg,
                )}
              >
                <NavIcon className={cn("h-3.5 w-3.5", accent.text)} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {menuItems.map((item, idx) => (
          <MenuActionButton
            key={`${role.key}-action-${idx}`}
            item={item}
            accentText={accent.text}
            accentBg={accent.bg}
            onMock={handleMock}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {role.features
          .filter((feature) => feature.available)
          .map((feature, idx) => (
            <button
              key={`${role.key}-feature-${idx}`}
              type="button"
              onClick={() =>
                handleMock(`Saved feature note: ${feature.text}`, "Feature tap")
              }
              className="flex w-full items-center gap-2 rounded-lg border border-white/5 bg-white/1 px-3 py-2 text-left text-gray-300 transition-colors hover:border-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            >
              <Check className={cn("h-4 w-4", accent.text)} />
              <span className="flex-1">{feature.text}</span>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wide",
                  accent.text,
                )}
              >
                tap
              </span>
            </button>
          ))}
        {role.upcoming.map((item) => (
          <Link
            key={item.id}
            href="/roadmap"
            className="flex items-center gap-2 rounded-lg border border-amber-500/10 bg-amber-500/5 px-3 py-2 text-left text-amber-200 transition-colors hover:border-amber-500/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="flex-1">{item.title}</span>
            <span className="text-[10px] uppercase tracking-wide text-amber-300">
              soon
            </span>
          </Link>
        ))}
      </div>

      {lastAction ? (
        <div
          className="mt-4 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-xs text-gray-200"
          aria-live="polite"
        >
          {lastAction}
        </div>
      ) : null}
    </div>
  );
}

type RoleMenuGridProps = {
  roles: RoleMenuCardData[];
  className?: string;
};

export function RoleMenuGrid({ roles, className }: RoleMenuGridProps) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-3", className)}>
      {roles.map((role) => (
        <RoleCard key={role.key} role={role} />
      ))}
    </div>
  );
}
