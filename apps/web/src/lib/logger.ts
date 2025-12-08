/**
 * Structured logger utility for API routes
 *
 * Provides environment-aware logging that adapts to development and production:
 * - Development: Human-readable logs with emojis
 * - Production: JSON-formatted logs for log aggregation tools
 *
 * @module lib/logger
 */

const isDev = process.env.NODE_ENV === "development";

export interface LogContext {
  action?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface Logger {
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error: unknown, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
  performance: (label: string, startTime: number, context?: LogContext) => void;
}

/**
 * Create a logger instance with a custom prefix
 */
export function createLogger(prefix: string): Logger {
  const LOG_PREFIX = `[${prefix}]`;

  return {
    info: (message: string, context?: LogContext) => {
      if (isDev) {
        console.log(`${LOG_PREFIX} ${message}`, context || "");
      } else {
        console.log(
          JSON.stringify({
            level: "info",
            message,
            timestamp: new Date().toISOString(),
            ...context,
          }),
        );
      }
    },

    warn: (message: string, context?: LogContext) => {
      if (isDev) {
        console.warn(`${LOG_PREFIX} ⚠️  ${message}`, context || "");
      } else {
        console.warn(
          JSON.stringify({
            level: "warn",
            message,
            timestamp: new Date().toISOString(),
            ...context,
          }),
        );
      }
    },

    error: (message: string, error: unknown, context?: LogContext) => {
      const errorDetails =
        error instanceof Error
          ? {
              error: error.message,
              stack: error.stack,
              name: error.name,
            }
          : { error: String(error) };

      if (isDev) {
        console.error(`${LOG_PREFIX} ❌ ${message}`, {
          ...context,
          ...errorDetails,
        });
      } else {
        console.error(
          JSON.stringify({
            level: "error",
            message,
            timestamp: new Date().toISOString(),
            ...context,
            ...errorDetails,
          }),
        );
      }
    },

    debug: (message: string, context?: LogContext) => {
      if (isDev) {
        console.debug(`${LOG_PREFIX} 🔍 ${message}`, context || "");
      }
      // Skip debug logs in production
    },

    performance: (label: string, startTime: number, context?: LogContext) => {
      const duration = Date.now() - startTime;
      if (isDev) {
        console.log(`${LOG_PREFIX} ⏱️  ${label}: ${duration}ms`, context || "");
      } else {
        console.log(
          JSON.stringify({
            level: "performance",
            label,
            duration,
            timestamp: new Date().toISOString(),
            ...context,
          }),
        );
      }
    },
  };
}

/**
 * Generate a unique request ID for tracking requests across logs
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
