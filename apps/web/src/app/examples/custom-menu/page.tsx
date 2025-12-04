import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Palette,
  Bug,
  Lightbulb,
  Heart,
  Code,
  Shield,
} from "lucide-react";
import { CodeBlock } from "@/components/CodePreview";

export const metadata: Metadata = {
  title: "Custom Menu Example",
  description:
    "Customized anyclick context menu with branded colors, icons, and role-based items.",
};

export default function CustomMenuExamplePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Custom Menu</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Custom Menu
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Customize the feedback menu with branded colors, custom icons,
          submenus, and role-based visibility.
        </p>
      </div>

      {/* Demo Area */}
      <div className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-cyan-400" />
          Custom Menu Preview
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Right-click this area to see a customized feedback menu with icons and
          custom labels:
        </p>

        {/* Simulated menu preview */}
        <div className="inline-block p-2 rounded-xl bg-[#1a1a2e] border border-white/10 shadow-xl">
          <div className="space-y-1 min-w-[200px]">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
              <Bug className="w-4 h-4 text-rose-400" />
              <span className="text-sm">Report Bug</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-sm">Suggest Feature</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-sm">Love It!</span>
            </button>
            <div className="border-t border-white/5 my-1" />
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
              <Code className="w-4 h-4 text-cyan-400" />
              <span className="text-sm">Developer Tools</span>
              <ArrowRight className="w-3 h-3 ml-auto text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom Icons */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Adding Custom Icons</h2>
        <p className="text-gray-400 mb-4">
          Each menu item can have a custom{" "}
          <code className="text-cyan-400">icon</code> prop. Use any React
          component (Lucide, Heroicons, custom SVGs, etc.):
        </p>
        <CodeBlock filename="app/providers.tsx">{`import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { Bug, Lightbulb, Heart } from 'lucide-react';

const menuItems = [
  { 
    type: 'bug', 
    label: 'Report Bug', 
    icon: <Bug className="w-4 h-4 text-rose-400" />,
    showComment: true,
  },
  { 
    type: 'feature', 
    label: 'Suggest Feature', 
    icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    showComment: true,
  },
  { 
    type: 'love', 
    label: 'Love It!', 
    icon: <Heart className="w-4 h-4 text-pink-400" />,
    showComment: false,
  },
];

<FeedbackProvider adapter={adapter} menuItems={menuItems}>
  {children}
</FeedbackProvider>`}</CodeBlock>
      </div>

      {/* Submenus */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Creating Submenus</h2>
        <p className="text-gray-400 mb-4">
          Add a <code className="text-cyan-400">children</code> array to create
          nested submenus:
        </p>
        <CodeBlock>{`const menuItems = [
  { type: 'bug', label: 'Report Bug', showComment: true },
  { type: 'feature', label: 'Request Feature', showComment: true },
  // Parent item with children creates a submenu
  {
    type: 'developer_menu', // Unique identifier
    label: 'Developer Tools',
    icon: <Code className="w-4 h-4" />,
    children: [
      { 
        type: 'cursor_local', 
        label: 'Fix with Cursor (Local)',
        showComment: true,
      },
      { 
        type: 'cursor_cloud', 
        label: 'Fix with Cursor (Cloud)',
        showComment: true,
      },
      { 
        type: 'copy_selector', 
        label: 'Copy CSS Selector',
        showComment: false,
      },
    ],
  },
];`}</CodeBlock>
      </div>

      {/* Role-Based Filtering */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Role-Based Menu Items</h2>
        <p className="text-gray-400 mb-4">
          Show or hide menu items based on user roles using{" "}
          <code className="text-cyan-400">requiredRoles</code>:
        </p>
        <CodeBlock>{`import { FeedbackProvider, filterMenuItemsByRole } from '@ewjdev/anyclick-react';
import type { FeedbackMenuItem, FeedbackUserContext } from '@ewjdev/anyclick-react';

// Define all menu items with role requirements
const allMenuItems: FeedbackMenuItem[] = [
  // Everyone sees these
  { type: 'bug', label: 'Report Bug', showComment: true },
  { type: 'feature', label: 'Request Feature', showComment: true },
  
  // Only developers and admins see this
  { 
    type: 'debug', 
    label: 'Debug Info', 
    icon: <Code className="w-4 h-4" />,
    requiredRoles: ['developer', 'admin'],
    showComment: false,
  },
  
  // Only admins see this
  { 
    type: 'admin_feedback', 
    label: 'Admin Report', 
    icon: <Shield className="w-4 h-4" />,
    requiredRoles: ['admin'],
    showComment: true,
  },
];

function Providers({ children, currentUser }) {
  // Create user context from your auth system
  const userContext: FeedbackUserContext = {
    roles: currentUser?.roles || [],
    id: currentUser?.id,
    email: currentUser?.email,
  };
  
  // Filter items based on user's roles
  const menuItems = filterMenuItemsByRole(allMenuItems, userContext);
  
  return (
    <FeedbackProvider 
      adapter={adapter} 
      menuItems={menuItems}
      metadata={userContext} // Include user info in feedback
    >
      {children}
    </FeedbackProvider>
  );
}`}</CodeBlock>
      </div>

      {/* Custom Styling */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Custom Menu Styling</h2>
        <p className="text-gray-400 mb-4">
          Apply custom styles or classes to the context menu:
        </p>
        <CodeBlock>{`<FeedbackProvider
  adapter={adapter}
  menuItems={menuItems}
  // Inline styles
  menuStyle={{
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
  }}
  // CSS class name (for Tailwind or custom CSS)
  menuClassName="my-custom-menu"
>
  {children}
</FeedbackProvider>`}</CodeBlock>

        <CodeBlock filename="styles.css">{`/* Custom menu styling */
.my-custom-menu {
  --menu-bg: #1a1a2e;
  --menu-border: rgba(255, 255, 255, 0.1);
  --menu-hover: rgba(255, 255, 255, 0.05);
  --menu-text: #e5e7eb;
  --menu-text-muted: #9ca3af;
}

.my-custom-menu .menu-item:hover {
  transform: translateX(4px);
  transition: transform 0.2s ease;
}`}</CodeBlock>
      </div>

      {/* Highlight Colors */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Custom Highlight Colors</h2>
        <p className="text-gray-400 mb-4">
          Customize the colors used to highlight target and container elements:
        </p>
        <CodeBlock>{`<FeedbackProvider
  adapter={adapter}
  highlightConfig={{
    enabled: true,
    colors: {
      // Target element (what user right-clicked)
      targetColor: '#f43f5e', // Rose
      targetShadowOpacity: 0.3,
      
      // Container element (parent component)
      containerColor: '#8b5cf6', // Violet
      containerShadowOpacity: 0.15,
    },
    // Selectors to identify container elements
    containerSelectors: [
      '[data-component]',
      '[data-testid]',
      '.card',
      'section',
      'article',
    ],
  }}
>
  {children}
</FeedbackProvider>`}</CodeBlock>
      </div>

      {/* Complete Example */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Complete Example</h2>
        <CodeBlock filename="app/providers.tsx">{`'use client';

import { FeedbackProvider, filterMenuItemsByRole } from '@ewjdev/anyclick-react';
import type { FeedbackMenuItem, FeedbackUserContext } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-';
import { Bug, Lightbulb, Heart, Code, Monitor, Cloud, Shield } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

const adapter = createHttpAdapter({ endpoint: '/api/feedback' });

const allMenuItems: FeedbackMenuItem[] = [
  { 
    type: 'bug', 
    label: 'Report Bug', 
    icon: <Bug className="w-4 h-4 text-rose-400" />,
    showComment: true,
  },
  { 
    type: 'feature', 
    label: 'Suggest Feature', 
    icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    showComment: true,
  },
  { 
    type: 'love', 
    label: 'Love It!', 
    icon: <Heart className="w-4 h-4 text-pink-400" />,
    showComment: false,
  },
  {
    type: 'developer_menu',
    label: 'Developer Tools',
    icon: <Code className="w-4 h-4 text-cyan-400" />,
    requiredRoles: ['developer', 'admin'],
    children: [
      { 
        type: 'cursor_local', 
        label: 'Fix Locally',
        icon: <Monitor className="w-4 h-4" />,
        showComment: true,
      },
      { 
        type: 'cursor_cloud', 
        label: 'Fix with AI',
        icon: <Cloud className="w-4 h-4" />,
        showComment: true,
      },
    ],
  },
  { 
    type: 'admin_report', 
    label: 'Admin Report', 
    icon: <Shield className="w-4 h-4 text-emerald-400" />,
    requiredRoles: ['admin'],
    showComment: true,
  },
];

export function Providers({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  
  const userContext: FeedbackUserContext = {
    roles: user?.roles || [],
    id: user?.id,
    email: user?.email,
  };
  
  const menuItems = filterMenuItemsByRole(allMenuItems, userContext);
  
  return (
    <FeedbackProvider
      adapter={adapter}
      menuItems={menuItems}
      metadata={userContext}
      highlightConfig={{
        enabled: true,
        colors: {
          targetColor: '#f43f5e',
          containerColor: '#8b5cf6',
        },
      }}
    >
      {children}
    </FeedbackProvider>
  );
}`}</CodeBlock>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20">
        <h3 className="font-semibold mb-2">Up next</h3>
        <p className="text-gray-400 text-sm mb-4">
          Learn how to integrate with GitHub Issues for automatic issue creation
          with screenshots.
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
