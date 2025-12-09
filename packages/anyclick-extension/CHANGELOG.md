# @ewjdev/anyclick-extension

## 3.0.0

### Minor Changes

- Enhance Chrome extension with new adapters and context menu improvements

  - Add T3.chat adapter integration with autofill and prompt refinement settings
  - Add UploadThing adapter for image uploads with cross-origin support
  - Improve context menu with better feedback handling and UI polish
  - Enhance popup and panel UI with toggle business logic cleanup
  - Add background queue processing for reliable payload submission

### Patch Changes

- Updated dependencies
  - @ewjdev/anyclick-t3chat@3.0.0
  - @ewjdev/anyclick-uploadthing@3.0.0

## 2.1.0

### Minor Changes

- Add Chrome Extension with Inspector window and DevTools panel improvements

  - Add standalone Inspector popup window (similar to Redux DevTools) that opens automatically when inspecting elements
  - Improve element targeting to use the right-clicked element instead of hover target
  - Add persistent element highlighting when inspecting
  - Improve toast messages with platform-specific keyboard shortcuts
  - Add background queue processing for reliable payload submission
  - Support for custom context menu with feedback types (Issue, Feature, Like)
