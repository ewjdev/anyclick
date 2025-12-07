# @ewjdev/anyclick-extension

Chrome MV3 extension for Anyclick - capture DOM context, screenshots, and metadata with high performance.

## Features

- **Custom Context Menu** - Right-click shows a beautiful custom menu (fully replaces native menu)
- **DevTools Panel** - Dedicated "Anyclick" panel in DevTools syncs with inspected elements
- **Instant Toast (<100ms)** - DOM captured synchronously; toast shows immediately
- **Background Queue** - Payloads are queued in `chrome.storage.local` and processed by the service worker with retries
- **Deferred Screenshots** - Screenshots happen in the background; payload still submits if screenshot fails
- **Lean DOM Capture** - Selector cache, trimmed text/HTML, and ancestor limits keep payloads small
- **HTTP Submission** - Background worker submits with retry/backoff
- **Minimal Footprint** - Lean content script with no external dependencies (vanilla JS menu)

## Installation

### From Source

1. Build the extension:

```bash
cd packages/anyclick-extension
yarn install
yarn build
```

2. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `dist/` folder

### Configuration

1. Click the Anyclick extension icon in Chrome toolbar
2. Enter your endpoint URL (e.g., `https://your-app.com/api/feedback`)
3. Optionally add an auth token for protected endpoints
4. Click "Save Settings"

## Usage

### Custom Context Menu

1. Right-click any element on a page - the custom Anyclick menu appears (replaces native menu)
2. Choose an action:
   - **Capture Element** - Instantly capture DOM context and queue for submission
   - **Inspect in DevTools** - Send element details to the Anyclick DevTools panel
   - **Send Feedback** - Submenu with Issue, Feature, or Like options (with optional comment)
3. A toast confirms the action; the payload is queued in the background
4. Press `Esc` to close the menu or click outside

### DevTools Panel

1. Open Chrome DevTools (F12 or right-click → Inspect)
2. Navigate to the **Anyclick** tab in DevTools
3. Right-click an element and select "Inspect in DevTools" to sync element details
4. The panel displays:
   - Element tag, ID, and classes
   - CSS selector
   - Bounding box dimensions
   - Data attributes
   - Ancestor hierarchy
5. Click **Capture** in the panel to capture the inspected element

### Fallback

The extension also adds a native Chrome context menu item "Capture with Anyclick" as fallback.

### Notes

- If the page is a restricted URL (e.g., `chrome://`), the content script won't load and capture will be skipped
- The background worker processes the queue: adds a screenshot (if possible) and submits with retries

## Payload Format

```typescript
interface CapturePayload {
  type: "extension-capture";
  element: {
    selector: string;
    tag: string;
    id?: string;
    classes: string[];
    innerText: string;
    outerHTML: string;
    boundingRect: { top, left, width, height };
    dataAttributes: Record<string, string>;
    ancestors: Array<{ tag, id?, classes, selector }>;
  };
  page: {
    url: string;
    title: string;
    referrer: string;
    screen: { width, height };
    viewport: { width, height };
    userAgent: string;
    timestamp: string;
  };
  action: {
    actionType: "contextmenu";
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    modifiers: { ctrl, shift, alt, meta };
    scrollX: number;
    scrollY: number;
    timestamp: string;
  };
  screenshots?: {
    viewport?: {
      dataUrl: string;
      width: number;
      height: number;
      sizeBytes: number;
    };
    capturedAt: string;
  };
  metadata?: Record<string, unknown>;
}
```

## Performance

- **Perceived latency**: Toast shown in <100ms (DOM capture + queue add)
- **DOM capture**: Typically <50ms with selector cache and trimmed HTML
- **Queue add**: ~<10ms (storage write)
- **Screenshot**: ~200-400ms (async, non-blocking)
- **Submission**: ~100-300ms (async, non-blocking)
- **Payload limits**:
  - innerText: 200 chars
  - outerHTML: 500 chars (outerHTML skipped entirely if >10KB)
  - ancestors: 3 levels
  - total payload: 500KB max

## Development

```bash
# Watch mode for development
yarn dev

# Type check
yarn typecheck

# Clean build artifacts
yarn clean
```

## Permissions

- `activeTab` - Capture current tab content
- `scripting` - Inject content script
- `storage` - Save settings locally (settings + queue)
- `contextMenus` - Add right-click menu item
- `alarms` - Periodically process the background queue
- `<all_urls>` - Capture on any website

## How the async queue works

- Content script captures DOM + metadata synchronously, shows a toast, and sends the payload to the background.
- Background adds the item to a persisted queue (`chrome.storage.local`).
- Queue processor runs on startup, on new items, and every ~5s via alarms.
- Screenshots are taken in the background; if they fail, the payload still submits without a screenshot.
- Failed submissions back off exponentially and persist across extension restarts.

## License

MIT © [anyclick](https://anyclick.ewj.dev)
