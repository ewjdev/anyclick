# AnyClick Execution Plan

Eric owns high-level direction. Day-to-day product and execution (triage, copy/docs/security hygiene, cloud agents on straightforward bugs) is run against this plan.

**Comment on the PR if a phase should move, die, or wait.** Later phases are not committed scope until Eric says so.

---

## Current Snapshot (2026-09-01)

- **Site:** https://anyclick.dev (also still live at https://anyclick-website.vercel.app with no redirect)
- **Package versions:** `main` lags npm (`@ewjdev/anyclick-react` 4.0.0 on git vs 5.0.0 on npm)
- **Traction:** 3 stars, ~10–17 weekly npm downloads
- **Open work:** 9 open PRs (several stale since Dec 2025 / Mar 2026), ~27 open issues that are mostly dogfood captures from the marketing site
- **Demo status:** The homepage demo works (right-click → themed menu → real screenshot review). The surrounding site currently undercuts that.

---

## Phase 0 — In Flight

_No product-direction decision needed. Separate PRs are implementing these. This document is the map._

- [ ] **Canonical domain:** `anyclick.dev` everywhere. Stop linking `anyclick.ewj.dev` (500s) and `anyclick-website.vercel.app` (no redirect).
- [ ] **Footer/docs npm link:** `npmjs.com/org/anyclick` 404s. Packages live under `@ewjdev`.
- [ ] **One public name:** `AnyclickProvider` / `AnyclickPayload`. `FeedbackProvider` is a deprecated alias. README uses `yarn add`, not `yarn install <pkg>`.
- [ ] **Getting-started snippets:** Match source method names (`submit` vs `submitAnyclick` vs `createIssue`).
- [ ] **Remove token logs:** No GitHub/Jira/Cursor token `console.log`s. No `NEXT_PUBLIC_` Cursor keys in docs.
- [ ] **Homepage "Coming Soon" vs roadmap:** Reconcile DONE status (Quick Chat, Chrome Extension, Jira, per-section menus).
- [ ] **Soften claims:** "Zero Config" / "Zero Dependencies" should match reality (`html-to-image` + PAT/API-route setup).
- [ ] **Screenshot review overlay:** Make the homepage demo overlay dismissible.
- [ ] **Examples page:** Actually enable anyclick, or stop claiming the whole docs site is dogfooded.

---

## Phase 1 — Needs a Thumbs-Up

**Do not start until Eric comments on this PR / plan.**

1. **Selectors are the product.**
   - `getUniqueSelector` is id → first two classes → `:nth-of-type`
   - It never prefers `data-testid`, role, or accessible name
   - Default GitHub titles are `[Feedback] div - page title`
   - **Proposal:** Playwright-like selector ranking + title = user comment
   - **Tests:** Tailwind, hashed CSS, and lists

2. **`@ewjdev/anyclick-react` is not modular.**
   - It pulls AI SDK, lucide, zustand, pointer, devtools, and Tailwind
   - **Proposal:** Provider + menu in `anyclick-react`; chat / pointer / inspect optional
   - Relax `react >= 19.2.1` to a documented React 19 (or 18) floor

3. **git ≠ npm.**
   - `react@5` headless + `@ewjdev/anyclick-react-tailwind|shadcn|mui` exist on npm and are not in this tree
   - **Proposal:** Either merge v5 onto `main` or deprecate the published split

4. **Do not steal right-click by default.**
   - Production apps should not have right-click hijacked
   - **Proposal:** Modifier chord, visible toggle, or `mode: "dev-only"` default

5. **Tests exist in name only.**
   - CI job is "Build & Test" with no `yarn test`
   - **Proposal:** Add vitest for selector + payload sanitization + HTTP adapter errors

---

## Phase 2 — Later

**Not now:** new adapters, `@anyclick` npm org, Playwright codegen, Slack, auto error collection, `anyclick-protocol` EHR/insurance intents, store-listed extension.

**Wedge to protect:** right-click → structured DOM + screenshots → GitHub issue or Cursor agent.

---

## Issue Tracker Hygiene

Most open issues are auto-filed dogfood (`[Feedback] div - anyclick - …`). They hide real bugs (e.g. #26 mobile touch target).

**Proposal:**

- [ ] Label dogfood captures `dogfood` and auto-close or hide them from the default view
- [ ] Real bugs get titles from the **comment**, not the tag name
- [ ] Stale PRs (#53, #55, #57, #60, #63, #65, #66, #67, #68) get a close-or-rebase pass

---

## Out of Scope

_Until Eric says otherwise:_

- New product surfaces
- New adapters
- Renaming the npm scope
- Store listing the extension
