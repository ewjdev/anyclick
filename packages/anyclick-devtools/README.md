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

## Notes

- Uses the same `anyclick:inspect` event contract as the lightweight inspector.
- Depends on React 19+ and `@ewjdev/anyclick-core`.

