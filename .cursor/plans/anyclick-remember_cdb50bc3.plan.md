---
name: anyclick-remember
overview: Add Anyclick.remember capture for highlights with short/long TTL, local-first capture, and hybrid sync into context pipeline across extension and web app.
todos:
  - id: define-ttl-rules
    content: Finalize TTL defaults and metadata fields
    status: pending
  - id: data-api
    content: Design local store + backend endpoints for remember notes
    status: pending
  - id: shared-sdk
    content: Add shared Remember types/helpers in core/react package
    status: pending
  - id: extension-ux
    content: Implement extension capture UI + context menu + sync
    status: pending
  - id: web-ui
    content: Build web Remember list with filters/actions
    status: pending
  - id: context-integration
    content: Wire notes into context assembly with dedupe/limits
    status: pending
  - id: qa-docs
    content: Add tests, telemetry, and docs for remember flows
    status: pending
---

# Anyclick.remember Capture

1) Behavior & TTL rules

- Lock short/long semantics (e.g., short=24–72h local-only, long=30–90d+server) and context inclusion rules (priority, max items, char cap).
- Define metadata to store with each note: source URL/title, selection snippet, optional user comment, createdFrom (extension/web), ttlType, expiresAt, tags, content hash for dedupe.

2) Data + API layer (hybrid local→remote)

- Extension local store (IndexedDB) for all captures with TTL expiry and retry queue for sync.
- Backend endpoint/Convex functions for long-term notes: create, list (by ttlType, search), promote/demote TTL, delete, expire cleanup.
- Add background sync worker: on long-term selection or manual promote, push to backend; reconcile deletes/expiry.

3) Shared types & helpers

- Add shared `RememberNote` types, serializers, and context-formatter in `packages/anyclick-core` or `packages/anyclick-react`.
- Provide client helpers: `captureRemember`, `listRemember`, `promoteToLong`, `pruneExpired`, with consistent error shapes for extension/web.

4) Extension UX (packages/anyclick-extension)

- Add context menu entries: “Remember → Short term” and “Remember → Long term” on text selection; include fallback button in overlay.
- Capture selection + optional user note in a lightweight composer; show success/error toasts and TTL badge.
- Local-first write; if long-term, enqueue sync; show sync state (pending/synced/failed) and retry controls.
- Hook into existing Anyclick context builder so active-session AI chats can pull unexpired short-term notes automatically; long-term notes available on request.

5) Web app UI (apps/web)

- Add `Remember` page/section to list notes with filters (ttlType, source, date), search, and TTL countdown badges.
- Support promote/demote/delete and copy-to-clipboard/add-to-chat actions; show source link and selection preview.
- Surface sync status and errors for items originating from the extension.

6) Context assembly integration

- Update context assembly to merge notes by recency/ttlType, dedupe by hash+URL, enforce max tokens, and mark provenance (remember/ttl/source) in prompt blocks.
- Add lightweight summarization for long lists and exclude expired items by default.

7) QA, telemetry, docs

- Unit tests for storage helpers, TTL expiry, sync queue; integration tests for create/list/promote flows; minimal UI tests for context menu capture and web list.
- Instrument events (capture, promote, sync success/fail) and document UX flows + support/limits (TTL defaults, privacy) in README/docs.

# Tags

- roadmap
- roles(product)