import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  Check,
  Image,
  Tag,
  ExternalLink,
} from "lucide-react";
import { CodeBlock } from "@/components/CodePreview";

export const metadata: Metadata = {
  title: "GitHub Integration Example",
  description:
    "Full GitHub Issues integration with automatic issue creation and screenshot uploads.",
};

export default function GitHubIntegrationPage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">GitHub Integration</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          GitHub Integration
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Automatically create GitHub Issues from feedback with rich context,
          labels, assignees, and embedded screenshots.
        </p>
      </div>

      {/* What's included */}
      <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-emerald-400" />
          What&apos;s Included
        </h2>
        <ul className="space-y-3">
          {[
            { icon: Check, text: "Automatic issue creation from feedback" },
            { icon: Image, text: "Screenshot uploads as issue attachments" },
            { icon: Tag, text: "Dynamic labels based on feedback type" },
            { icon: ExternalLink, text: "Full DOM context in issue body" },
          ].map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3 text-gray-300 text-sm"
            >
              <item.icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Prerequisites */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Prerequisites</h2>
        <ul className="space-y-2">
          {[
            "GitHub repository with Issues enabled",
            "Personal Access Token with 'repo' scope",
            "Environment variables configured",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Environment Setup */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Environment Setup</h2>
        <CodeBlock filename=".env.local">{`# GitHub Personal Access Token
# Create at: https://github.com/settings/tokens
# Required scopes: repo (or public_repo for public repos)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Repository information
GITHUB_REPO=your-username/your-repository-name`}</CodeBlock>
      </div>

      {/* Browser-Side Setup */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Browser-Side Setup</h2>
        <p className="text-gray-400 mb-4">
          Use the HTTP adapter to send feedback to your API endpoint:
        </p>
        <CodeBlock filename="app/providers.tsx">{`'use client';

import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-';

const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider 
      adapter={adapter}
      // Enable screenshot capture for GitHub
      screenshotConfig={{
        enabled: true,
        quality: 0.9,
        format: 'png',
      }}
    >
      {children}
    </FeedbackProvider>
  );
}`}</CodeBlock>
      </div>

      {/* Server-Side Setup */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Server-Side API Route</h2>
        <p className="text-gray-400 mb-4">
          Create an API route that receives feedback and creates GitHub Issues:
        </p>
        <CodeBlock filename="app/api/feedback/route.ts">{`import { createGitHubAdapter } from '@ewjdev/anyclick-github/server';
import type { FeedbackPayload } from '@ewjdev/anyclick-core';

const repoName = process.env.GITHUB_REPO!;
const [owner, repo] = repoName.split("/");

// Create the GitHub adapter with configuration
const github = createGitHubAdapter({
  owner,
  repo,
  token: process.env.GITHUB_TOKEN!,
  
  // Dynamic labels based on feedback type
  getLabels: (payload) => {
    const labels = ['feedback', 'from-app'];
    
    switch (payload.type) {
      case 'issue':
      case 'bug':
        labels.push('bug');
        break;
      case 'feature':
        labels.push('enhancement');
        break;
      case 'like':
      case 'love':
        labels.push('positive-feedback');
        break;
    }
    
    return labels;
  },
  
  // Custom issue title
  getTitle: (payload) => {
    const emoji = {
      issue: '🐛',
      bug: '🐛',
      feature: '✨',
      like: '❤️',
      love: '❤️',
    }[payload.type] || '📝';
    
    // Use comment as title if available, otherwise use selector
    const title = payload.comment 
      ? payload.comment.slice(0, 80) 
      : \`Feedback on \${payload.element.tagName}\`;
    
    return \`\${emoji} \${title}\`;
  },
  
  // Optional: assign to specific users
  getAssignees: (payload) => {
    // Assign bugs to the bug-triage team
    if (payload.type === 'issue' || payload.type === 'bug') {
      return ['bug-triage-user'];
    }
    return [];
  },
});

export async function POST(request: Request) {
  try {
    const payload: FeedbackPayload = await request.json();
    const result = await github.submit(payload);
    
    return Response.json(result);
  } catch (error) {
    console.error('Failed to create GitHub issue:', error);
    return Response.json(
      { success: false, error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}`}</CodeBlock>
      </div>

      {/* Issue Format */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Generated Issue Format</h2>
        <p className="text-gray-400 mb-4">
          The adapter generates well-formatted GitHub Issues with all captured
          context:
        </p>

        {/* Issue preview */}
        <div className="rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">Issue Preview</span>
          </div>
          <div className="p-6 text-sm">
            <h3 className="text-lg font-semibold mb-4">
              🐛 Button not responding on click
            </h3>

            <p className="text-gray-300 mb-4">
              The submit button doesn&apos;t trigger form submission when
              clicked.
            </p>

            <h4 className="font-semibold text-gray-200 mb-2">
              📍 Element Context
            </h4>
            <ul className="text-gray-400 mb-4 space-y-1 text-xs font-mono">
              <li>
                <span className="text-gray-500">Selector:</span>{" "}
                button.submit-btn[data-testid=&quot;submit&quot;]
              </li>
              <li>
                <span className="text-gray-500">Tag:</span> button
              </li>
              <li>
                <span className="text-gray-500">Text:</span> Submit Form
              </li>
            </ul>

            <h4 className="font-semibold text-gray-200 mb-2">
              🌐 Page Context
            </h4>
            <ul className="text-gray-400 mb-4 space-y-1 text-xs font-mono">
              <li>
                <span className="text-gray-500">URL:</span>{" "}
                https://example.com/checkout
              </li>
              <li>
                <span className="text-gray-500">Viewport:</span> 1920 × 1080
              </li>
              <li>
                <span className="text-gray-500">Timestamp:</span>{" "}
                2024-01-15T10:30:00Z
              </li>
            </ul>

            <h4 className="font-semibold text-gray-200 mb-2">📸 Screenshots</h4>
            <div className="flex gap-2">
              <div className="w-20 h-12 rounded bg-white/5 flex items-center justify-center text-xs text-gray-500">
                Target
              </div>
              <div className="w-20 h-12 rounded bg-white/5 flex items-center justify-center text-xs text-gray-500">
                Container
              </div>
              <div className="w-20 h-12 rounded bg-white/5 flex items-center justify-center text-xs text-gray-500">
                Full Page
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Formatting */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Custom Issue Formatting</h2>
        <p className="text-gray-400 mb-4">
          Override the default markdown formatting:
        </p>
        <CodeBlock>{`import { createGitHubAdapter, formatFeedbackAsMarkdown } from '@ewjdev/anyclick-github/server';

const repoName = process.env.GITHUB_REPO!;
const [owner, repo] = repoName.split("/");

const github = createGitHubAdapter({
  owner,
  repo,
  token: process.env.GITHUB_TOKEN!,
  
  // Custom body formatting
  getBody: (payload) => {
    // Use built-in formatter as base
    const defaultBody = formatFeedbackAsMarkdown(payload);
    
    // Add custom sections
    return \`
\${defaultBody}

---

## 🔧 Additional Info

- **Environment**: \${payload.metadata?.environment || 'production'}
- **User ID**: \${payload.metadata?.userId || 'anonymous'}
- **Session**: \${payload.metadata?.sessionId || 'unknown'}

<details>
<summary>Raw HTML</summary>

\\\`\\\`\\\`html
\${payload.element.outerHTML}
\\\`\\\`\\\`

</details>
    \`;
  },
});`}</CodeBlock>
      </div>

      {/* Handling Screenshots */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Screenshot Upload</h2>
        <p className="text-gray-400 mb-4">
          Screenshots are automatically uploaded as issue attachments. The
          adapter handles base64 decoding and GitHub&apos;s asset upload API.
        </p>
        <CodeBlock>{`// Screenshots are included in the payload
const payload: FeedbackPayload = {
  // ... other fields
  screenshots: {
    target: {
      dataUrl: 'data:image/png;base64,...',
      width: 200,
      height: 100,
    },
    container: {
      dataUrl: 'data:image/png;base64,...',
      width: 800,
      height: 600,
    },
    fullPage: {
      dataUrl: 'data:image/png;base64,...',
      width: 1920,
      height: 1080,
    },
  },
};

// The adapter uploads and embeds them automatically
// ![Target Screenshot](https://github.com/.../assets/123)
// ![Container Screenshot](https://github.com/.../assets/456)
// ![Full Page Screenshot](https://github.com/.../assets/789)`}</CodeBlock>
      </div>

      {/* Error Handling */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Error Handling</h2>
        <CodeBlock filename="app/api/feedback/route.ts">{`export async function POST(request: Request) {
  try {
    const payload: FeedbackPayload = await request.json();
    
    // Validate required fields
    if (!payload.type || !payload.element) {
      return Response.json(
        { success: false, error: 'Invalid payload' },
        { status: 400 }
      );
    }
    
    const result = await github.submit(payload);
    
    if (!result.success) {
      console.error('GitHub API error:', result.error);
      return Response.json(result, { status: 500 });
    }
    
    return Response.json(result);
  } catch (error) {
    console.error('Feedback submission error:', error);
    
    // Return user-friendly error
    return Response.json(
      { 
        success: false, 
        error: 'Unable to submit feedback. Please try again.',
      },
      { status: 500 }
    );
  }
}`}</CodeBlock>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-amber-500/10 border border-emerald-500/20">
        <h3 className="font-semibold mb-2">Next: Local Development Workflow</h3>
        <p className="text-gray-400 text-sm mb-4">
          Learn how to integrate with Cursor for instant AI-powered code fixes
          during development.
        </p>
        <Link
          href="/examples/cursor-local"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
        >
          Cursor Local Example
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
