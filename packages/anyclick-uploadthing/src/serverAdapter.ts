import type { UploadResult, UploadThingServerOptions } from "./types";

/**
 * UploadThing Server Adapter
 *
 * Server-side adapter for handling UploadThing uploads using the official UTApi.
 * This is the recommended approach for production as it keeps your token secure.
 *
 * @see https://docs.uploadthing.com/api-reference/ut-api
 *
 * @example
 * ```ts
 * // app/api/uploadthing/route.ts
 * import { createUploadThingServerAdapter } from "@ewjdev/anyclick-uploadthing/server";
 *
 * const adapter = createUploadThingServerAdapter({
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
  private utapi: import("uploadthing/server").UTApi | null = null;
  private token: string;

  constructor(options: UploadThingServerOptions) {
    if (!options.token) {
      throw new Error("UploadThing token is required");
    }
    this.token = options.token;
  }

  /**
   * Get or create the UTApi instance
   */
  private async getApi(): Promise<import("uploadthing/server").UTApi> {
    if (!this.utapi) {
      try {
        const { UTApi } = await import("uploadthing/server");
        this.utapi = new UTApi({ token: this.token });
      } catch {
        throw new Error(
          "uploadthing package is required. Install it with: npm install uploadthing",
        );
      }
    }
    return this.utapi;
  }

  /**
   * Upload a file to UploadThing
   * @param file - The file to upload (File, Blob, or buffer with metadata)
   * @returns Upload result with URL
   */
  async uploadFile(
    file: File | Blob | { buffer: Buffer; name: string; type: string },
  ): Promise<UploadResult> {
    console.log("[UploadThing ServerAdapter] uploadFile called");

    try {
      const api = await this.getApi();
      console.log("[UploadThing ServerAdapter] UTApi instance ready");

      // Convert to proper format for UTApi
      let uploadFile: File;
      if (file instanceof File) {
        uploadFile = file;
        console.log("[UploadThing ServerAdapter] Using File directly:", {
          name: file.name,
          size: file.size,
          type: file.type,
        });
      } else if (file instanceof Blob) {
        uploadFile = new File([file], `upload-${Date.now()}`, {
          type: file.type,
        });
        console.log("[UploadThing ServerAdapter] Created File from Blob:", {
          name: uploadFile.name,
          size: uploadFile.size,
          type: uploadFile.type,
        });
      } else {
        uploadFile = new File([file.buffer], file.name, { type: file.type });
        console.log("[UploadThing ServerAdapter] Created File from buffer:", {
          name: uploadFile.name,
          size: uploadFile.size,
          type: uploadFile.type,
        });
      }

      console.log("[UploadThing ServerAdapter] Calling UTApi.uploadFiles...");
      const response = await api.uploadFiles(uploadFile);
      console.log("[UploadThing ServerAdapter] UTApi response:", {
        hasError: !!response.error,
        hasData: !!response.data,
        error: response.error,
        data: response.data
          ? {
              url: response.data.url,
              key: response.data.key,
              name: response.data.name,
              size: response.data.size,
            }
          : null,
      });

      if (response.error) {
        console.error(
          "[UploadThing ServerAdapter] Upload error:",
          response.error,
        );
        return {
          success: false,
          error: response.error.message || "Upload failed",
        };
      }

      console.log(
        "[UploadThing ServerAdapter] Upload successful:",
        response.data.url,
      );
      return {
        success: true,
        url: response.data.url,
        key: response.data.key,
        name: response.data.name,
        size: response.data.size,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown upload error";
      console.error("[UploadThing ServerAdapter] Exception:", {
        message,
        error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Upload multiple files to UploadThing
   * @param files - Array of files to upload
   * @returns Array of upload results
   */
  async uploadFiles(files: File[]): Promise<UploadResult[]> {
    try {
      const api = await this.getApi();
      const responses = await api.uploadFiles(files);

      // Handle both single and array responses
      const results = Array.isArray(responses) ? responses : [responses];

      return results.map((response) => {
        if (response.error) {
          return {
            success: false,
            error: response.error.message || "Upload failed",
          };
        }
        return {
          success: true,
          url: response.data.url,
          key: response.data.key,
          name: response.data.name,
          size: response.data.size,
        };
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown upload error";
      return files.map(() => ({
        success: false,
        error: message,
      }));
    }
  }

  /**
   * Upload a file from a data URL
   * @param dataUrl - The data URL (base64 encoded)
   * @param filename - The filename to use
   * @returns Upload result
   */
  async uploadFromDataUrl(
    dataUrl: string,
    filename: string,
  ): Promise<UploadResult> {
    console.log("[UploadThing ServerAdapter] uploadFromDataUrl called:", {
      dataUrlLength: dataUrl.length,
      filename,
    });

    // Parse data URL
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.error("[UploadThing ServerAdapter] Invalid data URL format");
      return {
        success: false,
        error: "Invalid data URL format",
      };
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    console.log("[UploadThing ServerAdapter] Parsed data URL:", {
      mimeType,
      bufferSize: buffer.length,
    });

    return this.uploadFile({
      buffer,
      name: filename,
      type: mimeType,
    });
  }

  /**
   * Upload a file from a URL (fetches the file first)
   * @param url - The file URL to fetch and upload
   * @param filename - The filename to use
   * @returns Upload result
   */
  async uploadFromUrl(url: string, filename?: string): Promise<UploadResult> {
    console.log("[UploadThing ServerAdapter] uploadFromUrl called:", {
      url,
      filename,
    });

    try {
      const api = await this.getApi();
      console.log(
        "[UploadThing ServerAdapter] Calling UTApi.uploadFilesFromUrl...",
      );

      // Use UTApi's uploadFilesFromUrl for URL uploads
      const response = await api.uploadFilesFromUrl({
        url,
        name: filename,
      });

      console.log(
        "[UploadThing ServerAdapter] UTApi uploadFilesFromUrl response:",
        {
          hasError: !!response.error,
          hasData: !!response.data,
          error: response.error,
        },
      );

      if (response.error) {
        console.error(
          "[UploadThing ServerAdapter] URL upload error:",
          response.error,
        );
        return {
          success: false,
          error: response.error.message || "Upload failed",
        };
      }

      console.log(
        "[UploadThing ServerAdapter] URL upload successful:",
        response.data.url,
      );
      return {
        success: true,
        url: response.data.url,
        key: response.data.key,
        name: response.data.name,
        size: response.data.size,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload from URL";
      console.error("[UploadThing ServerAdapter] URL upload exception:", {
        message,
        error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Delete a file from UploadThing
   * @param key - The file key to delete
   * @returns Whether deletion was successful
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const api = await this.getApi();
      const result = await api.deleteFiles(key);
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Delete multiple files from UploadThing
   * @param keys - Array of file keys to delete
   * @returns Whether deletion was successful
   */
  async deleteFiles(keys: string[]): Promise<boolean> {
    try {
      const api = await this.getApi();
      const result = await api.deleteFiles(keys);
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get file URLs for given keys
   * @param keys - File keys to get URLs for
   * @returns Object mapping keys to URLs
   */
  async getFileUrls(keys: string[]): Promise<Record<string, string>> {
    try {
      const api = await this.getApi();
      const result = await api.getFileUrls(keys);
      const urls: Record<string, string> = {};
      for (const item of result.data) {
        urls[item.key] = item.url;
      }
      return urls;
    } catch {
      return {};
    }
  }
}

/**
 * Create an UploadThingServerAdapter instance
 * @param options - Configuration options (requires token)
 * @returns Configured UploadThingServerAdapter
 */
export function createUploadThingServerAdapter(
  options: UploadThingServerOptions,
): UploadThingServerAdapter {
  return new UploadThingServerAdapter(options);
}
