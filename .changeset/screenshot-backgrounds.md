---
"@ewjdev/anyclick-core": patch
"@ewjdev/anyclick-react": patch
---

Fix screenshots losing the page background (#88). Element and container captures are now cropped from a single viewport render with the configured `padding`, so dark pages, gradients, background images and translucent cards look the way they do on screen instead of being flattened onto white. The viewport capture now honors the scroll position instead of always showing the top of the document, and Anyclick's own menu is excluded from captures. Nodes that cannot be cropped (outside the viewport or inside a scrolled container) fall back to a standalone render on the composited background color of their ancestors, exposed as `resolveBackdropColor`.
