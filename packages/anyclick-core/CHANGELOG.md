# @ewjdev/anyclick-core

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
