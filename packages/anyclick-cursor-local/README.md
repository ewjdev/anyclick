# @ewjdev/anyclick-cursor-local

> Local Cursor CLI adapter for UI feedback - run cursor-agent locally during development

[![npm version](https://img.shields.io/npm/v/@ewjdev/anyclick-cursor-local.svg)](https://www.npmjs.com/package/@ewjdev/anyclick-cursor-local)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@ewjdev/anyclick-cursor-local` enables local Cursor integration for development workflows. Submit UI feedback and have it automatically open in Cursor with full context for AI-powered fixes.

## Installation

```bash
npm install @ewjdev/anyclick-cursor-local
```

## Quick Start

### 1. Start the Local Server

```bash
# Add to package.json scripts
"scripts": {
  "feedback-server": "anyclick-local-server"
}

# Run
npm run feedback-server
```

### 2. Configure the Provider

```tsx
'use client';

import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { createLocalAdapter } from '@ewjdev/anyclick-cursor-local';

const adapter = createLocalAdapter({
  serverUrl: 'http://localhost:3847',
  projectPath: process.cwd(),
});

<FeedbackProvider adapter={adapter}>
  {children}
</FeedbackProvider>
```

## Features

- 🖥️ **Local Development** - No cloud dependency for development
- 📁 **File-Based Storage** - Feedback saved as JSON files
- 🚀 **Cursor Integration** - Automatically opens Cursor with context
- ⚙️ **Configurable** - Customize prompt generation and file handling

## How It Works

1. User right-clicks element and selects "Fix with Cursor"
2. Feedback is sent to local server on your machine
3. Server saves feedback to `.feedback/` directory
4. Server invokes Cursor with the feedback context
5. Cursor AI analyzes and proposes fixes

## Server Configuration

Create `anyclick.config.js` in your project root:

```javascript
module.exports = {
  port: 3847,
  outputDir: '.feedback',
  cursorPath: '/Applications/Cursor.app/Contents/MacOS/Cursor',
  
  onFeedback: async (payload, filePath) => {
    console.log(`Feedback saved to: ${filePath}`);
  },
  
  formatPrompt: (payload) => {
    return `Fix: ${payload.comment}\nElement: ${payload.element.selector}`;
  },
  
  cors: {
    origin: ['http://localhost:3000'],
  },
};
```

## Multi-Adapter Setup

Route different feedback types to different adapters:

```typescript
import { createLocalAdapter } from '@ewjdev/anyclick-cursor-local';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

function createRoutingAdapter(config) {
  return {
    async submit(payload) {
      if (payload.type === 'cursor_local') {
        return config.local.submit(payload);
      }
      return config.github.submit(payload);
    },
  };
}

const adapter = createRoutingAdapter({
  local: createLocalAdapter({ serverUrl: 'http://localhost:3847' }),
  github: createHttpAdapter({ endpoint: '/api/feedback' }),
});
```

## CLI

```bash
# Start with default options
npx anyclick-local-server

# Start with custom port
npx anyclick-local-server --port 4000

# Start with custom output directory
npx anyclick-local-server --output .my-feedback
```

## Security

⚠️ The local server is designed for **development only**. Never expose it to the internet. The server only accepts connections from localhost by default.

## Best Practices

- Add `.feedback/` to your `.gitignore`
- Use descriptive comments when submitting feedback
- Configure Cursor rules for your project conventions
- Run the server in a separate terminal for visibility

## Documentation

For full documentation, visit [anyclick.ewj.dev/docs/adapters](https://anyclick.ewj.dev/docs/adapters)

## Related Packages

- [`@ewjdev/anyclick-core`](https://www.npmjs.com/package/@ewjdev/anyclick-core) - Core library
- [`@ewjdev/anyclick-react`](https://www.npmjs.com/package/@ewjdev/anyclick-react) - React provider
- [`@ewjdev/anyclick-cursor`](https://www.npmjs.com/package/@ewjdev/anyclick-cursor) - Cursor Cloud integration

## License

MIT © [anyclick](https://anyclick.ewj.dev)
