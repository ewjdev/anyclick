# @ewjdev/anyclick-react

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
