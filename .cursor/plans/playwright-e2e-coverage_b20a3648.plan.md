---
name: playwright-e2e-coverage
overview: Add a first-wave Playwright suite for `apps/web` that validates the website still renders correctly and that core `anyclick-react` behaviors work in real browser flows, without depending on external APIs or screenshot-baseline regression.
todos:
  - id: setup-playwright-web
    content: Add Playwright config and `apps/web` scripts using the non-HTTPS local startup path.
    status: completed
  - id: stabilize-selectors
    content: Add only the minimal stable selectors/test hooks needed for runtime overlay, dialog, and menu assertions.
    status: completed
  - id: write-website-smoke-specs
    content: Create smoke coverage for homepage, docs, and examples index.
    status: completed
  - id: write-core-runtime-specs
    content: Create application-level specs for global provider, Quick Chat shell, scoped providers, and sensitive masking flows.
    status: completed
  - id: validate-local-run
    content: Run the suite locally and fix any obvious selector or environment flakiness before handing it off.
    status: completed
isProject: false
---

# Playwright E2E Plan

## Goal

Create a stable Playwright setup for the website and library demos that catches regressions from recent `anyclick-react` changes by testing real browser interactions, especially provider bootstrapping, context-menu behavior, scoped overrides, and privacy-related UI.

## Scope

- Include deterministic browser coverage only.
- Exclude real API-backed assertions for Quick Chat responses, feedback submission, and external integrations in v1.
- Exclude screenshot-baseline visual regression in v1; validate visuals through rendered UI states, visibility, text, classes, and interaction behavior.

## Files To Add Or Update

- Add Playwright config under [apps/web/playwright.config.ts](apps/web/playwright.config.ts).
- Add E2E specs under [apps/web/e2e/](apps/web/e2e/).
- Update [apps/web/package.json](apps/web/package.json) with `e2e` scripts using the existing non-HTTPS startup path (`dev:turbo`).
- Add minimal stable test hooks only where needed in shared/runtime-critical UI:
  - [apps/web/src/components/AnyclickProviderWrapper.tsx](apps/web/src/components/AnyclickProviderWrapper.tsx)
  - [apps/web/src/app/examples/quick-chat/QuickChatProvider.tsx](apps/web/src/app/examples/quick-chat/QuickChatProvider.tsx)
  - [apps/web/src/app/examples/scoped-providers/ScopedProvidersDemo.tsx](apps/web/src/app/examples/scoped-providers/ScopedProvidersDemo.tsx)
  - [apps/web/src/app/examples/sensitive-masking/page.tsx](apps/web/src/app/examples/sensitive-masking/page.tsx)
- If selectors are still too brittle, add a few targeted `data-testid` hooks in shared package UI exercised by the site:
  - [packages/anyclick-react/src/ContextMenu.tsx](packages/anyclick-react/src/ContextMenu.tsx)
  - [packages/anyclick-react/src/QuickChat/QuickChat.tsx](packages/anyclick-react/src/QuickChat/QuickChat.tsx)
  - [packages/anyclick-react/src/ScreenshotPreview.tsx](packages/anyclick-react/src/ScreenshotPreview.tsx)

## Test Matrix

### Website smoke coverage

- Homepage `/`
  - Page renders key hero/primary CTA content.
  - Core navigation and example/doc entry points are usable.
  - Right-clicking normal content opens the global Anyclick menu from [apps/web/src/components/AnyclickProviderWrapper.tsx](apps/web/src/components/AnyclickProviderWrapper.tsx).
- Docs page `/docs/getting-started`
  - Docs layout and page content render.
  - Code/documentation blocks remain usable.
  - Global menu behavior does not conflict with docs content.
- Examples index `/examples`
  - Example cards render and key routes are reachable.

### Core anyclick-react runtime coverage

- Global provider shell
  - Right-click opens menu.
  - Escape/outside click closes menu.
  - Core preset actions render in the menu from [apps/web/src/components/AnyclickProviderWrapper.tsx](apps/web/src/components/AnyclickProviderWrapper.tsx).
- Quick Chat route `/examples/quick-chat`
  - Chat entry UI opens from the runtime shell.
  - Input focus, close/reopen behavior, and non-network UI states work.
  - Stub network calls or block them explicitly so the test stays deterministic.
- Scoped providers route `/examples/scoped-providers`
  - Different sections expose different menu labels/themes.
  - Nested scoped providers override the global provider.
  - Disabled section falls back to native behavior by confirming Anyclick UI does not appear.
- Sensitive masking route `/examples/sensitive-masking`
  - Sensitive fixture inputs render.
  - Screenshot/preview UI opens if available in the current flow.
  - Assert privacy-related preview/state hooks without depending on real feedback submission.

## Implementation Notes

- Use `webServer` in Playwright to boot `yarn workspace web-app dev:turbo` instead of the HTTPS dev command already defined in [apps/web/package.json](apps/web/package.json).
- Keep the first suite Chromium-first for stability; expand to more browsers only after selectors and flows settle.
- Prefer role/text locators first. Add `data-testid` only where menu/dialog/runtime internals are otherwise too fragile.
- Mock or abort external/network-dependent requests so failures in OpenAI, feedback, or integrations do not make the core regression suite flaky.

## Validation

- Run the new suite locally against `apps/web`.
- Verify recently edited files remain lint-clean.
- Document the intended E2E commands in `apps/web/package.json` scripts so future website and package changes can be checked quickly.

## Risks

- Runtime overlays, portals, and custom context-menu behavior may need a few explicit test hooks for reliability.
- Some screenshot-preview assertions may require reading package UI structure in `anyclick-react` before choosing the final selectors.
- API-backed routes and full visual regression remain follow-up work after this deterministic first wave is stable.

