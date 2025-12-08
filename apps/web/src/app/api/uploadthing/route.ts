/**
 * Example UploadThing API route for Anyclick integration.
 *
 * This demonstrates how to set up a server-side upload endpoint
 * for the UploadThing adapter.
 *
 * To use this:
 * 1. Get your UploadThing token from https://uploadthing.com/dashboard
 * 2. Add UPLOADTHING_TOKEN to your .env.local
 * 3. Right-click on images in the Anyclick menu to upload
 */
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Check for UploadThing token
  const token = process.env.UPLOADTHING_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error: "UploadThing not configured",
        message:
          "Set UPLOADTHING_TOKEN in your environment variables to enable uploads.",
      },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Request presigned URL from UploadThing
    const presignedResponse = await fetch(
      "https://api.uploadthing.com/v6/uploadFiles",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": token,
        },
        body: JSON.stringify({
          files: [
            {
              name: file.name,
              size: file.size,
              type: file.type,
            },
          ],
          acl: "public-read",
          contentDisposition: "inline",
        }),
      },
    );

    if (!presignedResponse.ok) {
      const errorText = await presignedResponse.text();
      console.error("UploadThing presigned URL error:", errorText);
      return NextResponse.json(
        { error: "Failed to get upload URL" },
        { status: 500 },
      );
    }

    const presignedData = await presignedResponse.json();
    const uploadInfo = presignedData.data?.[0];

    if (!uploadInfo) {
      return NextResponse.json(
        { error: "Invalid presigned URL response" },
        { status: 500 },
      );
    }

    // Upload to presigned URL
    const uploadUrl = uploadInfo.presignedUrls?.url || uploadInfo.url;
    if (!uploadUrl) {
      return NextResponse.json(
        { error: "No upload URL in response" },
        { status: 500 },
      );
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: buffer,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadResponse.status}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      url: uploadInfo.fileUrl,
      key: uploadInfo.key,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
