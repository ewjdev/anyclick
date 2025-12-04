import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/CodePreview";

export const metadata: Metadata = {
  title: "@ewjdev/anyclick-core",
  description:
    "API reference for the core anyclick library - DOM capture, payload building, and screenshot utilities.",
};

function TypeDef({
  name,
  type,
  description,
}: {
  name: string;
  type: string;
  description: string;
}) {
  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <div className="flex items-baseline gap-2 mb-1">
        <code className="text-cyan-400 text-sm">{name}</code>
        <code className="text-gray-500 text-xs">{type}</code>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

export default function CoreDocsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="not-prose mb-12">
        <div className="flex items-center gap-3 mb-4">
          <code className="px-3 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-lg font-mono">
            @ewjdev/anyclick-core
          </code>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Core Library
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Framework-agnostic core library for UI feedback capture. Provides DOM
          utilities, payload building, screenshot capture, and the adapter
          interface.
        </p>
      </div>

      {/* Installation */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Installation</h2>
        <CodeBlock>{`npm install @ewjdev/anyclick-core`}</CodeBlock>
        <p className="text-gray-400 text-sm mt-2">
          Note: If you&apos;re using{" "}
          <code className="text-cyan-400">@ewjdev/anyclick-react</code>, the
          core library is included as a dependency.
        </p>
      </section>

      {/* Main Exports */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Main Exports</h2>

        {/* FeedbackClient */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 mb-6">
          <h3 className="text-lg font-semibold mb-2">FeedbackClient</h3>
          <p className="text-gray-400 text-sm mb-4">
            The main client class that handles context menu events, DOM capture,
            and feedback submission.
          </p>
          <CodeBlock>{`import { createFeedbackClient } from '@ewjdev/anyclick-core';

const client = createFeedbackClient({
  adapter: myAdapter,
  targetFilter: (event, target) => true, // Optional filter
  maxInnerTextLength: 500,
  maxOuterHTMLLength: 2000,
  maxAncestors: 5,
  cooldownMs: 1000,
});

// Attach to DOM (starts listening for context menu events)
client.attach();

// Submit feedback programmatically
await client.submitFeedback(element, 'issue', {
  comment: 'This button is broken',
  metadata: { userId: '123' },
});

// Detach from DOM
client.detach();`}</CodeBlock>
        </div>

        {/* DOM Utilities */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 mb-6">
          <h3 className="text-lg font-semibold mb-2">DOM Utilities</h3>
          <p className="text-gray-400 text-sm mb-4">
            Helper functions for extracting information from DOM elements.
          </p>
          <CodeBlock>{`import {
  getUniqueSelector,
  getAncestors,
  getDataAttributes,
  buildElementContext,
} from '@ewjdev/anyclick-core';

// Get a unique CSS selector for an element
const selector = getUniqueSelector(element);
// => "button.submit-btn[data-testid='submit']"

// Get ancestor elements with context
const ancestors = getAncestors(element, { maxAncestors: 5 });

// Get all data-* attributes
const dataAttrs = getDataAttributes(element);
// => { testid: 'submit', action: 'save' }

// Build full element context
const context = buildElementContext(element, {
  maxInnerTextLength: 500,
  maxOuterHTMLLength: 2000,
});`}</CodeBlock>
        </div>

        {/* Screenshot Utilities */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 mb-6">
          <h3 className="text-lg font-semibold mb-2">Screenshot Utilities</h3>
          <p className="text-gray-400 text-sm mb-4">
            Functions for capturing screenshots of elements and the page.
          </p>
          <CodeBlock>{`import {
  captureScreenshot,
  captureAllScreenshots,
  isScreenshotSupported,
  DEFAULT_SCREENSHOT_CONFIG,
} from '@ewjdev/anyclick-core';

// Check if screenshots are supported
if (isScreenshotSupported()) {
  // Capture a single element
  const screenshot = await captureScreenshot(element, {
    quality: 0.9,
    pixelRatio: 2,
    format: 'png',
  });

  // Capture target, container, and full page
  const screenshots = await captureAllScreenshots(
    targetElement,
    containerElement,
    { ...DEFAULT_SCREENSHOT_CONFIG }
  );
}`}</CodeBlock>
        </div>

        {/* Payload Building */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Payload Building</h3>
          <p className="text-gray-400 text-sm mb-4">
            Build the full feedback payload with page and element context.
          </p>
          <CodeBlock>{`import { buildFeedbackPayload, buildPageContext } from '@ewjdev/anyclick-core';

// Build page context (URL, viewport, etc.)
const pageContext = buildPageContext();

// Build complete feedback payload
const payload = buildFeedbackPayload({
  element,
  type: 'issue',
  comment: 'Something is wrong here',
  metadata: { userId: '123' },
  screenshots: screenshotData,
});`}</CodeBlock>
        </div>
      </section>

      {/* Types */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Types</h2>

        {/* FeedbackPayload */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 mb-6">
          <h3 className="text-lg font-semibold mb-4">FeedbackPayload</h3>
          <p className="text-gray-400 text-sm mb-4">
            The main payload structure sent to adapters.
          </p>
          <div className="divide-y divide-white/5">
            <TypeDef
              name="type"
              type="FeedbackType"
              description="The feedback type (e.g., 'issue', 'feature', 'like')"
            />
            <TypeDef
              name="timestamp"
              type="string"
              description="ISO timestamp of when feedback was captured"
            />
            <TypeDef
              name="page"
              type="PageContext"
              description="Page-level context (URL, viewport, etc.)"
            />
            <TypeDef
              name="element"
              type="ElementContext"
              description="Target element context (selector, text, etc.)"
            />
            <TypeDef
              name="comment"
              type="string | undefined"
              description="Optional user comment"
            />
            <TypeDef
              name="metadata"
              type="Record<string, unknown>"
              description="Custom metadata from the provider"
            />
            <TypeDef
              name="screenshots"
              type="ScreenshotData | undefined"
              description="Captured screenshots"
            />
          </div>
        </div>

        {/* ElementContext */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 mb-6">
          <h3 className="text-lg font-semibold mb-4">ElementContext</h3>
          <p className="text-gray-400 text-sm mb-4">
            Information captured about the target element.
          </p>
          <div className="divide-y divide-white/5">
            <TypeDef
              name="selector"
              type="string"
              description="Unique CSS selector for the element"
            />
            <TypeDef
              name="tagName"
              type="string"
              description="The element's tag name (lowercase)"
            />
            <TypeDef
              name="innerText"
              type="string"
              description="Truncated inner text content"
            />
            <TypeDef
              name="outerHTML"
              type="string"
              description="Truncated and sanitized outer HTML"
            />
            <TypeDef
              name="dataAttributes"
              type="Record<string, string>"
              description="All data-* attributes"
            />
            <TypeDef
              name="ancestors"
              type="AncestorInfo[]"
              description="Array of ancestor element info"
            />
            <TypeDef
              name="boundingRect"
              type="DOMRect"
              description="Element's bounding rectangle"
            />
          </div>
        </div>

        {/* FeedbackAdapter */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
          <h3 className="text-lg font-semibold mb-4">FeedbackAdapter</h3>
          <p className="text-gray-400 text-sm mb-4">
            Interface that adapters must implement.
          </p>
          <CodeBlock>{`interface FeedbackAdapter {
  submit(payload: FeedbackPayload): Promise<FeedbackResult>;
}

interface FeedbackResult {
  success: boolean;
  id?: string;        // Created resource ID (e.g., issue number)
  url?: string;       // URL to the created resource
  error?: string;     // Error message if failed
}`}</CodeBlock>
        </div>
      </section>

      {/* Screenshot Types */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Screenshot Configuration</h2>

        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
          <h3 className="text-lg font-semibold mb-4">ScreenshotConfig</h3>
          <div className="divide-y divide-white/5">
            <TypeDef
              name="enabled"
              type="boolean"
              description="Whether screenshot capture is enabled"
            />
            <TypeDef
              name="quality"
              type="number"
              description="JPEG quality (0-1), default 0.9"
            />
            <TypeDef
              name="pixelRatio"
              type="number"
              description="Device pixel ratio, default 2"
            />
            <TypeDef
              name="format"
              type="'png' | 'jpeg'"
              description="Image format, default 'png'"
            />
            <TypeDef
              name="maxWidth"
              type="number"
              description="Maximum width in pixels"
            />
            <TypeDef
              name="maxHeight"
              type="number"
              description="Maximum height in pixels"
            />
            <TypeDef
              name="sensitiveSelectors"
              type="string[]"
              description="Selectors to blur/hide in screenshots"
            />
          </div>
        </div>
      </section>

      {/* Custom Adapters */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Building Custom Adapters</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          You can build custom adapters by implementing the{" "}
          <code className="text-cyan-400">FeedbackAdapter</code> interface:
        </p>
        <CodeBlock filename="my-custom-adapter.ts">{`import type { FeedbackAdapter, FeedbackPayload, FeedbackResult } from '@ewjdev/anyclick-core';

export function createCustomAdapter(config: MyConfig): FeedbackAdapter {
  return {
    async submit(payload: FeedbackPayload): Promise<FeedbackResult> {
      try {
        // Your custom logic here
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        const data = await response.json();
        
        return {
          success: true,
          id: data.id,
          url: data.url,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  };
}`}</CodeBlock>
      </section>

      {/* Next steps */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold mb-6">Related</h2>
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
              Use the core library with React applications.
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
              Pre-built adapters for GitHub and Cursor.
            </p>
          </Link>
        </div>
      </section>
    </article>
  );
}
