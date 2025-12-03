import type { FeedbackAdapter, FeedbackPayload } from "@anyclick/core";
import type { HttpAdapterOptions } from "./types";

/**
 * HTTP adapter for browser-side usage
 * Sends feedback payloads to your backend endpoint
 */
export class HttpAdapter implements FeedbackAdapter {
  private endpoint: string;
  private headers: Record<string, string>;
  private method: "POST" | "PUT";
  private transformPayload?: (
    payload: FeedbackPayload,
  ) => Record<string, unknown>;
  private timeout: number;

  constructor(options: HttpAdapterOptions) {
    this.endpoint = options.endpoint;
    this.headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    this.method = options.method ?? "POST";
    this.transformPayload = options.transformPayload;
    this.timeout = options.timeout ?? 10000;
  }

  async submitFeedback(payload: FeedbackPayload): Promise<void> {
    const body = this.transformPayload
      ? this.transformPayload(payload)
      : payload;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.endpoint, {
        method: this.method,
        headers: this.headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `Feedback submission failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Feedback submission timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Create an HTTP adapter instance
 */
export function createHttpAdapter(options: HttpAdapterOptions): HttpAdapter {
  return new HttpAdapter(options);
}
