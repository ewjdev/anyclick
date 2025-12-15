---
name: doc-tool-integration
overview: Add documentation search + retrieval to QuickChat so the API can answer Anyclick website questions before calling the LLM
todos: []
---

# Doc-Aware QuickChat Plan

## 1. Index Documentation Sources

- Parse markdown/MDX under `docs/` and public site docs (`apps/web/src/docs/**`) to extract slug, title, and text snippets.
- Implement a build-time script (e.g. `scripts/build-doc-index.ts`) that produces `apps/web/src/data/docIndex.json` with normalized tokens + canonical GitHub/npm URLs for each section.
- Include version metadata (package version from `packages/anyclick-react/package.json`) so the API can state which docs version it used.

## 2. Add Doc Search Utility

- Create a helper in `apps/web/src/lib/docSearch.ts` that loads the JSON index and exposes keyword + fuzzy search (e.g. cosine over term frequency or simple scoring) returning top matches with URLs/content.
- Provide an optional GitHub fallback: if local index hits are low confidence, call GitHub search API (repo + docs path) with PAT from env to pull snippet + link.

## 3. Enhance Chat API Flow (`apps/web/src/app/api/anyclick/chat/route.ts`)

- Before calling `streamText`, run doc search with the user question.
- If matches exist, build a concise context block summarizing each hit (title, URL, excerpt) and append it to the system prompt or add as assistant messages so the LLM is grounded.
- If no matches, attempt GitHub API search; include any results.
- Include metadata in logs + response payload (e.g. `docSources` array) so the client can render which docs were consulted.

## 4. Update QuickChat Client (`packages/anyclick-react/src/QuickChat/useQuickChat.ts` + `QuickChat.tsx`)

- Extend the message payload schema to accept `docSources` or suggested links from the backend response.
- Surface a UI section showing “Suggested Docs” with clickable URLs (default to docs/github) and highlight when the assistant answer cites them.
- Ensure the client gracefully handles cases where no docs were found and encourage the user to refine queries when needed.

## 5. Testing & Verification

- Add unit tests for the doc search helper (keyword scoring, GitHub fallback stub) under `apps/web/src/lib/__tests__/docSearch.test.ts`.
- Run manual QuickChat flows to confirm: (a) doc-answerable question returns immediate doc citations; (b) unrelated question still streams via LLM; (c) logs show which sources were used.