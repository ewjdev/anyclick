# @anyclick/github

HTTP adapter for browser-side feedback submission and GitHub Issues integration for server-side processing. Part of the UI Feedback library suite.

## Installation

```bash
npm install @anyclick/github @anyclick/core
# or
yarn add @anyclick/github @anyclick/core
# or
pnpm add @anyclick/github @anyclick/core
```

## Overview

This package provides two main components:

1. **HttpAdapter** (browser-side): Sends feedback payloads to your backend endpoint
2. **GitHubAdapter** (server-side): Creates GitHub Issues from feedback payloads

## Quick Start

### Browser-Side: HTTP Adapter

```tsx
import { FeedbackProvider } from '@anyclick/react';
import { createHttpAdapter } from '@anyclick/github';

const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
});

function App() {
  return (
    <FeedbackProvider adapter={adapter}>
      <YourApp />
    </FeedbackProvider>
  );
}
```

### Server-Side: GitHub Adapter

```typescript
// app/api/feedback/route.ts (Next.js App Router)
import { createGitHubAdapter } from '@anyclick/github/server';
import { NextResponse } from 'next/server';

const github = createGitHubAdapter({
  token: process.env.GITHUB_TOKEN!,
  owner: 'your-org',
  repo: 'your-repo',
});

export async function POST(request: Request) {
  const payload = await request.json();
  
  try {
    const issue = await github.createIssue(payload);
    return NextResponse.json({ 
      success: true, 
      issueUrl: issue.htmlUrl,
      issueNumber: issue.number,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}
```

## API Reference

### Browser Exports (`@anyclick/github`)

#### `createHttpAdapter(options)`

Creates an HTTP adapter for browser-side use.

```typescript
interface HttpAdapterOptions {
  endpoint: string;                              // Your backend URL
  headers?: Record<string, string>;              // Additional headers
  method?: 'POST' | 'PUT';                       // HTTP method (default: POST)
  transformPayload?: (payload) => object;        // Transform before sending
  timeout?: number;                              // Request timeout in ms (default: 10000)
}
```

**Example with all options:**

```typescript
const adapter = createHttpAdapter({
  endpoint: '/api/feedback',
  method: 'POST',
  headers: {
    'X-App-Version': '2.1.0',
    'X-Request-ID': generateRequestId(),
  },
  timeout: 15000,
  transformPayload: (payload) => ({
    ...payload,
    submittedAt: new Date().toISOString(),
    source: 'web-app',
  }),
});
```

### Server Exports (`@anyclick/github/server`)

#### `createGitHubAdapter(options)`

Creates a GitHub adapter for server-side use.

```typescript
interface GitHubAdapterOptions {
  token: string;                                 // GitHub PAT with repo scope
  owner: string;                                 // Repository owner
  repo: string;                                  // Repository name
  defaultLabels?: string[];                      // Labels for all issues
  formatTitle?: (payload) => string;             // Custom title formatter
  formatBody?: (payload) => string;              // Custom body formatter
  apiBaseUrl?: string;                           // For GitHub Enterprise
}
```

**Example with all options:**

```typescript
const github = createGitHubAdapter({
  token: process.env.GITHUB_TOKEN!,
  owner: 'acme-corp',
  repo: 'frontend',
  defaultLabels: ['user-feedback', 'triage'],
  apiBaseUrl: 'https://github.mycompany.com/api/v3', // GitHub Enterprise
  formatTitle: (payload) => {
    const emoji = { issue: '🐛', feature: '✨', like: '👍' }[payload.type];
    return `${emoji} ${payload.type}: ${payload.page.title}`;
  },
  formatBody: (payload) => {
    return `
## Feedback

**Type:** ${payload.type}
**Comment:** ${payload.comment || 'No comment'}

## Context

- **URL:** ${payload.page.url}
- **Element:** \`${payload.element.selector}\`
    `;
  },
});
```

#### `GitHubAdapter` Methods

```typescript
class GitHubAdapter {
  // Create a GitHub issue from a feedback payload
  createIssue(payload: FeedbackPayload): Promise<GitHubIssueResult>;

  // Validate adapter configuration
  validateConfiguration(): Promise<boolean>;
}

interface GitHubIssueResult {
  number: number;      // Issue number
  url: string;         // API URL
  htmlUrl: string;     // Browser URL
}
```

## Default GitHub Issue Format

### Title Format

```
[🐛 Bug Report] button - My App Title
[✨ Feature Request] #signup-form - My App Title
[👍 Positive Feedback] div.hero - My App Title
```

### Body Format

The default body formatter creates a detailed, well-structured GitHub issue:

```markdown
## Feedback Details

**Type:** Issue
**Comment:**
> User's comment here

---

## Page Context

- **URL:** https://example.com/dashboard
- **Title:** Dashboard - My App
- **Viewport:** 1920x1080
- **Timestamp:** 2024-01-15T10:30:00.000Z

---

## Element Context

- **Selector:** `#app > div.dashboard > button.submit`
- **Tag:** `button`
- **ID:** `submit-btn`
- **Classes:** `submit, primary, large`

**Element Text:**
```
Submit Form
```

<details>
<summary>Element HTML</summary>

```html
<button id="submit-btn" class="submit primary large">Submit Form</button>
```
</details>

<details>
<summary>Element Hierarchy</summary>

```
div.dashboard
  form.main-form
    button.submit
```
</details>

---

<details>
<summary>Browser Info</summary>

- **User Agent:** Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...
- **Screen:** 2560x1440
</details>
```

## Custom Formatters

### Custom Title Formatter

```typescript
const github = createGitHubAdapter({
  token: process.env.GITHUB_TOKEN!,
  owner: 'acme',
  repo: 'app',
  formatTitle: (payload) => {
    const typeEmoji = {
      issue: '🐛',
      feature: '💡',
      like: '❤️',
    }[payload.type];
    
    const pageTitle = payload.page.title.split(' - ')[0]; // Remove app suffix
    const element = payload.element.id || payload.element.tag;
    
    return `${typeEmoji} [${payload.type.toUpperCase()}] ${element} on ${pageTitle}`;
  },
});
```

### Custom Body Formatter

```typescript
import { defaultFormatBody } from '@anyclick/github/server';

const github = createGitHubAdapter({
  token: process.env.GITHUB_TOKEN!,
  owner: 'acme',
  repo: 'app',
  formatBody: (payload) => {
    // Add custom header
    const header = `
## 📣 User Feedback

Submitted via UI Feedback Widget

---

`;
    // Use default formatting for the rest
    return header + defaultFormatBody(payload);
  },
});
```

## Automatic Labels

Issues are automatically labeled based on feedback type:

| Feedback Type | GitHub Label |
|---------------|--------------|
| `issue` | `bug` |
| `feature` | `enhancement` |
| `like` | `feedback` |

These are added in addition to any `defaultLabels` you specify.

## Express.js Example

```typescript
import express from 'express';
import { createGitHubAdapter } from '@anyclick/github/server';

const app = express();
app.use(express.json());

const github = createGitHubAdapter({
  token: process.env.GITHUB_TOKEN!,
  owner: 'acme',
  repo: 'frontend',
});

app.post('/api/feedback', async (req, res) => {
  try {
    const issue = await github.createIssue(req.body);
    res.json({ success: true, issue });
  } catch (error) {
    console.error('GitHub error:', error);
    res.status(500).json({ success: false, error: 'Failed to create issue' });
  }
});

app.listen(3000);
```

## Next.js Pages Router Example

```typescript
// pages/api/feedback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubAdapter } from '@anyclick/github/server';

const github = createGitHubAdapter({
  token: process.env.GITHUB_TOKEN!,
  owner: 'acme',
  repo: 'frontend',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const issue = await github.createIssue(req.body);
    return res.status(200).json({ success: true, issue });
  } catch (error) {
    console.error('GitHub error:', error);
    return res.status(500).json({ success: false });
  }
}
```

## Authentication & Security

### GitHub Token Permissions

Create a Personal Access Token (PAT) with the following scopes:
- `repo` - Full control of private repositories (or `public_repo` for public only)

For GitHub Apps, you need:
- `issues: write`
- `metadata: read`

### Security Best Practices

1. **Never expose your GitHub token to the browser**
   ```typescript
   // ❌ BAD - Token exposed to client
   const adapter = createGitHubAdapter({ token: 'ghp_xxxx', ... });
   
   // ✅ GOOD - Use HTTP adapter, handle GitHub on server
   const adapter = createHttpAdapter({ endpoint: '/api/feedback' });
   ```

2. **Validate payloads on the server**
   ```typescript
   app.post('/api/feedback', async (req, res) => {
     const payload = req.body;
     
     // Validate required fields
     if (!payload.type || !payload.element || !payload.page) {
       return res.status(400).json({ error: 'Invalid payload' });
     }
     
     // Validate feedback type
     if (!['issue', 'feature', 'like'].includes(payload.type)) {
       return res.status(400).json({ error: 'Invalid feedback type' });
     }
     
     // Proceed with GitHub issue creation
     await github.createIssue(payload);
   });
   ```

3. **Rate limit your endpoint**
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const feedbackLimiter = rateLimit({
     windowMs: 60 * 1000, // 1 minute
     max: 5, // 5 requests per minute
   });
   
   app.post('/api/feedback', feedbackLimiter, async (req, res) => {
     // ...
   });
   ```

## TypeScript

Full TypeScript support:

```typescript
// Browser imports
import type { HttpAdapterOptions } from '@anyclick/github';

// Server imports
import type { 
  GitHubAdapterOptions, 
  GitHubIssueResult 
} from '@anyclick/github/server';

// Re-exported from core
import type { 
  FeedbackAdapter, 
  FeedbackPayload, 
  FeedbackType 
} from '@anyclick/github';
```

## Related Packages

- [`@anyclick/core`](../uifeedback-core) - Framework-agnostic core library
- [`@anyclick/react`](../uifeedback-react) - React provider and context menu UI

## License

MIT

