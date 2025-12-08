import { CodeBlock } from "@/components/CodePreview";
import {
  ArrowRight,
  Check,
  MessageSquare,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import QuickChatProvider from "./QuickChatProvider";

export const metadata: Metadata = {
  title: "Quick Chat Example",
  description: "AI-powered quick chat in the context menu for instant answers.",
};

export default function QuickChatExamplePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Quick Chat</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30">
            <Sparkles className="w-6 h-6 text-violet-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Quick Chat
          </h1>
        </div>
        <p className="text-lg text-gray-400 leading-relaxed">
          Get instant AI-powered answers about any element on your page. Ask
          questions, get styling tips, accessibility insights, and more - all
          from the context menu.
        </p>
      </div>

      {/* Demo Area */}
      <QuickChatProvider>
        <div className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-violet-400" />
            Try It
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Right-click any element below and click the{" "}
            <Sparkles className="w-3 h-3 inline text-violet-400" /> icon to open
            Quick Chat:
          </p>

          <div className="space-y-4">
            <button className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors">
              Primary Button
            </button>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="font-medium mb-1">Card Component</h3>
              <p className="text-sm text-gray-400">
                Ask the AI about this card&apos;s styles, accessibility, or how
                to modify it.
              </p>
            </div>

            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
                Accessible
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">
                Responsive
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                Animated
              </span>
            </div>

            <nav className="flex gap-4 p-3 rounded-lg bg-white/5">
              <a href="#" className="text-sm text-gray-300 hover:text-white">
                Home
              </a>
              <a href="#" className="text-sm text-gray-300 hover:text-white">
                About
              </a>
              <a href="#" className="text-sm text-gray-300 hover:text-white">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </QuickChatProvider>

      {/* Features */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Features</h2>
        <ul className="space-y-3">
          {[
            "Auto-focus text field when chat opens",
            "Suggested prompts based on element context",
            "Streaming AI responses with size limits",
            "Context redaction - choose what info to share",
            "Pin chat to keep it open across interactions",
            "Quick actions: copy, research more, open in chat app",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* How It Works */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div>
              <h3 className="font-medium mb-1">Right-click any element</h3>
              <p className="text-sm text-gray-400">
                The context menu opens with the Quick Chat button (sparkles
                icon) in the header.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <h3 className="font-medium mb-1">Review & redact context</h3>
              <p className="text-sm text-gray-400">
                Element info is automatically captured. Click &quot;Edit&quot;
                to exclude any pieces you don&apos;t want to share with the AI.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div>
              <h3 className="font-medium mb-1">Ask or select a suggestion</h3>
              <p className="text-sm text-gray-400">
                Type your question or pick from AI-generated suggestions based
                on the element.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-sm font-medium">
              4
            </div>
            <div>
              <h3 className="font-medium mb-1">Get instant answers</h3>
              <p className="text-sm text-gray-400">
                Responses stream in real-time with quick actions to copy,
                research more, or open in your favorite chat app.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Implementation</h2>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          1. Configure the Provider
        </h3>
        <CodeBlock
          filename="app/providers.tsx"
          language="tsx"
          code={`'use client';

import { AnyclickProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AnyclickProvider 
      adapter={adapter}
      quickChatConfig={{
        endpoint: '/api/anyclick/chat',
        model: 'gpt-5-nano',
        maxResponseLength: 500,
        showRedactionUI: true,
        showSuggestions: true,
        placeholder: 'Ask about this element...',
        title: 'Quick Ask',
      }}
    >
      {children}
    </AnyclickProvider>
  );
}`}
        />

        <h3 className="text-lg font-semibold mb-3 mt-8">
          2. Create the API Route
        </h3>
        <CodeBlock
          filename="app/api/anyclick/chat/route.ts"
          language="typescript"
          code={`import { createOpenAI } from "@ai-sdk/openai";
import { streamText, generateText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { action, context, message, model, maxLength } = await request.json();

  if (action === "suggest") {
    // Generate suggested prompts based on context
    const result = await generateText({
      model: openai(model || "gpt-5-nano"),
      system: "Generate 3-4 short questions about this element...",
      prompt: \`Element context: \${context}\`,
      maxTokens: 150,
    });
    return Response.json({ suggestions: JSON.parse(result.text) });
  }

  if (action === "chat") {
    // Stream the response
    const result = streamText({
      model: openai(model || "gpt-5-nano"),
      system: \`Keep response under \${maxLength} chars. Context: \${context}\`,
      prompt: message,
      maxTokens: 300,
    });
    return result.toTextStreamResponse();
  }
}`}
        />

        <h3 className="text-lg font-semibold mb-3 mt-8">
          3. Add Environment Variable
        </h3>
        <CodeBlock
          filename=".env.local"
          language="bash"
          code={`# OpenAI API Key for Quick Chat
OPENAI_API_KEY=sk-...`}
        />
      </div>

      {/* Configuration Options */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Configuration Options</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/10">
                <th className="pb-3 font-medium">Option</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Default</th>
                <th className="pb-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              <tr className="border-b border-white/5">
                <td className="py-3 font-mono text-cyan-400">endpoint</td>
                <td className="py-3">string</td>
                <td className="py-3 font-mono text-xs">/api/anyclick/chat</td>
                <td className="py-3">API endpoint for chat requests</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 font-mono text-cyan-400">model</td>
                <td className="py-3">string</td>
                <td className="py-3 font-mono text-xs">gpt-5-nano</td>
                <td className="py-3">AI model for chat responses</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 font-mono text-cyan-400">
                  maxResponseLength
                </td>
                <td className="py-3">number</td>
                <td className="py-3 font-mono text-xs">500</td>
                <td className="py-3">Max characters in response</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 font-mono text-cyan-400">
                  showRedactionUI
                </td>
                <td className="py-3">boolean</td>
                <td className="py-3 font-mono text-xs">true</td>
                <td className="py-3">Show context redaction controls</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 font-mono text-cyan-400">
                  showSuggestions
                </td>
                <td className="py-3">boolean</td>
                <td className="py-3 font-mono text-xs">true</td>
                <td className="py-3">Show AI-generated prompt suggestions</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-cyan-400">systemPrompt</td>
                <td className="py-3">string</td>
                <td className="py-3 font-mono text-xs">-</td>
                <td className="py-3">Custom system prompt for AI</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="mb-12 p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-amber-400">
          <MessageSquare className="w-4 h-4" />
          Privacy Note
        </h3>
        <p className="text-gray-400 text-sm">
          Quick Chat sends element context to the AI. The redaction UI lets
          users control exactly what information is shared. No data is stored -
          each conversation is ephemeral and scoped to the current session.
        </p>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <h3 className="font-semibold mb-2">Explore More</h3>
        <p className="text-gray-400 text-sm mb-4">
          See how Quick Chat works with other anyclick features like screenshot
          capture and custom menus.
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
