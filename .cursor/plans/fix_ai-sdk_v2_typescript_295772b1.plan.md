---
name: Fix ai-sdk v2 TypeScript
overview: Fix all TypeScript errors in useQuickChat.ts to align with @ai-sdk/react v2 and ai v5 API changes.
todos:
  - id: fix-imports
    content: Update imports to include DefaultChatTransport from ai
    status: pending
  - id: fix-helper
    content: Fix aiMessageToChatMessage and add getMessageText helper
    status: pending
  - id: fix-usechat
    content: Update useChat hook config and callbacks for v2 API
    status: pending
  - id: fix-sendmessage
    content: Replace append with sendMessage in sendMessage function
    status: pending
  - id: fix-types
    content: Replace Message with UIMessage throughout
    status: pending
  - id: add-ai-dep
    content: Add ai package as dependency to anyclick-react
    status: pending
---

# Fix ai-sdk/react v2 TypeScript Errors

The upgrade to `@ai-sdk/react@2.0.114` and `ai@5.0.112` introduced breaking API changes. The hook needs to be updated to use the new transport-based architecture.

## Key API Changes in v2

| v1 API | v2 API |
|--------|--------|
| `api: '/endpoint'` | `transport: new DefaultChatTransport({ api: '/endpoint' })` |
| `append({ role, content })` | `sendMessage({ text })` |
| `isLoading` | `status` ('submitted', 'streaming', 'ready', 'error') |
| `message.content` | `message.parts` (array of `{ type: 'text', text: string }`) |
| `onFinish(message)` | `onFinish({ message, messages, ... })` |

## Files to Update

### 1. `packages/anyclick-react/src/QuickChat/useQuickChat.ts`

**Imports** (line 10):
```typescript
import { UIMessage, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
```

**Fix `aiMessageToChatMessage`** (lines 141-148):
- Extract text content from `parts` array instead of `content`
- Fix timestamp access (use `createdAt` directly, not `msg.message?.createdAt`)

**Fix useChat hook** (lines 236-319):
- Replace `api` with `transport: new DefaultChatTransport({ api: ... })`
- Replace `append` with `sendMessage`
- Replace `isLoading` with `status`
- Fix `onFinish` callback to destructure `{ message }` from the parameter
- Access message properties correctly via the destructured `message`

**Fix message content access** (lines 384, 391):
- Replace `msg.content` with helper to extract text from `msg.parts`

**Fix Message type references** (lines 468, 489):
- Replace `Message` with `UIMessage`

**Fix sendMessage function** (line 609):
- Change `append({ content, role })` to `sendMessage({ text })`

### 2. `packages/anyclick-react/package.json`

Add `ai` as a dependency to access `DefaultChatTransport`:
```json
"ai": "^5.0.112"
```

## Helper Function to Add

```typescript
function getMessageText(msg: UIMessage): string {
  return msg.parts
    ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('') ?? '';
}
```

## Status Mapping

Replace `isSending` logic:
```typescript
const isSending = status === 'submitted' || status === 'streaming';
const isStreaming = status === 'streaming';
```