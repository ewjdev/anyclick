---
name: quickchat-ai-sdk-ui-refactor
overview: Refactor QuickChat to use ai-sdk-ui with zustand-based persistence and a new backend history endpoint with 24h retention.
todos:
  - id: zustand-store
    content: Add zustand store with 24h local persistence
    status: completed
  - id: hook-refactor
    content: Refactor useQuickChat to ai-sdk-ui + store
    status: completed
  - id: ui-update
    content: Embed ai-sdk-ui UI in QuickChat layout
    status: completed
  - id: backend-history
    content: Create KV history endpoint with 24h TTL
    status: completed
  - id: cleanup-legacy
    content: Remove sessionStorage chat history usage
    status: completed
---

# QuickChat ai-sdk-ui + persistence refactor

- Implement a zustand chat store with `persist` to localStorage, enforcing 24h TTL for messages and exposing load/save helpers; place in `packages/anyclick-react/src/QuickChat/`.
- Refactor `useQuickChat` to use @ai-sdk/react hooks (e.g., `useChat` from `ai/react`) for streaming, wire it to the zustand store (read/write messages, hydrate from local cache, push updates to backend history), and keep context-chunk logic for prompts.
- Update `QuickChat.tsx` to embed @ai-sdk/react message/input components within the existing panel layout, keep context toggles/pin UX, and route send/clear through the new store/hook instead of sessionStorage.
- Add a backend KV history endpoint (e.g., `apps/web/src/app/api/anyclick/chat/history/route.ts`) that saves/reads chat transcripts with 24h expiry; connect store sync calls to this endpoint (e.g., on load and after sends).
- Remove legacy sessionStorage chat history code and ensure fallback behaviors (default suggestions, copy actions) continue to work with the new data flow.