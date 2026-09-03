---
"@ewjdev/anyclick-core": patch
---

Fix element/container screenshot captures on dark backgrounds

Element and container screenshot captures now correctly resolve the background color from ancestor elements instead of using a hardcoded white background. This fixes the issue where elements on dark surfaces appeared to be composited onto white in the review overlay.

The fix walks up the DOM tree from the captured element to find the first ancestor with an opaque background color, checking:
1. The element itself and each ancestor's computed `background-color`
2. Document body and html element as fallbacks
3. Falls back to white only if no background color is found anywhere

Semi-transparent backgrounds (rgba with alpha >= 0.5) are treated as opaque enough to use.
