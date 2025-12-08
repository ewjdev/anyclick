# @ewjdev/anyclick-uploadthing

UploadThing adapter for Anyclick - upload screenshots and images to [UploadThing](https://uploadthing.com).

## Installation

```bash
npm install @ewjdev/anyclick-uploadthing uploadthing
# or
yarn add @ewjdev/anyclick-uploadthing uploadthing
# or
pnpm add @ewjdev/anyclick-uploadthing uploadthing
```

## Quick Start

### 1. Create API Route (Recommended)

Create a server-side endpoint for secure uploads:

```typescript
// app/api/uploadthing/route.ts
import { createUploadThingServerAdapter } from "@ewjdev/anyclick-uploadthing/server";
****
const adapter = createUploadThingServerAdapter({
  token: process.env.UPLOADTHING_TOKEN!,
});
****
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const result = await adapter.uploadFile(file);

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json({
    url: result.url,
    key: result.key,
    name: result.name,
  });
}
```

### 2. Add Menu Item

```tsx
import {
  AnyclickProvider,
  createUploadThingMenuItem,
} from "@ewjdev/anyclick-react";

const menuItems = [
  { label: "Report Bug", type: "bug", showComment: true },
  createUploadThingMenuItem({
    endpoint: "/api/uploadthing",
    onUploadComplete: (result) => {
      if (result.url) {
        navigator.clipboard.writeText(result.url);
        console.log("Uploaded:", result.url);
      }
    },
  }),
];

function App() {
  return (
    <AnyclickProvider menuItems={menuItems}>
      <YourApp />
    </AnyclickProvider>
  );
}
```

## Client-Side Uploads

For development or simple use cases, you can use direct client-side uploads:

```typescript
import { createUploadThingAdapter } from "@ewjdev/anyclick-uploadthing";

const adapter = createUploadThingAdapter({
  apiKey: "your-uploadthing-api-key",
  persistApiKey: true, // Store in localStorage
});

// Upload from element
const imageElement = document.querySelector("img");
const result = await adapter.uploadFromElement(imageElement);

// Upload from URL
const result = await adapter.uploadFromUrl("https://example.com/image.png");

// Upload screenshot data
const result = await adapter.uploadScreenshot({
  dataUrl: "data:image/png;base64,...",
  name: "my-screenshot",
  type: "element",
});
```

> **Note:** Client-side uploads expose your API key to the browser. Use server-side uploads for production.

## API

### Browser Adapter

```typescript
import {
  UploadThingAdapter,
  createUploadThingAdapter,
} from "@ewjdev/anyclick-uploadthing";

const adapter = createUploadThingAdapter({
  endpoint: "/api/uploadthing", // Your API route
  // OR
  apiKey: "...", // Direct client uploads (dev only)
  persistApiKey: false, // Store in localStorage
  headers: {}, // Custom headers
  timeout: 30000, // Request timeout
  onUploadStart: (file) => {},
  onUploadProgress: (progress) => {},
  onUploadComplete: (result) => {},
  onUploadError: (error) => {},
});

// Methods
await adapter.uploadFile(file);
await adapter.uploadScreenshot({ dataUrl, name, type });
await adapter.uploadFromUrl(imageUrl, filename);
await adapter.uploadFromElement(element);
adapter.detectImage(element); // Check if element is an image
adapter.isConfigured(); // Check if adapter is ready
adapter.setApiKey(key); // Set/update API key
```

### Server Adapter

```typescript
import {
  UploadThingServerAdapter,
  createUploadThingServerAdapter,
} from "@ewjdev/anyclick-uploadthing/server";

const adapter = createUploadThingServerAdapter({
  token: process.env.UPLOADTHING_TOKEN!,
  appId: "optional-app-id",
  selfHosted: false,
  apiUrl: "https://api.uploadthing.com", // For self-hosted
});

// Methods
await adapter.uploadFile(file);
await adapter.uploadFromDataUrl(dataUrl, filename);
await adapter.uploadFromUrl(url, filename);
await adapter.deleteFile(key);
```

## Image Detection

Detect if an element contains an uploadable image:

```typescript
import { detectImage, isImageElement } from "@ewjdev/anyclick-uploadthing";

// Full detection with details
const result = detectImage(element);
if (result.isImage) {
  console.log("Type:", result.imageType); // 'img' | 'picture' | 'canvas' | 'svg' | 'background'
  console.log("Source:", result.src);
}

// Simple check
if (isImageElement(element)) {
  // Element is an image
}
```

## Utility Functions

```typescript
import {
  dataUrlToFile,
  dataUrlToBlob,
  urlToFile,
  getStoredApiKey,
  storeApiKey,
  clearStoredApiKey,
  generateScreenshotFilename,
  getFileExtension,
} from "@ewjdev/anyclick-uploadthing";

// Convert data URL to File
const file = dataUrlToFile(dataUrl, "screenshot.png");

// Fetch image from URL
const file = await urlToFile("https://example.com/image.png", "image");

// API key storage
storeApiKey("your-key");
const key = getStoredApiKey();
clearStoredApiKey();

// Generate filename
const name = generateScreenshotFilename("element");
// "screenshot-element-2024-01-15T10-30-00-000Z.png"
```

## Environment Variables

```bash
# .env.local
UPLOADTHING_TOKEN=your-token-here
```

Get your token from [UploadThing Dashboard](https://uploadthing.com/dashboard).

## TypeScript

Full TypeScript support:

```typescript
import type {
  UploadThingAdapterOptions,
  UploadThingServerOptions,
  UploadResult,
  ImageDetectionResult,
  ScreenshotUploadData,
} from "@ewjdev/anyclick-uploadthing";
```

## Self-Hosted UploadThing

For self-hosted instances:

```typescript
const adapter = createUploadThingServerAdapter({
  token: process.env.UPLOADTHING_TOKEN!,
  selfHosted: true,
  apiUrl: "https://your-uploadthing-instance.com",
});
```

## License

MIT
