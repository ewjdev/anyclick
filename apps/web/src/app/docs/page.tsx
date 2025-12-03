import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  MousePointerClick,
  Camera,
  GitBranch,
  Terminal,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Learn how to integrate anyclick into your application for seamless UI feedback capture.",
};

export default function DocsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="not-prose mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Documentation
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          anyclick is a modular UI feedback system that captures DOM context,
          screenshots, and integrates with GitHub Issues or AI coding agents
          like Cursor.
        </p>
      </div>

      {/* What is anyclick */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">What is anyclick?</h2>
        <p className="text-gray-400 mb-6 leading-relaxed">
          anyclick lets users right-click any element in your application to
          submit feedback with full context. The system captures:
        </p>
        <ul className="space-y-3">
          {[
            {
              icon: MousePointerClick,
              text: "CSS selectors, data attributes, and DOM hierarchy",
            },
            {
              icon: Camera,
              text: "Screenshots of the element, container, and full page",
            },
            {
              icon: GitBranch,
              text: "Page URL, viewport size, and user metadata",
            },
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-gray-300">
              <item.icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              {item.text}
            </li>
          ))}
        </ul>
      </section>

      {/* Architecture */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Architecture</h2>
        <p className="text-gray-400 mb-6 leading-relaxed">
          anyclick is built as a monorepo with modular packages. Each package
          has a single responsibility, making it easy to pick only what you
          need.
        </p>

        <div className="grid gap-4">
          {[
            {
              name: "@ewjdev/anyclick-core",
              description:
                "Framework-agnostic core library with DOM capture, payload building, and screenshot utilities.",
              color: "violet",
            },
            {
              name: "@ewjdev/anyclick-react",
              description:
                "React provider and context menu UI. Drop-in component that handles all UI and event management.",
              color: "cyan",
            },
            {
              name: "@ewjdev/anyclick-github",
              description:
                "GitHub Issues integration. HTTP adapter for browser + server-side GitHub API client.",
              color: "emerald",
            },
            {
              name: "@ewjdev/anyclick-cursor",
              description:
                "Cursor Cloud Agent adapter. Launch AI coding agents from feedback payloads.",
              color: "amber",
            },
            {
              name: "@ewjdev/anyclick-cursor-local",
              description:
                "Local Cursor CLI adapter. Run cursor-agent locally during development.",
              color: "rose",
            },
          ].map((pkg) => (
            <div
              key={pkg.name}
              className={`p-4 rounded-xl border bg-${pkg.color}-500/5 border-${pkg.color}-500/20`}
              style={{
                backgroundColor: `rgb(var(--color-${pkg.color}-500) / 0.05)`,
                borderColor: `rgb(var(--color-${pkg.color}-500) / 0.2)`,
              }}
            >
              <code className={`text-sm font-mono text-${pkg.color}-400`}>
                {pkg.name}
              </code>
              <p className="text-gray-400 text-sm mt-1">{pkg.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/docs/getting-started"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-violet-400" />
              <h3 className="font-semibold">Getting Started</h3>
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-gray-400 text-sm">
              Install and configure anyclick in under 5 minutes.
            </p>
          </Link>

          <Link
            href="/docs/core"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <MousePointerClick className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold">Core Library</h3>
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-gray-400 text-sm">
              Learn about the core API and types.
            </p>
          </Link>

          <Link
            href="/docs/react"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold">React Provider</h3>
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-gray-400 text-sm">
              Integrate with React using the FeedbackProvider.
            </p>
          </Link>

          <Link
            href="/docs/adapters"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold">Adapters</h3>
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-gray-400 text-sm">
              Connect to GitHub, Cursor, or build your own adapter.
            </p>
          </Link>
        </div>
      </section>

      {/* Feedback types */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Built-in Feedback Types</h2>
        <p className="text-gray-400 mb-6 leading-relaxed">
          anyclick comes with three built-in feedback types, but you can
          customize or extend them:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 font-medium text-gray-300">
                  Type
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">
                  Label
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-3 px-4">
                  <code className="text-cyan-400">issue</code>
                </td>
                <td className="py-3 px-4 text-gray-400">Report an issue</td>
                <td className="py-3 px-4 text-gray-400">
                  For bugs and problems
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">
                  <code className="text-cyan-400">feature</code>
                </td>
                <td className="py-3 px-4 text-gray-400">Request a feature</td>
                <td className="py-3 px-4 text-gray-400">
                  For enhancement requests
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">
                  <code className="text-cyan-400">like</code>
                </td>
                <td className="py-3 px-4 text-gray-400">I like this!</td>
                <td className="py-3 px-4 text-gray-400">
                  For positive feedback
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Next steps */}
      <section className="not-prose">
        <div className="p-6 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
          <h3 className="font-semibold mb-2">Ready to get started?</h3>
          <p className="text-gray-400 text-sm mb-4">
            Follow our step-by-step guide to integrate anyclick into your
            application.
          </p>
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
          >
            Getting Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}
