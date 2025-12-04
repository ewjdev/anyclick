import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Monitor,
  Zap,
  FolderOpen,
} from "lucide-react";
import { CodeBlock, TerminalBlock } from "@/components/CodePreview";

export const metadata: Metadata = {
  title: "Cursor Local Example",
  description:
    "Development workflow with local Cursor integration for instant AI-powered code fixes.",
};

export default function CursorLocalPage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Cursor Local</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Cursor Local Workflow
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Integrate anyclick with Cursor&apos;s local CLI for instant AI-powered
          code fixes during development.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-500/20">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          How It Works
        </h2>
        <ol className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm flex-shrink-0">
              1
            </span>
            <span className="text-gray-300">
              Right-click an element and select &quot;Fix with Cursor&quot;
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm flex-shrink-0">
              2
            </span>
            <span className="text-gray-300">
              Feedback is sent to a local server running on your machine
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm flex-shrink-0">
              3
            </span>
            <span className="text-gray-300">
              Server saves feedback to a file and invokes cursor-agent
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm flex-shrink-0">
              4
            </span>
            <span className="text-gray-300">
              Cursor AI analyzes the context and proposes a fix
            </span>
          </li>
        </ol>
      </div>

      {/* Installation */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Installation</h2>
        <TerminalBlock>{`npm install @ewjdev/anyclick-cursor-local`}</TerminalBlock>
      </div>

      {/* Start the Server */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">1. Start the Local Server</h2>
        <p className="text-gray-400 mb-4">
          The local adapter requires a server to receive feedback. Add a script
          to your package.json:
        </p>
        <CodeBlock filename="package.json">{`{
  "scripts": {
    "feedback-server": "anyclick-local-server",
    "dev": "concurrently \\"npm run feedback-server\\" \\"next dev\\""
  }
}`}</CodeBlock>

        <p className="text-gray-400 mb-4">Start the server:</p>
        <TerminalBlock>{`npm run feedback-server

# Output:
# 🚀 anyclick local server running on http://localhost:3847
# 📁 Feedback files will be saved to: .feedback/
# 🔧 Cursor integration: enabled`}</TerminalBlock>
      </div>

      {/* Configure Provider */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">2. Configure the Provider</h2>
        <p className="text-gray-400 mb-4">
          Set up the local adapter for development mode:
        </p>
        <CodeBlock filename="app/providers.tsx">{`'use client';

import { FeedbackProvider, filterMenuItemsByRole } from '@ewjdev/anyclick-react';
import type { FeedbackMenuItem } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';
import { createLocalAdapter } from '@ewjdev/anyclick-cursor-local';
import { Monitor, Cloud, Bug, Lightbulb } from 'lucide-react';

// Production adapter (GitHub)
const githubAdapter = createHttpAdapter({
  endpoint: '/api/feedback',
});

// Development adapter (local Cursor)
const localAdapter = createLocalAdapter({
  serverUrl: 'http://localhost:3847',
  // Path to your project (for Cursor to open)
  projectPath: process.cwd(),
});

// Choose adapter based on environment
const isDev = process.env.NODE_ENV === 'development';

// Menu items with Cursor options
const menuItems: FeedbackMenuItem[] = [
  { type: 'bug', label: 'Report Bug', icon: <Bug className="w-4 h-4" />, showComment: true },
  { type: 'feature', label: 'Suggest Feature', icon: <Lightbulb className="w-4 h-4" />, showComment: true },
  // Cursor options (dev only)
  ...(isDev ? [{
    type: 'cursor_menu' as const,
    label: 'Fix with Cursor',
    children: [
      { 
        type: 'cursor_local' as const, 
        label: 'Fix Locally', 
        icon: <Monitor className="w-4 h-4" />,
        showComment: true,
      },
      { 
        type: 'cursor_cloud' as const, 
        label: 'Fix with Cloud Agent', 
        icon: <Cloud className="w-4 h-4" />,
        showComment: true,
      },
    ],
  }] : []),
];

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider 
      adapter={isDev ? localAdapter : githubAdapter}
      menuItems={menuItems}
    >
      {children}
    </FeedbackProvider>
  );
}`}</CodeBlock>
      </div>

      {/* Multi-Adapter Setup */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          3. Multi-Adapter Setup (Optional)
        </h2>
        <p className="text-gray-400 mb-4">
          Route different feedback types to different adapters:
        </p>
        <CodeBlock filename="app/providers.tsx">{`import type { FeedbackAdapter, FeedbackPayload } from '@ewjdev/anyclick-core';

// Create a router adapter
function createRoutingAdapter(config: {
  local: FeedbackAdapter;
  github: FeedbackAdapter;
}): FeedbackAdapter {
  return {
    async submit(payload: FeedbackPayload) {
      // Route Cursor types to local adapter
      if (payload.type === 'cursor_local' || payload.type === 'cursor_cloud') {
        return config.local.submit(payload);
      }
      
      // Route everything else to GitHub
      return config.github.submit(payload);
    },
  };
}

const adapter = createRoutingAdapter({
  local: localAdapter,
  github: githubAdapter,
});

<FeedbackProvider adapter={adapter} menuItems={menuItems}>
  {children}
</FeedbackProvider>`}</CodeBlock>
      </div>

      {/* Server Configuration */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Server Configuration</h2>
        <p className="text-gray-400 mb-4">
          Customize the local server behavior:
        </p>
        <CodeBlock filename="anyclick.config.js">{`module.exports = {
  // Server port (default: 3847)
  port: 3847,
  
  // Directory to save feedback files
  outputDir: '.feedback',
  
  // Cursor CLI command (if not in PATH)
  cursorPath: '/Applications/Cursor.app/Contents/MacOS/Cursor',
  
  // Custom handler when feedback is received
  onFeedback: async (payload, filePath) => {
    console.log(\`Feedback saved to: \${filePath}\`);
    
    // Optional: trigger custom actions
    // await sendSlackNotification(payload);
  },
  
  // Format the AI prompt
  formatPrompt: (payload) => {
    return \`
Fix the following issue in the codebase:

## Problem
\${payload.comment || 'User reported an issue with this element'}

## Element
- Selector: \${payload.element.selector}
- Text: \${payload.element.innerText}

## Location
- URL: \${payload.page.url}

Please analyze the code and propose a fix.
    \`;
  },
  
  // CORS configuration
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
  },
};`}</CodeBlock>
      </div>

      {/* Feedback File Format */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Generated Feedback Files</h2>
        <p className="text-gray-400 mb-4">
          The server saves feedback as JSON files that can be processed by
          Cursor:
        </p>
        <CodeBlock filename=".feedback/feedback-2024-01-15T10-30-00Z.json">{`{
  "type": "cursor_local",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "comment": "This button should be disabled when form is invalid",
  "page": {
    "url": "http://localhost:3000/checkout",
    "title": "Checkout - My App",
    "viewportWidth": 1920,
    "viewportHeight": 1080
  },
  "element": {
    "selector": "button[data-testid='submit-btn']",
    "tagName": "button",
    "innerText": "Submit Order",
    "dataAttributes": {
      "testid": "submit-btn"
    }
  },
  "prompt": "Fix the following issue..."
}`}</CodeBlock>
      </div>

      {/* Cursor Rules Integration */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Cursor Rules Integration</h2>
        <p className="text-gray-400 mb-4">
          Add a Cursor rule to help the AI understand feedback files:
        </p>
        <CodeBlock filename=".cursor/rules/feedback.mdc">{`---
description: Handle anyclick feedback files
globs:
  - .feedback/*.json
---

# Feedback File Processing

When processing anyclick feedback files:

1. Read the feedback JSON to understand the issue
2. Use the \`selector\` to locate the relevant component
3. Consider the \`comment\` as the primary issue description
4. Reference the \`page.url\` for context about where the issue occurs
5. Look at \`element.innerText\` and \`element.dataAttributes\` for identification

Always:
- Keep changes minimal and focused on the reported issue
- Preserve existing functionality
- Add appropriate error handling if relevant
- Update tests if the component has them`}</CodeBlock>
      </div>

      {/* Tips */}
      <div className="mb-12 p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-amber-400" />
          Tips for Best Results
        </h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>
            • Add <code className="text-amber-300">.feedback/</code> to your{" "}
            <code className="text-amber-300">.gitignore</code>
          </li>
          <li>• Use descriptive comments when submitting feedback</li>
          <li>
            • Add <code className="text-amber-300">data-testid</code> attributes
            for reliable element identification
          </li>
          <li>• Configure Cursor rules for your project&apos;s conventions</li>
          <li>
            • Run the feedback server in a separate terminal for better
            visibility
          </li>
        </ul>
      </div>

      {/* Security Note */}
      <div className="mb-12 p-6 rounded-xl bg-rose-500/10 border border-rose-500/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-rose-400" />
          Security Reminder
        </h3>
        <p className="text-sm text-gray-400">
          The local server is designed for development only. Never expose it to
          the internet. The server only accepts connections from localhost by
          default.
        </p>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/10 to-violet-500/10 border border-amber-500/20">
        <h3 className="font-semibold mb-2">Explore More</h3>
        <p className="text-gray-400 text-sm mb-4">
          Check out the documentation for advanced configuration options and
          integrations.
        </p>
        <div className="flex gap-4">
          <Link
            href="/docs/adapters"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
          >
            Adapter Docs
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/docs/react"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            React Provider
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
