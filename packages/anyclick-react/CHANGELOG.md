# @ewjdev/anyclick-react

## 1.5.0

### Minor Changes

- b826935: move inspect into seperate package for devtools

## 1.4.1

### Patch Changes

- Added documentation and cleanup

## 1.4.0

### Patch Changes

- Update anyclick-core to 1.3.0
- Updated dependencies
  - @ewjdev/anyclick-pointer@1.4.0
  - @ewjdev/anyclick-core@1.4.0

## 1.3.0

### Minor Changes

- 7942892: Improve element inspector hierarchy navigation and selector generation

  - Add utility class filtering in selector generation to exclude Tailwind/Bootstrap utilities
  - Redesign ElementHierarchyNav to show 3-line sibling-based view matching code editor conventions
  - Add ellipsis indicator for deeply nested elements (depth > 3 levels)
  - Improve CSS truncation with single-line display for long class names
  - Export `isBlacklisted` function from ElementHierarchyNav for external use
  - Add 'br' tag to element blacklist

### Patch Changes

- Updated dependencies [7942892]
  - @ewjdev/anyclick-core@1.3.0

## 1.2.0

### Minor Changes

- Add experimental adapters package with a game mode adapter, integrate fun-mode toggling via pointer config, and update examples/docs to use the new adapter flow.

### Patch Changes

- Updated dependencies
  - @ewjdev/anyclick-core@1.2.0
  - @ewjdev/anyclick-pointer@1.2.0

## 1.1.1

### Patch Changes

- Fix mobile touch handling for scoped providers

  Fix issue where global providers were incorrectly handling touch events inside scoped provider containers. Touch events now properly defer to scoped providers, allowing them to handle events with their own theme configuration. Added `isElementInAnyScopedProvider` helper to check if an element is within any scoped provider's container.

- Updated dependencies
  - @ewjdev/anyclick-core@1.1.1

## 1.1.0

### Minor Changes

- 8d9a18e: Cursor theming, scoped providers and menu theming

### Patch Changes

- Updated dependencies [8d9a18e]
  - @ewjdev/anyclick-core@1.1.0

## 1.1.0

### Minor Changes

- **Scoped Provider Improvements**: Disabled scoped providers now properly allow the native browser context menu to appear instead of blocking it.

- **CSS Custom Properties for Menu Theming**: Added CSS variable support for comprehensive menu customization. Override these variables in `menuStyle` to theme internal menu elements:

  - `--anyclick-menu-bg` - Background color
  - `--anyclick-menu-text` - Primary text color
  - `--anyclick-menu-text-muted` - Secondary/header text color
  - `--anyclick-menu-border` - Border colors
  - `--anyclick-menu-hover` - Hover state background
  - `--anyclick-menu-accent` - Accent color (submit button)
  - `--anyclick-menu-accent-text` - Accent text color
  - `--anyclick-menu-input-bg` - Input field background
  - `--anyclick-menu-input-border` - Input field border
  - `--anyclick-menu-cancel-bg` - Cancel button background
  - `--anyclick-menu-cancel-text` - Cancel button text

- **New Exports**:
  - `menuCSSVariables` - Object containing default CSS variable values for reference
  - `isElementInDisabledScope` available via store for advanced use cases

### Bug Fixes

- **Fixed Theme Merging Timing Issue**: Resolved a bug where `menuStyle` and other theme properties weren't being applied to the context menu. The issue was caused by `useMemo` running before the provider was registered in the store.

- **Fixed Disabled Scope Detection**: Global providers now correctly detect when an element is inside a disabled scoped provider and allow the native context menu.

### Patch Changes

- Updated dependencies
  - @ewjdev/anyclick-core@1.1.0

## 1.0.0

### Major Changes

- a464d40: Initial release of the anyclick libraries

### Patch Changes

- Updated dependencies [a464d40]
  - @ewjdev/anyclick-core@1.0.0
