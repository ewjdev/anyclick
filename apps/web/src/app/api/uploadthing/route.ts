/**
 * UploadThing API route for Anyclick integration.
 *
 * This demonstrates how to set up a server-side upload endpoint
 * using the official UploadThing UTApi via @ewjdev/anyclick-uploadthing.
 *
 * To use this:
 * 1. Get your UploadThing token from https://uploadthing.com/dashboard
 * 2. Add UPLOADTHING_TOKEN to your .env.local
 * 3. Right-click on images in the Anyclick menu to upload
 *
 * @see https://docs.uploadthing.com/api-reference/ut-api
 */
import { createUploadThingServerAdapter } from "@ewjdev/anyclick-uploadthing/server";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-uploadthing-api-key",
} as const;

function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function OPTIONS() {
  return withCors(NextResponse.json({}, { status: 200 }));
}

export async function POST(request: Request) {
  console.log("[UploadThing API] POST request received");

  // Token can come from the extension header or server env
  const headerToken = request.headers.get("x-uploadthing-api-key")?.trim();
  const token = headerToken || process.env.UPLOADTHING_TOKEN;

  if (!token) {
    console.error("[UploadThing API] No UPLOADTHING_TOKEN configured");
    return withCors(
      NextResponse.json(
        {
          error: "UploadThing not configured",
          message:
            "Set UPLOADTHING_TOKEN in env or send x-uploadthing-api-key header.",
        },
        { status: 503 },
      ),
    );
  }

  console.log("[UploadThing API] Token found, processing request...");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const url = formData.get("url") as string | null;
    const dataUrl = formData.get("dataUrl") as string | null;
    const filename =
      (formData.get("filename") as string) || `upload-${Date.now()}`;

    console.log("[UploadThing API] FormData parsed:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      hasUrl: !!url,
      url: url?.substring(0, 50),
      hasDataUrl: !!dataUrl,
      dataUrlLength: dataUrl?.length,
      filename,
    });

    // Create the adapter with your token (header token takes priority)
    const adapter = createUploadThingServerAdapter({ token });

    let result;

    if (file) {
      // Upload file directly
      console.log(
        "[UploadThing API] Uploading file:",
        file.name,
        file.size,
        "bytes",
      );
      result = await adapter.uploadFile(file);
    } else if (url) {
      // Upload from URL
      console.log("[UploadThing API] Uploading from URL:", url);
      result = await adapter.uploadFromUrl(url, filename);
    } else if (dataUrl) {
      // Upload from data URL (base64)
      console.log(
        "[UploadThing API] Uploading from data URL, length:",
        dataUrl.length,
      );
      result = await adapter.uploadFromDataUrl(dataUrl, filename);
    } else {
      console.warn("[UploadThing API] No file, url, or dataUrl in request");
      return withCors(
        NextResponse.json(
          { error: "No file, url, or dataUrl provided" },
          { status: 400 },
        ),
      );
    }

    console.log("[UploadThing API] Upload result:", {
      success: result.success,
      url: result.url,
      key: result.key,
      error: result.error,
    });

    if (!result.success) {
      console.error("[UploadThing API] Upload failed:", result.error);
      return withCors(
        NextResponse.json(
          { error: result.error || "Upload failed" },
          { status: 500 },
        ),
      );
    }

    console.log("[UploadThing API] Upload successful:", result.url);
    return withCors(
      NextResponse.json({
        success: true,
        url: result.url,
        key: result.key,
        name: result.name,
        size: result.size,
      }),
    );
  } catch (error) {
    console.error("[UploadThing API] Error:", error);
    return withCors(
      NextResponse.json(
        {
          error: "Upload failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      ),
    );
  }
}
