import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Terminal, FileCode, Box } from "lucide-react";

export const metadata: Metadata = {
  title: "Getting Started",
  description:
    "Learn how to install and configure anyclick in your application.",
};

function CodeBlock({
  children,
  filename,
  language = "typescript",
}: {
  children: string;
  filename?: string;
  language?: string;
}) {
  return (
    <div className="rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden my-6">
      {filename && (
        <div className="px-4 py-2 border-b border-white/5 text-xs text-gray-500 font-mono flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5" />
          {filename}
        </div>
      )}
      <pre className="p-4 text-sm font-mono overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function TerminalBlock({ children }: { children: string }) {
  return (
    <div className="rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden my-6">
      <div className="px-4 py-2 border-b border-white/5 text-xs text-gray-500 font-mono flex items-center gap-2">
        <Terminal className="w-3.5 h-3.5" />
        Terminal
      </div>
      <pre className="p-4 text-sm font-mono overflow-x-auto">
        <code className="text-gray-300">{children}</code>
      </pre>
    </div>
  );
}

export default function GettingStartedPage() {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="not-prose mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Getting Started
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Get anyclick running in your React application in under 5 minutes.
        </p>
      </div>

      {/* Prerequisites */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Prerequisites</h2>
        <ul className="space-y-2">
          {[
            "Node.js 18.18.0 or later",
            "React 19+ application (Next.js 14+, Vite, etc.)",
            "GitHub repository (for GitHub Issues integration)",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Step 1: Installation */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Step 1: Install Packages</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Install the core packages you need. For a typical React + GitHub
          setup:
        </p>
        <TerminalBlock>{`npm install @ewjdev/anyclick-react @ewjdev/anyclick-github`}</TerminalBlock>

        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 mt-6">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Box className="w-4 h-4 text-violet-400" />
            Package Overview
          </h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>
              <code className="text-violet-300">@ewjdev/anyclick-react</code> –
              React provider and UI components
            </li>
            <li>
              <code className="text-violet-300">@ewjdev/anyclick-github</code> –
              GitHub Issues adapter
            </li>
            <li>
              <code className="text-violet-300">@ewjdev/anyclick-core</code> –
              Automatically included as a dependency
            </li>
          </ul>
        </div>
      </section>

      {/* Step 2: Environment Variables */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">
          Step 2: Set Up Environment Variables
        </h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Create a GitHub Personal Access Token with{" "}
          <code className="text-cyan-400">repo</code> scope and add it to your
          environment:
        </p>
        <CodeBlock filename=".env.local">{`GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO=your-username/your-repo-name`}</CodeBlock>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-6">
          <h4 className="font-semibold text-sm mb-2">⚠️ Security Note</h4>
          <p className="text-sm text-gray-400">
            Never expose your GitHub token to the browser. The token should only
            be used server-side in your API route.
          </p>
        </div>
      </section>

      {/* Step 3: API Route */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Step 3: Create an API Route</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Create a server-side API route that receives feedback and creates
          GitHub Issues:
        </p>
        <CodeBlock filename="app/api/feedback/route.ts">{`import { createGitHubAdapter } from '@ewjdev/anyclick-github/server';
import type { FeedbackPayload } from '@ewjdev/anyclick-core';

const repoName = process.env.GITHUB_REPO!;
const [owner, repo] = repoName.split("/");

const github = createGitHubAdapter({
  owner,
  repo,
  token: process.env.GITHUB_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const payload: FeedbackPayload = await request.json();
    const result = await github.submit(payload);
    
    return Response.json(result);
  } catch (error) {
    console.error('Feedback submission failed:', error);
    return Response.json(
      { success: false, error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}`}</CodeBlock>
      </section>

      {/* Step 4: Provider Setup */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Step 4: Add the Provider</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Wrap your application with the{" "}
          <code className="text-cyan-400">FeedbackProvider</code>:
        </p>
        <CodeBlock filename="app/providers.tsx">{`'use client';

import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';
import type { ReactNode } from 'react';

const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FeedbackProvider adapter={adapter}>
      {children}
    </FeedbackProvider>
  );
}`}</CodeBlock>

        <p className="text-gray-400 mb-4 leading-relaxed mt-6">
          Then use the provider in your layout:
        </p>
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
      </section>

      {/* Step 5: Test */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Step 5: Test It Out</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Start your development server and right-click any element in your app:
        </p>
        <TerminalBlock>{`npm run dev`}</TerminalBlock>

        <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mt-6">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            You&apos;re all set!
          </h4>
          <p className="text-sm text-gray-400">
            Right-click any element, select a feedback type, add a comment, and
            submit. A new GitHub Issue will be created with all the captured
            context.
          </p>
        </div>
      </section>

      {/* Configuration Options */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Configuration Options</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          The <code className="text-cyan-400">FeedbackProvider</code> accepts
          several configuration options:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 font-medium text-gray-300">
                  Prop
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">
                  Type
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-3 px-4">
                  <code className="text-cyan-400">adapter</code>
                </td>
                <td className="py-3 px-4 text-gray-400">FeedbackAdapter</td>
                <td className="py-3 px-4 text-gray-400">
                  Required. The adapter for submitting feedback.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">
                  <code className="text-cyan-400">menuItems</code>
                </td>
                <td className="py-3 px-4 text-gray-400">FeedbackMenuItem[]</td>
                <td className="py-3 px-4 text-gray-400">
                  Custom menu items (default: issue, feature, like)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">
                  <code className="text-cyan-400">metadata</code>
                </td>
                <td className="py-3 px-4 text-gray-400">
                  Record&lt;string, unknown&gt;
                </td>
                <td className="py-3 px-4 text-gray-400">
                  Additional data to include with every submission
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">
                  <code className="text-cyan-400">highlightConfig</code>
                </td>
                <td className="py-3 px-4 text-gray-400">HighlightConfig</td>
                <td className="py-3 px-4 text-gray-400">
                  Configure element highlighting behavior
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">
                  <code className="text-cyan-400">screenshotConfig</code>
                </td>
                <td className="py-3 px-4 text-gray-400">ScreenshotConfig</td>
                <td className="py-3 px-4 text-gray-400">
                  Configure screenshot capture settings
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">
                  <code className="text-cyan-400">disabled</code>
                </td>
                <td className="py-3 px-4 text-gray-400">boolean</td>
                <td className="py-3 px-4 text-gray-400">
                  Disable feedback capture entirely
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Next steps */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold mb-6">Next Steps</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/docs/react"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all"
          >
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              React Provider
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-gray-400 text-sm">
              Learn about all provider props and customization options.
            </p>
          </Link>

          <Link
            href="/docs/adapters"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all"
          >
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              Adapters
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-gray-400 text-sm">
              Connect to Cursor AI agents or build custom adapters.
            </p>
          </Link>

          <Link
            href="/examples"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all"
          >
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              Examples
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-gray-400 text-sm">
              See anyclick in action with interactive examples.
            </p>
          </Link>

          <Link
            href="/docs/core"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all"
          >
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              Core Library
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-gray-400 text-sm">
              Deep dive into the core API and build custom integrations.
            </p>
          </Link>
        </div>
      </section>
    </article>
  );
}
