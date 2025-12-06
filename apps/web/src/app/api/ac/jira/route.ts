import { createJiraAdapter } from "@ewjdev/anyclick-jira/server";

// Interface for session credentials passed via header
interface SessionCredentials {
  jiraUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

// Parse session credentials from header
function parseSessionCredentials(req: Request): SessionCredentials | null {
  const headerValue = req.headers.get("x-jira-credentials");
  if (!headerValue) return null;

  try {
    const creds = JSON.parse(headerValue) as SessionCredentials;
    // Validate required fields
    if (creds.jiraUrl && creds.email && creds.apiToken && creds.projectKey) {
      return creds;
    }
  } catch (e) {
    console.error("[Jira API] Failed to parse session credentials:", e);
  }
  return null;
}

// Create Jira adapter from env vars
function getJiraAdapterFromEnv() {
  const jiraUrl = process.env.JIRA_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!jiraUrl || !email || !apiToken || !projectKey) {
    return null;
  }

  return createJiraAdapter({
    jiraUrl,
    email,
    apiToken,
    projectKey,
  });
}

// Create Jira adapter from session credentials
function getJiraAdapterFromSession(creds: SessionCredentials) {
  return createJiraAdapter({
    jiraUrl: creds.jiraUrl,
    email: creds.email,
    apiToken: creds.apiToken,
    projectKey: creds.projectKey,
  });
}

// Get Jira adapter - prefers session credentials (when explicitly provided), falls back to env vars
function getJiraAdapter(req: Request) {
  // First check if session credentials are explicitly provided via header
  // This takes priority because it means the user is intentionally using custom credentials
  const sessionCreds = parseSessionCredentials(req);
  if (sessionCreds) {
    return getJiraAdapterFromSession(sessionCreds);
  }

  // Fall back to env vars
  const envAdapter = getJiraAdapterFromEnv();
  if (envAdapter) {
    return envAdapter;
  }

  return null;
}

// Check if Jira is configured via env vars and return missing fields
function getJiraConfigStatus(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.JIRA_URL) missing.push("JIRA_URL");
  if (!process.env.JIRA_EMAIL) missing.push("JIRA_EMAIL");
  if (!process.env.JIRA_API_TOKEN) missing.push("JIRA_API_TOKEN");
  if (!process.env.JIRA_PROJECT_KEY) missing.push("JIRA_PROJECT_KEY");
  return { configured: missing.length === 0, missing };
}

/**
 * GET /api/ac/jira - Jira metadata and search operations
 *
 * Query params:
 *   - action=status: Get Jira configuration status (env vars only)
 *   - action=issue-types: Get available Jira issue types
 *   - action=fields&issueType=Bug: Get fields for an issue type
 *   - action=search&field=Team&fieldKey=customfield_123&query=dev: Search for field values
 *
 * Headers:
 *   - x-jira-credentials: JSON string with {jiraUrl, email, apiToken, projectKey}
 *     Used as fallback when env vars are not configured
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Check configuration status (only reports env var status, not session)
  if (action === "status" || !action) {
    const status = getJiraConfigStatus();
    return Response.json({
      configured: status.configured,
      missing: status.missing,
      hint: status.configured
        ? "Jira is ready to receive feedback"
        : `Add these to .env.local: ${status.missing.join(", ")}`,
    });
  }

  // Get Jira adapter (from env or session credentials)
  const jira = getJiraAdapter(req);
  if (!jira) {
    return Response.json(
      {
        error:
          "Jira is not configured. Please provide credentials or set environment variables.",
        missing: getJiraConfigStatus().missing,
      },
      { status: 400 },
    );
  }

  // Get available issue types
  if (action === "issue-types") {
    try {
      const issueTypes = await jira.getIssueTypes();
      return Response.json({ issueTypes });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to fetch issue types";
      console.error("Failed to fetch issue types:", message);
      return Response.json({ error: message }, { status: 500 });
    }
  }

  // Get fields for a specific issue type
  if (action === "fields") {
    const issueType = url.searchParams.get("issueType");
    if (!issueType) {
      return Response.json({ error: "issueType parameter is required" }, {
        status: 400,
      });
    }

    const includeOptional = url.searchParams.get("includeOptional") === "true";

    try {
      const result = await jira.getFieldsForForm(issueType, {
        includeOptional,
      });

      // Log fields for debugging
      console.log(`[Jira API] Issue type: ${issueType}`);
      console.log(`[Jira API] Total fields: ${result.fields.length}`);
      console.log(
        `[Jira API] Required fields:`,
        result.fields.filter((f) => f.required).map((f) => ({
          key: f.key,
          name: f.name,
          type: f.type,
          hasOptions: !!f.options?.length,
        })),
      );

      return Response.json(result);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to fetch fields";
      console.error("Failed to fetch fields:", message);
      return Response.json({ error: message }, { status: 500 });
    }
  }

  // Search for field values (autocomplete)
  if (action === "search") {
    const fieldName = url.searchParams.get("field");
    const fieldKey = url.searchParams.get("fieldKey") || undefined;
    const query = url.searchParams.get("query") || "";

    if (!fieldName) {
      return Response.json({ error: "field parameter is required" }, {
        status: 400,
      });
    }

    try {
      const results = await jira.searchFieldValues(fieldName, query, fieldKey);
      return Response.json({ results });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to search field values";
      console.error("Failed to search field values:", message);
      return Response.json({ error: message }, { status: 500 });
    }
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
