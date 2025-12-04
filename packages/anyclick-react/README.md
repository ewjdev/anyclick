# @ewjdev/anyclick-react

> React provider and context menu UI for UI feedback capture

[![npm version](https://img.shields.io/npm/v/@ewjdev/anyclick-react.svg)](https://www.npmjs.com/package/@ewjdev/anyclick-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@ewjdev/anyclick-react` provides a drop-in React component that adds feedback capture to your application. Right-click any element to open a customizable context menu for submitting feedback.

## Installation

```bash
npm install @ewjdev/anyclick-react
```

## Requirements

- React 19+
- @ewjdev/anyclick-core (included as dependency)

## Quick Start

```tsx
"use client";

import { AnyclickProvider } from "@ewjdev/anyclick-react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";

const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <AnyclickProvider adapter={adapter}>{children}</AnyclickProvider>;
}
```

That's it! Users can now right-click any element to submit feedback.

## Features

- 🖱️ **Right-Click Context Menu** - Native feel with customizable items
- 🎨 **Element Highlighting** - Visual feedback for target and container elements
- 📸 **Screenshot Capture** - Automatic screenshots of target, container, and page
- 🔒 **Role-Based Menu Items** - Show different options based on user roles
- 📱 **Submenus** - Organize menu items with nested submenus
- 🎯 **Scoped Providers** - Limit feedback capture to specific components
- 🎨 **Nested Theming** - Override themes for specific sections of your app

## Props

| Prop              | Type                       | Description                                    |
| ----------------- | -------------------------- | ---------------------------------------------- |
| `adapter`         | `FeedbackAdapter`          | Required. The adapter for submitting feedback  |
| `menuItems`       | `FeedbackMenuItem[]`       | Custom menu items                              |
| `metadata`        | `Record<string, unknown>`  | Additional data included with every submission |
| `theme`           | `AnyclickTheme \| null`    | Theme configuration (inherits from parent)     |
| `scoped`          | `boolean`                  | Limit capture to this provider's children only |
| `disabled`        | `boolean`                  | Disable feedback capture                       |
| `onSubmitSuccess` | `(payload) => void`        | Success callback                               |
| `onSubmitError`   | `(error, payload) => void` | Error callback                                 |

## Scoped Providers

Limit feedback capture to specific sections of your app:

```tsx
import { AnyclickProvider } from "@ewjdev/anyclick-react";

function App() {
  return (
    <AnyclickProvider adapter={globalAdapter}>
      {/* Global feedback works everywhere */}
      <Header />

      {/* Scoped provider - separate configuration */}
      <AnyclickProvider
        adapter={dashboardAdapter}
        scoped
        menuItems={dashboardMenuItems}
      >
        <Dashboard />
      </AnyclickProvider>

      <Footer />
    </AnyclickProvider>
  );
}
```

## Nested Theming

Override themes for specific sections:

```tsx
import { AnyclickProvider } from "@ewjdev/anyclick-react";

function App() {
  return (
    <AnyclickProvider
      adapter={adapter}
      theme={{
        highlightConfig: {
          colors: { targetColor: "#3b82f6" },
        },
      }}
    >
      {/* Uses blue highlights */}
      <MainContent />

      {/* Uses red highlights (overrides parent) */}
      <AnyclickProvider
        scoped
        theme={{
          highlightConfig: {
            colors: { targetColor: "#ef4444" },
          },
        }}
      >
        <WarningSection />
      </AnyclickProvider>

      {/* Disable anyclick for this section */}
      <AnyclickProvider scoped theme={{ disabled: true }}>
        <SensitiveArea />
      </AnyclickProvider>
    </AnyclickProvider>
  );
}
```

## Theme Configuration

```tsx
interface AnyclickTheme {
  menuStyle?: CSSProperties;
  menuClassName?: string;
  highlightConfig?: HighlightConfig;
  screenshotConfig?: ScreenshotConfig;
  disabled?: boolean; // Disable anyclick in this subtree
}
```

## Custom Menu Items

```tsx
import { Bug, Lightbulb, Heart } from "lucide-react";

const menuItems = [
  {
    type: "bug",
    label: "Report Bug",
    icon: <Bug className="w-4 h-4" />,
    showComment: true,
  },
  {
    type: "feature",
    label: "Suggest Feature",
    icon: <Lightbulb className="w-4 h-4" />,
    showComment: true,
  },
  {
    type: "love",
    label: "Love It!",
    icon: <Heart className="w-4 h-4" />,
    showComment: false,
  },
];

<AnyclickProvider adapter={adapter} menuItems={menuItems}>
  {children}
</AnyclickProvider>;
```

## Role-Based Filtering

```tsx
import { filterMenuItemsByRole } from "@ewjdev/anyclick-react";

const allMenuItems = [
  { type: "bug", label: "Report Bug" },
  { type: "debug", label: "Debug Info", requiredRoles: ["developer"] },
];

const userContext = { roles: ["user", "developer"] };
const menuItems = filterMenuItemsByRole(allMenuItems, userContext);
```

## Highlight Configuration

```tsx
<AnyclickProvider
  adapter={adapter}
  theme={{
    highlightConfig: {
      enabled: true,
      colors: {
        targetColor: "#3b82f6",
        containerColor: "#8b5cf6",
      },
      containerSelectors: ["[data-component]", ".card"],
    },
  }}
>
  {children}
</AnyclickProvider>
```

## useAnyclick Hook

Access anyclick context from child components:

```tsx
import { useAnyclick } from "@ewjdev/anyclick-react";

function MyComponent() {
  const { isSubmitting, openMenu, closeMenu, theme, scoped, providerId } =
    useAnyclick();

  // Open menu programmatically
  const handleClick = (event) => {
    openMenu(event.currentTarget, { x: event.clientX, y: event.clientY });
  };

  return <button onClick={handleClick}>Open Feedback</button>;
}
```

## Migration from FeedbackProvider

The `FeedbackProvider` component has been renamed to `AnyclickProvider`. The old name is still exported for backward compatibility but is deprecated:

```tsx
// Old (deprecated)
import { FeedbackProvider, useFeedback } from "@ewjdev/anyclick-react";

// New (recommended)
import { AnyclickProvider, useAnyclick } from "@ewjdev/anyclick-react";
```

## Documentation

For full documentation, visit [anyclick.ewj.dev/docs/react](https://anyclick.ewj.dev/docs/react)

## Related Packages

- [`@ewjdev/anyclick-core`](https://www.npmjs.com/package/@ewjdev/anyclick-core) - Core library
- [`@ewjdev/anyclick-github`](https://www.npmjs.com/package/@ewjdev/anyclick-github) - GitHub Issues integration
- [`@ewjdev/anyclick-cursor`](https://www.npmjs.com/package/@ewjdev/anyclick-cursor) - Cursor AI integration

## License

MIT © [anyclick](https://anyclick.ewj.dev)
