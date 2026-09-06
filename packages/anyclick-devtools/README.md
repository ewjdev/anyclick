# @ewjdev/anyclick-devtools

Advanced inspector UI for anyclick. This package contains the full-featured DevTools-style `InspectDialog`, including modification tracking, accessibility view, box model overlay, and IDE deep links. Use it when you need the complete debugging experience; use `@ewjdev/anyclick-react` for the lightweight context menu and tiny inspector.

## Installation

```bash
npm install @ewjdev/anyclick-devtools
# or
yarn add @ewjdev/anyclick-devtools
# or
pnpm add @ewjdev/anyclick-devtools
```

## Usage

```tsx
"use client";

import {
  InspectDialogManager,
  openInspectDialog,
} from "@ewjdev/anyclick-devtools";

function App({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Place once near the root */}
      <InspectDialogManager />
      {children}
    </>
  );
}

// Somewhere in your UI (e.g., context menu action)
function handleInspect(target: Element) {
  openInspectDialog(target);
}
```

## Features

### Element Hierarchy Navigator

The inspector includes a compact hierarchy navigator that shows:

- **Parent**: The nearest inspectable ancestor element
- **Previous sibling**: The previous inspectable sibling in DOM order
- **Current element**: The selected element (highlighted)
- **Next sibling**: The next inspectable sibling in DOM order
- **First child**: The first inspectable direct child

When ancestors beyond the immediate parent are available, an interactive ellipsis (`…`) button appears. Clicking it opens an ancestor chooser that displays all navigable ancestors within the inspection boundary, ordered nearest-first.

The navigator:

- Skips zero-size elements, structural elements (`<br>`, SVG), and AnyClick-owned UI
- Preserves DOM order for siblings and children
- Supports keyboard navigation (Arrow Up and Arrow Down to move, Enter/Space to select, Escape to dismiss)
- Updates selection, selector, and properties synchronously on navigation

## Notes

- Uses the same `anyclick:inspect` event contract as the lightweight inspector.
- Depends on React 19+ and `@ewjdev/anyclick-core`.
