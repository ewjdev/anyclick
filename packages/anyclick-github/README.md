# @ewjdev/anyclick-github

> GitHub adapter for UI feedback - create issues with rich context and screenshots

[![npm version](https://img.shields.io/npm/v/@ewjdev/anyclick-github.svg)](https://www.npmjs.com/package/@ewjdev/anyclick-github)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@ewjdev/anyclick-github` provides adapters for integrating anyclick with GitHub Issues. Includes a browser-side HTTP adapter and a server-side GitHub API client.

## Installation

```bash
npm install @ewjdev/anyclick-github
```

## Setup

### Media Branch (Required for Screenshots)

If your feedback includes screenshots, they are uploaded to a dedicated orphan branch in your repository. Run this command once during initial setup:

```bash
# Using environment variables
GITHUB_TOKEN=ghp_xxx GITHUB_REPO={repo-user}/your-repo npx @ewjdev/anyclick-github setup-media-branch

# Or using CLI arguments
npx @ewjdev/anyclick-github setup-media-branch -t ghp_xxx -o your-org -r your-repo

# Custom branch name (default: issues/src)
npx @ewjdev/anyclick-github setup-media-branch -b feedback-assets
```

Or programmatically in your setup script:

```typescript
import { createGitHubAdapter } from "@ewjdev/anyclick-github/server";

const repoName = process.env.GITHUB_REPO;
const [owner, repo] = repoName.split("/");

const github = createGitHubAdapter({
  token: process.env.GITHUB_TOKEN!,
  owner,
  repo,
});

// Creates the branch if it doesn't exist
await github.ensureMediaBranch();

// Check if branch exists
const exists = await github.mediaBranchExists();
```

## Quick Start

### Browser Side

```tsx
"use client";

import { FeedbackProvider } from "@ewjdev/anyclick-react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";

const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

<FeedbackProvider adapter={adapter}>{children}</FeedbackProvider>;
```

### Server Side

```typescript
// app/api/feedback/route.ts
import { createGitHubAdapter } from "@ewjdev/anyclick-github/server";

const repoName = process.env.GITHUB_REPO;

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

## Features

- 📝 **Issue Creation** - Automatic GitHub Issue creation
- 📸 **Screenshot Uploads** - Embed screenshots as issue attachments
- 🏷️ **Dynamic Labels** - Configure labels based on feedback type
- ✏️ **Custom Formatting** - Full control over issue title and body

## Configuration

### HTTP Adapter (Browser)

```typescript
const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
  headers: {
    "X-Custom-Header": "value",
  },
});
```

### GitHub Adapter (Server)

```typescript
const github = createGitHubAdapter({
  owner: "your-org",
  repo: "your-repo",
  token: process.env.GITHUB_TOKEN!,

  // Dynamic labels
  getLabels: (payload) => {
    const labels = ["feedback"];
    if (payload.type === "bug") labels.push("bug");
    if (payload.type === "feature") labels.push("enhancement");
    return labels;
  },

  // Custom title
  getTitle: (payload) => {
    const emoji = payload.type === "bug" ? "🐛" : "✨";
    return `${emoji} ${payload.comment?.slice(0, 80) || "Feedback"}`;
  },

  // Custom body formatting
  getBody: (payload) => {
    return formatFeedbackAsMarkdown(payload);
  },

  // Assign to users
  getAssignees: (payload) => {
    return payload.type === "bug" ? ["triage-team"] : [];
  },
});
```

## Custom Markdown Formatting

```typescript
import { formatFeedbackAsMarkdown } from "@ewjdev/anyclick-github/server";

// Use the built-in formatter
const markdown = formatFeedbackAsMarkdown(payload);

// Or create custom formatting
const github = createGitHubAdapter({
  // ...config
  getBody: (payload) => `
## ${payload.type === "bug" ? "🐛 Bug Report" : "✨ Feature Request"}

**Comment:** ${payload.comment || "No comment"}

### Element
- Selector: \`${payload.element.selector}\`
- Text: ${payload.element.innerText}

### Page
- URL: ${payload.page.url}
- Viewport: ${payload.page.viewportWidth}x${payload.page.viewportHeight}
  `,
});
```

## Environment Variables

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_REPO=repo-owner/your-repository-name
```

### Required Token Scopes

- `repo` - Full control of private repositories (required for screenshot uploads)
- `public_repo` - Access public repositories only (for public repos)

### Media Branch Configuration

Screenshots are uploaded to an orphan branch (default: `issues/src`). Configure via adapter options:

```typescript
const github = createGitHubAdapter({
  // ...required options
  mediaBranch: "feedback-media", // Custom branch name
  assetsPath: "screenshots", // Custom path within branch
});
```

## Documentation

For full documentation, visit [anyclick.ewj.dev/docs/adapters](https://anyclick.ewj.dev/docs/adapters)

## Related Packages

- [`@ewjdev/anyclick-core`](https://www.npmjs.com/package/@ewjdev/anyclick-core) - Core library
- [`@ewjdev/anyclick-react`](https://www.npmjs.com/package/@ewjdev/anyclick-react) - React provider

## License

MIT © [anyclick](https://anyclick.ewj.dev)
