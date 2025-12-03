# @anyclick/react

React provider and context menu UI for capturing user feedback with rich DOM context. Built on top of `@anyclick/core`.

## Installation

```bash
npm install @anyclick/react @anyclick/core
# or
yarn add @anyclick/react @anyclick/core
# or
pnpm add @anyclick/react @anyclick/core
```

## Quick Start

### 1. Create an Adapter

```tsx
// Using the HTTP adapter from @anyclick/github
import { createHttpAdapter } from '@anyclick/github';

const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
});
```

Or create a simple custom adapter:

```tsx
import { FeedbackAdapter } from '@anyclick/core';

const adapter: FeedbackAdapter = {
  async submitFeedback(payload) {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};
```

### 2. Wrap Your App

```tsx
import { FeedbackProvider } from '@anyclick/react';

export default function App() {
  return (
    <FeedbackProvider adapter={adapter}>
      <YourApp />
    </FeedbackProvider>
  );
}
```

### 3. That's It!

Users can now right-click on any element to see a feedback menu with options to report issues, request features, or give positive feedback.

## Next.js App Router

For Next.js App Router, create a client component wrapper:

```tsx
// components/FeedbackProviderWrapper.tsx
"use client";

import { FeedbackProvider } from "@anyclick/react";
import { createHttpAdapter } from "@anyclick/github";

const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

export function FeedbackProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider adapter={adapter}>
      {children}
    </FeedbackProvider>
  );
}
```

```tsx
// app/layout.tsx
import { FeedbackProviderWrapper } from "@/components/FeedbackProviderWrapper";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FeedbackProviderWrapper>
          {children}
        </FeedbackProviderWrapper>
      </body>
    </html>
  );
}
```

## API Reference

### `<FeedbackProvider>`

Main provider component that enables feedback capture.

```tsx
interface FeedbackProviderProps {
  // Required
  adapter: FeedbackAdapter;
  children: ReactNode;

  // Menu customization
  menuItems?: FeedbackMenuItem[];
  menuStyle?: CSSProperties;
  menuClassName?: string;

  // Highlight customization
  highlightConfig?: HighlightConfig;

  // Core options
  targetFilter?: (event: MouseEvent, target: Element) => boolean;
  maxInnerTextLength?: number;
  maxOuterHTMLLength?: number;
  maxAncestors?: number;
  cooldownMs?: number;
  stripAttributes?: string[];
  metadata?: Record<string, unknown>;

  // Callbacks
  onSubmitSuccess?: (payload: FeedbackPayload) => void;
  onSubmitError?: (error: Error, payload: FeedbackPayload) => void;

  // State
  disabled?: boolean;
}
```

### `useFeedback()` Hook

Access feedback functionality programmatically:

```tsx
import { useFeedback } from '@anyclick/react';

function MyComponent() {
  const { 
    isEnabled,
    isSubmitting,
    submitFeedback,
    openMenu,
    closeMenu,
  } = useFeedback();

  const handleFeedbackClick = (e: React.MouseEvent) => {
    const element = e.currentTarget;
    openMenu(element, { x: e.clientX, y: e.clientY });
  };

  return (
    <button onClick={handleFeedbackClick}>
      Give Feedback
    </button>
  );
}
```

### `<ContextMenu>`

The context menu component (used internally, but exported for customization):

```tsx
interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  targetElement: Element | null;
  items: FeedbackMenuItem[];
  onSelect: (type: FeedbackType, comment?: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
  style?: CSSProperties;
  className?: string;
  highlightConfig?: HighlightConfig;
}
```

## Customization

### Custom Menu Items

```tsx
import { FeedbackProvider, FeedbackMenuItem } from '@anyclick/react';
import { BugIcon, LightbulbIcon, HeartIcon } from 'your-icon-library';

const customMenuItems: FeedbackMenuItem[] = [
  { 
    type: 'issue', 
    label: 'Report Bug', 
    icon: <BugIcon />,
    showComment: true,  // Show comment input
  },
  { 
    type: 'feature', 
    label: 'Suggest Improvement', 
    icon: <LightbulbIcon />,
    showComment: true,
  },
  { 
    type: 'like', 
    label: 'Love it!', 
    icon: <HeartIcon />,
    showComment: false, // No comment input
  },
];

<FeedbackProvider adapter={adapter} menuItems={customMenuItems}>
  {children}
</FeedbackProvider>
```

### Highlight Configuration

Customize the visual highlighting when users right-click:

```tsx
<FeedbackProvider
  adapter={adapter}
  highlightConfig={{
    // Enable/disable highlights entirely
    enabled: true,

    // Customize colors
    colors: {
      targetColor: "#10b981",        // Green for clicked element
      containerColor: "#f59e0b",     // Amber for parent container
      targetShadowOpacity: 0.3,      // Shadow intensity (0-1)
      containerShadowOpacity: 0.15,
    },

    // Custom selectors for container detection
    containerSelectors: [
      ".card",
      ".panel",
      ".modal",
      "[data-container]",
      "article",
      "section",
    ],

    // Min children for fallback container detection
    minChildrenForContainer: 2,
  }}
>
  {children}
</FeedbackProvider>
```

#### Default Highlight Colors

| Property | Default | Description |
|----------|---------|-------------|
| `targetColor` | `#3b82f6` (blue) | Outline color for clicked element |
| `containerColor` | `#8b5cf6` (purple) | Outline color for container parent |
| `targetShadowOpacity` | `0.25` | Shadow opacity for target |
| `containerShadowOpacity` | `0.1` | Shadow opacity for container |

#### Default Container Selectors

```typescript
[
  ".container", ".card", ".panel", ".section", 
  ".wrapper", ".box", ".modal", ".dialog", ".drawer",
  '[role="dialog"]', '[role="region"]', '[role="article"]', '[role="main"]',
  "article", "section", "main", "aside", "nav", "header", "footer"
]
```

### Target Filtering

Control which elements can receive feedback:

```tsx
<FeedbackProvider
  adapter={adapter}
  targetFilter={(event, target) => {
    // Ignore footer elements
    if (target.closest('footer')) return false;
    
    // Ignore elements with specific class
    if (target.classList.contains('no-feedback')) return false;
    
    // Ignore form inputs
    const tag = target.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return false;
    
    return true;
  }}
>
  {children}
</FeedbackProvider>
```

You can also use the `data-feedback-ignore` attribute:

```html
<div data-feedback-ignore>
  <!-- Right-click feedback disabled for this element and children -->
</div>
```

### Custom Menu Styling

```tsx
<FeedbackProvider
  adapter={adapter}
  menuStyle={{
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  }}
  menuClassName="my-feedback-menu"
>
  {children}
</FeedbackProvider>
```

Or use the exported style objects:

```tsx
import { menuStyles, darkMenuStyles } from '@anyclick/react';

// Customize based on theme
const customStyles = isDarkMode ? darkMenuStyles : menuStyles;
```

### Global Metadata

Add metadata to every feedback submission:

```tsx
<FeedbackProvider
  adapter={adapter}
  metadata={{
    appVersion: '2.1.0',
    environment: 'production',
    userId: currentUser?.id,
    sessionId: getSessionId(),
  }}
>
  {children}
</FeedbackProvider>
```

### Callbacks

```tsx
<FeedbackProvider
  adapter={adapter}
  onSubmitSuccess={(payload) => {
    toast.success('Thanks for your feedback!');
    analytics.track('feedback_submitted', { type: payload.type });
  }}
  onSubmitError={(error, payload) => {
    toast.error('Failed to submit feedback');
    errorReporting.capture(error, { payload });
  }}
>
  {children}
</FeedbackProvider>
```

### Privacy Controls

Strip sensitive attributes from captured HTML:

```tsx
<FeedbackProvider
  adapter={adapter}
  stripAttributes={[
    'data-user-id',
    'data-email',
    'data-token',
    'data-password',
  ]}
>
  {children}
</FeedbackProvider>
```

### Rate Limiting

```tsx
<FeedbackProvider
  adapter={adapter}
  cooldownMs={5000} // 5 seconds between submissions
>
  {children}
</FeedbackProvider>
```

### Disabling Feedback

```tsx
const [feedbackEnabled, setFeedbackEnabled] = useState(true);

<FeedbackProvider adapter={adapter} disabled={!feedbackEnabled}>
  {children}
</FeedbackProvider>
```

## Programmatic Usage

### Open Menu on Custom Trigger

```tsx
import { useFeedback } from '@anyclick/react';

function FeedbackButton() {
  const { openMenu } = useFeedback();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (buttonRef.current) {
      openMenu(buttonRef.current, { 
        x: e.clientX, 
        y: e.clientY 
      });
    }
  };

  return (
    <button ref={buttonRef} onClick={handleClick}>
      🐛 Report Issue
    </button>
  );
}
```

### Submit Feedback Directly

```tsx
import { useFeedback } from '@anyclick/react';

function QuickFeedback() {
  const { submitFeedback } = useFeedback();
  const elementRef = useRef<HTMLDivElement>(null);

  const handleQuickLike = async () => {
    if (elementRef.current) {
      await submitFeedback(elementRef.current, 'like', 'Quick like!');
    }
  };

  return (
    <div ref={elementRef}>
      <button onClick={handleQuickLike}>👍 Quick Like</button>
    </div>
  );
}
```

## Highlight Utilities

Use highlight functions directly for custom implementations:

```tsx
import { 
  applyHighlights, 
  clearHighlights, 
  findContainerParent,
  defaultHighlightColors,
  defaultContainerSelectors,
} from '@anyclick/react';

// Apply highlights manually
const { target, container } = applyHighlights(element, {
  colors: { targetColor: '#ff0000' },
});

// Clear all highlights
clearHighlights();

// Find container parent
const containerElement = findContainerParent(element, {
  containerSelectors: ['.my-card', '.my-panel'],
  minChildrenForContainer: 3,
});
```

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  FeedbackMenuItem,
  FeedbackProviderProps,
  FeedbackContextValue,
  ContextMenuProps,
  HighlightColors,
  HighlightConfig,
  // Re-exported from @anyclick/core
  FeedbackType,
  FeedbackPayload,
  FeedbackAdapter,
  ElementContext,
  PageContext,
} from '@anyclick/react';
```

## Complete Example

```tsx
"use client";

import { FeedbackProvider } from '@anyclick/react';
import { createHttpAdapter } from '@anyclick/github';
import { BugIcon, SparklesIcon, HeartIcon } from 'lucide-react';

const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
  headers: {
    'X-App-Version': '2.1.0',
  },
});

const menuItems = [
  { type: 'issue', label: 'Report a Bug', icon: <BugIcon size={16} />, showComment: true },
  { type: 'feature', label: 'Request Feature', icon: <SparklesIcon size={16} />, showComment: true },
  { type: 'like', label: 'I Love This!', icon: <HeartIcon size={16} />, showComment: false },
];

export function FeedbackWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider
      adapter={adapter}
      menuItems={menuItems}
      highlightConfig={{
        enabled: true,
        colors: {
          targetColor: '#3b82f6',
          containerColor: '#8b5cf6',
        },
        containerSelectors: ['.card', '.panel', 'article', 'section'],
      }}
      metadata={{
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
        environment: process.env.NODE_ENV,
      }}
      stripAttributes={['data-user-id', 'data-token']}
      cooldownMs={3000}
      onSubmitSuccess={(payload) => {
        console.log('Feedback submitted:', payload.type);
      }}
      onSubmitError={(error) => {
        console.error('Feedback failed:', error);
      }}
    >
      {children}
    </FeedbackProvider>
  );
}
```

## Related Packages

- [`@anyclick/core`](../uifeedback-core) - Framework-agnostic core library
- [`@anyclick/github`](../uifeedback-github) - HTTP adapter and GitHub Issues integration

## License

MIT

