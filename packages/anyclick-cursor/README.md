# @anyclick/cursor

Cursor Cloud Agent adapter for UI feedback - launch agents from feedback payloads.

## Installation

```bash
npm install @anyclick/cursor
# or
yarn add @anyclick/cursor
```

## Usage

### Server-Side (API Route)

```typescript
import { createCursorAgentAdapter } from "@anyclick/cursor";
import type { FeedbackPayload } from "@anyclick/core";

const cursorAdapter = createCursorAgentAdapter({
  apiKey: process.env.CURSOR_API_KEY!,
  defaultSource: {
    repository: "https://github.com/your-org/your-repo",
    ref: "main",
  },
  defaultTarget: {
    autoCreatePr: true,
  },
});

export async function POST(req: Request) {
  const payload: FeedbackPayload = await req.json();

  const result = await cursorAdapter.createAgent(payload);

  if (!result.success) {
    return Response.json({ error: result.error?.message }, { status: 500 });
  }

  return Response.json({
    agentId: result.agent?.id,
    agentUrl: result.agent?.target.url,
  });
}
```

### Configuration Options

```typescript
interface CursorAgentAdapterOptions {
  /** Cursor API key (from https://cursor.com/settings) */
  apiKey: string;

  /** Default repository configuration */
  defaultSource: {
    repository: string; // e.g., "https://github.com/your-org/your-repo"
    ref?: string; // Branch or commit ref (default: "main")
  };

  /** Default target configuration */
  defaultTarget?: {
    branchName?: string; // Auto-generated if not provided
    autoCreatePr?: boolean; // Create PR when agent finishes
    openAsCursorGithubApp?: boolean;
    skipReviewerRequest?: boolean;
  };

  /** API base URL (default: https://api.cursor.com) */
  apiBaseUrl?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Custom prompt formatter */
  formatPrompt?: (payload: FeedbackPayload) => AgentPrompt;

  /** Custom agent name formatter */
  formatAgentName?: (payload: FeedbackPayload) => string;
}
```

### Custom Prompt Formatting

You can customize how feedback payloads are converted to agent prompts:

```typescript
import { createCursorAgentAdapter, defaultFormatPrompt } from "@anyclick/cursor";

const adapter = createCursorAgentAdapter({
  apiKey: process.env.CURSOR_API_KEY!,
  defaultSource: { repository: "https://github.com/your-org/repo" },
  formatPrompt: (payload) => {
    // Use default formatting and add custom instructions
    const base = defaultFormatPrompt(payload);
    return {
      text: `${base.text}\n\n## Additional Context\nPlease follow our coding standards.`,
    };
  },
});
```

### Additional Methods

```typescript
// Get agent status
const status = await adapter.getAgentStatus("bc_abc123");

// Add follow-up instruction
await adapter.addFollowUp("bc_abc123", {
  text: "Also add unit tests for this change",
});

// Delete an agent
await adapter.deleteAgent("bc_abc123");
```

## Environment Variables

| Variable               | Description                                    | Required |
| ---------------------- | ---------------------------------------------- | -------- |
| `CURSOR_API_KEY`       | Your Cursor API key                            | Yes      |
| `CURSOR_REPOSITORY`    | Default repository URL                         | Yes      |
| `CURSOR_DEFAULT_REF`   | Default branch (defaults to "main")            | No       |
| `CURSOR_AUTO_CREATE_PR`| Set to "true" to auto-create PRs               | No       |

## Role-Based Access

This adapter is designed to work with role-based access control. See `@anyclick/react` for the `filterMenuItemsByRole` utility that can restrict the "Build with Cursor" menu item to specific user roles.

## API Reference

For the full Cursor Cloud Agent API documentation, see:
https://cursor.com/docs/cloud-agent/api/endpoints

## License

MIT

