import { CodeBlock } from "@/components/CodePreview";
import { ArrowRight, Check, MousePointerClick } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ScopedProvidersDemo } from "./ScopedProvidersDemo";

export const metadata: Metadata = {
  title: "Scoped & Nested Providers",
  description:
    "Learn how to use scoped providers and nested theming for granular control over feedback capture.",
};

export default function ScopedProvidersExamplePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Scoped & Nested Providers</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Scoped & Nested Providers
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Control feedback capture at a granular level with scoped providers and
          nested theming. Perfect for complex applications with different
          feedback requirements per section.
        </p>
      </div>

      {/* Demo Area */}
      <div className="mb-12 p-8 rounded-2xl bg-linear-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MousePointerClick className="w-5 h-5 text-violet-400" />
          Try It
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Right-click elements in different sections to see how scoped providers
          work. Notice the different highlight colors and behavior:
        </p>

        <ScopedProvidersDemo />
      </div>

      {/* What you get */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Use Cases</h2>
        <ul className="space-y-3">
          {[
            "Different feedback configurations per page section",
            "Custom theming for specific components (colors, styles)",
            "Disable feedback in sensitive areas (forms, payments)",
            "Separate adapters for different feedback destinations",
            "Role-based feedback with different menu items per section",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Implementation */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Implementation</h2>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          1. Basic Scoped Provider
        </h3>
        <p className="text-gray-400 mb-4">
          Use the <code className="text-cyan-400">scoped</code> prop to limit
          feedback capture to a specific section:
        </p>
        <CodeBlock filename="components/Dashboard.tsx">{`'use client';

import { AnyclickProvider } from '@ewjdev/anyclick-react';

export function Dashboard({ children }) {
  return (
    <AnyclickProvider 
      adapter={dashboardAdapter}
      scoped // Only captures events within this provider's children
      menuItems={dashboardMenuItems}
    >
      {children}
    </AnyclickProvider>
  );
}`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">2. Nested Theming</h3>
        <p className="text-gray-400 mb-4">
          Child providers inherit and can override parent themes:
        </p>
        <CodeBlock filename="app/layout.tsx">{`'use client';

import { AnyclickProvider } from '@ewjdev/anyclick-react';

export function Providers({ children }) {
  return (
    // Root provider with blue highlights
    <AnyclickProvider 
      adapter={adapter}
      theme={{
        highlightConfig: {
          colors: { 
            targetColor: '#3b82f6', // Blue
            containerColor: '#8b5cf6', // Purple
          }
        }
      }}
    >
      <Header />
      <main>{children}</main>
      
      {/* Nested provider with custom rose theme */}
      <AnyclickProvider 
        scoped
        theme={{
          highlightConfig: {
            colors: { 
              targetColor: '#f43f5e', // Rose
              containerColor: '#ec4899', // Pink
            }
          }
        }}
      >
        <SpecialSection />
      </AnyclickProvider>
      
      <Footer />
    </AnyclickProvider>
  );
}`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          3. Scoped Pointer Theming
        </h3>
        <p className="text-gray-400 mb-4">
          To have different pointer (cursor) themes per section, wrap with both{" "}
          <code className="text-cyan-400">AnyclickProvider</code> and{" "}
          <code className="text-cyan-400">PointerProvider</code>:
        </p>
        <CodeBlock filename="components/RoseSection.tsx">{`'use client';

import { AnyclickProvider } from '@ewjdev/anyclick-react';
import { PointerProvider } from '@ewjdev/anyclick-pointer';
import { MousePointer2 } from 'lucide-react';

export function RoseSection({ children }) {
  return (
    <AnyclickProvider 
      scoped
      theme={{
        highlightConfig: {
          colors: { 
            targetColor: '#f43f5e', // Rose highlights
            containerColor: '#ec4899',
          }
        }
      }}
    >
      <PointerProvider
        theme={{
          colors: {
            pointerColor: '#f43f5e', // Rose pointer
            circleColor: 'rgba(244, 63, 94, 0.4)',
          },
          pointerIcon: (
            <MousePointer2 size={24} fill="rgba(244, 63, 94, 0.3)" stroke="#f43f5e" />
          ),
        }}
        config={{ visibility: 'always', hideDefaultCursor: true }}
      >
        {children}
      </PointerProvider>
    </AnyclickProvider>
  );
}`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          4. Disabling Feedback & Pointer
        </h3>
        <p className="text-gray-400 mb-4">
          Disable both feedback and custom pointer for sensitive areas:
        </p>
        <CodeBlock filename="components/PaymentForm.tsx">{`'use client';

import { AnyclickProvider } from '@ewjdev/anyclick-react';
import { PointerProvider } from '@ewjdev/anyclick-pointer';

export function PaymentForm({ children }) {
  return (
    // Disable feedback
    <AnyclickProvider scoped theme={{ disabled: true }}>
      {/* Disable custom pointer, show default cursor */}
      <PointerProvider config={{ visibility: 'never', hideDefaultCursor: false }}>
        <form>
          <input type="text" placeholder="Card Number" />
          <input type="text" placeholder="CVV" />
          <button type="submit">Pay Now</button>
        </form>
      </PointerProvider>
    </AnyclickProvider>
  );
}`}</CodeBlock>

        <h3 className="text-lg font-semibold mb-3 mt-8">
          5. Different Adapters Per Section
        </h3>
        <p className="text-gray-400 mb-4">
          Route feedback to different destinations based on the section:
        </p>
        <CodeBlock filename="app/layout.tsx">{`'use client';

import { AnyclickProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

// Main app feedback goes to GitHub
const githubAdapter = createHttpAdapter({
  endpoint: '/api/feedback/github',
});

// Dashboard feedback goes to internal tool
const internalAdapter = createHttpAdapter({
  endpoint: '/api/feedback/internal',
});

export function Providers({ children }) {
  return (
    <AnyclickProvider adapter={githubAdapter}>
      <Header />
      
      {/* Dashboard uses different adapter */}
      <AnyclickProvider 
        adapter={internalAdapter}
        scoped
        menuItems={internalMenuItems}
      >
        <Dashboard />
      </AnyclickProvider>
      
      <Footer />
    </AnyclickProvider>
  );
}`}</CodeBlock>
      </div>

      {/* Theme Configuration */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Theme Configuration</h2>
        <p className="text-gray-400 mb-4">
          The <code className="text-cyan-400">AnyclickTheme</code> interface:
        </p>
        <CodeBlock>{`interface AnyclickTheme {
  // Custom styles for the context menu
  menuStyle?: CSSProperties;
  
  // Custom class name for the context menu
  menuClassName?: string;
  
  // Highlight configuration
  highlightConfig?: {
    enabled?: boolean;
    colors?: {
      targetColor?: string;
      containerColor?: string;
      targetShadowOpacity?: number;
      containerShadowOpacity?: number;
    };
    containerSelectors?: string[];
  };
  
  // Screenshot configuration
  screenshotConfig?: ScreenshotConfig;
  
  // Disable anyclick in this subtree
  disabled?: boolean;
}`}</CodeBlock>
      </div>

      {/* useAnyclick Hook */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">useAnyclick Hook</h2>
        <p className="text-gray-400 mb-4">
          Access the current provider context, including the merged theme:
        </p>
        <CodeBlock>{`import { useAnyclick } from '@ewjdev/anyclick-react';

function MyComponent() {
  const { 
    isEnabled,      // Whether feedback is enabled
    isSubmitting,   // Whether submission is in progress
    theme,          // Merged theme (includes parent themes)
    scoped,         // Whether this provider is scoped
    providerId,     // Unique ID for this provider
    openMenu,       // Open menu programmatically
    closeMenu,      // Close menu
    submitFeedback, // Submit feedback programmatically
  } = useAnyclick();
  
  return (
    <div>
      <p>Feedback enabled: {isEnabled ? 'Yes' : 'No'}</p>
      <p>Current highlight color: {theme.highlightConfig?.colors?.targetColor}</p>
    </div>
  );
}`}</CodeBlock>
      </div>

      {/* Event Bubbling */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Event Handling</h2>
        <p className="text-gray-400 mb-4">
          When nested providers exist, events bubble from the nearest provider
          to the outermost. The nearest non-disabled provider handles the event:
        </p>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <pre className="text-sm text-gray-400 font-mono">
            {`<AnyclickProvider adapter={a1}>      ← Handles if inner is disabled
  <AnyclickProvider scoped adapter={a2}>  ← Handles first (nearest)
    <Button />  ← Right-click here
  </AnyclickProvider>
</AnyclickProvider>`}
          </pre>
        </div>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-xl bg-linear-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <h3 className="font-semibold mb-2">Explore More</h3>
        <p className="text-gray-400 text-sm mb-4">
          Learn about other advanced features like custom pointers and sensitive
          data masking.
        </p>
        <div className="flex gap-4">
          <Link
            href="/examples/custom-pointer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
          >
            Custom Pointer
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/examples/sensitive-masking"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
          >
            Sensitive Masking
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
