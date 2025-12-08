---
name: anyclick-browser-extension-plan
overview: Plan to add a Chrome-focused Anyclick browser extension that integrates with existing Anyclick capture/adapter stack for high-performance DOM/context capture and AI-enthusiast consumer use.
todos:
  - id: skeleton
    content: Scaffold MV3 extension package/build
    status: completed
  - id: capture
    content: Implement lean content capture + metadata
    status: completed
    dependencies:
      - skeleton
  - id: screenshot
    content: Add background screenshot/tab meta flow
    status: completed
    dependencies:
      - capture
  - id: submission
    content: Wire messaging + HTTP submit with retries
    status: completed
    dependencies:
      - screenshot
  - id: popup
    content: Build minimal popup/settings UI
    status: completed
    dependencies:
      - submission
  - id: perf-tests
    content: Perf guards, docs, manual + unit tests
    status: in_progress
    dependencies:
      - popup
---

# Plan: Chrome Anyclick Extension (v1)

## Goals

- Ship a Chrome MV3 extension that brings Anyclick capture to any site with native browser APIs (DOM, screenshots, tabs) and minimal friction for consumers/AI enthusiasts.
- Keep performance high: lean content scripts, minimal background work, clear message passing.

## Scope

- Target Chrome/Chromium first; design for future Firefox/Safari parity.
- Focus on fast capture (DOM, screenshots) with optional light UI; reuse existing Anyclick adapters where possible.

## Approach

- Create a new package `packages/anyclick-extension` with MV3 `manifest.json`, background service worker, content script, and (optionally) a lightweight popup/context menu.
- Reuse `@ewjdev/anyclick-core` capture logic via a bridge; avoid duplicating selectors/DOM traversal.
- Add messaging between content script ↔ background for privileged APIs (tab info, screenshots) and host integration with Anyclick backend (existing adapters via HTTP).
- Provide an SDK shim so the web app can talk to the extension when present (feature-detect and fall back to existing web flow).
- Instrument performance: measure capture time, payload size, and screenshot latency.

## Key Workstreams

1) **Extension Shell**: Scaffold MV3 manifest (permissions: `scripting`, `activeTab`, `tabs`, `storage`, `contextMenus`, `offscreen` if needed), background worker, popup HTML, icons, build pipeline (likely Vite/tsup) and bundling to `dist/`.
2) **Content Script Capture**: Inject capture hook that listens for context-menu/right-click; reuse anyclick-core to collect DOM context; throttle observers; serialize minimal payload.
3) **Screenshot & Context**: Use `chrome.tabs.captureVisibleTab` or `chrome.tabs.captureTab` via background; consider offscreen doc for full-page stitched capture if required; include URL/tab metadata.
4) **Messaging & Bridge**: Define a typed message protocol; background mediates between content and adapters; optionally expose a `window.anyclickExtension` bridge for web apps to feature-detect.
5) **Adapter Integration**: Route captured payloads to existing adapters (GitHub/HTTP/AI) via background fetch; allow user-configured endpoint/token stored in `chrome.storage`.
6) **UX for Consumers**: Minimal popup to toggle enablement, set endpoint/token, and show last capture status; optional context menu entry “Send feedback with Anyclick”.
7) **Performance & Safety**: Avoid heavy libs in content script, defer non-critical work to background, limit DOM traversal scope, sanitize/limit payload size; handle permission errors gracefully.
8) **Testing & Release**: Automated tests for message contracts and capture utilities; manual validation in Chrome; prepare `README` section and Chrome Web Store submission checklist.

## Deliverables

- New extension package with manifest, background, content script, popup UI, build scripts.
- Message protocol types and bridge helpers consumable by web app/anyclick-react.
- Documentation: how to build/load extension, config options, and how web apps detect/use it.
- Test coverage for core capture utilities and messaging; manual test script for Chrome.

## Milestones

- M1: Skeleton extension builds/loads, context menu triggers content script.
- M2: Capture DOM context + screenshot via background; payload stored/sent to dummy endpoint.
- M3: Bridge to Anyclick adapters and minimal popup settings; docs + tests.