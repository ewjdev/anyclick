import { CodeBlock } from "@/components/CodePreview";
import {
  ArrowRight,
  Check,
  ExternalLink,
  MessageSquare,
  MousePointerClick,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import T3ChatProvider from "./T3ChatProvider";

export const metadata: Metadata = {
  title: "t3.chat Integration Example",
  description: "Send selected text to t3.chat with Anyclick context menus.",
};

export default function T3ChatIntegrationPage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">t3.chat Integration</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-linear-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
            <MessageSquare className="w-6 h-6 text-violet-400" />
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            t3.chat Integration
          </h1>
        </div>
        <p className="text-lg text-gray-400 leading-relaxed">
          Select text anywhere on the page and send it directly to{" "}
          <a
            href="https://t3.chat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300"
          >
            t3.chat
          </a>{" "}
          for AI-powered answers. Perfect for quick research and code questions.
        </p>
      </div>

      {/* Demo Area */}
      <T3ChatProvider>
        <div className="mb-12 p-8 rounded-2xl bg-linear-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-violet-400" />
            Try It
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Select some text below, then right-click and choose &quot;Ask
            t3.chat&quot; to send it to t3.chat:
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="font-medium mb-2">Sample Code</h3>
              <pre className="text-sm text-gray-300 font-mono bg-black/30 p-3 rounded overflow-x-auto">
                {`function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`}
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                Select any part of this code and ask t3.chat about it!
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="font-medium mb-2">Technical Content</h3>
              <p className="text-sm text-gray-300">
                React Server Components allow you to render components on the
                server and send only the HTML to the client. This reduces the
                JavaScript bundle size and improves initial page load
                performance. Combined with Suspense boundaries, you can create
                streaming SSR experiences.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="font-medium mb-2">Error Message</h3>
              <code className="text-sm text-red-400 font-mono">
                TypeError: Cannot read properties of undefined (reading
                &apos;map&apos;)
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Select this error and ask t3.chat how to fix it!
              </p>
            </div>
          </div>
        </div>
      </T3ChatProvider>

      {/* Features */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Features</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Text Selection Detection</strong> -
              Menu item only appears when text is selected
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Quick Chat Integration</strong> -
              Send questions from the built-in Quick Chat to t3.chat
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Pre-filled Query</strong> -
              Selected text is automatically added to the t3.chat input
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Opens in New Tab</strong> - Your
              workflow isn&apos;t interrupted
            </span>
          </li>
        </ul>
      </div>

      {/* Setup Guide */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Setup</h2>
        <p className="text-gray-400 mb-6">
          Add t3.chat integration to your Anyclick setup:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">
              1. Using the Chrome Preset (Recommended)
            </h3>
            <CodeBlock
              filename="app/layout.tsx"
              language="tsx"
              code={`import { AnyclickProvider, createPresetMenu } from "@ewjdev/anyclick-react";

// Chrome preset includes t3.chat menu item by default
const chromePreset = createPresetMenu("chrome");

export default function Layout({ children }) {
  return (
    <AnyclickProvider
      adapter={adapter}
      menuItems={chromePreset.menuItems}
    >
      {children}
    </AnyclickProvider>
  );
}`}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              2. Adding to Custom Menus
            </h3>
            <CodeBlock
              filename="app/layout.tsx"
              language="tsx"
              code={`import {
  AnyclickProvider,
  createT3ChatMenuItem,
} from "@ewjdev/anyclick-react";

const menuItems = [
  { label: "Report Bug", type: "bug", showComment: true },
  { label: "Feature Idea", type: "feature", showComment: true },
  createT3ChatMenuItem(), // Adds "Ask t3.chat" item
];

export default function Layout({ children }) {
  return (
    <AnyclickProvider adapter={adapter} menuItems={menuItems}>
      {children}
    </AnyclickProvider>
  );
}`}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              3. Quick Chat t3.chat Button
            </h3>
            <p className="text-gray-400 mb-3">
              The Quick Chat component includes a t3.chat button by default.
              Users can type a question and send it directly to t3.chat:
            </p>
            <CodeBlock
              filename="app/layout.tsx"
              language="tsx"
              code={`import { AnyclickProvider } from "@ewjdev/anyclick-react";

export default function Layout({ children }) {
  return (
    <AnyclickProvider
      adapter={adapter}
      quickChatConfig={{
        endpoint: "/api/anyclick/chat",
        // t3.chat button is enabled by default
        t3chat: {
          enabled: true,
          baseUrl: "https://t3.chat",
        },
      }}
    >
      {children}
    </AnyclickProvider>
  );
}`}
            />
          </div>
        </div>
      </div>

      {/* Standalone Package */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Standalone Package</h2>
        <p className="text-gray-400 mb-6">
          For custom integrations, use the t3.chat adapter package directly:
        </p>

        <CodeBlock
          filename="Terminal"
          language="bash"
          code="npm install @ewjdev/anyclick-t3chat"
        />

        <div className="mt-6">
          <CodeBlock
            filename="your-component.tsx"
            language="tsx"
            code={`import {
  createT3ChatAdapter,
  getSelectedText,
  hasTextSelection,
} from "@ewjdev/anyclick-t3chat";

const adapter = createT3ChatAdapter({
  baseUrl: "https://t3.chat",
  openInNewTab: true,
});

// Check if text is selected
if (hasTextSelection()) {
  const text = getSelectedText();
  adapter.sendQuery(text);
}

// Or send selected text directly
adapter.sendSelectedText();`}
          />
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-6 rounded-2xl bg-linear-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
        <h2 className="text-xl font-bold mb-3">Next Steps</h2>
        <p className="text-gray-400 mb-4">
          Explore more integrations and features:
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/examples/uploadthing-integration"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
          >
            UploadThing Integration
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/examples/quick-chat"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
          >
            Quick Chat
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://t3.chat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-sm font-medium transition-colors"
          >
            Try t3.chat
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
