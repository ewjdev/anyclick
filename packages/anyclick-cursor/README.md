# @ewjdev/anyclick-cursor

> Cursor Cloud Agent adapter for UI feedback - launch AI agents from feedback payloads

[![npm version](https://img.shields.io/npm/v/@ewjdev/anyclick-cursor.svg)](https://www.npmjs.com/package/@ewjdev/anyclick-cursor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@ewjdev/anyclick-cursor` enables integration with Cursor's Cloud Agent API. Submit UI feedback and have AI automatically analyze and propose code fixes.

## Installation

```bash
npm install @ewjdev/anyclick-cursor
```

## Quick Start

The Cursor adapter should only be used server-side to keep your API key secure.

**Server-side API route:**

```typescript
// app/api/feedback/route.ts
import { createCursorAdapter } from "@ewjdev/anyclick-cursor";

const cursor = createCursorAdapter({
  apiKey: process.env.CURSOR_API_KEY, // Server-only, never expose to browser
  projectId: "your-project-id",
});

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await cursor.submit(payload);
  return Response.json(result);
}
```

**Browser-side provider:**

```tsx
import { AnyclickProvider } from "@ewjdev/anyclick-react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";

const adapter = createHttpAdapter({ endpoint: "/api/feedback" });

<AnyclickProvider adapter={adapter}>{children}</AnyclickProvider>;
```

## Features

- 🤖 **AI-Powered Fixes** - Submit feedback for automatic code analysis
- 📝 **Optimized Prompts** - Feedback formatted for optimal AI understanding
- 🔧 **Configurable** - Customize prompt generation and context

## Configuration

```typescript
// Server-side only
const cursor = createCursorAdapter({
  apiKey: process.env.CURSOR_API_KEY, // Keep server-side only
  projectId: "your-project-id",

  // Custom prompt formatting
  formatPrompt: (payload) => {
    return `
Fix this ${payload.type} in the codebase:

Element: ${payload.element.selector}
Comment: ${payload.comment}
Page: ${payload.page.url}

Please analyze and propose a fix.
    `;
  },
});
```

## Prompt Formatting

```typescript
import { formatForCursorAgent } from "@ewjdev/anyclick-cursor";

// Generate an optimized prompt for Cursor
const prompt = formatForCursorAgent(payload);
```

## Usage with Menu Items

```tsx
const menuItems = [
  { type: "bug", label: "Report Bug", showComment: true },
  { type: "feature", label: "Request Feature", showComment: true },
  {
    type: "cursor_cloud",
    label: "Fix with AI",
    showComment: true,
    requiredRoles: ["developer"],
  },
];

<AnyclickProvider adapter={adapter} menuItems={menuItems}>
  {children}
</AnyclickProvider>;
```

## Documentation

For full documentation, visit [anyclick.dev/docs/adapters](https://anyclick.dev/docs/adapters)

## Related Packages

- [`@ewjdev/anyclick-core`](https://www.npmjs.com/package/@ewjdev/anyclick-core) - Core library
- [`@ewjdev/anyclick-react`](https://www.npmjs.com/package/@ewjdev/anyclick-react) - React provider
- [`@ewjdev/anyclick-cursor-local`](https://www.npmjs.com/package/@ewjdev/anyclick-local) - Local development

## License

MIT © [anyclick](https://anyclick.dev)
