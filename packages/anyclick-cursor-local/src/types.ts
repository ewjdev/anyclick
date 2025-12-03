import type { FeedbackPayload } from "@anyclick/core";

/**
 * Execution mode for cursor-agent
 */
export type ExecutionMode = "interactive" | "print";

/**
 * Output format for print mode
 */
export type OutputFormat = "text" | "stream-json";

/**
 * Configuration for the Local Cursor CLI Adapter
 */
export interface LocalCursorAdapterOptions {
  /** Working directory for cursor-agent (defaults to process.cwd()) */
  workingDirectory?: string;
  /** Execution mode: interactive opens terminal, print runs headlessly */
  mode?: ExecutionMode;
  /** Output format for print mode */
  outputFormat?: OutputFormat;
  /** Model to use (optional, uses cursor default if not specified) */
  model?: string;
  /** Custom prompt formatter */
  formatPrompt?: (payload: FeedbackPayload) => string;
  /** Timeout for print mode execution in milliseconds (default: 300000 = 5 min) */
  timeout?: number;
}

/**
 * Result from running cursor-agent locally
 */
export interface LocalCursorResult {
  success: boolean;
  /** Output from cursor-agent (in print mode) */
  output?: string;
  /** Error if execution failed */
  error?: Error;
  /** Exit code from the process */
  exitCode?: number;
}

/**
 * Server configuration for the local dev server
 */
export interface LocalServerConfig {
  /** Port to run the server on (default: 3847) */
  port?: number;
  /** Host to bind to (default: localhost) */
  host?: string;
  /** Working directory for cursor-agent */
  workingDirectory?: string;
  /** Allowed origins for CORS (default: localhost origins) */
  allowedOrigins?: string[];
  /** Execution mode */
  mode?: ExecutionMode;
  /** Model to use */
  model?: string;
}
