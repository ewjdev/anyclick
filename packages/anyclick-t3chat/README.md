# @ewjdev/anyclick-t3chat

T3.chat adapter for Anyclick - send selected text and queries to [t3.chat](https://t3.chat) for AI-powered answers.

## Installation

```bash
npm install @ewjdev/anyclick-t3chat
# or
yarn add @ewjdev/anyclick-t3chat
# or
pnpm add @ewjdev/anyclick-t3chat
```

## Quick Start

### With Anyclick React

The easiest way to use t3.chat integration is with the Chrome preset or the `createT3ChatMenuItem` helper:

```tsx
import { AnyclickProvider, createPresetMenu } from "@ewjdev/anyclick-react";

// Option 1: Use Chrome preset (includes t3.chat by default)
const chromePreset = createPresetMenu("chrome");

// Option 2: Add to custom menu
import { createT3ChatMenuItem } from "@ewjdev/anyclick-react";

const menuItems = [
  { label: "Report Bug", type: "bug", showComment: true },
  createT3ChatMenuItem(), // Adds "Ask t3.chat" item
];

function App() {
  return (
    <AnyclickProvider menuItems={menuItems}>
      <YourApp />
    </AnyclickProvider>
  );
}
```

### Standalone Usage

Use the adapter directly for custom integrations:

```typescript
import {
  createT3ChatAdapter,
  getSelectedText,
  hasTextSelection,
} from "@ewjdev/anyclick-t3chat";

// Create adapter
const adapter = createT3ChatAdapter({
  baseUrl: "https://t3.chat",
  openInNewTab: true,
});

// Send a query
adapter.sendQuery("How do I fix this TypeScript error?");

// Send selected text
if (hasTextSelection()) {
  adapter.sendSelectedText();
}

// Get selected text
const text = getSelectedText();
console.log("Selected:", text);
```

## API

### `T3ChatAdapter`

The main adapter class for t3.chat integration.

#### Constructor Options

```typescript
interface T3ChatAdapterOptions {
  /** Base URL for t3.chat (default: "https://t3.chat") */
  baseUrl?: string;
  /** Whether to open in a new tab (default: true) */
  openInNewTab?: boolean;
  /** Custom URL builder function */
  buildUrl?: (query: string) => string;
}
```

#### Methods

- `sendQuery(query: string): T3ChatResult` - Send a query to t3.chat
- `sendSelectedText(): T3ChatResult` - Send currently selected text
- `openT3Chat(): T3ChatResult` - Open t3.chat without a query
- `hasSelection(): boolean` - Check if text is selected
- `getSelectedText(): string` - Get the selected text
- `getBaseUrl(): string` - Get the configured base URL

### Utility Functions

```typescript
import {
  getSelectedText,
  hasTextSelection,
  getTextSelectionContext,
  buildT3ChatUrl,
  navigateToUrl,
} from "@ewjdev/anyclick-t3chat";

// Get selected text
const text = getSelectedText();

// Check if text is selected
if (hasTextSelection()) {
  // ...
}

// Get detailed selection context
const context = getTextSelectionContext();
// { text: "...", hasSelection: true, anchorElement: Element }

// Build a t3.chat URL
const url = buildT3ChatUrl("my query", "https://t3.chat");
// "https://t3.chat/?q=my%20query"

// Navigate to a URL
navigateToUrl(url, true); // true = new tab
```

## Quick Chat Integration

When using Anyclick's Quick Chat feature, t3.chat integration is enabled by default:

```tsx
<AnyclickProvider
  quickChatConfig={{
    endpoint: "/api/anyclick/chat",
    t3chat: {
      enabled: true, // Show "Send to t3.chat" button
      baseUrl: "https://t3.chat",
      label: "Ask t3.chat",
    },
  }}
>
  <YourApp />
</AnyclickProvider>
```

Users can type a question and click the t3.chat button to open it in a new tab with their query pre-filled.

## Browser Extension

The t3.chat adapter also works with the Anyclick browser extension. See [@ewjdev/anyclick-extension](../anyclick-extension) for details.

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  T3ChatAdapterOptions,
  T3ChatResult,
  TextSelectionContext,
} from "@ewjdev/anyclick-t3chat";
```

## License

MIT
