import { createGitHubAdapter } from "@ewjdev/anyclick-github/server";
import { createCursorAgentAdapter } from "@ewjdev/anyclick-cursor";
import type { FeedbackPayload } from "@ewjdev/anyclick-core";

const githubRepo = process.env.GITHUB_REPO! ?? "ewjdev/anyclick";

const github = createGitHubAdapter({
  token: process.env.GITHUB_TOKEN!,
  owner: githubRepo.split("/")[0]!,
  repo: githubRepo.split("/")[1]!,
});

// Local cursor server URL (only used in development)
const LOCAL_CURSOR_SERVER =
  process.env.LOCAL_CURSOR_SERVER_URL ?? "http://localhost:3847";

export async function POST(req: Request) {
  const payload: FeedbackPayload = await req.json();

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

  // Default: create GitHub issue
  const issue = await github.createIssue(payload);
  return Response.json({ success: true, url: issue.htmlUrl });
}
