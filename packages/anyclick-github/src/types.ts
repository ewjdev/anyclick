import type { FeedbackPayload } from "@ewjdev/anyclick-core";

/**
 * Options for the HTTP adapter (browser-side)
 */
export interface HttpAdapterOptions {
  /** URL of your backend endpoint that handles feedback */
  endpoint: string;
  /** Additional headers to include with requests */
  headers?: Record<string, string>;
  /** HTTP method to use (defaults to POST) */
  method?: "POST" | "PUT";
  /** Transform the payload before sending (e.g., add auth tokens) */
  transformPayload?: (payload: FeedbackPayload) => Record<string, unknown>;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Options for the GitHub adapter (server-side)
 */
export interface GitHubAdapterOptions {
  /** GitHub personal access token with repo scope */
  token: string;
  /** Repository owner (username or organization) */
  owner: string;
  /** Repository name */
  repo: string;
  /** Optional: Default labels to add to issues */
  defaultLabels?: string[];
  /** Optional: Transform payload to custom issue title */
  formatTitle?: (payload: FeedbackPayload) => string;
  /** Optional: Transform payload to custom issue body */
  formatBody?: (payload: FeedbackPayload) => string;
  /** Optional: GitHub API base URL (for GitHub Enterprise) */
  apiBaseUrl?: string;
  /** Optional: Branch to store screenshot assets (default: 'issues/src') */
  mediaBranch?: string;
  /** Optional: Path within mediaBranch to store assets (default: 'feedback-assets') */
  assetsPath?: string;
}

/**
 * Metadata embedded in issue body for cleanup workflow
 */
export interface UIFeedbackMetadata {
  /** Unique submission identifier */
  submissionId: string;
  /** Branch where assets are stored */
  branch: string;
  /** Path to assets directory */
  assetsPath: string;
}

/**
 * GitHub issue creation result
 */
export interface GitHubIssueResult {
  /** Issue number */
  number: number;
  /** Issue URL */
  url: string;
  /** Issue HTML URL */
  htmlUrl: string;
}

/**
 * Feedback type labels for GitHub issues
 */
export const feedbackTypeLabels: Record<string, string> = {
  issue: "bug",
  feature: "enhancement",
  like: "feedback",
};
