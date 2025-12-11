import { CodeBlock, TerminalBlock } from "@/components/CodePreview";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const QuickStartSection = () => {
  return (
    <div className="max-w-4xl mx-auto relative">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Quick Start</h2>
        <p className="text-gray-400">Get up and running in under 2 minutes</p>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="flex gap-6">
          <div className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold">
            1
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-3">Install the packages</h3>
            <TerminalBlock
              code="npm install @ewjdev/anyclick-react @ewjdev/anyclick-github"
              showCopy={true}
            />
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-6">
          <div className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold">
            2
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-3">Create an API route</h3>
            <CodeBlock
              filename="app/api/feedback/route.ts"
              language="typescript"
              code={`import { createGitHubAdapter } from '@ewjdev/anyclick-github/server';

const github = createGitHubAdapter({
  owner: 'your-org',
  repo: 'your-repo',
  token: process.env.GITHUB_TOKEN
});

export async function POST(req) {
  const payload = await req.json();
  const result = await github.submit(payload);
  return Response.json(result);
}`}
            />
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-6">
          <div className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold">
            3
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-3">Wrap your app</h3>
            <CodeBlock
              filename="app/layout.tsx"
              language="tsx"
              code={`import { AnyclickProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

const adapter = createHttpAdapter({ endpoint: '/api/feedback' });

export default function Layout({ children }) {
  return (
    <AnyclickProvider adapter={adapter}>
      {children}
    </AnyclickProvider>
  );
}`}
            />
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-6">
          <div className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold">
            4
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-3">Right-click anywhere!</h3>
            <p className="text-gray-400">
              That&apos;s it! Right-click any element in your app to open the
              feedback menu. Select a feedback type, add a comment, and submit.
              Your feedback is now on GitHub.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/docs/getting-started"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Read the full documentation
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default QuickStartSection;
