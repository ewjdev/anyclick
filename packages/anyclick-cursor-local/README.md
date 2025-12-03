# @anyclick/cursor-local

Local Cursor CLI adapter for UI feedback - run `cursor-agent` locally during development.

This package provides a standalone dev server that receives feedback from your app and runs `cursor-agent` locally, allowing you to use Cursor's AI coding assistance without cloud agents.

## Prerequisites

Install the Cursor CLI:

```bash
curl https://cursor.com/install -fsS | bash
```

## Installation

```bash
npm install @anyclick/cursor-local
# or
yarn add @anyclick/cursor-local
```

## Quick Start

### 1. Start the local server

```bash
# Using npx
npx uifeedback-local-server

# Or if installed globally
uifeedback-local-server

# With options
uifeedback-local-server --port 4000 --cwd /path/to/project
```

### 2. Configure your app to use the local endpoint

In your feedback provider, point to the local server when in development:

```tsx
const adapter = createHttpAdapter({
  endpoint: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3847/feedback'
    : '/api/feedback',
});
```

## Server Options

```
Options:
  -p, --port <port>     Port to run the server on (default: 3847)
  -h, --host <host>     Host to bind to (default: localhost)
  -d, --cwd <dir>       Working directory for cursor-agent
  -m, --mode <mode>     Execution mode: interactive or print (default: interactive)
  --model <model>       Model to use for cursor-agent
  --help                Show help message
```

## Execution Modes

### Interactive Mode (default)

Opens `cursor-agent` in your terminal for an interactive session:

```bash
uifeedback-local-server -m interactive
```

When feedback is submitted, `cursor-agent` starts with the prompt and you can interact with it directly.

### Print Mode

Runs `cursor-agent` headlessly and returns the output:

```bash
uifeedback-local-server -m print
```

Useful for automated workflows or CI integration.

## API Endpoints

### POST /feedback

Submit feedback to run cursor-agent.

**Request:**
```json
{
  "type": "feature",
  "comment": "Add dark mode support",
  "element": { ... },
  "page": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "output": "cursor-agent started in interactive mode"
}
```

### GET /health

Check server status and cursor-agent installation.

**Response:**
```json
{
  "status": "ok",
  "cursorAgentInstalled": true
}
```

## Programmatic Usage

```typescript
import { createLocalCursorAdapter } from '@anyclick/cursor-local';

const adapter = createLocalCursorAdapter({
  workingDirectory: '/path/to/project',
  mode: 'interactive',
});

// Check if cursor-agent is installed
const installed = await adapter.checkInstalled();

// Run with feedback payload
const result = await adapter.runAgent(payload);
```

## Custom Prompt Formatting

```typescript
import { createLocalCursorAdapter, defaultFormatPrompt } from '@anyclick/cursor-local';

const adapter = createLocalCursorAdapter({
  formatPrompt: (payload) => {
    // Use default and add custom instructions
    return defaultFormatPrompt(payload) + '\n\nFollow our coding standards.';
  },
});
```

## Integration with @anyclick/react

See the main app's `FeedbackProviderWrapper` for an example of how to integrate local and cloud Cursor options with a submenu.

## Security Note

This server is intended for **local development only**. It:
- Only binds to localhost by default
- Has CORS restrictions for localhost origins
- Should NOT be exposed to the internet

## License

MIT

