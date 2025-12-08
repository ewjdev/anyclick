---
name: T3 Chat and UploadThing Adapters
overview: Build adapters for t3.chat and UploadThing services, supporting both web library and browser extension, with Next.js backend integration options and future proxy service compatibility.
todos:
  - id: create-t3chat-package
    content: Create packages/anyclick-t3chat with browser adapter, types, and utilities for text selection detection and t3.chat navigation
    status: completed
  - id: create-uploadthing-package
    content: Create packages/anyclick-uploadthing with browser and server adapters, image detection utilities, and UploadThing SDK integration
    status: completed
  - id: integrate-t3chat-menu
    content: Add conditional t3.chat menu item to ContextMenu when text is selected, using text selection detection
    status: completed
  - id: integrate-t3chat-quickchat
    content: Add Send to t3.chat option in QuickChat component that navigates with current query
    status: completed
  - id: integrate-uploadthing-menu
    content: Add UploadThing menu items for images and screenshots, with image detection logic
    status: completed
  - id: create-extension-package
    content: Create packages/anyclick-extension with content scripts, background scripts, and adapter wrappers
    status: completed
  - id: add-nextjs-examples
    content: Create example pages and API routes for t3.chat and UploadThing Next.js integration
    status: completed
  - id: write-documentation
    content: Write README files for both adapters, extension package, and update main adapter docs
    status: completed
---

# T3 Chat and UploadThing Adapters Implementation Plan

## Overview

Create adapters for t3.chat and UploadThing to enable marketing opportunities with @t3dotgg. Support both web library (`@ewjdev/anyclick-react`) and browser extension (`packages/anyclick-extension`), with flexible backend integration options.

## Architecture

### Package Structure

- `packages/anyclick-t3chat/` - t3.chat adapter package
- `packages/anyclick-uploadthing/` - UploadThing adapter package  
- `packages/anyclick-extension/` - Browser extension

### Integration Points

- Web library: React components and context menu items
- Extension: Content scripts with adapter wrappers
- Backend: Next.js API routes or future proxy service

## Implementation Details

### 1. T3.Chat Adapter (`packages/anyclick-t3chat`)

**Browser-Side Features:**

- Text selection detection on right-click
- Menu item: "Send to t3.chat" (when text is selected)
- Quick chat integration: Add "Send to t3.chat" option within quick chat UI
- Navigation to t3.chat with pre-filled query

**Package Structure:**

```
packages/anyclick-t3chat/
├── src/
│   ├── index.ts              # Browser-side exports
│   ├── t3chatAdapter.ts       # Browser adapter for navigation
│   ├── types.ts               # Type definitions
│   └── utils.ts               # Helper functions (text selection, URL building)
├── package.json
└── README.md
```

**Key Implementation:**

- Detect selected text using `window.getSelection()`
- Build t3.chat URL with query parameter: `https://t3.chat/?q={encodedQuery}`
- Add menu item that appears conditionally when text is selected
- Integrate with QuickChat component to add "Send to t3.chat" button

**Files to Create/Modify:**

- `packages/anyclick-t3chat/src/index.ts` - Export browser adapter
- `packages/anyclick-t3chat/src/t3chatAdapter.ts` - Navigation adapter
- `packages/anyclick-t3chat/src/types.ts` - Configuration types
- `packages/anyclick-react/src/QuickChat/QuickChat.tsx` - Add t3.chat option
- `packages/anyclick-react/src/ContextMenu.tsx` - Add conditional menu item for text selection

### 2. UploadThing Adapter (`packages/anyclick-uploadthing`)

**Browser-Side Features:**

- Right-click on screenshot → upload to UploadThing
- Right-click on image elements → upload to UploadThing
- Client-side upload using UploadThing SDK
- API key storage in localStorage (optional, for quick setup)

**Server-Side Features:**

- Next.js API route handler using UTApi
- Server-side upload for security (recommended for production)
- Self-hosted configuration support

**Package Structure:**

```
packages/anyclick-uploadthing/
├── src/
│   ├── index.ts              # Browser-side exports
│   ├── server.ts              # Server-side exports (UTApi)
│   ├── uploadthingAdapter.ts  # Browser adapter
│   ├── serverAdapter.ts       # Server adapter
│   ├── types.ts               # Type definitions
│   └── utils.ts               # Image detection, screenshot handling
├── package.json
└── README.md
```

**Key Implementation:**

- Detect image elements (`<img>`, `<picture>`, CSS background images)
- Capture screenshots using existing `@ewjdev/anyclick-core` screenshot utilities
- Upload using UploadThing's client SDK (`@uploadthing/react`) or server UTApi
- Support both direct client uploads and proxied server uploads
- Configuration options:
  - `apiKey` (client-side, stored in localStorage)
  - `endpoint` (server-side API route)
  - `selfHosted` (boolean, for self-hosted UploadThing instances)

**Files to Create/Modify:**

- `packages/anyclick-uploadthing/src/index.ts` - Browser exports
- `packages/anyclick-uploadthing/src/server.ts` - Server exports
- `packages/anyclick-uploadthing/src/uploadthingAdapter.ts` - Client adapter
- `packages/anyclick-uploadthing/src/serverAdapter.ts` - Server adapter
- `packages/anyclick-react/src/ContextMenu.tsx` - Add image/screenshot detection and menu items
- `packages/anyclick-react/src/types.ts` - Add image detection utilities

### 3. Browser Extension (`packages/anyclick-extension`)

**Architecture:**

- Content scripts inject anyclick functionality into pages
- Background script coordinates adapter configuration
- Shared adapter core logic with extension-specific wrappers
- Manifest V3 support

**Package Structure:**

```
packages/anyclick-extension/
├── src/
│   ├── content/              # Content scripts
│   │   ├── inject.ts          # Inject anyclick into pages
│   │   └── adapters/          # Extension adapter wrappers
│   ├── background/            # Background scripts
│   │   └── adapter-config.ts  # Adapter configuration management
│   ├── popup/                 # Extension popup UI (optional)
│   ├── types.ts
│   └── manifest.json
├── package.json
└── README.md
```

**Key Implementation:**

- Content script wrapper for t3.chat adapter (navigation-based, works in extension)
- Content script wrapper for UploadThing adapter (uses extension storage for API keys)
- Bridge between extension storage and adapter configuration
- Support for both adapters in extension context

**Files to Create:**

- `packages/anyclick-extension/src/content/inject.ts` - Main injection script
- `packages/anyclick-extension/src/content/adapters/t3chat.ts` - t3.chat wrapper
- `packages/anyclick-extension/src/content/adapters/uploadthing.ts` - UploadThing wrapper
- `packages/anyclick-extension/src/background/adapter-config.ts` - Configuration management
- `packages/anyclick-extension/manifest.json` - Extension manifest

### 4. React Integration Updates

**Context Menu Enhancements:**

- Detect text selection and show t3.chat menu item conditionally
- Detect image elements and show UploadThing menu item
- Detect screenshot context and show UploadThing menu item

**Quick Chat Integration:**

- Add "Send to t3.chat" button/option in QuickChat component
- Navigate to t3.chat with current query when clicked

**Files to Modify:**

- `packages/anyclick-react/src/ContextMenu.tsx` - Add conditional menu items
- `packages/anyclick-react/src/QuickChat/QuickChat.tsx` - Add t3.chat option
- `packages/anyclick-react/src/types.ts` - Add adapter configuration types
- `packages/anyclick-react/src/utils.ts` - Add text selection and image detection utilities

### 5. Next.js Integration Examples

**Create example pages:**

- `apps/web/src/app/examples/t3chat-integration/page.tsx` - t3.chat example
- `apps/web/src/app/examples/uploadthing-integration/page.tsx` - UploadThing example
- `apps/web/src/app/api/uploadthing/route.ts` - Example API route for UploadThing

**Files to Create:**

- `apps/web/src/app/examples/t3chat-integration/page.tsx`
- `apps/web/src/app/examples/uploadthing-integration/page.tsx`
- `apps/web/src/app/api/uploadthing/route.ts` (example)

### 6. Documentation

**Adapter Documentation:**

- `packages/anyclick-t3chat/README.md` - Usage guide
- `packages/anyclick-uploadthing/README.md` - Setup guide (client vs server)
- `packages/anyclick-extension/README.md` - Extension setup guide

**Web App Documentation:**

- Update `apps/web/src/app/docs/adapters/page.tsx` - Add t3.chat and UploadThing sections

**Files to Create/Modify:**

- `packages/anyclick-t3chat/README.md`
- `packages/anyclick-uploadthing/README.md`
- `packages/anyclick-extension/README.md`
- `apps/web/src/app/docs/adapters/page.tsx` - Add new adapter sections

## Technical Considerations

### Text Selection Detection

- Use `window.getSelection()?.toString().trim()` to detect selected text
- Check selection on context menu open
- Store selection state temporarily for menu item rendering

### Image Detection

- Check if target element is `<img>` or `<picture>`
- Check for CSS background images via computed styles
- Check if context is screenshot capture mode

### Screenshot Handling

- Reuse existing screenshot capture from `@ewjdev/anyclick-core`
- Convert screenshots to File/Blob for UploadThing upload
- Handle both element screenshots and viewport screenshots

### Adapter Interface Compliance

- Both adapters implement `AnyclickAdapter` interface
- Browser adapters use `submitAnyclick()` for consistency (even if just navigation)
- Server adapters follow same pattern as GitHub/Jira adapters

### Extension Compatibility

- Content scripts run in isolated context - need message passing for configuration
- Use `chrome.storage` or `browser.storage` for API key persistence
- Bridge adapter calls through content script → background script → adapter

### Future Proxy Service Support

- Design adapters to work with future anyclick proxy service
- Configuration structure should support proxy endpoint URLs
- Adapters should be proxy-agnostic (work standalone or via proxy)

## Dependencies

### New Dependencies

- `@uploadthing/react` - UploadThing client SDK (for browser)
- `uploadthing` - UploadThing server SDK (for Next.js)

### Existing Dependencies (reuse)

- `@ewjdev/anyclick-core` - Screenshot utilities, types
- `@ewjdev/anyclick-react` - React components

## Testing Strategy

1. **Unit Tests:**

   - Text selection detection utilities
   - Image detection utilities
   - URL building for t3.chat
   - UploadThing adapter configuration

2. **Integration Tests:**

   - Context menu items appear conditionally
   - Quick chat t3.chat option works
   - UploadThing uploads succeed (client and server)
   - Extension content script injection

3. **Manual Testing:**

   - Test on various websites with text selection
   - Test image uploads from different sources
   - Test extension in Chrome/Firefox
   - Test Next.js integration examples

## Implementation Order

1. **Phase 1: Core Adapters**

   - Create `anyclick-t3chat` package with browser adapter
   - Create `anyclick-uploadthing` package with browser adapter
   - Add basic menu items to React components

2. **Phase 2: React Integration**

   - Integrate t3.chat into QuickChat component
   - Add image detection and UploadThing menu items
   - Add text selection detection for t3.chat menu item

3. **Phase 3: Server-Side Support**

   - Add UploadThing server adapter
   - Create Next.js API route example
   - Add configuration options for server vs client

4. **Phase 4: Extension Support**

   - Create extension package structure
   - Implement content script injection
   - Create adapter wrappers for extension context
   - Add background script for configuration

5. **Phase 5: Documentation & Examples**

   - Write adapter READMEs
   - Create example pages
   - Update main adapter documentation
   - Add setup guides for Next.js integration