"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { PointerProvider } from "@ewjdev/anyclick-pointer";
import { AnyclickProvider, type ContextMenuItem } from "@ewjdev/anyclick-react";
import {
  Bug,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Code2,
  HeartPulse,
  ImagePlus,
  MessageSquare,
  MousePointer2,
  Package,
  Palette,
  Puzzle,
  Receipt,
  ShieldCheck,
  Target,
  Terminal,
  TrendingUp,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

const adapter = createHttpAdapter({ endpoint: "/api/feedback" });

// =============================================================================
// Workstream Theme Configuration
// =============================================================================

interface WorkstreamTheme {
  // Track (lane) styling
  trackGradient: string;
  trackBg?: string;
  trackShadow: string;
  trackBorder: string;
  // Animation
  animation?: string;
  animationClass?: string;
  // Accent for scroll buttons
  accentColor: string;
  accentColorLight: string;
  // Card theming
  cardBg: string;
  cardBorder: string;
  cardHoverBg: string;
  cardGlow?: string;
}

const workstreamThemes: Record<string, WorkstreamTheme> = {
  // Software Dev: neon terminal grid, cool violet/green accents, scanline shimmer
  software: {
    trackGradient:
      "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(34, 197, 94, 0.06) 50%, rgba(139, 92, 246, 0.08) 100%)",
    trackBg: `
      linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(34, 197, 94, 0.06) 50%, rgba(139, 92, 246, 0.08) 100%),
      repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(139, 92, 246, 0.03) 20px, rgba(139, 92, 246, 0.03) 21px),
      repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(34, 197, 94, 0.02) 20px, rgba(34, 197, 94, 0.02) 21px)
    `,
    trackShadow:
      "inset 0 2px 12px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(139, 92, 246, 0.1)",
    trackBorder: "rgba(139, 92, 246, 0.15)",
    animation: "shimmer",
    animationClass: "animate-software-shimmer",
    accentColor: "#8b5cf6",
    accentColorLight: "rgba(139, 92, 246, 0.3)",
    cardBg: "rgba(139, 92, 246, 0.04)",
    cardBorder: "rgba(139, 92, 246, 0.12)",
    cardHoverBg: "rgba(139, 92, 246, 0.08)",
    cardGlow: "0 0 20px rgba(139, 92, 246, 0.1)",
  },

  // E-commerce: warm warehouse/amber, subtle moving gradient for logistics flow
  ecommerce: {
    trackGradient:
      "linear-gradient(90deg, rgba(245, 158, 11, 0.06) 0%, rgba(251, 191, 36, 0.1) 50%, rgba(245, 158, 11, 0.06) 100%)",
    trackBg: `
      linear-gradient(90deg, rgba(245, 158, 11, 0.06) 0%, rgba(251, 191, 36, 0.1) 50%, rgba(245, 158, 11, 0.06) 100%)
    `,
    trackShadow:
      "inset 0 2px 12px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(245, 158, 11, 0.08)",
    trackBorder: "rgba(245, 158, 11, 0.12)",
    animation: "flow",
    animationClass: "animate-ecommerce-flow",
    accentColor: "#f59e0b",
    accentColorLight: "rgba(245, 158, 11, 0.3)",
    cardBg: "rgba(245, 158, 11, 0.04)",
    cardBorder: "rgba(245, 158, 11, 0.12)",
    cardHoverBg: "rgba(245, 158, 11, 0.08)",
    cardGlow: "0 0 16px rgba(245, 158, 11, 0.08)",
  },

  // Healthcare Front Desk: calm teal/emerald, soft pulse animation, gentle glass
  healthcare: {
    trackGradient:
      "linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(20, 184, 166, 0.08) 50%, rgba(16, 185, 129, 0.06) 100%)",
    trackBg: `
      linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(20, 184, 166, 0.08) 50%, rgba(16, 185, 129, 0.06) 100%)
    `,
    trackShadow:
      "inset 0 2px 10px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(16, 185, 129, 0.1)",
    trackBorder: "rgba(16, 185, 129, 0.12)",
    animation: "pulse",
    animationClass: "animate-healthcare-pulse",
    accentColor: "#10b981",
    accentColorLight: "rgba(16, 185, 129, 0.3)",
    cardBg: "rgba(16, 185, 129, 0.03)",
    cardBorder: "rgba(16, 185, 129, 0.1)",
    cardHoverBg: "rgba(16, 185, 129, 0.07)",
    cardGlow: "0 0 18px rgba(16, 185, 129, 0.08)",
  },

  // Medical Billing: navy/blue with ledger lines, faint parallax dots
  billing: {
    trackGradient:
      "linear-gradient(180deg, rgba(59, 130, 246, 0.06) 0%, rgba(30, 64, 175, 0.08) 100%)",
    trackBg: `
      linear-gradient(180deg, rgba(59, 130, 246, 0.06) 0%, rgba(30, 64, 175, 0.08) 100%),
      repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(59, 130, 246, 0.04) 32px, rgba(59, 130, 246, 0.04) 33px)
    `,
    trackShadow:
      "inset 0 2px 12px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(59, 130, 246, 0.08)",
    trackBorder: "rgba(59, 130, 246, 0.1)",
    animation: "dots",
    animationClass: "animate-billing-dots",
    accentColor: "#3b82f6",
    accentColorLight: "rgba(59, 130, 246, 0.3)",
    cardBg: "rgba(59, 130, 246, 0.03)",
    cardBorder: "rgba(59, 130, 246, 0.1)",
    cardHoverBg: "rgba(59, 130, 246, 0.07)",
    cardGlow: "0 0 16px rgba(59, 130, 246, 0.08)",
  },

  // Social Media: vibrant pink/purple with bokeh/particle twinkle
  social: {
    trackGradient:
      "linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.08) 100%)",
    trackBg: `
      linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.08) 100%)
    `,
    trackShadow:
      "inset 0 2px 12px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(236, 72, 153, 0.12)",
    trackBorder: "rgba(236, 72, 153, 0.15)",
    animation: "twinkle",
    animationClass: "animate-social-twinkle",
    accentColor: "#ec4899",
    accentColorLight: "rgba(236, 72, 153, 0.3)",
    cardBg: "rgba(236, 72, 153, 0.04)",
    cardBorder: "rgba(236, 72, 153, 0.12)",
    cardHoverBg: "rgba(236, 72, 153, 0.08)",
    cardGlow: "0 0 20px rgba(236, 72, 153, 0.1)",
  },

  // Browser Automation: orange/yellow circuit motif, slight tilt/hover lift
  automation: {
    trackGradient:
      "linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 179, 8, 0.06) 50%, rgba(249, 115, 22, 0.08) 100%)",
    trackBg: `
      linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 179, 8, 0.06) 50%, rgba(249, 115, 22, 0.08) 100%),
      repeating-linear-gradient(90deg, transparent 0px, transparent 40px, rgba(249, 115, 22, 0.03) 40px, rgba(249, 115, 22, 0.03) 42px),
      repeating-linear-gradient(0deg, transparent 0px, transparent 40px, rgba(234, 179, 8, 0.02) 40px, rgba(234, 179, 8, 0.02) 42px)
    `,
    trackShadow:
      "inset 0 2px 12px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(249, 115, 22, 0.1)",
    trackBorder: "rgba(249, 115, 22, 0.12)",
    animation: "circuit",
    animationClass: "animate-automation-circuit",
    accentColor: "#f97316",
    accentColorLight: "rgba(249, 115, 22, 0.3)",
    cardBg: "rgba(249, 115, 22, 0.04)",
    cardBorder: "rgba(249, 115, 22, 0.12)",
    cardHoverBg: "rgba(249, 115, 22, 0.08)",
    cardGlow: "0 0 16px rgba(249, 115, 22, 0.1)",
  },
};

// =============================================================================
// Role Configuration Type
// =============================================================================

interface RoleConfig {
  id: string;
  title: string;
  menuItems: ContextMenuItem[];
  menuStyle: CSSProperties;
  pointerIcon: ReactNode;
  accentColor: string;
}

// =============================================================================
// Workstream Configuration
// =============================================================================

interface WorkstreamConfig {
  id: string;
  title: string;
  tagline: string;
  roles: RoleConfig[];
  trackColor: string; // Legacy - keeping for reference
}

const workstreams: WorkstreamConfig[] = [
  // Software Development
  {
    id: "software",
    title: "Software Development",
    tagline: "Bug tracking, code review, feature requests",
    trackColor: "from-violet-500/5 via-violet-500/10 to-violet-500/5",
    roles: [
      {
        id: "qa",
        title: "QA",
        menuItems: [
          { label: "Bug report", type: "bug", showComment: true },
          { label: "Repro steps", type: "repro", showComment: true },
          { label: "Screenshot", type: "screenshot", showComment: false },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#1a1a1a",
          "--anyclick-menu-border": "#dc2626",
          "--anyclick-menu-text": "#fafafa",
          "--anyclick-menu-hover": "#292929",
          "--anyclick-menu-accent": "#dc2626",
          backgroundColor: "#1a1a1a",
          border: "1px solid #dc2626",
          borderRadius: 4,
          boxShadow: "0 0 16px rgba(220, 38, 38, 0.25)",
          fontFamily: "ui-monospace, monospace",
          fontSize: 13,
        } as CSSProperties,
        pointerIcon: <Bug size={18} className="text-red-500" />,
        accentColor: "#dc2626",
      },
      {
        id: "developer",
        title: "Developer",
        menuItems: [
          { label: "Send to Cursor", type: "cursor", showComment: false },
          { label: "Copy selector", type: "selector", showComment: false },
          { label: "Stack trace", type: "trace", showComment: false },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#0a0a0a",
          "--anyclick-menu-border": "#22c55e",
          "--anyclick-menu-text": "#22c55e",
          "--anyclick-menu-hover": "#0f1f0f",
          "--anyclick-menu-accent": "#22c55e",
          backgroundColor: "#0a0a0a",
          border: "1px solid #22c55e",
          borderRadius: 0,
          boxShadow: "0 0 16px rgba(34, 197, 94, 0.25)",
          fontFamily: "ui-monospace, monospace",
          fontSize: 13,
        } as CSSProperties,
        pointerIcon: <Terminal size={18} className="text-green-500" />,
        accentColor: "#22c55e",
      },
      {
        id: "pm",
        title: "PM",
        menuItems: [
          { label: "Feature idea", type: "feature", showComment: true },
          { label: "User feedback", type: "feedback", showComment: true },
          { label: "Prioritize", type: "priority", showComment: true },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "rgba(139, 92, 246, 0.15)",
          "--anyclick-menu-border": "rgba(139, 92, 246, 0.4)",
          "--anyclick-menu-text": "#f5f3ff",
          "--anyclick-menu-hover": "rgba(139, 92, 246, 0.25)",
          "--anyclick-menu-accent": "#8b5cf6",
          background:
            "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(34, 211, 238, 0.15))",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          borderRadius: 12,
          boxShadow: "0 0 20px rgba(139, 92, 246, 0.2)",
        } as CSSProperties,
        pointerIcon: <Target size={18} className="text-violet-400" />,
        accentColor: "#8b5cf6",
      },
      {
        id: "designer",
        title: "Designer",
        menuItems: [
          { label: "Visual bug", type: "visual", showComment: true },
          { label: "Contrast check", type: "contrast", showComment: false },
          { label: "Annotate", type: "annotate", showComment: true },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "rgba(255, 255, 255, 0.06)",
          "--anyclick-menu-border": "rgba(255, 255, 255, 0.15)",
          "--anyclick-menu-text": "#fafafa",
          "--anyclick-menu-hover": "rgba(255, 255, 255, 0.1)",
          "--anyclick-menu-accent": "#f43f5e",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 10,
          boxShadow: "0 0 20px rgba(244, 63, 94, 0.1)",
        } as CSSProperties,
        pointerIcon: <Palette size={18} className="text-rose-400" />,
        accentColor: "#f43f5e",
      },
    ],
  },

  // E-commerce / Order Fulfillment
  {
    id: "ecommerce",
    title: "E-commerce Fulfillment",
    tagline: "Orders, inventory, shipping, customer support",
    trackColor: "from-amber-500/5 via-amber-500/10 to-amber-500/5",
    roles: [
      {
        id: "picker",
        title: "Order Picker",
        menuItems: [
          { label: "Item missing", type: "missing", showComment: true },
          { label: "Wrong location", type: "location", showComment: true },
          { label: "Damaged stock", type: "damaged", showComment: false },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#1c1917",
          "--anyclick-menu-border": "#f59e0b",
          "--anyclick-menu-text": "#fef3c7",
          "--anyclick-menu-hover": "#292524",
          "--anyclick-menu-accent": "#f59e0b",
          backgroundColor: "#1c1917",
          border: "1px solid #f59e0b",
          borderRadius: 6,
          boxShadow: "0 0 16px rgba(245, 158, 11, 0.2)",
        } as CSSProperties,
        pointerIcon: <Package size={18} className="text-amber-500" />,
        accentColor: "#f59e0b",
      },
      {
        id: "support",
        title: "Support",
        menuItems: [
          { label: "Refund request", type: "refund", showComment: true },
          { label: "Shipping issue", type: "shipping", showComment: true },
          { label: "Escalate", type: "escalate", showComment: true },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "rgba(6, 182, 212, 0.1)",
          "--anyclick-menu-border": "rgba(6, 182, 212, 0.3)",
          "--anyclick-menu-text": "#ecfeff",
          "--anyclick-menu-hover": "rgba(6, 182, 212, 0.2)",
          "--anyclick-menu-accent": "#06b6d4",
          background: "rgba(6, 182, 212, 0.08)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(6, 182, 212, 0.25)",
          borderRadius: 10,
          boxShadow: "0 0 16px rgba(6, 182, 212, 0.15)",
        } as CSSProperties,
        pointerIcon: <MessageSquare size={18} className="text-cyan-400" />,
        accentColor: "#06b6d4",
      },
      {
        id: "shipping",
        title: "Shipping",
        menuItems: [
          { label: "Delay alert", type: "delay", showComment: true },
          { label: "Route change", type: "route", showComment: false },
          { label: "Priority flag", type: "priority", showComment: false },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#18181b",
          "--anyclick-menu-border": "#a855f7",
          "--anyclick-menu-text": "#faf5ff",
          "--anyclick-menu-hover": "#27272a",
          "--anyclick-menu-accent": "#a855f7",
          backgroundColor: "#18181b",
          border: "1px solid #a855f7",
          borderRadius: 8,
          boxShadow: "0 0 16px rgba(168, 85, 247, 0.2)",
        } as CSSProperties,
        pointerIcon: <Truck size={18} className="text-purple-400" />,
        accentColor: "#a855f7",
      },
    ],
  },

  // Healthcare Front Desk
  {
    id: "healthcare",
    title: "Healthcare Front Desk",
    tagline: "Patient check-in, scheduling, records",
    trackColor: "from-emerald-500/5 via-emerald-500/10 to-emerald-500/5",
    roles: [
      {
        id: "receptionist",
        title: "Receptionist",
        menuItems: [
          { label: "Check-in issue", type: "checkin", showComment: true },
          { label: "Insurance flag", type: "insurance", showComment: true },
          { label: "Reschedule", type: "schedule", showComment: false },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#022c22",
          "--anyclick-menu-border": "#10b981",
          "--anyclick-menu-text": "#d1fae5",
          "--anyclick-menu-hover": "#064e3b",
          "--anyclick-menu-accent": "#10b981",
          backgroundColor: "#022c22",
          border: "1px solid #10b981",
          borderRadius: 8,
          boxShadow: "0 0 16px rgba(16, 185, 129, 0.2)",
        } as CSSProperties,
        pointerIcon: <ClipboardCheck size={18} className="text-emerald-400" />,
        accentColor: "#10b981",
      },
      {
        id: "nurse",
        title: "Nurse",
        menuItems: [
          { label: "Vital alert", type: "vital", showComment: true },
          { label: "Med update", type: "medication", showComment: true },
          { label: "Flag urgent", type: "urgent", showComment: false },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#1e1b4b",
          "--anyclick-menu-border": "#818cf8",
          "--anyclick-menu-text": "#e0e7ff",
          "--anyclick-menu-hover": "#312e81",
          "--anyclick-menu-accent": "#818cf8",
          backgroundColor: "#1e1b4b",
          border: "1px solid #818cf8",
          borderRadius: 6,
          boxShadow: "0 0 16px rgba(129, 140, 248, 0.2)",
        } as CSSProperties,
        pointerIcon: <HeartPulse size={18} className="text-indigo-400" />,
        accentColor: "#818cf8",
      },
      {
        id: "admin",
        title: "Admin",
        menuItems: [
          { label: "Compliance note", type: "compliance", showComment: true },
          { label: "Audit flag", type: "audit", showComment: false },
          { label: "Report issue", type: "report", showComment: true },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#0f172a",
          "--anyclick-menu-border": "#64748b",
          "--anyclick-menu-text": "#e2e8f0",
          "--anyclick-menu-hover": "#1e293b",
          "--anyclick-menu-accent": "#64748b",
          backgroundColor: "#0f172a",
          border: "1px solid #64748b",
          borderRadius: 4,
          boxShadow: "0 0 12px rgba(100, 116, 139, 0.15)",
        } as CSSProperties,
        pointerIcon: <ShieldCheck size={18} className="text-slate-400" />,
        accentColor: "#64748b",
      },
    ],
  },

  // Medical Billing
  {
    id: "billing",
    title: "Medical Billing",
    tagline: "Claims, coding, denials, appeals",
    trackColor: "from-blue-500/5 via-blue-500/10 to-blue-500/5",
    roles: [
      {
        id: "coder",
        title: "Coder",
        menuItems: [
          { label: "Code mismatch", type: "mismatch", showComment: true },
          { label: "Missing info", type: "missing", showComment: true },
          { label: "Flag review", type: "review", showComment: false },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#0c0a09",
          "--anyclick-menu-border": "#3b82f6",
          "--anyclick-menu-text": "#dbeafe",
          "--anyclick-menu-hover": "#1c1917",
          "--anyclick-menu-accent": "#3b82f6",
          backgroundColor: "#0c0a09",
          border: "1px solid #3b82f6",
          borderRadius: 2,
          boxShadow: "0 0 16px rgba(59, 130, 246, 0.2)",
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
        } as CSSProperties,
        pointerIcon: <Code2 size={18} className="text-blue-500" />,
        accentColor: "#3b82f6",
      },
      {
        id: "claims",
        title: "Claims",
        menuItems: [
          { label: "Denial appeal", type: "appeal", showComment: true },
          { label: "Resubmit", type: "resubmit", showComment: false },
          { label: "Note payer", type: "payer", showComment: true },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#14532d",
          "--anyclick-menu-border": "#22c55e",
          "--anyclick-menu-text": "#dcfce7",
          "--anyclick-menu-hover": "#166534",
          "--anyclick-menu-accent": "#22c55e",
          backgroundColor: "#14532d",
          border: "1px solid #22c55e",
          borderRadius: 6,
          boxShadow: "0 0 16px rgba(34, 197, 94, 0.2)",
        } as CSSProperties,
        pointerIcon: <Receipt size={18} className="text-green-400" />,
        accentColor: "#22c55e",
      },
    ],
  },

  // Social Media Management
  {
    id: "social",
    title: "Social Media",
    tagline: "Content, engagement, analytics, scheduling",
    trackColor: "from-pink-500/5 via-pink-500/10 to-pink-500/5",
    roles: [
      {
        id: "creator",
        title: "Creator",
        menuItems: [
          { label: "Save asset", type: "save", showComment: false },
          { label: "Edit request", type: "edit", showComment: true },
          { label: "Approve post", type: "approve", showComment: false },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "rgba(236, 72, 153, 0.1)",
          "--anyclick-menu-border": "rgba(236, 72, 153, 0.3)",
          "--anyclick-menu-text": "#fdf2f8",
          "--anyclick-menu-hover": "rgba(236, 72, 153, 0.2)",
          "--anyclick-menu-accent": "#ec4899",
          background:
            "linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.1))",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(236, 72, 153, 0.25)",
          borderRadius: 14,
          boxShadow: "0 0 20px rgba(236, 72, 153, 0.15)",
        } as CSSProperties,
        pointerIcon: <ImagePlus size={18} className="text-pink-400" />,
        accentColor: "#ec4899",
      },
      {
        id: "community",
        title: "Community",
        menuItems: [
          { label: "Flag comment", type: "flag", showComment: true },
          { label: "Quick reply", type: "reply", showComment: true },
          { label: "Report user", type: "report", showComment: true },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#1f2937",
          "--anyclick-menu-border": "#f472b6",
          "--anyclick-menu-text": "#fce7f3",
          "--anyclick-menu-hover": "#374151",
          "--anyclick-menu-accent": "#f472b6",
          backgroundColor: "#1f2937",
          border: "1px solid #f472b6",
          borderRadius: 10,
          boxShadow: "0 0 16px rgba(244, 114, 182, 0.15)",
        } as CSSProperties,
        pointerIcon: <Users size={18} className="text-pink-300" />,
        accentColor: "#f472b6",
      },
      {
        id: "analyst",
        title: "Analyst",
        menuItems: [
          { label: "Export data", type: "export", showComment: false },
          { label: "Anomaly flag", type: "anomaly", showComment: true },
          { label: "Add to report", type: "report", showComment: false },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#0f172a",
          "--anyclick-menu-border": "#38bdf8",
          "--anyclick-menu-text": "#e0f2fe",
          "--anyclick-menu-hover": "#1e293b",
          "--anyclick-menu-accent": "#38bdf8",
          backgroundColor: "#0f172a",
          border: "1px solid #38bdf8",
          borderRadius: 4,
          boxShadow: "0 0 16px rgba(56, 189, 248, 0.15)",
          fontFamily: "ui-monospace, monospace",
        } as CSSProperties,
        pointerIcon: <TrendingUp size={18} className="text-sky-400" />,
        accentColor: "#38bdf8",
      },
    ],
  },

  // Browser Automation / Extensions
  {
    id: "automation",
    title: "Browser Automation",
    tagline: "Chrome extensions, scraping, workflows",
    trackColor: "from-orange-500/5 via-orange-500/10 to-orange-500/5",
    roles: [
      {
        id: "power-user",
        title: "Power User",
        menuItems: [
          { label: "Record action", type: "record", showComment: false },
          { label: "Add to flow", type: "flow", showComment: false },
          { label: "Extract data", type: "extract", showComment: false },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#18181b",
          "--anyclick-menu-border": "#f97316",
          "--anyclick-menu-text": "#fed7aa",
          "--anyclick-menu-hover": "#27272a",
          "--anyclick-menu-accent": "#f97316",
          backgroundColor: "#18181b",
          border: "1px solid #f97316",
          borderRadius: 6,
          boxShadow: "0 0 16px rgba(249, 115, 22, 0.2)",
        } as CSSProperties,
        pointerIcon: <Zap size={18} className="text-orange-500" />,
        accentColor: "#f97316",
      },
      {
        id: "extension-dev",
        title: "Ext. Dev",
        menuItems: [
          { label: "Inspect element", type: "inspect", showComment: false },
          { label: "DOM snapshot", type: "snapshot", showComment: false },
          { label: "Event trace", type: "events", showComment: false },
        ],
        menuStyle: {
          "--anyclick-menu-bg": "#0a0a0a",
          "--anyclick-menu-border": "#eab308",
          "--anyclick-menu-text": "#fef08a",
          "--anyclick-menu-hover": "#171717",
          "--anyclick-menu-accent": "#eab308",
          backgroundColor: "#0a0a0a",
          border: "1px solid #eab308",
          borderRadius: 0,
          boxShadow: "0 0 16px rgba(234, 179, 8, 0.2)",
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
        } as CSSProperties,
        pointerIcon: <Puzzle size={18} className="text-yellow-500" />,
        accentColor: "#eab308",
      },
    ],
  },
];

// =============================================================================
// Role Card Component (compact for horizontal scroll)
// =============================================================================

function RoleCard({
  role,
  workstreamId,
  theme,
}: {
  role: RoleConfig;
  workstreamId: string;
  theme: WorkstreamTheme;
}) {
  return (
    <AnyclickProvider
      adapter={adapter}
      menuItems={role.menuItems}
      metadata={{ role: role.id, workstream: workstreamId }}
      theme={{
        menuStyle: role.menuStyle,
        highlightConfig: {
          enabled: true,
          colors: {
            targetColor: role.accentColor,
            containerColor: `${role.accentColor}40`,
          },
        },
      }}
      header={<></>}
      scoped
    >
      <PointerProvider
        theme={{
          colors: {
            pointerColor: role.accentColor,
            circleColor: `${role.accentColor}60`,
          },
          pointerIcon: role.pointerIcon,
        }}
        config={{
          visibility: "always",
          hideDefaultCursor: true,
        }}
      >
        <div
          className={cn(
            "group relative flex min-w-[140px] flex-col items-center gap-2 rounded-lg p-4",
            "transition-all duration-300 ease-out",
            "hover:scale-[1.02] hover:-translate-y-0.5",
            // Reduced motion fallback
            "motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0",
          )}
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), ${theme.cardGlow || "none"}`,
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget;
            target.style.backgroundColor = theme.cardHoverBg;
            target.style.borderColor = role.accentColor + "30";
            target.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 24px ${role.accentColor}20`;
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget;
            target.style.backgroundColor = theme.cardBg;
            target.style.borderColor = theme.cardBorder;
            target.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.04), ${theme.cardGlow || "none"}`;
          }}
        >
          {/* Icon */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100"
            style={{ backgroundColor: `${role.accentColor}18` }}
          >
            {role.pointerIcon}
          </div>

          {/* Title */}
          <span className="text-sm font-medium text-white">{role.title}</span>

          {/* Menu items preview (tiny) */}
          <div className="flex flex-wrap justify-center gap-1">
            {role.menuItems.slice(0, 2).map((item) => (
              <span
                key={item.type}
                className="rounded px-1.5 py-0.5 text-[10px] transition-colors duration-200"
                style={{
                  backgroundColor: `${role.accentColor}15`,
                  color: role.accentColor,
                }}
              >
                {item.label}
              </span>
            ))}
          </div>

          {/* Right-click hint */}
          <span className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <MousePointer2 size={10} />
            Right-click
          </span>
        </div>
      </PointerProvider>
    </AnyclickProvider>
  );
}

// =============================================================================
// Workstream Lane Component
// =============================================================================

function WorkstreamLane({ workstream }: { workstream: WorkstreamConfig }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const theme = workstreamThemes[workstream.id];

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -200 : 200;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="group/lane relative">
      {/* Lane header */}
      <div className="mb-3 flex items-baseline justify-between px-1">
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: theme.accentColor }}
          >
            {workstream.title}
          </h3>
          <p className="text-xs text-gray-500">{workstream.tagline}</p>
        </div>
        <Link
          href="/examples/role-presets"
          className="text-xs transition-colors hover:opacity-80"
          style={{ color: theme.accentColorLight }}
        >
          See all →
        </Link>
      </div>

      {/* Recessed track container with theme */}
      <div
        className={cn(
          "relative rounded-xl overflow-hidden",
          // Animation class (respects reduced-motion via CSS)
          theme.animationClass,
        )}
        style={{
          background: theme.trackBg || theme.trackGradient,
          boxShadow: theme.trackShadow,
          border: `1px solid ${theme.trackBorder}`,
        }}
      >
        {/* Animated overlay for specific themes */}
        {theme.animation === "shimmer" && (
          <div
            className="pointer-events-none absolute inset-0 opacity-30 motion-reduce:hidden"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.1) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 8s ease-in-out infinite",
            }}
          />
        )}
        {theme.animation === "flow" && (
          <div
            className="pointer-events-none absolute inset-0 opacity-40 motion-reduce:hidden"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(245, 158, 11, 0.08) 30%, rgba(251, 191, 36, 0.12) 50%, rgba(245, 158, 11, 0.08) 70%, transparent 100%)",
              backgroundSize: "300% 100%",
              animation: "flow 12s linear infinite",
            }}
          />
        )}
        {theme.animation === "pulse" && (
          <div
            className="pointer-events-none absolute inset-0 opacity-25 motion-reduce:hidden"
            style={{
              background: `radial-gradient(ellipse at center, ${theme.accentColorLight} 0%, transparent 70%)`,
              animation: "healthcarePulse 4s ease-in-out infinite",
            }}
          />
        )}
        {theme.animation === "dots" && (
          <div
            className="pointer-events-none absolute inset-0 opacity-20 motion-reduce:hidden"
            style={{
              backgroundImage: `radial-gradient(circle, ${theme.accentColor}30 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
              animation: "dotsDrift 20s linear infinite",
            }}
          />
        )}
        {theme.animation === "twinkle" && (
          <div
            className="pointer-events-none absolute inset-0 motion-reduce:hidden"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(236, 72, 153, 0.3) 0%, transparent 8%),
                radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.25) 0%, transparent 10%),
                radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 6%),
                radial-gradient(circle at 30% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 8%)
              `,
              animation: "twinkle 6s ease-in-out infinite",
            }}
          />
        )}
        {theme.animation === "circuit" && (
          <div
            className="pointer-events-none absolute inset-0 opacity-15 motion-reduce:hidden"
            style={{
              backgroundImage: `
                linear-gradient(90deg, ${theme.accentColor}20 1px, transparent 1px),
                linear-gradient(0deg, ${theme.accentColor}15 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
              animation: "circuitPulse 3s ease-in-out infinite",
            }}
          />
        )}

        {/* Scroll buttons - tinted to lane accent */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-r-lg p-1.5 opacity-0 backdrop-blur-sm transition-all duration-200 hover:scale-110 group-hover/lane:opacity-100 motion-reduce:hover:scale-100"
          style={{
            backgroundColor: `${theme.accentColor}20`,
            color: theme.accentColor,
            border: `1px solid ${theme.accentColor}30`,
            borderLeft: "none",
          }}
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-l-lg p-1.5 opacity-0 backdrop-blur-sm transition-all duration-200 hover:scale-110 group-hover/lane:opacity-100 motion-reduce:hover:scale-100"
          style={{
            backgroundColor: `${theme.accentColor}20`,
            color: theme.accentColor,
            border: `1px solid ${theme.accentColor}30`,
            borderRight: "none",
          }}
          aria-label="Scroll right"
        >
          <ChevronRight size={16} />
        </button>

        {/* Scrollable role cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth px-4 py-4 scrollbar-none"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {workstream.roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              workstreamId={workstream.id}
              theme={theme}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Showcase Component
// =============================================================================

export function WorkstreamShowcase({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {workstreams.map((workstream) => (
        <WorkstreamLane key={workstream.id} workstream={workstream} />
      ))}

      {/* Extensibility callout */}
      <div className="mt-8 rounded-xl border border-white/5 bg-white/1 p-4 text-center">
        <p className="text-sm text-gray-400">
          <span className="text-white font-medium">Extensible by design</span> —
          Build custom workstreams for any industry. Context menus, pointers,
          and adapters are all configurable.
        </p>
        <Link
          href="/docs/getting-started"
          className="mt-2 inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          Learn how to customize
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}
