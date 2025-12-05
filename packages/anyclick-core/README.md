# @ewjdev/anyclick-core

> Framework-agnostic core library for UI feedback capture with DOM context

[![npm version](https://img.shields.io/npm/v/@ewjdev/anyclick-core.svg)](https://www.npmjs.com/package/@ewjdev/anyclick-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@ewjdev/anyclick-core` provides the foundational utilities for capturing UI feedback with full DOM context. It's framework-agnostic and can be used with any JavaScript framework or vanilla JavaScript.

## Installation

```bash
npm install @ewjdev/anyclick-core
```

## Features

- 🎯 **DOM Capture** - Extract selectors, data attributes, and ancestor information
- 📸 **Screenshot Utilities** - Capture element and page screenshots
- 📦 **Payload Building** - Construct structured feedback payloads
- 🔌 **Adapter Interface** - Flexible adapter pattern for custom integrations

## Basic Usage

```typescript
import { createAnyclickClient } from "@ewjdev/anyclick-core";

// Create a anyclick client with your adapter
const client = createAnyclickClient({
  adapter: {
    async submit(payload) {
      // Your submission logic
      return { success: true };
    },
  },
});

// Attach to DOM (starts listening for context menu events)
client.attach();

// Later, submit feedback programmatically
await client.submitFeedback(element, "issue", {
  comment: "This button is broken",
});

// Cleanup
client.detach();
```

## API Reference

### DOM Utilities

```typescript
import {
  getUniqueSelector,
  getAncestors,
  getDataAttributes,
  buildElementContext,
} from "@ewjdev/anyclick-core";

// Get a unique CSS selector for an element
const selector = getUniqueSelector(element);

// Get ancestor elements with context
const ancestors = getAncestors(element, { maxAncestors: 5 });

// Get all data-* attributes
const dataAttrs = getDataAttributes(element);

// Build full element context
const context = buildElementContext(element);
```

### Screenshot Capture

```typescript
import {
  captureScreenshot,
  captureAllScreenshots,
  isScreenshotSupported,
} from "@ewjdev/anyclick-core";

if (isScreenshotSupported()) {
  // Capture a single element
  const screenshot = await captureScreenshot(element, {
    quality: 0.9,
    format: "png",
  });

  // Capture target, container, and full page
  const screenshots = await captureAllScreenshots(
    targetElement,
    containerElement,
  );
}
```

### Payload Building

```typescript
import { buildFeedbackPayload, buildPageContext } from "@ewjdev/anyclick-core";

const payload = buildFeedbackPayload({
  element,
  type: "issue",
  comment: "Something is wrong here",
  metadata: { userId: "123" },
});
```

## Types

### FeedbackPayload

```typescript
interface FeedbackPayload {
  type: FeedbackType;
  timestamp: string;
  page: PageContext;
  element: ElementContext;
  comment?: string;
  metadata?: Record<string, unknown>;
  screenshots?: ScreenshotData;
}
```

### AnyclickAdapter

```typescript
interface AnyclickAdapter {
  submit(payload: AnyclickPayload): Promise<AnyclickResult>;
}

interface AnyclickResult {
  success: boolean;
  id?: string;
  url?: string;
  error?: string;
}
```

## Configuration

```typescript
const client = createAnyclickClient({
  adapter: myAdapter,
  targetFilter: (event, target) => true,
  maxInnerTextLength: 500,
  maxOuterHTMLLength: 2000,
  maxAncestors: 5,
  cooldownMs: 1000,
  stripAttributes: ["data-sensitive"],
});
```

## Documentation

For full documentation, visit [anyclick.ewj.dev/docs/core](https://anyclick.ewj.dev/docs/core)

## Related Packages

- [`@ewjdev/anyclick-react`](https://www.npmjs.com/package/@ewjdev/anyclick-react) - React provider and UI
- [`@ewjdev/anyclick-`](https://www.npmjs.com/package/@ewjdev/anyclick-github) - GitHub Issues integration
- [`@ewjdev/anyclick-cursor`](https://www.npmjs.com/package/@ewjdev/anyclick-cursor) - Cursor AI integration
- [`@ewjdev/anyclick-cursor-local`](https://www.npmjs.com/package/@ewjdev/anyclick-cursor-local) - Local Cursor development

## License

MIT © [anyclick](https://anyclick.ewj.dev)
