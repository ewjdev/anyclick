// Browser-side adapter
export { HttpAdapter, createHttpAdapter } from "./httpAdapter";

// Types
export type { HttpAdapterOptions } from "./types";

// Re-export core types for convenience
export type {
  FeedbackAdapter,
  FeedbackPayload,
  FeedbackType,
} from "@ewjdev/anyclick-core";
