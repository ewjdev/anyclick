import type { UploadResult, UploadThingServerOptions } from "./types";

/**
 * UploadThing Server Adapter
 *
 * Server-side adapter for handling UploadThing uploads in Next.js API routes.
 * This is the recommended approach for production as it keeps your API token secure.
 *
 * @example
 * ```ts
 * // app/api/uploadthing/route.ts
 * import { UploadThingServerAdapter } from "@ewjdev/anyclick-uploadthing/server";
 *
 * const adapter = new UploadThingServerAdapter({
 *   token: process.env.UPLOADTHING_TOKEN!,
 * });
 *
 * export async function POST(request: Request) {
 *   const formData = await request.formData();
 *   const file = formData.get("file") as File;
 *
 *   const result = await adapter.uploadFile(file);
 *   return Response.json(result);
 * }
 * ```
 */
export class UploadThingServerAdapter {
  private token: string;
  private appId?: string;
  private selfHosted: boolean;
  private apiUrl: string;

  constructor(options: UploadThingServerOptions) {
    if (!options.token) {
      throw new Error("UploadThing token is required");
    }

    this.token = options.token;
    this.appId = options.appId;
    this.selfHosted = options.selfHosted ?? false;
    this.apiUrl = options.apiUrl ?? "https://api.uploadthing.com";
  }

  /**
   * Upload a file to UploadThing
   * @param file - The file to upload (File or Buffer with metadata)
   * @param options - Upload options
   * @returns Upload result
   */
  async uploadFile(
    file: File | { buffer: Buffer; name: string; type: string }
  ): Promise<UploadResult> {
    try {
      // Convert to proper format
      let fileData: File;
      if (file instanceof File) {
        fileData = file;
      } else {
        fileData = new File([file.buffer], file.name, { type: file.type });
      }

      // Step 1: Request presigned URL
      const presignedResponse = await fetch(`${this.apiUrl}/v6/uploadFiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": this.token,
          ...(this.appId && { "x-uploadthing-app-id": this.appId }),
        },
        body: JSON.stringify({
          files: [
            {
              name: fileData.name,
              size: fileData.size,
              type: fileData.type,
            },
          ],
          acl: "public-read",
          contentDisposition: "inline",
        }),
      });

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text();
        throw new Error(
          `Failed to get presigned URL: ${presignedResponse.status} - ${errorText}`
        );
      }

      const presignedData = await presignedResponse.json();
      const uploadInfo = presignedData.data?.[0];

      if (!uploadInfo) {
        throw new Error("Invalid presigned URL response");
      }

      // Step 2: Upload to presigned URL
      const uploadUrl = uploadInfo.presignedUrls?.url || uploadInfo.url;
      if (!uploadUrl) {
        throw new Error("No upload URL in response");
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: fileData,
        headers: {
          "Content-Type": fileData.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.status}`);
      }

      // Step 3: Confirm upload completion (if needed)
      if (uploadInfo.pollingUrl) {
        // Poll for completion
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const pollResponse = await fetch(uploadInfo.pollingUrl, {
            headers: {
              "x-uploadthing-api-key": this.token,
            },
          });

          if (pollResponse.ok) {
            const pollData = await pollResponse.json();
            if (pollData.status === "uploaded") {
              return {
                success: true,
                url: pollData.fileUrl || uploadInfo.fileUrl,
                key: pollData.key || uploadInfo.key,
                name: fileData.name,
                size: fileData.size,
              };
            }
          }

          attempts++;
        }
      }

      return {
        success: true,
        url: uploadInfo.fileUrl,
        key: uploadInfo.key,
        name: fileData.name,
        size: fileData.size,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown upload error";
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Upload a file from a data URL
   * @param dataUrl - The data URL
   * @param filename - The filename to use
   * @returns Upload result
   */
  async uploadFromDataUrl(
    dataUrl: string,
    filename: string
  ): Promise<UploadResult> {
    // Parse data URL
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return {
        success: false,
        error: "Invalid data URL format",
      };
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    return this.uploadFile({
      buffer,
      name: filename,
      type: mimeType,
    });
  }

  /**
   * Upload a file from a URL
   * @param url - The file URL
   * @param filename - The filename to use
   * @returns Upload result
   */
  async uploadFromUrl(url: string, filename: string): Promise<UploadResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";

      return this.uploadFile({
        buffer,
        name: filename,
        type: contentType,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch file";
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Delete a file from UploadThing
   * @param key - The file key
   * @returns Whether deletion was successful
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/v6/deleteFiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": this.token,
        },
        body: JSON.stringify({ fileKeys: [key] }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Create an UploadThingServerAdapter instance
 * @param options - Configuration options
 * @returns Configured UploadThingServerAdapter
 */
export function createUploadThingServerAdapter(
  options: UploadThingServerOptions
): UploadThingServerAdapter {
  return new UploadThingServerAdapter(options);
}
