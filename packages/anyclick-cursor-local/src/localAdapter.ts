import { spawn } from "child_process";
import type { FeedbackPayload } from "@ewjdev/anyclick-core";
import type {
  LocalCursorAdapterOptions,
  LocalCursorResult,
  ExecutionMode,
  OutputFormat,
} from "./types";
import { defaultFormatPrompt } from "./formatters";

const DEFAULT_TIMEOUT = 6000000; // 10 minutes

/**
 * Local Cursor CLI Adapter
 * Runs cursor-agent locally for development
 */
export class LocalCursorAdapter {
  private workingDirectory: string;
  private mode: ExecutionMode;
  private outputFormat: OutputFormat;
  private model?: string;
  private timeout: number;
  private formatPrompt: (payload: FeedbackPayload) => string;

  constructor(options: LocalCursorAdapterOptions = {}) {
    this.workingDirectory = options.workingDirectory ?? process.cwd();
    this.mode = options.mode ?? "print";
    this.outputFormat = options.outputFormat ?? "stream-json";
    this.model = options.model ?? "gpt-5.1-codex";
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.formatPrompt = options.formatPrompt ?? defaultFormatPrompt;
  }

  /**
   * Run cursor-agent with the feedback payload
   */
  async runAgent(payload: FeedbackPayload): Promise<LocalCursorResult> {
    const prompt = this.formatPrompt(payload);

    if (this.mode === "interactive") {
      return this.runInteractive(prompt);
    } else {
      return this.runPrint(prompt);
    }
  }

  /**
   * Run cursor-agent in interactive mode
   * Opens a new terminal session with the prompt
   */
  private async runInteractive(prompt: string): Promise<LocalCursorResult> {
    return new Promise((resolve) => {
      const args = [prompt];

      if (this.model) {
        args.push("--model", this.model);
      }

      // Spawn cursor-agent with the prompt
      const child = spawn("cursor-agent", args, {
        cwd: this.workingDirectory,
        stdio: "inherit", // Inherit stdio to show in terminal
        shell: true,
        detached: true, // Allow it to run independently
      });

      // Don't wait for interactive mode to complete
      child.unref();

      // Return success immediately - user will interact with the agent
      resolve({
        success: true,
        output: "cursor-agent started in interactive mode",
      });
    });
  }

  /**
   * Run cursor-agent in print (non-interactive) mode
   * Waits for completion and returns the output
   */
  private async runPrint(prompt: string): Promise<LocalCursorResult> {
    return new Promise((resolve) => {
      const args = [
        "-p",
        "--force",
        prompt,
        "--output-format",
        this.outputFormat,
      ];

      if (this.model) {
        args.push("--model", this.model);
      }

      let stdout = "";
      let stderr = "";

      const child = spawn("cursor-agent", args, {
        cwd: this.workingDirectory,
        shell: true,
      });

      // Set up timeout
      const timeoutId = setTimeout(() => {
        child.kill("SIGTERM");
        resolve({
          success: false,
          error: new Error(`cursor-agent timed out after ${this.timeout}ms`),
        });
      }, this.timeout);

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        clearTimeout(timeoutId);

        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
            exitCode: code,
          });
        } else {
          resolve({
            success: false,
            output: stdout,
            error: new Error(stderr || `cursor-agent exited with code ${code}`),
            exitCode: code ?? undefined,
          });
        }
      });

      child.on("error", (error) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: error.message.includes("ENOENT")
            ? new Error(
                "cursor-agent not found. Install it with: curl https://cursor.com/install -fsS | bash",
              )
            : error,
        });
      });
    });
  }

  /**
   * Check if cursor-agent is installed and available
   */
  async checkInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn("which", ["cursor-agent"], { shell: true });

      child.on("close", (code) => {
        resolve(code === 0);
      });

      child.on("error", () => {
        resolve(false);
      });
    });
  }
}

/**
 * Create a Local Cursor Adapter instance
 */
export function createLocalCursorAdapter(
  options?: LocalCursorAdapterOptions,
): LocalCursorAdapter {
  return new LocalCursorAdapter(options);
}
