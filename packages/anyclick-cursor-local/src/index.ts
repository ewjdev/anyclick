// Local Cursor Adapter
export { LocalCursorAdapter, createLocalCursorAdapter } from "./localAdapter";

// Formatters (for customization)
export { defaultFormatPrompt } from "./formatters";

// Types
export type {
  ExecutionMode,
  OutputFormat,
  LocalCursorAdapterOptions,
  LocalCursorResult,
  LocalServerConfig,
} from "./types";

// Re-export core types for convenience
export type { AnyclickPayload, AnyclickType } from "@ewjdev/anyclick-core";
