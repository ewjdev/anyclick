import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GitBranch, Terminal, Monitor, Cloud } from "lucide-react";
import { CodeBlock } from "@/components/CodePreview";

export const metadata: Metadata = {
  title: "Adapters",
  description:
    "Connect anyclick to GitHub Issues, Cursor AI agents, or build your own custom adapter.",
};

export default function AdaptersDocsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="not-prose mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Adapters
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Adapters connect anyclick to external services. Use pre-built adapters
          for GitHub and Cursor, or implement the adapter interface for custom
          integrations.
        </p>
      </div>

      {/* Adapter Overview */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Available Adapters</h2>
        <div className="grid gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              <code className="text-emerald-300 font-mono">
                @ewjdev/anyclick-github
              </code>
            </div>
            <p className="text-gray-400 text-sm">
              Create GitHub Issues with rich context, formatted markdown, and
              embedded screenshots.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <code className="text-amber-300 font-mono">
                @ewjdev/anyclick-cursor
              </code>
            </div>
            <p className="text-gray-400 text-sm">
              Launch Cursor&apos;s Cloud Agent to automatically fix issues from
              feedback.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Monitor className="w-5 h-5 text-rose-400" />
              <code className="text-rose-300 font-mono">
                @ewjdev/anyclick-cursor-local
              </code>
            </div>
            <p className="text-gray-400 text-sm">
              Run cursor-agent locally during development for instant code
              fixes.
            </p>
          </div>
        </div>
      </section>

      {/* GitHub Adapter */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-emerald-400" />
          GitHub Adapter
        </h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          The GitHub adapter creates Issues in your repository with full
          context, labels, and embedded screenshots.
        </p>

        <h3 className="text-lg font-semibold mb-3 mt-8">Installation</h3>
        <CodeBlock>{`npm install @ewjdev/anyclick-github`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">Browser-Side Setup</h3>
        <p className="text-gray-400 mb-4">
          Use the HTTP adapter to send feedback to your API endpoint:
        </p>
        <CodeBlock filename="app/providers.tsx">{`'use client';

import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
  // Optional: custom headers
  headers: {
    'X-Custom-Header': 'value',
  },
});

export function Providers({ children }) {
  return (
    <FeedbackProvider adapter={adapter}>
      {children}
    </FeedbackProvider>
  );
}`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">Server-Side Setup</h3>
        <p className="text-gray-400 mb-4">
          Create an API route that receives feedback and creates GitHub Issues:
        </p>
        <CodeBlock filename="app/api/feedback/route.ts">{`import { createGitHubAdapter, formatFeedbackAsMarkdown } from '@ewjdev/anyclick-github/server';
import type { FeedbackPayload } from '@ewjdev/anyclick-core';

const repoName = process.env.GITHUB_REPO!;
const [owner, repo] = repoName.split("/");

const github = createGitHubAdapter({
  owner,
  repo,
  token: process.env.GITHUB_TOKEN!,
  // Optional: customize labels based on feedback type
  getLabels: (payload) => {
    const labels = ['feedback'];
    if (payload.type === 'issue') labels.push('bug');
    if (payload.type === 'feature') labels.push('enhancement');
    return labels;
  },
  // Optional: custom title format
  getTitle: (payload) => {
    const prefix = payload.type === 'issue' ? '🐛' : '✨';
    return \`\${prefix} Feedback: \${payload.element.selector}\`;
  },
});

export async function POST(request: Request) {
  try {
    const payload: FeedbackPayload = await request.json();
    const result = await github.submit(payload);
    return Response.json(result);
  } catch (error) {
    console.error('Feedback error:', error);
    return Response.json(
      { success: false, error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">GitHub Token Scopes</h3>
        <p className="text-gray-400 mb-4">
          Create a Personal Access Token with these scopes:
        </p>
        <ul className="space-y-2 mb-4">
          <li className="flex items-center gap-2 text-gray-300 text-sm">
            <code className="text-cyan-400">repo</code> – Full control of
            private repositories
          </li>
          <li className="flex items-center gap-2 text-gray-300 text-sm">
            <code className="text-cyan-400">public_repo</code> – For public
            repositories only
          </li>
        </ul>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          Custom Markdown Formatting
        </h3>
        <CodeBlock>{`import { formatFeedbackAsMarkdown } from '@ewjdev/anyclick-github/server';

// Use the built-in formatter
const markdown = formatFeedbackAsMarkdown(payload);

// Or create custom formatting
function customFormat(payload: FeedbackPayload): string {
  return \`
## \${payload.type === 'issue' ? '🐛 Bug Report' : '✨ Feature Request'}

**Element:** \\\`\${payload.element.selector}\\\`

**Comment:** \${payload.comment || 'No comment provided'}

### Page Context
- URL: \${payload.page.url}
- Viewport: \${payload.page.viewportWidth}x\${payload.page.viewportHeight}

### Element Details
\\\`\\\`\\\`html
\${payload.element.outerHTML}
\\\`\\\`\\\`
  \`;
}`}</CodeBlock>
      </section>

      {/* Cursor Cloud Adapter */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <Cloud className="w-6 h-6 text-amber-400" />
          Cursor Cloud Agent
        </h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Launch Cursor&apos;s Cloud Agent to automatically analyze and fix
          issues based on feedback.
        </p>

        <h3 className="text-lg font-semibold mb-3 mt-8">Installation</h3>
        <CodeBlock>{`npm install @ewjdev/anyclick-cursor`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">Usage</h3>
        <CodeBlock filename="app/providers.tsx">{`import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { createCursorAdapter } from '@ewjdev/anyclick-cursor';

const cursorAdapter = createCursorAdapter({
  // Cursor Cloud Agent configuration
  apiKey: process.env.NEXT_PUBLIC_CURSOR_API_KEY,
  projectId: 'your-project-id',
});

// Use with custom menu items
const menuItems = [
  { type: 'issue', label: 'Report Issue', showComment: true },
  { 
    type: 'cursor_cloud', 
    label: 'Fix with AI', 
    showComment: true,
    requiredRoles: ['developer'],
  },
];

<FeedbackProvider 
  adapter={cursorAdapter} 
  menuItems={menuItems}
>
  {children}
</FeedbackProvider>`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          Format for Cursor Agent
        </h3>
        <CodeBlock>{`import { formatForCursorAgent } from '@ewjdev/anyclick-cursor';

const agentPrompt = formatForCursorAgent(payload);
// Returns a structured prompt optimized for AI code fixes`}</CodeBlock>
      </section>

      {/* Cursor Local Adapter */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <Monitor className="w-6 h-6 text-rose-400" />
          Cursor Local Agent
        </h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Run <code className="text-cyan-400">cursor-agent</code> locally during
          development. Feedback is saved to disk and opens directly in Cursor.
        </p>

        <h3 className="text-lg font-semibold mb-3 mt-8">Installation</h3>
        <CodeBlock>{`npm install @ewjdev/anyclick-cursor-local`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          Start the Local Server
        </h3>
        <p className="text-gray-400 mb-4">
          The local adapter requires a server to receive feedback and invoke
          Cursor:
        </p>
        <CodeBlock>{`# Add to your package.json scripts
"scripts": {
  "feedback-server": "anyclick-local-server"
}

# Run the server (default port: 3847)
npm run feedback-server`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">Browser-Side Setup</h3>
        <CodeBlock filename="app/providers.tsx">{`import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { createLocalAdapter } from '@ewjdev/anyclick-cursor-local';

// Only use in development
const localAdapter = createLocalAdapter({
  serverUrl: 'http://localhost:3847',
  projectPath: '/path/to/your/project',
});

// Conditional adapter based on environment
const adapter = process.env.NODE_ENV === 'development' 
  ? localAdapter 
  : productionAdapter;

<FeedbackProvider adapter={adapter}>
  {children}
</FeedbackProvider>`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          Server Configuration
        </h3>
        <CodeBlock filename="feedback-server.config.js">{`module.exports = {
  port: 3847,
  outputDir: '.feedback',
  // Custom handler when feedback is received
  onFeedback: async (payload) => {
    // Save to file, open in Cursor, etc.
    console.log('Received feedback:', payload.type);
  },
  // Format the feedback as a Cursor-compatible prompt
  formatPrompt: (payload) => {
    return \`Fix this \${payload.type}: \${payload.comment}\`;
  },
};`}</CodeBlock>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-6">
          <h4 className="font-semibold text-sm mb-2">⚠️ Development Only</h4>
          <p className="text-sm text-gray-400">
            The local adapter is designed for development workflows only.
            Don&apos;t expose the local server in production.
          </p>
        </div>
      </section>

      {/* Building Custom Adapters */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Building Custom Adapters</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Implement the <code className="text-cyan-400">FeedbackAdapter</code>{" "}
          interface to create custom integrations:
        </p>
        <CodeBlock filename="adapters/slack.ts">{`import type { FeedbackAdapter, FeedbackPayload, FeedbackResult } from '@ewjdev/anyclick-core';

interface SlackAdapterConfig {
  webhookUrl: string;
  channel?: string;
}

export function createSlackAdapter(config: SlackAdapterConfig): FeedbackAdapter {
  return {
    async submit(payload: FeedbackPayload): Promise<FeedbackResult> {
      try {
        const message = formatSlackMessage(payload);
        
        const response = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: config.channel,
            ...message,
          }),
        });
        
        if (!response.ok) {
          throw new Error(\`Slack API error: \${response.status}\`);
        }
        
        return {
          success: true,
          id: \`slack-\${Date.now()}\`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  };
}

function formatSlackMessage(payload: FeedbackPayload) {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: \`\${payload.type === 'issue' ? '🐛' : '✨'} New Feedback\`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: \`*Type:* \${payload.type}\` },
          { type: 'mrkdwn', text: \`*Page:* \${payload.page.url}\` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: \`*Comment:* \${payload.comment || 'No comment'}\`,
        },
      },
    ],
  };
}`}</CodeBlock>
      </section>

      {/* Combining Adapters */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Combining Multiple Adapters</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Send feedback to multiple destinations:
        </p>
        <CodeBlock filename="adapters/multi.ts">{`import type { FeedbackAdapter, FeedbackPayload, FeedbackResult } from '@ewjdev/anyclick-core';

export function createMultiAdapter(adapters: FeedbackAdapter[]): FeedbackAdapter {
  return {
    async submit(payload: FeedbackPayload): Promise<FeedbackResult> {
      const results = await Promise.allSettled(
        adapters.map(adapter => adapter.submit(payload))
      );
      
      const successes = results.filter(
        (r): r is PromiseFulfilledResult<FeedbackResult> => 
          r.status === 'fulfilled' && r.value.success
      );
      
      return {
        success: successes.length > 0,
        id: successes[0]?.value.id,
        url: successes[0]?.value.url,
        error: successes.length === 0 ? 'All adapters failed' : undefined,
      };
    },
  };
}

// Usage
const adapter = createMultiAdapter([
  githubAdapter,
  slackAdapter,
  analyticsAdapter,
]);`}</CodeBlock>
      </section>

      {/* Next steps */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold mb-6">Examples</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/examples/github-integration"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all"
          >
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              GitHub Integration
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-gray-400 text-sm">
              See the GitHub adapter in action.
            </p>
          </Link>

          <Link
            href="/examples/cursor-local"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-rose-500/30 transition-all"
          >
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              Cursor Local Workflow
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-gray-400 text-sm">
              Development workflow with local Cursor integration.
            </p>
          </Link>
        </div>
      </section>
    </article>
  );
}
