# @ewjdev/anyclick-extension

Browser extension for Anyclick - adds right-click context menu integration with t3.chat and UploadThing to any webpage.

## Features

- **Text Selection → t3.chat**: Select text on any page, right-click, and send it to t3.chat for AI-powered answers
- **Image Upload → UploadThing**: Right-click on images to upload them directly to UploadThing
- **Cross-browser Support**: Works on Chrome, Edge, and Firefox (Manifest V3)
- **Configurable**: Store your preferences and API keys securely in extension storage

## Installation

### From Source

1. Clone the repository:

```bash
git clone https://github.com/ewjdev/anyclick.git
cd anyclick/packages/anyclick-extension
```

2. Install dependencies:

```bash
npm install
```

3. Build the extension:

```bash
npm run build:extension
```

4. Load in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `packages/anyclick-extension` folder

### From Store (Coming Soon)

The extension will be available on:
- Chrome Web Store
- Firefox Add-ons
- Edge Add-ons

## Usage

### t3.chat Integration

1. Select text on any webpage
2. Right-click to open the context menu
3. Click "Ask t3.chat"
4. The selected text opens in t3.chat with your query pre-filled

### UploadThing Integration

1. Configure your UploadThing endpoint in the extension options
2. Right-click on any image
3. Click "Upload to UploadThing"
4. The image URL is copied to your clipboard

## Configuration

Click the extension icon to open settings:

```typescript
interface ExtensionConfig {
  enabled: boolean; // Enable/disable the extension
  t3chat: {
    enabled: boolean; // Enable t3.chat menu item
    baseUrl: string; // Custom t3.chat URL
  };
  uploadthing: {
    enabled: boolean; // Enable UploadThing menu item
    endpoint?: string; // Your upload API endpoint
    apiKey?: string; // UploadThing API key (for direct uploads)
  };
}
```

## Development

### Project Structure

```
packages/anyclick-extension/
├── src/
│   ├── background/          # Service worker
│   │   └── background.ts
│   ├── content/             # Content scripts
│   │   ├── inject.ts
│   │   └── adapters/
│   │       ├── t3chat.ts
│   │       └── uploadthing.ts
│   ├── types.ts             # Type definitions
│   └── index.ts             # Package exports
├── manifest.json            # Extension manifest
├── package.json
└── README.md
```

### Scripts

```bash
# Build library exports
npm run build

# Build extension bundle
npm run build:extension

# Development watch mode
npm run dev

# Clean build files
npm run clean
```

### Using Extension Adapters in Your Code

The extension exports reusable adapters that work in content script context:

```typescript
import {
  sendToT3Chat,
  sendSelectionToT3Chat,
  hasSelection,
} from "@ewjdev/anyclick-extension";

// Send text to t3.chat
sendToT3Chat("How do I fix this error?", { baseUrl: "https://t3.chat" });

// Send selected text
if (hasSelection()) {
  sendSelectionToT3Chat();
}
```

```typescript
import {
  uploadFile,
  uploadImageFromUrl,
  isImageElement,
  getImageSource,
} from "@ewjdev/anyclick-extension";

// Check if element is an image
if (isImageElement(element)) {
  const src = getImageSource(element);
  if (src) {
    const result = await uploadImageFromUrl(src, {
      endpoint: "/api/uploadthing",
    });
    console.log("Uploaded:", result.url);
  }
}
```

## Permissions

The extension requires these permissions:

- `contextMenus` - Add items to right-click menu
- `storage` - Save configuration
- `activeTab` - Access current tab for uploads
- `<all_urls>` - Work on any website

## Privacy

- Your API keys are stored locally in your browser
- No data is sent to third parties except:
  - Your selected text to t3.chat (when you choose)
  - Images to UploadThing (when you choose)
- No analytics or tracking

## TypeScript

```typescript
import type {
  ExtensionConfig,
  ExtensionMessage,
  ExtensionResponse,
  MessageType,
} from "@ewjdev/anyclick-extension";

import {
  DEFAULT_EXTENSION_CONFIG,
  CONTEXT_MENU_IDS,
} from "@ewjdev/anyclick-extension";
```

## Browser Compatibility

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome  | 102+           | ✅ Supported |
| Edge    | 102+           | ✅ Supported |
| Firefox | 109+           | ✅ Supported |
| Safari  | -              | 🚧 Coming Soon |

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test the extension locally
5. Submit a pull request

## License

MIT
