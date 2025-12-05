import { createJiraAdapter } from "@ewjdev/anyclick-jira/server";

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

/**
 * GET /api/ac/jira - Jira metadata and search operations
 *
 * Query params:
 *   - action=status: Get Jira configuration status
 *   - action=issue-types: Get available Jira issue types
 *   - action=fields&issueType=Bug: Get fields for an issue type
 *   - action=search&field=Team&fieldKey=customfield_123&query=dev: Search for field values
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Check configuration status
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

  // All other actions require Jira to be configured
  const configStatus = getJiraConfigStatus();
  if (!configStatus.configured) {
    return Response.json(
      {
        error: "Jira is not configured",
        missing: configStatus.missing,
      },
      { status: 400 },
    );
  }

  const jira = getJiraAdapter();

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
