# @ewjdev/anyclick-devtools

## 5.1.2

### Patch Changes

- 6ed32b5: Make inspector hierarchy a compact navigator with selectable ancestor ellipses (#98).

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

- b6b800d: Fix inspector properties disappearing after hierarchy selection (#96).

  - **Highlight classes no longer blacklist elements**: `anyclick-highlight-target` and `anyclick-highlight-container` are temporary styling classes applied to legitimate page elements during inspection. They no longer incorrectly classify elements as Anyclick-owned UI.
  - **Dedicated UI markers**: Actual Anyclick-owned UI (inspector, menu, pointer, toast, overlay) is now identified via dedicated `data-anyclick-*` attributes instead of CSS classes. The inspector dialog now has `data-anyclick-inspector` on its root element.
  - **Unsupported rows are non-actionable**: Clicking or hovering unsupported structural elements (`<br>`, SVG nodes) in the hierarchy no longer selects them or removes the current valid selection. They display with `cursor: not-allowed` and don't receive hover highlighting.
  - **Explicit unsupported-element message**: When a non-inspectable target is opened directly (e.g., programmatically), the inspector shows a clear explanation instead of a blank properties region. Navigation and close controls remain functional.
  - **App content remains inspectable**: Elements inside `data-anyclick-root` (the wrapper containing application content) are not excluded. Only elements inside dedicated Anyclick UI markers are non-inspectable.
  - **Test coverage**: Added focused regression tests for normal, highlighted, unsupported, and Anyclick-owned targets.

- Updated dependencies [c33f30a]
  - @ewjdev/anyclick-core@5.1.2

## 5.1.0

### Minor Changes

- 353c4ca: Rebrand from Feedback to Anyclick

  - Rename FeedbackProvider to AnyclickProvider
  - Rename FeedbackMenu to AnyclickMenu
  - Rename useFeedback hook to useAnyclick
  - Update all component names, comments, and documentation to use Anyclick branding
  - Update package homepages to use anyclick.dev domain

### Patch Changes

- Updated dependencies [353c4ca]
  - @ewjdev/anyclick-core@5.1.0

## 4.0.0

### Patch Changes

- Updated dependencies
  - @ewjdev/anyclick-react@4.0.0

## 3.0.0

### Patch Changes

- Update peer dependencies and add setup improvements

  - Update React peer dependencies to 19.2.1 across devtools and pointer packages
  - Add setup wrapper script for GitHub adapter with environment variable checking
  - Improve error handling and user feedback in GitHub setup process

- Updated dependencies
  - @ewjdev/anyclick-react@3.0.0

## 2.0.0

### Patch Changes

- b826935: move inspect into seperate package for devtools
- Updated dependencies [b826935]
- Updated dependencies [20d6085]
  - @ewjdev/anyclick-react@2.0.0
