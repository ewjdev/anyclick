import type { Metadata } from "next";
import Link from "next/link";
import {
  Box,
  Palette,
  GitBranch,
  Terminal,
  ArrowRight,
  Sparkles,
  Shield,
  MousePointer2,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Examples",
  description:
    "Interactive examples showcasing anyclick feedback capture capabilities.",
};

const examples = [
  {
    title: "Basic Setup",
    description:
      "Minimal implementation with default configuration. Perfect starting point for new integrations.",
    href: "/examples/basic",
    icon: Box,
    color: "violet",
    tags: ["React", "Provider", "Default Menu"],
  },
  {
    title: "Custom Pointer",
    description:
      "Replace the default cursor with a beautiful themed pointer. Includes right-click circle animation and press effects.",
    href: "/examples/custom-pointer",
    icon: MousePointer2,
    color: "rose",
    tags: ["Cursor", "Animation", "Theming", "CSS"],
  },
  {
    title: "Custom Menu",
    description:
      "Customized context menu with branded colors, icons, and role-based menu items.",
    href: "/examples/custom-menu",
    icon: Palette,
    color: "cyan",
    tags: ["Theming", "Icons", "Submenus", "Role-Based"],
  },
  {
    title: "GitHub Integration",
    description:
      "Full GitHub Issues integration with automatic issue creation and screenshot uploads.",
    href: "/examples/github-integration",
    icon: GitBranch,
    color: "emerald",
    tags: ["GitHub", "Issues", "Screenshots", "Markdown"],
  },
  {
    title: "Cursor Local",
    description:
      "Development workflow with local Cursor integration for instant AI-powered code fixes.",
    href: "/examples/cursor-local",
    icon: Terminal,
    color: "amber",
    tags: ["Cursor", "Development", "AI", "Local"],
  },
  {
    title: "Sensitive Masking",
    description:
      "Automatic masking of passwords, credit cards, and other sensitive data in screenshots.",
    href: "/examples/sensitive-masking",
    icon: Shield,
    color: "emerald",
    tags: ["Privacy", "Security", "Screenshots", "Masking"],
  },
  {
    title: "Scoped & Nested Providers",
    description:
      "Control feedback capture at a granular level with scoped providers and nested theming.",
    href: "/examples/scoped-providers",
    icon: Layers,
    color: "fuchsia",
    tags: ["Scoped", "Nested", "Theming", "Advanced"],
  },
];

export default function ExamplesPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Examples
          </h1>
        </div>
        <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
          Explore these interactive examples to see anyclick in action. Each
          example demonstrates different features and configuration options.
        </p>
      </div>

      {/* Try it callout */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-emerald-500/10 border border-violet-500/20 mb-12">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold mb-2">Try it on this page!</h2>
            <p className="text-gray-400 text-sm">
              This entire documentation site uses anyclick. Right-click any
              element to see the feedback menu in action. The feedback is
              connected to our GitHub repository.
            </p>
          </div>
        </div>
      </div>

      {/* Examples Grid */}
      <div className="grid gap-6">
        {examples.map((example) => {
          const Icon = example.icon;
          return (
            <Link
              key={example.href}
              href={example.href}
              className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}
                  style={{
                    background: `linear-gradient(135deg, rgb(var(--color-${example.color}-500) / 0.2), rgb(var(--color-${example.color}-500) / 0.05))`,
                  }}
                >
                  <Icon className={`w-6 h-6 text-${example.color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg font-semibold">{example.title}</h2>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    {example.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {example.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Custom Examples CTA */}
      <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
        <h3 className="font-semibold mb-2">Need a specific example?</h3>
        <p className="text-gray-400 text-sm mb-4">
          If you&apos;d like to see an example for a specific use case, open an
          issue on GitHub or contribute your own example.
        </p>
        <div className="flex gap-4">
          <a
            href="https://github.com/ewjdev/anyclick/issues/new"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Request Example
          </a>
          <a
            href="https://github.com/ewjdev/anyclick/blob/main/CONTRIBUTING.md"
            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white text-sm font-medium transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contribute
          </a>
        </div>
      </div>
    </div>
  );
}
