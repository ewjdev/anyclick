# @ewjdev/anyclick-uploadthing

UploadThing adapter for Anyclick - upload screenshots and images to UploadThing with a simple right-click menu.

## Installation

```bash
npm install @ewjdev/anyclick-uploadthing uploadthing
```

## Quick Start (Server-Side)

The recommended approach is to create an API route that handles uploads securely on your server.

### 1. Set up environment variable

Get your token from [UploadThing Dashboard](https://uploadthing.com/dashboard):

```bash
# .env.local
UPLOADTHING_TOKEN=your_token_here
```

### 2. Create API Route

```ts
// app/api/uploadthing/route.ts
import { NextResponse } from "next/server";
import { createUploadThingServerAdapter } from "@ewjdev/anyclick-uploadthing/server";

export async function POST(request: Request) {
  const token = process.env.UPLOADTHING_TOKEN;
  
  if (!token) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const adapter = createUploadThingServerAdapter({ token });
  
  const formData = await request.formData();
  const file = formData.get("file") as File;
  
  const result = await adapter.uploadFile(file);
  return NextResponse.json(result);
}
```

### 3. Configure Extension or Web Library

Point your Anyclick extension or web integration to your API endpoint:

**Extension:** Set the Upload Endpoint in extension settings to `https://your-app.com/api/uploadthing`

**Web:** Use the `createUploadThingMenuItem` helper:

```tsx
import { AnyclickProvider, createUploadThingMenuItem } from "@ewjdev/anyclick-react";

const menuItems = [
  createUploadThingMenuItem({
    endpoint: "/api/uploadthing",
    onSuccess: (result) => console.log("Uploaded:", result.url),
  }),
];

<AnyclickProvider menuItems={menuItems}>
  {children}
</AnyclickProvider>
```

## Server Adapter API

### `createUploadThingServerAdapter(options)`

Creates a server adapter using the official [UTApi](https://docs.uploadthing.com/api-reference/ut-api).

```ts
import { createUploadThingServerAdapter } from "@ewjdev/anyclick-uploadthing/server";

const adapter = createUploadThingServerAdapter({
  token: process.env.UPLOADTHING_TOKEN!,
});
```

### Methods

#### `uploadFile(file)`

Upload a file directly.

```ts
const result = await adapter.uploadFile(file);
// { success: true, url: "https://...", key: "...", name: "...", size: 1234 }
```

#### `uploadFiles(files)`

Upload multiple files.

```ts
const results = await adapter.uploadFiles([file1, file2]);
```

#### `uploadFromUrl(url, filename?)`

Upload a file from a URL.

```ts
const result = await adapter.uploadFromUrl(
  "https://example.com/image.png",
  "my-image.png"
);
```

#### `uploadFromDataUrl(dataUrl, filename)`

Upload from a base64 data URL (useful for screenshots).

```ts
const result = await adapter.uploadFromDataUrl(
  "data:image/png;base64,...",
  "screenshot.png"
);
```

#### `deleteFile(key)`

Delete a file by its key.

```ts
const success = await adapter.deleteFile("file-key-here");
```

#### `deleteFiles(keys)`

Delete multiple files.

```ts
const success = await adapter.deleteFiles(["key1", "key2"]);
```

#### `getFileUrls(keys)`

Get URLs for file keys.

```ts
const urls = await adapter.getFileUrls(["key1", "key2"]);
// { key1: "https://...", key2: "https://..." }
```

## Browser Extension Setup

1. Click the Anyclick extension icon
2. Scroll to **Integrations** section
3. Enable **UploadThing**
4. Enter your **Upload Endpoint** (e.g., `https://your-app.com/api/uploadthing`)
5. Click **Save Settings**

Now when you right-click on an image, you'll see "Upload to UploadThing" option.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `UPLOADTHING_TOKEN` | Your UploadThing API token from the dashboard |

## Links

- [UploadThing Documentation](https://docs.uploadthing.com)
- [UploadThing Dashboard](https://uploadthing.com/dashboard)
- [UTApi Reference](https://docs.uploadthing.com/api-reference/ut-api)
