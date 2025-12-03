import type { FeedbackPayload } from "@anyclick/core";

/**
 * Cursor Cloud Agent status
 */
export type AgentStatus =
  | "CREATING"
  | "RUNNING"
  | "FINISHED"
  | "ERROR"
  | "CANCELLED";

/**
 * Source repository configuration
 */
export interface AgentSource {
  /** Repository URL (e.g., https://github.com/your-org/your-repo) */
  repository: string;
  /** Branch or commit ref to use as base (default: main) */
  ref?: string;
}

/**
 * Target branch configuration
 */
export interface AgentTarget {
  /** Name of the branch to create */
  branchName?: string;
  /** Whether to automatically create a PR when the agent finishes */
  autoCreatePr?: boolean;
  /** Whether to open as Cursor GitHub App */
  openAsCursorGithubApp?: boolean;
  /** Whether to skip reviewer request */
  skipReviewerRequest?: boolean;
}

/**
 * Image attachment for agent prompt
 */
export interface AgentPromptImage {
  /** Base64-encoded image data */
  data: string;
  /** Image dimensions */
  dimension: {
    width: number;
    height: number;
  };
}

/**
 * Agent prompt configuration
 */
export interface AgentPrompt {
  /** Text instruction for the agent */
  text: string;
  /** Optional images (max 5) */
  images?: AgentPromptImage[];
}

/**
 * Response from creating an agent
 */
export interface AgentCreateResponse {
  /** Unique agent identifier */
  id: string;
  /** Agent name/title */
  name: string;
  /** Current status */
  status: AgentStatus;
  /** Source configuration */
  source: AgentSource;
  /** Target configuration */
  target: {
    branchName: string;
    url: string;
    prUrl?: string;
    autoCreatePr: boolean;
    openAsCursorGithubApp: boolean;
    skipReviewerRequest: boolean;
  };
  /** Creation timestamp */
  createdAt: string;
}

/**
 * Configuration for the Cursor Agent Adapter
 */
export interface CursorAgentAdapterOptions {
  /** Cursor API key (from https://cursor.com/settings) */
  apiKey: string;
  /** Default repository configuration */
  defaultSource: AgentSource;
  /** Default target configuration */
  defaultTarget?: AgentTarget;
  /** API base URL (default: https://api.cursor.com) */
  apiBaseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom prompt formatter */
  formatPrompt?: (payload: FeedbackPayload) => AgentPrompt;
  /** Custom agent name formatter */
  formatAgentName?: (payload: FeedbackPayload) => string;
}

/**
 * Result from creating an agent
 */
export interface CursorAgentResult {
  success: boolean;
  agent?: AgentCreateResponse;
  error?: Error;
}
