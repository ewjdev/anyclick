# Pointer performance notes

- Target: < 1 frame of drift at 60fps (≈16ms input → render).
- Movement path: `pointerrawupdate` (fallback `pointermove`) → coalesced events → single rAF → `translate3d`.
- Rendering: transform-only, `contain: layout paint style`, `pointer-events: none`, GPU hint via `translateZ(0)` and `will-change`.
- Device gating: `shouldShowPointer()` + `matchMedia(pointer)` + `visibilitychange`; work stops when tab hidden or pointer leaves the page.
- Cursor hide: one shared `<style>`; recycled when pointer disables/enables.

## Debugging latency

Enable lightweight logging via pointer config:

```ts
mountPointer({
  config: {
    debugPerformance: true,
    debugLogIntervalMs: 4000, // optional
  },
});
```

What you get:

- Perf marks: `anyclick-pointer-init`, `anyclick-pointer-update` (start/end) visible in Chrome Performance panel.
- Console summary every `debugLogIntervalMs`: avg/max input→render lag and sample count.

## Quick test matrix

- Heavy DOM (e.g., dashboards) and media pages (YouTube/streaming).
- Wide-screen vs. HiDPI; Chrome performance panel to confirm 1 rAF update per pointer event.
- Backgrounded tab then resumed (ensure opacity reset, no work while hidden).
- Touch-capable laptop: verify pointer hides on touch, reappears on fine pointer.
