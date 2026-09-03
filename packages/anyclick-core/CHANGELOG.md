# @ewjdev/anyclick-core

## 5.1.1

### Patch Changes

- 3cfcefa: Fix element/container screenshot captures on dark backgrounds

  Element and container screenshot captures now correctly resolve the background color from ancestor elements instead of using a hardcoded white background. This fixes the issue where elements on dark surfaces appeared to be composited onto white in the review overlay.

  The fix walks up the DOM tree from the captured element to find the first ancestor with an opaque background color, checking:

  1. The element itself and each ancestor's computed `background-color`
  2. Document body and html element as fallbacks
  3. Falls back to white only if no background color is found anywhere

  Semi-transparent backgrounds (rgba with alpha >= 0.5) are treated as opaque enough to use.

## 5.1.0

### Minor Changes

- 353c4ca: Rebrand from Feedback to Anyclick

  - Rename FeedbackProvider to AnyclickProvider
  - Rename FeedbackMenu to AnyclickMenu
  - Rename useFeedback hook to useAnyclick
  - Update all component names, comments, and documentation to use Anyclick branding
  - Update package homepages to use anyclick.dev domain

## 1.4.0

### Minor Changes

- 7942892: Improve element inspector hierarchy navigation and selector generation

  - Add utility class filtering in selector generation to exclude Tailwind/Bootstrap utilities
  - Redesign ElementHierarchyNav to show 3-line sibling-based view matching code editor conventions
  - Add ellipsis indicator for deeply nested elements (depth > 3 levels)
  - Improve CSS truncation with single-line display for long class names
  - Export `isBlacklisted` function from ElementHierarchyNav for external use
  - Add 'br' tag to element blacklist

## 1.2.0

### Minor Changes

- Add experimental adapters package with a game mode adapter, integrate fun-mode toggling via pointer config, and update examples/docs to use the new adapter flow.

## 1.1.1

### Patch Changes

- Fix mobile touch handling for scoped providers

  Fix issue where global providers were incorrectly handling touch events inside scoped provider containers. Touch events now properly defer to scoped providers, allowing them to handle events with their own theme configuration. Added `isElementInAnyScopedProvider` helper to check if an element is within any scoped provider's container.

## 1.1.0

### Minor Changes

- 8d9a18e: Cursor theming, scoped providers and menu theming

## 1.1.0

### Minor Changes

- **Disabled Scope Support**: The `onContextMenu` callback now supports returning `false` to allow the native browser context menu to appear. This enables disabled scoped providers to properly show the native menu instead of preventing it.

### API Changes

- `AnyclickClient.onContextMenu` callback signature updated to `(event: MouseEvent, element: Element) => boolean | void`
  - Return `false` to allow native context menu (e.g., for disabled scopes)
  - Return `true` or `void` to prevent native menu and show custom menu

## 1.0.0

### Major Changes

- a464d40: Initial release of the anyclick libraries
