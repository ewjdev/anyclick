# anyclick

> Why not click on anything?

[![npm version](https://img.shields.io/npm/v/@ewjdev/anyclick-react.svg)](https://www.npmjs.com/package/@ewjdev/anyclick-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Right-click any element in your app to capture feedback with full DOM context, screenshots, and automatic integration with GitHub Issues or AI coding agents.

## Features

- 🎯 **Context-Aware Capture** - Extract CSS selectors, data attributes, ancestors, and page context
- 📸 **Screenshot Capture** - Automatic screenshots of target, container, and full page
- 🐙 **GitHub Integration** - Create rich GitHub Issues with embedded screenshots
- 🤖 **AI Agent Integration** - Launch Cursor AI agents for automatic code fixes
- ⚛️ **React Provider** - Drop-in component with customizable context menu
- 🔌 **Adapter Pattern** - Flexible architecture for custom integrations

## Quick Start

### Installation

```bash
yarn install @ewjdev/anyclick-react @ewjdev/anyclick-github
```

### Usage

**1. Create API Route**

```typescript
// app/api/feedback/route.ts
import { createGitHubAdapter } from "@ewjdev/anyclick-github/server";

const repoName = process.env.GITHUB_REPO!;
const [owner, repo] = repoName.split("/");
const github = createGitHubAdapter({
  owner,
  repo,
  token: process.env.GITHUB_TOKEN!,
});

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await github.submit(payload);
  return Response.json(result);
}
```

**2. Add Provider**

```tsx
"use client";

import { FeedbackProvider } from "@ewjdev/anyclick-react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";

const adapter = createHttpAdapter({ endpoint: "/api/feedback" });

export function Providers({ children }: { children: React.ReactNode }) {
  return <FeedbackProvider adapter={adapter}>{children}</FeedbackProvider>;
}
```

**3. Right-click any element!**

That's it! Users can now right-click any element to submit feedback.

## Packages

| Package                                                             | Description                        |
| ------------------------------------------------------------------- | ---------------------------------- |
| [`@ewjdev/anyclick-core`](./packages/anyclick-core)                 | Framework-agnostic core library    |
| [`@ewjdev/anyclick-react`](./packages/anyclick-react)               | React provider and context menu UI |
| [`@ewjdev/anyclick-github`](./packages/anyclick-github)             | GitHub Issues adapter              |
| [`@ewjdev/anyclick-cursor`](./packages/anyclick-cursor)             | Cursor Cloud Agent adapter         |
| [`@ewjdev/anyclick-cursor-local`](./packages/anyclick-cursor-local) | Local Cursor CLI adapter           |

## Documentation

Visit [anyclick.ewj.dev](https://anyclick.ewj.dev) for full documentation:

- [Getting Started](https://anyclick.ewj.dev/docs/getting-started)
- [Core Library](https://anyclick.ewj.dev/docs/core)
- [React Provider](https://anyclick.ewj.dev/docs/react)
- [Adapters](https://anyclick.ewj.dev/docs/adapters)
- [Examples](https://anyclick.ewj.dev/examples)

## Development

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Start development mode
yarn dev

# Format code
yarn format

# Create a changeset
yarn changeset
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT © [anyclick](https://anyclick.ewj.dev)
