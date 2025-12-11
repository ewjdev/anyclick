---
name: anyclick-context-context-demo
overview: Update plan to use localStorage for persistence and ensure robust UI patterns (explicit copy buttons).
todos: []
---

# Anyclick Context Demo (Persistent)

1) Create demo page `apps/web/src/app/anyclick-context-demo/page.tsx` with clear copy explaining context capture, intent sharing, and persistence; use existing design tokens.
2) Implement a reusable context provider hook (`useAnyclickContext`) backed by **localStorage** (persists across tabs/reloads) with a namespaced key (e.g., `anyclick_demo_context`).

- Features: `addContext(item)`, `removeContext(id)`, `clearContext()`, `getContext()`.
- Data shape: `{ id, content, type: 'text'|'code', sourceUrl, timestamp }`.
3) Build highlight-to-select UI:
- Create a container with sample text/code.
- Implement a "Floating Action" or "Selection Toolbar" that appears near selected text (or a fixed "Save Selected" button for better accessibility/reliability).
- User flow: Select text -> Click "Save to Context" -> Item added to list.
4) Add "Context Viewer & Share" section:
- Display saved items in a list/grid.
- Add "Copy to Clipboard" button for the full JSON payload (simulating the "Intent" payload).
- Add a "Share with AI" stub button that simulates sending the payload to a provider (log to console / toast notification).
5) Document usage inline: explain how this `localStorage` pattern mimics an extension's background storage, allowing data to move between the page and external AI tools.

Todos:

- scaffold-page: Create `anyclick-context-demo` page
- provider-hook: Add localStorage-backed `useAnyclickContext`
- highlight-ui: Implement text selection listener and "Save" UI
- viewer-ui: Build list view of saved context with "Delete" actions
- share-stub: Implement "Copy Payload" and "Share" simulation logic
- inline-docs: Add explanations about persistence and intent protocol patterns