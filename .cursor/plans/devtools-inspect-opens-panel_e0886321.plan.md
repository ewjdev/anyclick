---
name: devtools-inspect-opens-panel
overview: Route the context menu Inspect action to open/focus the Anyclick DevTools panel and stop sending element context payloads elsewhere.
todos:
  - id: trace-flow
    content: Trace current inspect flow across content/background/devtools
    status: completed
  - id: stop-send
    content: Remove inspect element sending to adapters/queue
    status: completed
  - id: open-panel
    content: Open/focus Anyclick DevTools panel on inspect
    status: completed
  - id: verify
    content: Manual test inspect menu opens Anyclick panel
    status: completed
---

# DevTools Inspect Opens Panel

1) Trace current Inspect flow

- Review `packages/anyclick-extension/src/contextMenu.ts` and `content.ts` to see how INSPECT_ELEMENT is triggered and forwarded.
- Note any background or devtools listeners (`background.ts`, `devtools.ts`, `panel.ts`) that handle inspect messages or capture responses.

2) Stop outbound capture on Inspect

- Update the Inspect handler so it no longer emits/forwards element context data to adapters/queues; keep only what’s needed to open the panel.
- Guard against regressions by keeping existing logging/metrics if harmless.

3) Open/focus Anyclick DevTools panel on Inspect

- Add a message path from content -> background -> devtools to open (or focus) the Anyclick panel; if DevTools isn’t open, call the Chrome DevTools API to open it and select the Anyclick panel.
- If DevTools is already open, switch to the Anyclick panel tab without reloading the inspected page.

4) Verify end-to-end behavior

- Manual test in browser: right-click Inspect in page context menu; confirm DevTools opens (if closed) and the Anyclick panel is focused, and no network/adapter sends occur.
- Adjust logging to reflect the new behavior (e.g., “Opened Anyclick DevTools panel”).