// Cursor Agent Adapter
export { CursorAgentAdapter, createCursorAgentAdapter } from "./agentAdapter";

// Formatters (for customization)
export { defaultFormatPrompt, defaultFormatAgentName } from "./formatters";

// Types
export type {
  AgentStatus,
  AgentSource,
  AgentTarget,
  AgentPrompt,
  AgentPromptImage,
  AgentCreateResponse,
  CursorAgentAdapterOptions,
  CursorAgentResult,
} from "./types";

// Re-export core types for convenience
export type { FeedbackPayload, FeedbackType } from "@ewjdev/anyclick-core";
