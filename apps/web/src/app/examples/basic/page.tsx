import { CodeBlock } from "@/components/CodePreview";
import { ArrowRight, Check, MousePointerClick } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BasicDemoArea } from "./BasicDemoArea";

export const metadata: Metadata = {
  title: "Basic Setup Example",
  description: "Minimal anyclick implementation with default configuration.",
};

export default function BasicExamplePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Basic Setup</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Basic Setup
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          The simplest possible anyclick implementation. Uses default menu items
          and minimal configuration.
        </p>
      </div>

      {/* Demo Area */}
      <BasicDemoArea />

      {/* What you get */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">What You Get</h2>
        <ul className="space-y-3">
          {[
            "Right-click context menu on any element",
            "Three default feedback types: Issue, Feature, Like",
            "Full DOM context capture (selector, text, HTML)",
            "Page context (URL, viewport, timestamp)",
            "Optional comment field",
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
          1. Create the Provider
        </h3>
        <CodeBlock
          filename="app/providers.tsx"
          language="tsx"
          code={`'use client';

import { AnyclickProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

// Create adapter pointing to your API
const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
});

export function Providers({ children }: { children: React.ReactNode }) {
  // That's it! Default menu items are automatically included
  return (
    <AnyclickProvider adapter={adapter}>
      {children}
    </AnyclickProvider>
  );
}`}
        />

        <h3 className="text-lg font-semibold mb-3 mt-8">2. Wrap Your App</h3>
        <CodeBlock
          filename="app/layout.tsx"
          language="tsx"
          code={`import { Providers } from './providers';

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
}`}
        />

        <h3 className="text-lg font-semibold mb-3 mt-8">3. Create API Route</h3>
        <CodeBlock
          filename="app/api/feedback/route.ts"
          language="typescript"
          code={`import { createGitHubAdapter } from '@ewjdev/anyclick-github/server';
import type { AnyclickPayload } from '@ewjdev/anyclick-core';

const repoName = process.env.GITHUB_REPO!;
const [owner, repo] = repoName.split("/");

const github = createGitHubAdapter({
  owner,
  repo,
  token: process.env.GITHUB_TOKEN!,
});

export async function POST(request: Request) {
  const payload: AnyclickPayload = await request.json();
  const result = await github.createIssue(payload);
  return Response.json(result);
}`}
        />
      </div>

      {/* Default Menu Items */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Default Menu Items</h2>
        <p className="text-gray-400 mb-4">
          When no <code className="text-cyan-400">menuItems</code> prop is
          provided, these defaults are used:
        </p>
        <CodeBlock
          language="typescript"
          code={`const defaultMenuItems = [
  { type: 'issue', label: 'Report an issue', showComment: true },
  { type: 'feature', label: 'Request a feature', showComment: true },
  { type: 'like', label: 'I like this!', showComment: false },
];`}
        />
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-xl bg-linear-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <h3 className="font-semibold mb-2">Ready for more?</h3>
        <p className="text-gray-400 text-sm mb-4">
          Check out the custom menu example to learn how to customize the
          feedback menu with your own branding, icons, and role-based items.
        </p>
        <Link
          href="/examples/custom-menu"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
        >
          Custom Menu Example
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
