import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileCode } from "lucide-react";

export const metadata: Metadata = {
  title: "@ewjdev/anyclick-react",
  description:
    "React provider and context menu UI for anyclick - drop-in feedback capture for React applications.",
};

function CodeBlock({
  children,
  filename,
}: {
  children: string;
  filename?: string;
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

function PropDef({
  name,
  type,
  defaultValue,
  description,
  required,
}: {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
  required?: boolean;
}) {
  return (
    <div className="py-4 border-b border-white/5 last:border-0">
      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <code className="text-cyan-400 text-sm">{name}</code>
        {required && <span className="text-xs text-rose-400">required</span>}
        <code className="text-gray-500 text-xs">{type}</code>
        {defaultValue && (
          <span className="text-xs text-gray-500">
            default: <code className="text-amber-400">{defaultValue}</code>
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

export default function ReactDocsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="not-prose mb-12">
        <div className="flex items-center gap-3 mb-4">
          <code className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-lg font-mono">
            @ewjdev/anyclick-react
          </code>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          React Provider
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Drop-in React provider and context menu UI for feedback capture.
          Handles all event management, UI rendering, and screenshot capture.
        </p>
      </div>

      {/* Installation */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Installation</h2>
        <CodeBlock>{`npm install @ewjdev/anyclick-react`}</CodeBlock>
        <p className="text-gray-400 text-sm mt-2">
          Requires React 19+ and includes{" "}
          <code className="text-cyan-400">@ewjdev/anyclick-core</code> as a
          dependency.
        </p>
      </section>

      {/* Basic Usage */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Basic Usage</h2>
        <CodeBlock filename="app/providers.tsx">{`'use client';

import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider adapter={adapter}>
      {children}
    </FeedbackProvider>
  );
}`}</CodeBlock>
      </section>

      {/* Props Reference */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">FeedbackProvider Props</h2>

        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
          <PropDef
            name="adapter"
            type="FeedbackAdapter"
            description="The adapter to use for submitting feedback. See adapters documentation for available options."
            required
          />
          <PropDef
            name="children"
            type="ReactNode"
            description="Child components to wrap with the feedback provider."
            required
          />
          <PropDef
            name="menuItems"
            type="FeedbackMenuItem[]"
            defaultValue="[issue, feature, like]"
            description="Custom menu items to show in the context menu. Each item can have type, label, icon, and children for submenus."
          />
          <PropDef
            name="metadata"
            type="Record<string, unknown>"
            description="Additional metadata to include with every feedback submission. Useful for user ID, session ID, etc."
          />
          <PropDef
            name="targetFilter"
            type="(event: MouseEvent, target: Element) => boolean"
            description="Filter function to determine if feedback should be captured for a target element. Return false to ignore."
          />
          <PropDef
            name="highlightConfig"
            type="HighlightConfig"
            description="Configuration for element highlighting behavior and colors."
          />
          <PropDef
            name="screenshotConfig"
            type="ScreenshotConfig"
            description="Configuration for screenshot capture settings (quality, format, etc.)."
          />
          <PropDef
            name="maxInnerTextLength"
            type="number"
            defaultValue="500"
            description="Maximum length for captured inner text content."
          />
          <PropDef
            name="maxOuterHTMLLength"
            type="number"
            defaultValue="2000"
            description="Maximum length for captured outer HTML."
          />
          <PropDef
            name="maxAncestors"
            type="number"
            defaultValue="5"
            description="Maximum number of ancestor elements to capture."
          />
          <PropDef
            name="cooldownMs"
            type="number"
            defaultValue="1000"
            description="Cooldown in milliseconds between submissions (rate limiting)."
          />
          <PropDef
            name="stripAttributes"
            type="string[]"
            description="HTML attributes to strip from captured outerHTML for privacy."
          />
          <PropDef
            name="onSubmitSuccess"
            type="(payload: FeedbackPayload) => void"
            description="Callback fired after successful submission."
          />
          <PropDef
            name="onSubmitError"
            type="(error: Error, payload: FeedbackPayload) => void"
            description="Callback fired after failed submission."
          />
          <PropDef
            name="menuStyle"
            type="CSSProperties"
            description="Custom inline styles for the context menu."
          />
          <PropDef
            name="menuClassName"
            type="string"
            description="Custom CSS class name for the context menu."
          />
          <PropDef
            name="disabled"
            type="boolean"
            defaultValue="false"
            description="Disable feedback capture entirely."
          />
        </div>
      </section>

      {/* Custom Menu Items */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Custom Menu Items</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Customize the feedback menu with your own items, icons, and submenus:
        </p>
        <CodeBlock filename="app/providers.tsx">{`import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { Bug, Lightbulb, ThumbsUp, Code, Monitor, Cloud } from 'lucide-react';

const menuItems = [
  { 
    type: 'bug', 
    label: 'Report Bug', 
    icon: <Bug className="w-4 h-4" />,
    showComment: true,
  },
  { 
    type: 'feature', 
    label: 'Suggest Feature', 
    icon: <Lightbulb className="w-4 h-4" />,
    showComment: true,
  },
  { 
    type: 'praise', 
    label: 'This is great!', 
    icon: <ThumbsUp className="w-4 h-4" />,
    showComment: false,
  },
  // Submenu example
  {
    type: 'dev_menu',
    label: 'Developer Tools',
    icon: <Code className="w-4 h-4" />,
    requiredRoles: ['developer', 'admin'], // Role-based visibility
    children: [
      { type: 'cursor_local', label: 'Fix with Cursor (Local)', icon: <Monitor className="w-4 h-4" /> },
      { type: 'cursor_cloud', label: 'Fix with Cursor (Cloud)', icon: <Cloud className="w-4 h-4" /> },
    ],
  },
];

<FeedbackProvider adapter={adapter} menuItems={menuItems}>
  {children}
</FeedbackProvider>`}</CodeBlock>
      </section>

      {/* Role-Based Filtering */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Role-Based Menu Filtering</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Show different menu items based on user roles:
        </p>
        <CodeBlock>{`import { FeedbackProvider, filterMenuItemsByRole } from '@ewjdev/anyclick-react';
import type { FeedbackMenuItem, FeedbackUserContext } from '@ewjdev/anyclick-react';

const allMenuItems: FeedbackMenuItem[] = [
  { type: 'issue', label: 'Report Issue', showComment: true },
  { type: 'feature', label: 'Request Feature', showComment: true },
  // Only visible to developers
  { 
    type: 'debug', 
    label: 'Debug Info', 
    requiredRoles: ['developer'],
  },
];

function Providers({ children, user }) {
  const userContext: FeedbackUserContext = {
    roles: user.roles,
    id: user.id,
    email: user.email,
  };
  
  const menuItems = filterMenuItemsByRole(allMenuItems, userContext);
  
  return (
    <FeedbackProvider 
      adapter={adapter} 
      menuItems={menuItems}
      metadata={userContext}
    >
      {children}
    </FeedbackProvider>
  );
}`}</CodeBlock>
      </section>

      {/* Highlight Configuration */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Highlight Configuration</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Customize how elements are highlighted when the context menu is open:
        </p>
        <CodeBlock>{`<FeedbackProvider
  adapter={adapter}
  highlightConfig={{
    enabled: true,
    colors: {
      targetColor: '#3b82f6',      // Blue for target element
      containerColor: '#8b5cf6',   // Purple for container
      targetShadowOpacity: 0.25,
      containerShadowOpacity: 0.1,
    },
    containerSelectors: [
      '[data-component]',
      '[data-section]',
      '.card',
      'section',
    ],
    minChildrenForContainer: 2,
  }}
>
  {children}
</FeedbackProvider>`}</CodeBlock>
      </section>

      {/* Screenshot Configuration */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">Screenshot Configuration</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Control screenshot capture behavior:
        </p>
        <CodeBlock>{`<FeedbackProvider
  adapter={adapter}
  screenshotConfig={{
    enabled: true,
    quality: 0.9,
    pixelRatio: 2,
    format: 'png',
    maxWidth: 1920,
    maxHeight: 1080,
    // Selectors to blur for privacy
    sensitiveSelectors: [
      '[data-sensitive]',
      '.credit-card-input',
      'input[type="password"]',
    ],
  }}
>
  {children}
</FeedbackProvider>`}</CodeBlock>
      </section>

      {/* useFeedback Hook */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">useFeedback Hook</h2>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Access feedback context from child components:
        </p>
        <CodeBlock>{`import { useFeedback } from '@ewjdev/anyclick-react';

function MyComponent() {
  const { 
    isEnabled, 
    isSubmitting, 
    submitFeedback, 
    openMenu,
    closeMenu 
  } = useFeedback();
  
  // Open menu programmatically
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    openMenu(
      event.currentTarget,
      { x: event.clientX, y: event.clientY }
    );
  };
  
  // Submit feedback programmatically
  const handleSubmit = async () => {
    await submitFeedback(
      document.querySelector('#my-element')!,
      'issue',
      'This element has a problem'
    );
  };
  
  return (
    <button onClick={handleClick} disabled={isSubmitting}>
      {isSubmitting ? 'Submitting...' : 'Open Feedback'}
    </button>
  );
}`}</CodeBlock>
      </section>

      {/* Exports */}
      <section className="not-prose mb-12">
        <h2 className="text-2xl font-bold mb-4">All Exports</h2>
        <CodeBlock>{`// Components
export { FeedbackProvider } from './FeedbackProvider';
export { ContextMenu } from './ContextMenu';
export { ScreenshotPreview } from './ScreenshotPreview';

// Context & Hooks
export { FeedbackContext, useFeedback } from './context';

// Utilities
export { filterMenuItemsByRole } from './types';

// Types
export type {
  FeedbackProviderProps,
  FeedbackContextValue,
  FeedbackMenuItem,
  FeedbackUserContext,
  ContextMenuProps,
  ScreenshotPreviewProps,
  HighlightConfig,
  HighlightColors,
} from './types';`}</CodeBlock>
      </section>

      {/* Next steps */}
      <section className="not-prose">
        <h2 className="text-2xl font-bold mb-6">Related</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/docs/adapters"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all"
          >
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              Adapters
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-gray-400 text-sm">
              Connect to GitHub, Cursor, or build custom adapters.
            </p>
          </Link>

          <Link
            href="/examples/custom-menu"
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all"
          >
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              Custom Menu Example
              <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-gray-400 text-sm">
              See custom menu styling and submenus in action.
            </p>
          </Link>
        </div>
      </section>
    </article>
  );
}
