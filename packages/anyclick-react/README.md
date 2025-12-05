# @ewjdev/anyclick-react

> React provider and context menu UI for UI feedback capture

[![npm version](https://img.shields.io/npm/v/@ewjdev/anyclick-react.svg)](https://www.npmjs.com/package/@ewjdev/anyclick-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@ewjdev/anyclick-react` provides a drop-in React component that adds feedback capture to your application. Right-click any element to open a customizable context menu for submitting feedback.

## Installation

```bash
npm install @ewjdev/anyclick-react
# or
yarn add @ewjdev/anyclick-react
# or
pnpm add @ewjdev/anyclick-react
```

## Requirements

- React 19+
- @ewjdev/anyclick-core (included as dependency)

## Quick Start

```tsx
"use client";

import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { AnyclickProvider } from "@ewjdev/anyclick-react";

const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <AnyclickProvider adapter={adapter}>{children}</AnyclickProvider>;
}
```

That's it! Users can now right-click any element to submit feedback.

### Advanced inspector (DevTools UI)

For the full Chrome DevTools-style inspector (modification tracking, box model overlay, accessibility deep dive), install the dedicated package:

```bash
npm install @ewjdev/anyclick-devtools
```

```tsx
import {
  InspectDialogManager,
  openInspectDialog,
} from "@ewjdev/anyclick-devtools";

// Place once near the root
<InspectDialogManager />;

// Trigger from a menu item or button
openInspectDialog(targetElement);
```

`@ewjdev/anyclick-react` keeps the tiny inspector for quick selector/copy/screenshot flows, while `@ewjdev/anyclick-devtools` hosts the full-featured experience.

## Features

- 🖱️ **Right-Click Context Menu** - Native feel with customizable items
- 📱 **Touch Support** - Press-and-hold on mobile devices
- 🎨 **Element Highlighting** - Visual feedback for target and container elements
- 📸 **Screenshot Capture** - Automatic screenshots of target, container, and viewport
- 🔒 **Role-Based Menu Items** - Show different options based on user roles
- 📁 **Submenus** - Organize menu items with nested submenus
- 🎯 **Scoped Providers** - Limit feedback capture to specific components
- 🎨 **Nested Theming** - Override themes for specific sections of your app
- 🔍 **Tiny Inspector** - Built-in lightweight inspector (selector, contents, screenshot); full DevTools UI now lives in `@ewjdev/anyclick-devtools`
- ⚡ **Performance Optimized** - Memoized components and efficient re-renders

## API Reference

### AnyclickProvider Props

| Prop                  | Type                       | Default     | Description                                    |
| --------------------- | -------------------------- | ----------- | ---------------------------------------------- |
| `adapter`             | `AnyclickAdapter`          | Required    | The adapter for submitting feedback            |
| `menuItems`           | `ContextMenuItem[]`        | Default set | Custom menu items                              |
| `metadata`            | `Record<string, unknown>`  | `undefined` | Additional data included with every submission |
| `theme`               | `AnyclickTheme \| null`    | `undefined` | Theme configuration (inherits from parent)     |
| `scoped`              | `boolean`                  | `false`     | Limit capture to this provider's children only |
| `disabled`            | `boolean`                  | `false`     | Disable anyclick capture                       |
| `highlightConfig`     | `HighlightConfig`          | Default     | Element highlighting configuration             |
| `screenshotConfig`    | `ScreenshotConfig`         | Default     | Screenshot capture configuration               |
| `onSubmitSuccess`     | `(payload) => void`        | `undefined` | Success callback                               |
| `onSubmitError`       | `(error, payload) => void` | `undefined` | Error callback                                 |
| `touchHoldDurationMs` | `number`                   | `500`       | Touch hold duration before triggering menu     |
| `touchMoveThreshold`  | `number`                   | `10`        | Max movement in px before touch hold cancels   |

### AnyclickTheme

```tsx
interface AnyclickTheme {
  /** Custom styles for the context menu */
  menuStyle?: CSSProperties;
  /** Custom class name for the context menu */
  menuClassName?: string;
  /** Configuration for element highlighting */
  highlightConfig?: HighlightConfig;
  /** Configuration for screenshot capture */
  screenshotConfig?: ScreenshotConfig;
  /** Disable anyclick in this subtree */
  disabled?: boolean;
  /** Enable fun mode (go-kart cursor) */
  funMode?: boolean | FunModeThemeConfig;
}
```

### ContextMenuItem

```tsx
interface ContextMenuItem {
  /** Unique type identifier */
  type: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Show comment input after selection */
  showComment?: boolean;
  /** Status badge (e.g., "comingSoon") */
  status?: "available" | "comingSoon";
  /** Visual badge configuration */
  badge?: { label: string; tone?: "neutral" | "info" | "warning" | "success" };
  /** Required roles to see this item */
  requiredRoles?: string[];
  /** Nested submenu items */
  children?: ContextMenuItem[];
  /** Custom click handler */
  onClick?: (context: {
    targetElement: Element | null;
    containerElement: Element | null;
    closeMenu: () => void;
  }) => void | boolean | Promise<void | boolean>;
}
```

### HighlightConfig

```tsx
interface HighlightConfig {
  /** Enable/disable highlighting */
  enabled?: boolean;
  /** Custom highlight colors */
  colors?: {
    targetColor?: string; // Default: "#3b82f6"
    containerColor?: string; // Default: "#8b5cf6"
    targetShadowOpacity?: number; // Default: 0.25
    containerShadowOpacity?: number; // Default: 0.1
  };
  /** CSS selectors to identify container elements */
  containerSelectors?: string[];
  /** Minimum children count for auto-container detection */
  minChildrenForContainer?: number;
}
```

## Examples

### Scoped Providers

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

### Nested Theming

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

### Custom Menu Items

```tsx
import { Bug, Heart, Lightbulb } from "lucide-react";

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

### Role-Based Filtering

```tsx
import { filterMenuItemsByRole } from "@ewjdev/anyclick-react";

const allMenuItems = [
  { type: "bug", label: "Report Bug" },
  { type: "debug", label: "Debug Info", requiredRoles: ["developer"] },
];

const userContext = { roles: ["user", "developer"] };
const menuItems = filterMenuItemsByRole(allMenuItems, userContext);
```

### Role-Based Presets

Skip hand-authoring menus by pulling in a preset for common roles:

```tsx
import { AnyclickProvider, createPresetMenu } from "@ewjdev/anyclick-react";

const qaPreset = createPresetMenu("qa");
// Available presets: "qa", "pm", "designer", "developer", "chrome"

<AnyclickProvider
  adapter={adapter}
  menuItems={qaPreset.menuItems}
  screenshotConfig={qaPreset.screenshotConfig}
  metadata={qaPreset.metadata}
  theme={qaPreset.theme}
>
  {children}
</AnyclickProvider>;
```

**Available Presets:**

| Preset      | Description                                                       |
| ----------- | ----------------------------------------------------------------- |
| `qa`        | Bug/defect, UX papercut, repro steps, + performance trace (soon)  |
| `pm`        | Feature idea, UX papercut, customer quote, + impact sizing (soon) |
| `designer`  | Visual bug, accessibility, copy/tone, + motion glitch (soon)      |
| `developer` | Bug, refactor request, + diagnostics submenu                      |
| `chrome`    | Chrome-like menu with reload, print, search, share, inspect       |

### useAnyclick Hook

Access anyclick context from child components:

```tsx
import { useAnyclick } from "@ewjdev/anyclick-react";

function MyComponent() {
  const {
    isEnabled, // Whether anyclick is active
    isSubmitting, // Whether a submission is in progress
    openMenu, // Open menu programmatically
    closeMenu, // Close menu
    theme, // Current merged theme
    scoped, // Whether provider is scoped
    providerId, // Unique provider ID
  } = useAnyclick();

  const handleClick = (event) => {
    openMenu(event.currentTarget, { x: event.clientX, y: event.clientY });
  };

  return <button onClick={handleClick}>Open Feedback</button>;
}
```

### Custom Styling with CSS Variables

Override menu styling using CSS custom properties:

```tsx
<AnyclickProvider
  adapter={adapter}
  theme={{
    menuStyle: {
      "--anyclick-menu-bg": "rgba(0, 0, 0, 0.9)",
      "--anyclick-menu-text": "#ffffff",
      "--anyclick-menu-border": "rgba(255, 255, 255, 0.1)",
      "--anyclick-menu-hover": "rgba(255, 255, 255, 0.1)",
      "--anyclick-menu-accent": "#f59e0b",
    },
  }}
>
  {children}
</AnyclickProvider>
```

**Available CSS Variables:**

| Variable                       | Default   | Description              |
| ------------------------------ | --------- | ------------------------ |
| `--anyclick-menu-bg`           | `#ffffff` | Menu background color    |
| `--anyclick-menu-hover`        | `#f5f5f5` | Item hover background    |
| `--anyclick-menu-text`         | `#333333` | Primary text color       |
| `--anyclick-menu-text-muted`   | `#666666` | Muted text color         |
| `--anyclick-menu-border`       | `#e5e5e5` | Border color             |
| `--anyclick-menu-accent`       | `#0066cc` | Accent/action color      |
| `--anyclick-menu-accent-text`  | `#ffffff` | Accent text color        |
| `--anyclick-menu-input-bg`     | `#ffffff` | Input background         |
| `--anyclick-menu-input-border` | `#dddddd` | Input border color       |
| `--anyclick-menu-cancel-bg`    | `#f0f0f0` | Cancel button background |
| `--anyclick-menu-cancel-text`  | `#666666` | Cancel button text       |

## Performance Considerations

The package is optimized for performance:

- Components use `React.memo` to prevent unnecessary re-renders
- Expensive computations are wrapped in `useMemo`
- Event handlers use `useCallback` for stable references
- Screenshot capture is lazy-loaded and async
- Touch event handling uses passive listeners where possible

## Migration from FeedbackProvider

The `FeedbackProvider` component has been renamed to `AnyclickProvider`. The old name is still exported for backward compatibility but is deprecated:

```tsx
// Old (deprecated)
import { FeedbackProvider, useFeedback } from "@ewjdev/anyclick-react";
// New (recommended)
import { AnyclickProvider, useAnyclick } from "@ewjdev/anyclick-react";
```

## Exported Utilities

```tsx
// Components
export { AnyclickProvider, ContextMenu, ScreenshotPreview, InspectDialog };

// Hooks
export { useAnyclick, useProviderStore, useInspectStore };

// Presets
export { createPresetMenu, listPresets, presetDefaults };

// Utilities
export { filterMenuItemsByRole, getBadgeStyle };
export {
  findContainerParent,
  highlightTarget,
  highlightContainer,
  clearHighlights,
  applyHighlights,
};

// Styles
export { menuStyles, darkMenuStyles, menuCSSVariables };

// IDE Integration
export { openInIDE, buildIDEUrl, detectPreferredIDE };
```

## Documentation

For full documentation, visit [anyclick.ewj.dev/docs/react](https://anyclick.ewj.dev/docs/react)

## Related Packages

- [`@ewjdev/anyclick-core`](https://www.npmjs.com/package/@ewjdev/anyclick-core) - Core library
- [`@ewjdev/anyclick-github`](https://www.npmjs.com/package/@ewjdev/anyclick-github) - GitHub Issues integration
- [`@ewjdev/anyclick-cursor`](https://www.npmjs.com/package/@ewjdev/anyclick-cursor) - Cursor AI integration
- [`@ewjdev/anyclick-pointer`](https://www.npmjs.com/package/@ewjdev/anyclick-pointer) - Custom pointer effects

## License

MIT © [anyclick](https://anyclick.ewj.dev)
