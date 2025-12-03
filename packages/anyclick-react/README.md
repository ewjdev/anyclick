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
'use client';

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
}
```

That's it! Users can now right-click any element to submit feedback.

## Features

- 🖱️ **Right-Click Context Menu** - Native feel with customizable items
- 🎨 **Element Highlighting** - Visual feedback for target and container elements
- 📸 **Screenshot Capture** - Automatic screenshots of target, container, and page
- 🔒 **Role-Based Menu Items** - Show different options based on user roles
- 📱 **Submenus** - Organize menu items with nested submenus

## Props

| Prop | Type | Description |
|------|------|-------------|
| `adapter` | `FeedbackAdapter` | Required. The adapter for submitting feedback |
| `menuItems` | `FeedbackMenuItem[]` | Custom menu items |
| `metadata` | `Record<string, unknown>` | Additional data included with every submission |
| `highlightConfig` | `HighlightConfig` | Configure element highlighting |
| `screenshotConfig` | `ScreenshotConfig` | Configure screenshot capture |
| `disabled` | `boolean` | Disable feedback capture |
| `onSubmitSuccess` | `(payload) => void` | Success callback |
| `onSubmitError` | `(error, payload) => void` | Error callback |

## Custom Menu Items

```tsx
import { Bug, Lightbulb, Heart } from 'lucide-react';

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
    type: 'love', 
    label: 'Love It!', 
    icon: <Heart className="w-4 h-4" />,
    showComment: false,
  },
];

<FeedbackProvider adapter={adapter} menuItems={menuItems}>
  {children}
</FeedbackProvider>
```

## Role-Based Filtering

```tsx
import { filterMenuItemsByRole } from '@ewjdev/anyclick-react';

const allMenuItems = [
  { type: 'bug', label: 'Report Bug' },
  { type: 'debug', label: 'Debug Info', requiredRoles: ['developer'] },
];

const userContext = { roles: ['user', 'developer'] };
const menuItems = filterMenuItemsByRole(allMenuItems, userContext);
```

## Highlight Configuration

```tsx
<FeedbackProvider
  adapter={adapter}
  highlightConfig={{
    enabled: true,
    colors: {
      targetColor: '#3b82f6',
      containerColor: '#8b5cf6',
    },
    containerSelectors: ['[data-component]', '.card'],
  }}
>
  {children}
</FeedbackProvider>
```

## useFeedback Hook

Access feedback context from child components:

```tsx
import { useFeedback } from '@ewjdev/anyclick-react';

function MyComponent() {
  const { isSubmitting, openMenu, closeMenu } = useFeedback();
  
  // Open menu programmatically
  const handleClick = (event) => {
    openMenu(event.currentTarget, { x: event.clientX, y: event.clientY });
  };
  
  return <button onClick={handleClick}>Open Feedback</button>;
}
```

## Documentation

For full documentation, visit [anyclick.ewj.dev/docs/react](https://anyclick.ewj.dev/docs/react)

## Related Packages

- [`@ewjdev/anyclick-core`](https://www.npmjs.com/package/@ewjdev/anyclick-core) - Core library
- [`@ewjdev/anyclick-github`](https://www.npmjs.com/package/@ewjdev/anyclick-github) - GitHub Issues integration
- [`@ewjdev/anyclick-cursor`](https://www.npmjs.com/package/@ewjdev/anyclick-cursor) - Cursor AI integration

## License

MIT © [anyclick](https://anyclick.ewj.dev)
