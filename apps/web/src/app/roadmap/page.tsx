import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BarChart3,
  Clock,
  Shield,
  Telescope,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Upcoming notifications and dashboard experiences for anyclick's error handling.",
};

const sections = [
  {
    title: "Short-term (next up)",
    icon: BellRing,
    color: "from-amber-500/10 to-transparent border-amber-500/20",
    bullets: [
      "Notification suite: Toast → Banner → Inline → Indicator with a shared NotificationContainer",
      "A11y-first UX: focus management, ARIA labels, reduced-motion, theme hooks",
      "Noise controls: coalescing identical errors, per-severity rate limits, dismissal persistence",
      "Configurable timeouts, placement, mobile-safe spacing, z-index and overlap rules",
    ],
  },
  {
    title: "Mid-term",
    icon: BarChart3,
    color: "from-cyan-500/10 to-transparent border-cyan-500/20",
    bullets: [
      "Self-hostable error dashboard with grouping, filters, and screenshot/DOM context excerpts",
      "Project-scoped auth: API keys for ingest + session auth for dashboard, audit logs for admin actions",
      "Alerting: signed webhooks with retry/backoff, threshold triggers, and muted periods",
    ],
  },
  {
    title: "Later",
    icon: Telescope,
    color: "from-violet-500/10 to-transparent border-violet-500/20",
    bullets: [
      "Slack/Jira/Linear connectors, SSO options, release mapping for source-map lookups",
      "Analytics: trend views, cohorts by release/environment, regression detection, RUM sampling knobs",
      "Dashboard polish: saved views, sharable links with redaction, light/dark themes, multi-tenant separation",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] via-[#0a0a0f] to-[#1a0a2e]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <header className="border-b border-white/5 backdrop-blur-xl bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Roadmap
              </p>
              <h1 className="text-xl font-semibold">Error handling UX</h1>
            </div>
          </div>
          <Link
            href="https://github.com/ewjdev/anyclick/blob/main/docs/roadmap.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium transition-colors"
          >
            View full roadmap
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <section className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
              <Clock className="w-4 h-4" />
              Highlights
            </div>
            <h2 className="text-3xl font-bold leading-tight">
              What&apos;s coming for notifications and the dashboard
            </h2>
            <p className="text-gray-400 max-w-3xl">
              The core error ingest plan stays focused on fidelity, reliability,
              and privacy. This roadmap tracks the UX layers we&apos;ll ship on
              top: in-app notifications for captured errors and a self-hostable
              dashboard to triage them.
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className={`p-6 rounded-2xl bg-gradient-to-br ${section.color} border text-gray-100`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-200">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 block h-2 w-2 rounded-full bg-white/50 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
