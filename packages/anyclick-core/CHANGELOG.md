# @ewjdev/anyclick-core

## 1.1.0

### Minor Changes

- **Disabled Scope Support**: The `onContextMenu` callback now supports returning `false` to allow the native browser context menu to appear. This enables disabled scoped providers to properly show the native menu instead of preventing it.

### API Changes

- `FeedbackClient.onContextMenu` callback signature updated to `(event: MouseEvent, element: Element) => boolean | void`
  - Return `false` to allow native context menu (e.g., for disabled scopes)
  - Return `true` or `void` to prevent native menu and show custom menu

## 1.0.0

### Major Changes

- a464d40: Initial release of the anyclick libraries
