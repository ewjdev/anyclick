---
"@ewjdev/anyclick-devtools": patch
---

Make inspector hierarchy a compact navigator with selectable ancestor ellipses (#98).

- **Compact local window**: The hierarchy navigator now shows a complete relationship view for the selected element:

  - Nearest inspectable parent/ancestor
  - Previous inspectable sibling
  - Current element (selected)
  - Next inspectable sibling
  - First inspectable direct child (shown even when next sibling exists)

- **Interactive ancestor ellipsis**: When ancestors above the parent are omitted, an actionable `…` button appears. Clicking it opens an ancestor chooser displaying omitted ancestors nearest-first within the inspection boundary.

- **Keyboard accessible**: The ancestor chooser supports full keyboard navigation (Arrow Up/Down to navigate, Enter/Space to select, Escape to dismiss without changing selection).

- **Eligibility guards preserved**: Elements with temporary highlight classes remain inspectable. Unsupported structural nodes (`<br>`, SVG) and AnyClick-owned UI cannot be navigation targets.

- **Synchronized updates**: Selecting any relationship entry updates the current selection, refreshes properties and selector, and recomputes the local window.

- **New helper exports**: Added `isEligibleForNavigation`, `findEligibleParent`, `findEligiblePrevSibling`, `findEligibleNextSibling`, `findEligibleFirstChild`, and `findOmittedAncestors` utility functions.

- **Test coverage**: Added comprehensive rendered-component and selection tests covering navigation, ancestor chooser, keyboard interactions, and eligibility edge cases.
