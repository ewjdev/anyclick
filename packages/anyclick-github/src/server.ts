// Server-side GitHub adapter
export { GitHubAdapter, createGitHubAdapter } from "./githubAdapter";

// Formatters (for customization)
export { defaultFormatTitle, defaultFormatBody } from "./formatters";

// Types
export type { GitHubAdapterOptions, GitHubIssueResult } from "./types";
export { feedbackTypeLabels } from "./types";

// Re-export core types for convenience
export type { AnyclickPayload, AnyclickType } from "@ewjdev/anyclick-core";
