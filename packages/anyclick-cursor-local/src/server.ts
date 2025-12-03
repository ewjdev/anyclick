#!/usr/bin/env node
import { createServer, IncomingMessage, ServerResponse } from "http";
import type { FeedbackPayload } from "@anyclick/core";
import { LocalCursorAdapter } from "./localAdapter";
import type { LocalServerConfig } from "./types";

const DEFAULT_PORT = 3847;
const DEFAULT_HOST = "localhost";

/**
 * Parse command line arguments
 */
function parseArgs(): LocalServerConfig {
  const args = process.argv.slice(2);
  const config: LocalServerConfig = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--port":
      case "-p":
        config.port = parseInt(nextArg, 10);
        i++;
        break;
      case "--host":
      case "-h":
        config.host = nextArg;
        i++;
        break;
      case "--cwd":
      case "-d":
        config.workingDirectory = nextArg;
        i++;
        break;
      case "--mode":
      case "-m":
        config.mode = nextArg as "interactive" | "print";
        i++;
        break;
      case "--model":
        config.model = nextArg;
        i++;
        break;
      case "--help":
        printHelp();
        process.exit(0);
    }
  }

  return config;
}

function printHelp(): void {
  console.log(`
uifeedback-local-server - Local Cursor CLI server for UI feedback

Usage:
  uifeedback-local-server [options]

Options:
  -p, --port <port>     Port to run the server on (default: ${DEFAULT_PORT})
  -h, --host <host>     Host to bind to (default: ${DEFAULT_HOST})
  -d, --cwd <dir>       Working directory for cursor-agent (default: current directory)
  -m, --mode <mode>     Execution mode: interactive or print (default: interactive)
  --model <model>       Model to use for cursor-agent
  --help                Show this help message

Examples:
  # Start with defaults
  uifeedback-local-server

  # Custom port and working directory
  uifeedback-local-server -p 4000 -d /path/to/project

  # Use print mode for headless execution
  uifeedback-local-server -m print
`);
}

/**
 * CORS headers for local development
 */
function setCorsHeaders(
  res: ServerResponse,
  origin: string,
  allowedOrigins: string[],
): void {
  // Check if origin is allowed
  const isAllowed =
    allowedOrigins.length === 0 ||
    allowedOrigins.some((allowed) => {
      if (allowed === "*") return true;
      if (allowed === origin) return true;
      // Support localhost with any port
      if (
        allowed === "localhost" &&
        (origin.startsWith("http://localhost:") ||
          origin.startsWith("https://localhost:"))
      ) {
        return true;
      }
      return false;
    });

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

/**
 * Read request body as JSON
 */
async function readBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body) as T);
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Create and start the local feedback server
 */
export function createLocalServer(config: LocalServerConfig = {}): void {
  const port = config.port ?? DEFAULT_PORT;
  const host = config.host ?? DEFAULT_HOST;
  const allowedOrigins = config.allowedOrigins ?? ["localhost"];

  const adapter = new LocalCursorAdapter({
    workingDirectory: config.workingDirectory,
    mode: config.mode,
    model: config.model,
  });

  const server = createServer(async (req, res) => {
    const origin = req.headers.origin ?? "";

    // Set CORS headers
    setCorsHeaders(res, origin, allowedOrigins);

    // Handle preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check endpoint
    if (req.url === "/health" && req.method === "GET") {
      const installed = await adapter.checkInstalled();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          cursorAgentInstalled: installed,
        }),
      );
      return;
    }

    // Main feedback endpoint
    if (req.url === "/feedback" && req.method === "POST") {
      try {
        const payload = await readBody<FeedbackPayload>(req);

        // Validate payload has required fields
        if (!payload.type || !payload.element || !payload.page) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Invalid payload" }));
          return;
        }

        console.log(
          `[${new Date().toISOString()}] Running cursor-agent for ${payload.type} feedback...`,
        );

        const result = await adapter.runAgent(payload);

        if (result.success) {
          console.log(
            `[${new Date().toISOString()}] cursor-agent started successfully`,
          );
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: true,
              output: result.output,
            }),
          );
        } else {
          console.error(
            `[${new Date().toISOString()}] cursor-agent failed:`,
            result.error?.message,
          );
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: result.error?.message ?? "Unknown error",
            }),
          );
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error:`, error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        );
      }
      return;
    }

    // 404 for unknown routes
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.listen(port, host, async () => {
    const installed = await adapter.checkInstalled();

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║           UI Feedback Local Server                             ║
╠════════════════════════════════════════════════════════════════╣
║  Server running at: http://${host}:${port}                       
║  cursor-agent installed: ${installed ? "✓ Yes" : "✗ No - install with:"}
${!installed ? "║    curl https://cursor.com/install -fsS | bash" : ""}
╠════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                    ║
║    POST /feedback  - Submit feedback to run cursor-agent       ║
║    GET  /health    - Check server and cursor-agent status      ║
╚════════════════════════════════════════════════════════════════╝
`);
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nShutting down server...");
    server.close(() => {
      process.exit(0);
    });
  });
}

// Run server if this is the main module
const isMain =
  process.argv[1]?.endsWith("server.js") ||
  process.argv[1]?.endsWith("server.ts") ||
  process.argv[1]?.endsWith("server.mjs");

if (isMain) {
  const config = parseArgs();
  createLocalServer(config);
}
