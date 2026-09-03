---
"@ewjdev/anyclick-devtools": patch
---

Fix inspector properties disappearing after hierarchy selection (#96).

- **Highlight classes no longer blacklist elements**: `anyclick-highlight-target` and `anyclick-highlight-container` are temporary styling classes applied to legitimate page elements during inspection. They no longer incorrectly classify elements as Anyclick-owned UI.

- **Dedicated UI markers**: Actual Anyclick-owned UI (inspector, menu, pointer, toast, overlay) is now identified via dedicated `data-anyclick-*` attributes instead of CSS classes. The inspector dialog now has `data-anyclick-inspector` on its root element.

- **Unsupported rows are non-actionable**: Clicking or hovering unsupported structural elements (`<br>`, SVG nodes) in the hierarchy no longer selects them or removes the current valid selection. They display with `cursor: not-allowed` and don't receive hover highlighting.

- **Explicit unsupported-element message**: When a non-inspectable target is opened directly (e.g., programmatically), the inspector shows a clear explanation instead of a blank properties region. Navigation and close controls remain functional.

- **App content remains inspectable**: Elements inside `data-anyclick-root` (the wrapper containing application content) are not excluded. Only elements inside dedicated Anyclick UI markers are non-inspectable.

- **Test coverage**: Added focused regression tests for normal, highlighted, unsupported, and Anyclick-owned targets.
