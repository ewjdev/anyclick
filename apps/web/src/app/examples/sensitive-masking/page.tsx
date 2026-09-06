import { CodeBlock } from "@/components/CodePreview";
import { ExampleStage } from "@/components/ExampleStage";
import { DEFAULT_SENSITIVE_SELECTORS } from "@ewjdev/anyclick-core";
import { ArrowRight, Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MASK_SELECTORS, SensitiveMaskingDemo } from "./SensitiveMaskingDemo";

export const metadata: Metadata = {
  title: "Sensitive Masking Example",
  description:
    "Right-click a form, then compare the masked screenshot with the raw payload anyclick captured.",
};

const source = `'use client';

import { AnyclickProvider, DEFAULT_SENSITIVE_SELECTORS } from '@ewjdev/anyclick-react';

// Never leaves the browser: this demo only compares what was captured.
const adapter = { submitAnyclick: async () => {} };

export function Providers({ children }) {
  return (
    <AnyclickProvider
      adapter={adapter}
      scoped
      menuItems={[{ type: 'capture', label: 'Capture & compare', showComment: false }]}
      screenshotConfig={{
        sensitiveSelectors: [...DEFAULT_SENSITIVE_SELECTORS, '.my-secret'],
        maskColor: '#000000',
        showPreview: true,
      }}
      highlightConfig={{ containerSelectors: ['[data-stage-card]'] }}
    >
      {children}
    </AnyclickProvider>
  );
}`;

export default function SensitiveMaskingExamplePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Sensitive Masking</span>
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Sensitive Masking
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Screenshots are masked. The DOM payload is not. See both.
        </p>
      </div>

      <ExampleStage
        id="sensitive-masking"
        prompt="Right-click the form. Watch what leaves."
        source={source}
        note="What's different: masking happens at screenshot time, by CSS selector, before the image is encoded. Password, card, data-sensitive and .my-secret fields are painted over. The element's outerHTML and innerText are still captured as text, which is why the reveal highlights them."
        reveal="compare"
        sensitiveSelectors={MASK_SELECTORS}
      >
        <SensitiveMaskingDemo />
      </ExampleStage>

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-white mb-8">
          Default selectors, custom selectors and how it works
        </summary>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            Default Sensitive Selectors
          </h2>
          <p className="text-gray-400 mb-4 leading-relaxed">
            These are masked out of the box. Add{" "}
            <code className="text-cyan-400">
              data-sensitive=&quot;true&quot;
            </code>{" "}
            or <code className="text-cyan-400">data-mask=&quot;true&quot;</code>{" "}
            to any element to mask it too.
          </p>
          <CodeBlock
            language="typescript"
            code={`// DEFAULT_SENSITIVE_SELECTORS\n${JSON.stringify(DEFAULT_SENSITIVE_SELECTORS, null, 2)}`}
          />
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Custom Selectors</h2>
          <p className="text-gray-400 mb-4 leading-relaxed">
            Extend the defaults rather than replacing them, unless you mean to.
          </p>
          <CodeBlock
            filename="app/providers.tsx"
            code={`import { AnyclickProvider, DEFAULT_SENSITIVE_SELECTORS } from '@ewjdev/anyclick-react';

<AnyclickProvider
  adapter={adapter}
  screenshotConfig={{
    sensitiveSelectors: [
      ...DEFAULT_SENSITIVE_SELECTORS,
      '.ssn-field',
      '[data-pii]',
      '#api-key-display',
    ],
    maskColor: '#000000',
  }}
>
  {children}
</AnyclickProvider>`}
          />
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <ol className="space-y-3">
            {[
              "When a screenshot is captured, anyclick injects a style that paints every element matching the sensitive selectors in the mask color.",
              "The image is rendered with html-to-image, then the style is removed.",
              "The mask is applied before compression and encoding, so the data never exists in the image.",
              "The preview dialog shows the masked screenshot before anything is sent.",
              "Text capture (outerHTML, innerText, selectors) is separate. Use stripAttributes, or keep secrets out of the DOM.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-300">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm flex-shrink-0">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Next
          </h2>
          <Link
            href="/docs/core"
            className="inline-flex items-center gap-2 text-sm text-violet-300 hover:text-white transition-colors"
          >
            Screenshot configuration reference
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </details>
    </div>
  );
}
