# Anyclick Extension - Manual Testing Checklist

## Prerequisites

1. Build the extension: `yarn build`
2. Load unpacked extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

## Test Checklist

### 1. Extension Loading

- [ ] Extension icon appears in Chrome toolbar
- [ ] Clicking icon opens popup
- [ ] Popup displays "Enabled" toggle, endpoint field, token field
- [ ] Toggle defaults to "Enabled"

### 2. Settings Persistence

- [ ] Enter endpoint URL (e.g., `https://httpbin.org/post`)
- [ ] Click "Save Settings"
- [ ] Toast shows "Settings saved!"
- [ ] Close and reopen popup - settings persist
- [ ] Disable extension via toggle
- [ ] Close and reopen popup - disabled state persists

### 3. Context Menu

- [ ] Right-click on any page element
- [ ] Context menu shows "Capture with Anyclick" option
- [ ] Clicking option triggers capture (toast appears)

### 4. Capture Flow (with valid endpoint)

Setup: Set endpoint to `https://httpbin.org/post` (echo server)

- [ ] Right-click element and select "Capture with Anyclick"
- [ ] Toast shows "Capturing..."
- [ ] Toast shows success message with timing (e.g., "Captured in 150ms")
- [ ] Popup shows updated "Last capture" timestamp
- [ ] Popup shows "Submitted successfully" status

### 5. Capture Flow (disabled)

- [ ] Disable extension in popup
- [ ] Right-click and select "Capture with Anyclick"
- [ ] Toast shows "Anyclick is disabled"

### 6. Error Handling

- [ ] Clear endpoint in popup, save
- [ ] Right-click and capture
- [ ] Toast shows "Configure endpoint in extension popup"

- [ ] Set invalid endpoint (e.g., `https://invalid.endpoint.test`)
- [ ] Right-click and capture
- [ ] Toast shows error message after retries

### 7. Payload Verification

Use browser DevTools Network tab or httpbin.org response to verify payload:

- [ ] `type` is `"extension-capture"`
- [ ] `element` contains selector, tag, classes, innerText, outerHTML
- [ ] `element.boundingRect` has top, left, width, height
- [ ] `element.dataAttributes` captured (if present)
- [ ] `element.ancestors` array has up to 4 entries
- [ ] `page` contains url, title, viewport, screen, userAgent, timestamp
- [ ] `action` contains clientX, clientY, pageX, pageY, scrollX, scrollY
- [ ] `screenshots.viewport` contains dataUrl (base64 JPEG), width, height, sizeBytes
- [ ] `metadata.captureTimeMs` shows capture duration

### 8. Performance Verification

- [ ] Capture completes in <500ms total
- [ ] Content script doesn't cause page lag
- [ ] No console errors during capture
- [ ] Payload size is under 500KB

### 9. Edge Cases

- [ ] Capture on element with no ID or classes
- [ ] Capture on deeply nested element (>10 levels)
- [ ] Capture on element with long text content (>1000 chars) - should truncate
- [ ] Capture on SVG element
- [ ] Capture on iframe content (should work on same-origin)
- [ ] Rapid consecutive captures (should handle gracefully)

## Test Endpoint Options

1. **httpbin.org** (public echo): `https://httpbin.org/post`
2. **Local Anyclick API** (if running): `http://localhost:3001/api/feedback`
3. **Request Bin**: Create at https://requestbin.com/

## Debugging

- Background logs: `chrome://extensions/` → Anyclick → "service worker" link
- Content script logs: Page DevTools Console
- Popup logs: Right-click popup → "Inspect"

## Known Limitations (v0.1.0)

- Viewport screenshot only (no element-specific or full-page)
- No visual element highlight before capture
- No capture preview/confirmation dialog
- Icons are placeholder 1x1 pixels


