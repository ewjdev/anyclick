import { createGitHubAdapter } from "@ewjdev/anyclick-github/server";
import { createJiraAdapter } from "@ewjdev/anyclick-jira/server";
import { createCursorAgentAdapter } from "@ewjdev/anyclick-cursor";
import type { AnyclickPayload } from "@ewjdev/anyclick-core";

// Lazily create the GitHub adapter to allow proper error handling
function getGitHubAdapter() {
  const token = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO ?? "ewjdev/anyclick";

  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is not configured. Please set the GITHUB_TOKEN environment variable.",
    );
  }

  const [owner, repo] = githubRepo.split("/");
  if (!owner || !repo) {
    throw new Error(
      `GITHUB_REPO is not in valid format. Expected "owner/repo", got "${githubRepo}"`,
    );
  }

  return createGitHubAdapter({
    token,
    owner,
    repo,
  });
}

// Lazily create the Jira adapter to allow proper error handling
function getJiraAdapter() {
  const jiraUrl = process.env.JIRA_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!jiraUrl || !email || !apiToken || !projectKey) {
    throw new Error(
      "Jira is not fully configured. Please set JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_PROJECT_KEY environment variables.",
    );
  }

  return createJiraAdapter({
    jiraUrl,
    email,
    apiToken,
    projectKey,
  });
}

// Check if Jira is configured and return missing fields
function getJiraConfigStatus(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.JIRA_URL) missing.push("JIRA_URL");
  if (!process.env.JIRA_EMAIL) missing.push("JIRA_EMAIL");
  if (!process.env.JIRA_API_TOKEN) missing.push("JIRA_API_TOKEN");
  if (!process.env.JIRA_PROJECT_KEY) missing.push("JIRA_PROJECT_KEY");
  return { configured: missing.length === 0, missing };
}

// Check if GitHub is configured
function getGitHubConfigStatus(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
  return { configured: missing.length === 0, missing };
}

// Legacy helpers for backward compatibility
function isJiraConfigured(): boolean {
  return getJiraConfigStatus().configured;
}

function isGitHubConfigured(): boolean {
  return getGitHubConfigStatus().configured;
}

// Local cursor server URL (only used in development)
const LOCAL_CURSOR_SERVER = process.env.LOCAL_CURSOR_SERVER_URL ??
  "http://localhost:3847";

/**
 * Parse Jira error messages to extract missing/required field names
 * Handles various Jira error message formats
 */
function parseJiraMissingFields(errorMessage: string): string[] {
  const missingFields: string[] = [];

  // Pattern 1: "Please enter a value for the X and Y fields"
  // Pattern 2: "Please enter a value for the X field"
  const valuePattern = /Please enter a value for the (.+?) fields?/gi;
  let match = valuePattern.exec(errorMessage);

  while (match) {
    const fieldsPart = match[1];
    // Split by " and " to handle multiple fields
    const fieldNames = fieldsPart.split(/\s+and\s+/i);
    for (const name of fieldNames) {
      // Also split by comma in case of "A, B and C"
      const subNames = name.split(/,\s*/);
      for (const subName of subNames) {
        const trimmed = subName.trim();
        if (trimmed && !missingFields.includes(trimmed)) {
          missingFields.push(trimmed);
        }
      }
    }
    match = valuePattern.exec(errorMessage);
  }

  // Pattern 3: Check for "X is required" patterns
  const requiredPattern = /['"]?([^'"]+)['"]?\s+is required/gi;
  match = requiredPattern.exec(errorMessage);
  while (match) {
    const fieldName = match[1].trim();
    if (fieldName && !missingFields.includes(fieldName)) {
      missingFields.push(fieldName);
    }
    match = requiredPattern.exec(errorMessage);
  }

  // Pattern 4: Check errors object keys if they exist in the error JSON
  try {
    const jsonMatch = errorMessage.match(/\{[\s\S]*"errors"[\s\S]*\}/);
    if (jsonMatch) {
      const errorJson = JSON.parse(jsonMatch[0]);
      // Check errorMessages array
      if (errorJson.errorMessages && Array.isArray(errorJson.errorMessages)) {
        for (const msg of errorJson.errorMessages) {
          // Recursively parse each error message
          const nestedFields = parseJiraMissingFields(msg);
          for (const f of nestedFields) {
            if (!missingFields.includes(f)) {
              missingFields.push(f);
            }
          }
        }
      }
      // Check errors object for field-specific errors
      if (errorJson.errors && typeof errorJson.errors === "object") {
        for (const fieldKey of Object.keys(errorJson.errors)) {
          if (!missingFields.includes(fieldKey)) {
            missingFields.push(fieldKey);
          }
        }
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  console.log("[Feedback API] Parsed missing fields:", missingFields);
  return missingFields;
}

/**
 * GET /api/feedback - Check adapter configuration status
 *
 * Returns configuration status for all adapters (GitHub, Jira)
 * For Jira-specific operations, use /api/ac/jira instead
 */
export async function GET(_req: Request) {
  const jiraStatus = getJiraConfigStatus();
  const githubStatus = getGitHubConfigStatus();

  return Response.json({
    adapters: {
      jira: {
        configured: jiraStatus.configured,
        missing: jiraStatus.missing,
        hint: jiraStatus.configured
          ? "Jira is ready to receive feedback"
          : `Add these to .env.local: ${jiraStatus.missing.join(", ")}`,
      },
      github: {
        configured: githubStatus.configured,
        missing: githubStatus.missing,
        hint: githubStatus.configured
          ? "GitHub is ready to receive feedback"
          : `Add these to .env.local: ${githubStatus.missing.join(", ")}`,
      },
    },
    ready: jiraStatus.configured || githubStatus.configured,
  });
}

export async function POST(req: Request) {
  const payload: AnyclickPayload = await req.json();

  // Log incoming payload for debugging
  console.log("\n========== FEEDBACK API POST ==========");
  console.log("[Feedback] Type:", payload.type);
  console.log("[Feedback] Comment:", payload.comment?.substring(0, 100));
  console.log(
    "[Feedback] Metadata keys:",
    payload.metadata ? Object.keys(payload.metadata) : "none",
  );
  if (payload.metadata) {
    console.log(
      "[Feedback] Metadata:",
      JSON.stringify(payload.metadata, null, 2),
    );
  }

  // Handle cursor_local requests (development only)
  if (payload.type === "cursor_local") {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
      return Response.json(
        { success: false, error: "Local cursor only available in development" },
        { status: 403 },
      );
    }

    // Forward to local cursor server
    try {
      const response = await fetch(`${LOCAL_CURSOR_SERVER}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        return Response.json(
          {
            success: false,
            error: error.error ?? "Failed to connect to local cursor server",
          },
          { status: response.status },
        );
      }

      const result = await response.json();
      return Response.json(result);
    } catch (error) {
      console.error("Failed to connect to local cursor server:", error);
      return Response.json(
        {
          success: false,
          error:
            "Failed to connect to local cursor server. Make sure it's running with: npx uifeedback-local-server",
        },
        { status: 503 },
      );
    }
  }

  // Handle cursor_cloud requests
  if (payload.type === "cursor_cloud") {
    // Validate environment
    const apiKey = process.env.CURSOR_API_KEY;
    const repository = process.env.CURSOR_REPOSITORY;

    if (!apiKey) {
      console.error("CURSOR_API_KEY is not configured");
      return Response.json(
        { success: false, error: "Cursor API not configured" },
        { status: 500 },
      );
    }

    if (!repository) {
      console.error("CURSOR_REPOSITORY is not configured");
      return Response.json(
        { success: false, error: "Cursor repository not configured" },
        { status: 500 },
      );
    }

    const githubUrl = repository.includes("github.com")
      ? repository
      : `https://github.com/${repository}`;

    // Create the Cursor agent adapter
    const cursorAdapter = createCursorAgentAdapter({
      apiKey,
      defaultSource: {
        repository: githubUrl,
        ref: process.env.CURSOR_DEFAULT_REF ?? "main",
      },
      defaultTarget: {
        autoCreatePr: process.env.CURSOR_AUTO_CREATE_PR === "true",
      },
    });

    // Create the agent
    const result = await cursorAdapter.createAgent(payload);

    if (!result.success) {
      console.error("Failed to create Cursor agent:", result.error);
      return Response.json(
        {
          success: false,
          error: result.error?.message ?? "Failed to create agent",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      agentId: result.agent?.id,
      agentUrl: result.agent?.target.url,
      branchName: result.agent?.target.branchName,
    });
  }

  // Default: create issues in configured adapters (GitHub and/or Jira)
  const results: Array<{
    adapter: string;
    success: boolean;
    url?: string;
    error?: string;
    missingFields?: string[];
  }> = [];

  // Try GitHub if configured
  if (isGitHubConfigured()) {
    try {
      const github = getGitHubAdapter();
      const issue = await github.createIssue(payload);
      results.push({ adapter: "GitHub", success: true, url: issue.htmlUrl });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to create GitHub issue";
      console.error("GitHub adapter error:", message);
      results.push({ adapter: "GitHub", success: false, error: message });
    }
  }

  // Try Jira if configured
  if (isJiraConfigured()) {
    try {
      const jira = getJiraAdapter();
      const issue = await jira.createIssue(payload);
      results.push({ adapter: "Jira", success: true, url: issue.url });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to create Jira issue";
      console.error("Jira adapter error:", message);

      // Parse Jira error to extract missing/required fields
      const missingFields = parseJiraMissingFields(message);

      results.push({
        adapter: "Jira",
        success: false,
        error: message,
        missingFields: missingFields.length > 0 ? missingFields : undefined,
      });
    }
  }

  // If no adapters are configured
  if (results.length === 0) {
    const jiraStatus = getJiraConfigStatus();
    const githubStatus = getGitHubConfigStatus();

    const missingVars: string[] = [];
    if (!jiraStatus.configured) {
      missingVars.push(`Jira: missing ${jiraStatus.missing.join(", ")}`);
    }
    if (!githubStatus.configured) {
      missingVars.push(`GitHub: missing ${githubStatus.missing.join(", ")}`);
    }

    return Response.json(
      {
        success: false,
        error:
          "No feedback adapters configured. Please configure GitHub or Jira.",
        details: missingVars,
        hint:
          "Add the missing environment variables to your .env.local file and restart the dev server.",
      },
      { status: 500 },
    );
  }

  // Check if at least one adapter succeeded
  const hasSuccess = results.some((r) => r.success);
  const successfulResults = results.filter((r) => r.success);
  const failedResults = results.filter((r) => !r.success);

  if (hasSuccess) {
    // Return success with details about all adapters
    return Response.json({
      success: true,
      results: successfulResults,
      ...(failedResults.length > 0 && { partialFailures: failedResults }),
    });
  } else {
    // All adapters failed
    return Response.json(
      {
        success: false,
        error: "All adapters failed",
        failures: failedResults,
      },
      { status: 500 },
    );
  }
}
