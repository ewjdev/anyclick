import type { FeedbackPayload } from "@anyclick/core";
import type {
  CursorAgentAdapterOptions,
  CursorAgentResult,
  AgentCreateResponse,
  AgentSource,
  AgentTarget,
  AgentPrompt,
} from "./types";
import { defaultFormatPrompt, defaultFormatAgentName } from "./formatters";

const DEFAULT_API_BASE_URL = "https://api.cursor.com";
const DEFAULT_TIMEOUT = 30000;

/**
 * Cursor Cloud Agent Adapter
 * Creates Cursor Cloud Agents from UI feedback payloads
 */
export class CursorAgentAdapter {
  private apiKey: string;
  private defaultSource: AgentSource;
  private defaultTarget: AgentTarget;
  private apiBaseUrl: string;
  private timeout: number;
  private formatPrompt: (payload: FeedbackPayload) => AgentPrompt;
  private formatAgentName: (payload: FeedbackPayload) => string;

  constructor(options: CursorAgentAdapterOptions) {
    this.apiKey = options.apiKey;
    this.defaultSource = options.defaultSource;
    this.defaultTarget = options.defaultTarget ?? {};
    this.apiBaseUrl = options.apiBaseUrl ?? DEFAULT_API_BASE_URL;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.formatPrompt = options.formatPrompt ?? defaultFormatPrompt;
    this.formatAgentName = options.formatAgentName ?? defaultFormatAgentName;
  }

  /**
   * Create a Cursor Cloud Agent from a feedback payload
   */
  async createAgent(
    payload: FeedbackPayload,
    options?: {
      source?: Partial<AgentSource>;
      target?: Partial<AgentTarget>;
    },
  ): Promise<CursorAgentResult> {
    const prompt = this.formatPrompt(payload);

    const source: AgentSource = {
      ...this.defaultSource,
      ...options?.source,
    };

    const target: AgentTarget = {
      ...this.defaultTarget,
      ...options?.target,
    };

    // Generate branch name if not provided
    if (!target.branchName) {
      const timestamp = Date.now();
      const typeSlug = payload.type.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      target.branchName = `cursor/${typeSlug}-${timestamp}`;
    }

    // Build request body per Cursor API spec
    // Note: 'name' is returned by the API, not sent in the request
    const requestBody = {
      prompt,
      source,
      target,
    };

    console.log(JSON.stringify(requestBody, null, 2));

    try {
      const response = await this.makeRequest<AgentCreateResponse>(
        "/v0/agents",
        "POST",
        requestBody,
      );

      console.log(JSON.stringify(response, null, 2));
      return {
        success: true,
        agent: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Get the status of an existing agent
   */
  async getAgentStatus(agentId: string): Promise<AgentCreateResponse> {
    return this.makeRequest<AgentCreateResponse>(
      `/v0/agents/${agentId}`,
      "GET",
    );
  }

  /**
   * Add a follow-up instruction to an existing agent
   */
  async addFollowUp(
    agentId: string,
    prompt: AgentPrompt,
  ): Promise<{ id: string }> {
    return this.makeRequest<{ id: string }>(
      `/v0/agents/${agentId}/followup`,
      "POST",
      { prompt },
    );
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string): Promise<{ id: string }> {
    return this.makeRequest<{ id: string }>(`/v0/agents/${agentId}`, "DELETE");
  }

  /**
   * Make an authenticated request to the Cursor API
   */
  private async makeRequest<T>(
    path: string,
    method: "GET" | "POST" | "DELETE",
    body?: unknown,
  ): Promise<T> {
    const url = `${this.apiBaseUrl}${path}`;

    // Create Basic Auth header (API key with empty password)
    const authHeader = `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `Cursor API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Cursor API request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Create a Cursor Agent Adapter instance
 */
export function createCursorAgentAdapter(
  options: CursorAgentAdapterOptions,
): CursorAgentAdapter {
  return new CursorAgentAdapter(options);
}
