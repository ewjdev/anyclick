---
"@ewjdev/anyclick-core": patch
---

Fix `attach()` to listen on `container.ownerDocument` instead of the global `document`, so containers inside same-origin iframes now correctly receive contextmenu events. Also fix `getUniqueSelector` and `getAncestors` to stop at the element's `ownerDocument.body`, producing selectors relative to the iframe document rather than the parent.
