import { CodeBlock } from "@/components/CodePreview";
import { DEFAULT_SENSITIVE_SELECTORS } from "@ewjdev/anyclick-core";
import {
  ArrowRight,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Shield,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sensitive Selector Masking Example",
  description:
    "Demonstrates how anyclick automatically masks sensitive elements in screenshots.",
};

export default function SensitiveMaskingExamplePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Sensitive Masking</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Sensitive Selector Masking
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          anyclick automatically masks sensitive elements like passwords, credit
          cards, and other private data in screenshots to protect user privacy.
        </p>
      </div>

      {/* Demo Area */}
      <div className="mb-12 p-8 rounded-2xl bg-linear-to-br from-emerald-500/10 to-violet-500/10 border border-emerald-500/20">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Try It - Right-click to Capture Screenshots
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Right-click any element below and submit feedback with screenshots.
          Notice how sensitive fields are automatically masked in the preview:
        </p>

        {/* Login Form */}
        <div className="space-y-6 p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-400" />
            Login Form
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="user@example.com"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                This password field will be masked in screenshots
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="space-y-6 p-6 rounded-xl bg-white/5 border border-white/10 mt-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            Payment Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Card Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Credit card inputs are automatically masked
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">CVV</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Sensitive Elements */}
        <div className="space-y-6 p-6 rounded-xl bg-white/5 border border-white/10 mt-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400" />
            Custom Sensitive Elements
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Social Security Number
              </label>
              <input
                type="text"
                data-sensitive="true"
                placeholder="XXX-XX-XXXX"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Elements with{" "}
                <code className="text-amber-400">data-sensitive="true"</code>{" "}
                are masked
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Private Notes
              </label>
              <textarea
                data-mask="true"
                placeholder="Enter private information here..."
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Elements with{" "}
                <code className="text-amber-400">data-mask="true"</code> are
                masked
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Secret API Key
              </label>
              <input
                type="text"
                className="sensitive w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="sk_live_..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Elements with <code className="text-amber-400">.sensitive</code>{" "}
                class are masked
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Internal ID
              </label>
              <input
                type="text"
                className="private w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="internal-12345"
              />
              <p className="text-xs text-gray-500 mt-1">
                Elements with <code className="text-amber-400">.private</code>{" "}
                class are masked
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-sm text-emerald-400 flex items-start gap-2">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              All sensitive elements above are automatically detected and masked
              in screenshots. Try right-clicking any element and submitting
              feedback to see the masked preview!
            </span>
          </p>
        </div>
      </div>

      {/* Default Selectors */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Default Sensitive Selectors</h2>
        <p className="text-gray-400 mb-4">
          anyclick includes these default selectors to automatically mask common
          sensitive elements:
        </p>
        <CodeBlock>{`import { DEFAULT_SENSITIVE_SELECTORS } from '@ewjdev/anyclick-core';

// Default selectors that are automatically masked:
${DEFAULT_SENSITIVE_SELECTORS.map((s) => `'${s}'`).join(",\n")}`}</CodeBlock>
      </div>

      {/* Implementation */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Implementation</h2>
        <p className="text-gray-400 mb-4">
          Configure sensitive selectors in your{" "}
          <code className="text-cyan-400">screenshotConfig</code>:
        </p>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          Using Default Selectors
        </h3>
        <CodeBlock filename="app/providers.tsx">{`'use client';

import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';
import { DEFAULT_SENSITIVE_SELECTORS } from '@ewjdev/anyclick-core';

const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider
      adapter={adapter}
      screenshotConfig={{
        enabled: true,
        // Use default selectors (already included by default)
        sensitiveSelectors: DEFAULT_SENSITIVE_SELECTORS,
        // Customize mask color (default: #1a1a1a)
        maskColor: '#1a1a1a',
      }}
    >
      {children}
    </FeedbackProvider>
  );
}`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          Adding Custom Selectors
        </h3>
        <CodeBlock filename="app/providers.tsx">{`'use client';

import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';
import { DEFAULT_SENSITIVE_SELECTORS } from '@ewjdev/anyclick-core';

const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider
      adapter={adapter}
      screenshotConfig={{
        enabled: true,
        // Combine default selectors with custom ones
        sensitiveSelectors: [
          ...DEFAULT_SENSITIVE_SELECTORS,
          // Add your custom selectors
          '[data-private]',
          '.api-key',
          '.secret-field',
          '#ssn-input',
        ],
        maskColor: '#000000', // Black mask
      }}
    >
      {children}
    </FeedbackProvider>
  );
}`}</CodeBlock>
      </div>

      {/* How It Works */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <ul className="space-y-3">
          {[
            "When a screenshot is captured, anyclick scans for elements matching the sensitive selectors",
            "Matching elements are covered with a solid color mask (default: #1a1a1a)",
            "The mask is applied before compression and encoding",
            "Sensitive data never appears in the final screenshot",
            "The preview dialog shows the masked screenshot before submission",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-300">
              <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Best Practices */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              Use Semantic Attributes
            </h3>
            <p className="text-gray-400 text-sm">
              Add <code className="text-cyan-400">data-sensitive="true"</code>{" "}
              or <code className="text-cyan-400">data-mask="true"</code> to any
              element containing sensitive information. This is more
              maintainable than relying solely on CSS classes.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-violet-400" />
              Test Your Selectors
            </h3>
            <p className="text-gray-400 text-sm">
              Always test that your sensitive selectors are working correctly by
              submitting feedback and checking the screenshot preview. Verify
              that sensitive data is properly masked.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Don't Over-Mask
            </h3>
            <p className="text-gray-400 text-sm">
              Only mask truly sensitive information. Over-masking can make
              screenshots less useful for debugging and feedback purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-xl bg-linear-to-r from-emerald-500/10 to-violet-500/10 border border-emerald-500/20">
        <h3 className="font-semibold mb-2">Ready for more?</h3>
        <p className="text-gray-400 text-sm mb-4">
          Learn how to integrate with GitHub Issues for automatic issue creation
          with masked screenshots.
        </p>
        <Link
          href="/examples/github-integration"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
        >
          GitHub Integration
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
