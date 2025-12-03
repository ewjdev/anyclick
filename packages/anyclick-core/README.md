# @anyclick/core

Framework-agnostic core library for capturing UI feedback with rich DOM context. This package provides the foundational types, utilities, and client for building feedback capture systems.

## Installation

```bash
npm install @anyclick/core
# or
yarn add @anyclick/core
# or
pnpm add @anyclick/core
```

## Overview

`@anyclick/core` captures detailed context about UI elements when users provide feedback:

- **Element Context**: CSS selector, tag, classes, attributes, inner text, outer HTML, bounding rect
- **Page Context**: URL, title, viewport size, screen size, user agent, timestamp
- **Ancestor Hierarchy**: Parent elements for understanding component structure

## Basic Usage

### With a Custom Adapter

```typescript
import { createFeedbackClient, FeedbackAdapter, FeedbackPayload } from '@anyclick/core';

// Create a simple adapter that logs feedback
const loggingAdapter: FeedbackAdapter = {
  async submitFeedback(payload: FeedbackPayload): Promise<void> {
    console.log('Feedback received:', payload);
    // Send to your backend, analytics service, etc.
  }
};

// Create the client
const client = createFeedbackClient({
  adapter: loggingAdapter,
});

// Attach to document (listens for right-click events)
client.attach();

// Set up what happens when user right-clicks
client.onContextMenu = (event, element) => {
  // Show your custom UI here
  console.log('User right-clicked on:', element);
};
```

### Manual Feedback Submission

```typescript
import { buildFeedbackPayload } from '@anyclick/core';

// Build a payload manually for any element
const element = document.querySelector('#my-button');
const payload = buildFeedbackPayload(element, 'issue', {
  comment: 'This button is confusing',
  metadata: { userId: '123', sessionId: 'abc' }
});

// Submit via your adapter
await myAdapter.submitFeedback(payload);
```

## API Reference

### Types

#### `FeedbackType`

```typescript
type FeedbackType = 'issue' | 'feature' | 'like';
```

#### `FeedbackPayload`

The complete payload sent to adapters:

```typescript
interface FeedbackPayload {
  type: FeedbackType;
  comment?: string;
  element: ElementContext;
  page: PageContext;
  metadata?: Record<string, unknown>;
}
```

#### `ElementContext`

Captured information about the target element:

```typescript
interface ElementContext {
  selector: string;           // Unique CSS selector
  tag: string;                // Tag name (lowercase)
  id?: string;                // Element ID if present
  classes: string[];          // Class list
  innerText: string;          // Text content (truncated)
  outerHTML: string;          // HTML (truncated)
  boundingRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  dataAttributes: Record<string, string>;
  ancestors: AncestorInfo[];  // Parent hierarchy
}
```

#### `PageContext`

Captured information about the page:

```typescript
interface PageContext {
  url: string;
  title: string;
  referrer: string;
  screen: { width: number; height: number };
  viewport: { width: number; height: number };
  userAgent: string;
  timestamp: string;          // ISO format
}
```

#### `FeedbackAdapter`

Interface for submitting feedback to backends:

```typescript
interface FeedbackAdapter {
  submitFeedback(payload: FeedbackPayload): Promise<void>;
}
```

#### `FeedbackClientOptions`

Configuration for the FeedbackClient:

```typescript
interface FeedbackClientOptions {
  adapter: FeedbackAdapter;
  targetFilter?: (event: MouseEvent, target: Element) => boolean;
  maxInnerTextLength?: number;    // Default: 500
  maxOuterHTMLLength?: number;    // Default: 1000
  maxAncestors?: number;          // Default: 5
  cooldownMs?: number;            // Default: 1000 (rate limiting)
  stripAttributes?: string[];     // Attributes to remove for privacy
}
```

### Functions

#### `createFeedbackClient(options)`

Creates a new FeedbackClient instance.

```typescript
const client = createFeedbackClient({
  adapter: myAdapter,
  maxInnerTextLength: 300,
  cooldownMs: 2000,
});
```

#### `buildFeedbackPayload(element, type, options?)`

Builds a complete FeedbackPayload from an element.

```typescript
const payload = buildFeedbackPayload(element, 'feature', {
  comment: 'Would love dark mode here',
  metadata: { priority: 'high' },
  maxInnerTextLength: 200,
});
```

#### `buildPageContext()`

Builds PageContext from the current window/document.

```typescript
const pageContext = buildPageContext();
```

#### `buildElementContext(element, options?)`

Builds ElementContext from a DOM element.

```typescript
const elementContext = buildElementContext(element, {
  maxInnerTextLength: 300,
  maxOuterHTMLLength: 500,
  maxAncestors: 3,
  stripAttributes: ['data-secret'],
});
```

### DOM Utilities

#### `getUniqueSelector(element)`

Generates a unique CSS selector for an element.

```typescript
const selector = getUniqueSelector(element);
// e.g., "#app > div.container > button.primary:nth-of-type(2)"
```

#### `getAncestors(element, maxDepth?)`

Gets ancestor information up to body.

```typescript
const ancestors = getAncestors(element, 5);
```

#### `getDataAttributes(element)`

Extracts all data-* attributes from an element.

```typescript
const data = getDataAttributes(element);
// { userId: '123', analytics: 'button-click' }
```

#### `truncate(str, maxLength)`

Truncates a string with ellipsis.

```typescript
const short = truncate(longText, 100);
```

#### `stripAttributesFromHTML(html, attributes)`

Removes specified attributes from HTML string (for privacy).

```typescript
const cleanHTML = stripAttributesFromHTML(html, ['data-user-id', 'data-token']);
```

### FeedbackClient Methods

```typescript
class FeedbackClient {
  // Lifecycle
  attach(): void;                    // Start listening to context menu events
  detach(): void;                    // Stop listening

  // State
  isRateLimited(): boolean;          // Check if in cooldown period
  getPendingElement(): Element | null;
  clearPendingElement(): void;

  // Submission
  buildPayload(element, type, options?): FeedbackPayload;
  submitFeedback(element, type, options?): Promise<FeedbackResult>;
  submitPendingFeedback(type, options?): Promise<FeedbackResult>;

  // Callbacks
  onContextMenu?: (event: MouseEvent, element: Element) => void;
  onSubmitSuccess?: (payload: FeedbackPayload) => void;
  onSubmitError?: (error: Error, payload: FeedbackPayload) => void;
}
```

## Advanced Configuration

### Target Filtering

Control which elements can receive feedback:

```typescript
const client = createFeedbackClient({
  adapter: myAdapter,
  targetFilter: (event, target) => {
    // Ignore body and html
    const tag = target.tagName.toLowerCase();
    if (tag === 'html' || tag === 'body') return false;
    
    // Ignore elements marked to ignore
    if (target.closest('[data-feedback-ignore]')) return false;
    
    // Ignore navigation elements
    if (target.closest('nav')) return false;
    
    // Allow everything else
    return true;
  },
});
```

### Privacy Controls

Strip sensitive attributes from captured HTML:

```typescript
const client = createFeedbackClient({
  adapter: myAdapter,
  stripAttributes: [
    'data-user-id',
    'data-session',
    'data-token',
    'data-email',
  ],
});
```

### Rate Limiting

Prevent spam with cooldown:

```typescript
const client = createFeedbackClient({
  adapter: myAdapter,
  cooldownMs: 5000, // 5 second cooldown between submissions
});

// Check if rate limited before showing UI
if (client.isRateLimited()) {
  showMessage('Please wait before submitting more feedback');
}
```

### Custom Metadata

Add custom data to every submission:

```typescript
const payload = buildFeedbackPayload(element, 'issue', {
  comment: userComment,
  metadata: {
    userId: getCurrentUserId(),
    sessionId: getSessionId(),
    featureFlags: getActiveFlags(),
    appVersion: '2.1.0',
  },
});
```

## Creating Custom Adapters

### HTTP Adapter Example

```typescript
import { FeedbackAdapter, FeedbackPayload } from '@anyclick/core';

class HttpFeedbackAdapter implements FeedbackAdapter {
  constructor(private endpoint: string, private headers: Record<string, string> = {}) {}

  async submitFeedback(payload: FeedbackPayload): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Feedback submission failed: ${response.status}`);
    }
  }
}

const adapter = new HttpFeedbackAdapter('/api/feedback', {
  'Authorization': 'Bearer token',
});
```

### Analytics Adapter Example

```typescript
import { FeedbackAdapter, FeedbackPayload } from '@anyclick/core';

class AnalyticsFeedbackAdapter implements FeedbackAdapter {
  async submitFeedback(payload: FeedbackPayload): Promise<void> {
    // Send to multiple analytics services
    await Promise.all([
      this.sendToMixpanel(payload),
      this.sendToSegment(payload),
      this.sendToBackend(payload),
    ]);
  }

  private async sendToMixpanel(payload: FeedbackPayload) {
    mixpanel.track('UI Feedback', {
      type: payload.type,
      page: payload.page.url,
      element: payload.element.selector,
      comment: payload.comment,
    });
  }

  // ... other methods
}
```

## SSR Compatibility

The library guards against server-side rendering:

```typescript
import { buildPageContext } from '@anyclick/core';

// Safe to call on server - returns empty values
const context = buildPageContext();

// FeedbackClient.attach() is also SSR-safe
client.attach(); // No-op on server
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  FeedbackType,
  FeedbackPayload,
  FeedbackAdapter,
  FeedbackClientOptions,
  FeedbackResult,
  ElementContext,
  PageContext,
  AncestorInfo,
} from '@anyclick/core';
```

## Related Packages

- [`@anyclick/react`](../uifeedback-react) - React provider and context menu UI
- [`@anyclick/github`](../uifeedback-github) - HTTP adapter and GitHub Issues integration

## License

MIT

