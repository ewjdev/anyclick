import type {
  FeedbackPayload,
  ScreenshotData,
  ScreenshotCapture,
} from "@ewjdev/anyclick-core";
import type {
  GitHubAdapterOptions,
  GitHubIssueResult,
  UIFeedbackMetadata,
} from "./types";
import { feedbackTypeLabels } from "./types";
import { defaultFormatTitle, defaultFormatBody } from "./formatters";

/**
 * GitHub adapter for server-side usage
 * Creates GitHub issues from feedback payloads
 */
export class GitHubAdapter {
  private token: string;
  private owner: string;
  private repo: string;
  private defaultLabels: string[];
  private formatTitle: (payload: FeedbackPayload) => string;
  private formatBody: (payload: FeedbackPayload) => string;
  private apiBaseUrl: string;
  private mediaBranch: string;
  private assetsPath: string;

  constructor(options: GitHubAdapterOptions) {
    this.token = options.token;
    this.owner = options.owner;
    this.repo = options.repo;
    this.defaultLabels = options.defaultLabels ?? [];
    this.formatTitle = options.formatTitle ?? defaultFormatTitle;
    this.formatBody = options.formatBody ?? defaultFormatBody;
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.github.com";
    this.mediaBranch = options.mediaBranch ?? "issues/src";
    this.assetsPath = options.assetsPath ?? "feedback-assets";
  }

  /**
   * Generate a unique submission ID
   */
  private generateSubmissionId(): string {
    return crypto.randomUUID();
  }

  /**
   * Get the raw GitHub URL for an asset
   */
  private getRawUrl(path: string): string {
    return `https://github.com/${this.owner}/${this.repo}/blob/${this.mediaBranch}/${path}?raw=true`;
  }

  /**
   * Upload a file to the media branch using GitHub Content API
   */
  private async uploadAsset(
    path: string,
    base64Content: string,
    commitMessage: string,
  ): Promise<string> {
    const url = `${this.apiBaseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`;

    console.log("🔍 Uploading asset to URL:", url);
    console.log(`   Branch: ${this.mediaBranch}`);
    console.log(`   Repo: ${this.owner}/${this.repo}`);
    console.log(`   Token: ${this.token}`);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch: this.mediaBranch,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");

      console.info(`curl command: ${curlCommand}`);

      // Provide more specific error messages based on status code
      let diagnosticMessage = "";
      if (response.status === 404) {
        diagnosticMessage = `
Possible causes for 404:
  - The branch '${this.mediaBranch}' does not exist
  - The repository '${this.owner}/${this.repo}' does not exist or is not accessible
  - The token does not have access to this repository
  - Fine-grained token missing 'Contents: Read and write' permission`;
      } else if (response.status === 401) {
        diagnosticMessage = `
Token authentication failed. Check that GITHUB_TOKEN is valid and not expired.`;
      } else if (response.status === 403) {
        diagnosticMessage = `
Permission denied. The token may not have write access to this repository.
For fine-grained tokens, ensure 'Contents: Read and write' permission is granted.`;
      } else if (response.status === 422) {
        diagnosticMessage = `
Validation failed. This could mean:
  - The file already exists (need to provide SHA for update)
  - Invalid base64 content
  - Branch name is invalid`;
      }

      throw new Error(
        `GitHub Content API error: ${response.status} ${response.statusText} - ${errorText}${diagnosticMessage}`,
      );
    }

    return this.getRawUrl(path);
  }

  /**
   * Upload all screenshots and return updated screenshot data with URLs
   */
  private async uploadScreenshots(
    submissionId: string,
    screenshots: ScreenshotData,
  ): Promise<ScreenshotData> {
    const basePath = `${this.assetsPath}/${submissionId}`;
    const uploadedScreenshots: ScreenshotData = {
      capturedAt: screenshots.capturedAt,
    };

    const uploadScreenshot = async (
      capture: ScreenshotCapture,
      name: string,
    ): Promise<ScreenshotCapture> => {
      // Extract base64 content from data URL (remove "data:image/png;base64," prefix)
      const base64Content = capture.dataUrl.replace(
        /^data:image\/\w+;base64,/,
        "",
      );
      const path = `${basePath}/${name}.png`;
      const rawUrl = await this.uploadAsset(
        path,
        base64Content,
        `Add feedback screenshot: ${name} (${submissionId})`,
      );

      return {
        ...capture,
        dataUrl: rawUrl,
      };
    };

    if (screenshots.element) {
      uploadedScreenshots.element = await uploadScreenshot(
        screenshots.element,
        "element",
      );
    }
    if (screenshots.container) {
      uploadedScreenshots.container = await uploadScreenshot(
        screenshots.container,
        "container",
      );
    }
    if (screenshots.viewport) {
      uploadedScreenshots.viewport = await uploadScreenshot(
        screenshots.viewport,
        "viewport",
      );
    }

    return uploadedScreenshots;
  }

  /**
   * Format the metadata comment to embed in issue body
   */
  private formatMetadataComment(metadata: UIFeedbackMetadata): string {
    return `\n\n<!-- uifeedback-metadata: ${JSON.stringify(metadata)} -->`;
  }

  /**
   * Create a GitHub issue from a feedback payload
   * If screenshots are present, uploads them to the media branch first
   */
  async createIssue(payload: FeedbackPayload): Promise<GitHubIssueResult> {
    let processedPayload = payload;
    let submissionId: string | undefined;

    // If there are screenshots, validate prerequisites before attempting upload
    if (payload.screenshots && this.hasScreenshots(payload.screenshots)) {
      console.log(
        "📸 Screenshots detected, validating GitHub configuration...",
      );

      // Run diagnostics to check prerequisites
      const diagnostics = await this.runDiagnostics();

      if (diagnostics.errors.length > 0) {
        console.log("❌ Configuration errors detected:");
        diagnostics.errors.forEach((err) => console.log(`   - ${err}`));

        // If media branch doesn't exist, try to create it automatically
        if (
          !diagnostics.mediaBranchExists &&
          diagnostics.repoAccessible &&
          diagnostics.repoPermissions?.push
        ) {
          console.log(
            `\n🔧 Attempting to create media branch '${this.mediaBranch}' automatically...`,
          );
          try {
            const sha = await this.ensureMediaBranch();
            if (sha) {
              console.log(
                `✅ Media branch created successfully (commit: ${sha.substring(0, 7)})`,
              );
            }
          } catch (branchError) {
            const errorMsg =
              branchError instanceof Error
                ? branchError.message
                : String(branchError);
            throw new Error(
              `Failed to auto-create media branch '${this.mediaBranch}': ${errorMsg}\n\n` +
                `You can manually create it by running:\n` +
                `  npx @ewjdev/anyclick-github setup-media-branch`,
            );
          }
        } else if (!diagnostics.mediaBranchExists) {
          // Can't auto-create, provide helpful error
          throw new Error(
            `Media branch '${this.mediaBranch}' does not exist and cannot be auto-created.\n\n` +
              `Diagnostic results:\n` +
              `  - Token valid: ${diagnostics.tokenValid}\n` +
              `  - Repo accessible: ${diagnostics.repoAccessible}\n` +
              `  - Push permission: ${diagnostics.repoPermissions?.push ?? "unknown"}\n\n` +
              `Errors:\n${diagnostics.errors.map((e) => `  - ${e}`).join("\n")}\n\n` +
              `To fix, ensure your token has write access and run:\n` +
              `  npx @ewjdev/anyclick-github setup-media-branch`,
          );
        }

        // If there are other critical errors (not just missing branch), throw
        const criticalErrors = diagnostics.errors.filter(
          (e) => !e.includes("Media branch"),
        );
        if (criticalErrors.length > 0 && !diagnostics.repoAccessible) {
          throw new Error(
            `GitHub configuration errors:\n${criticalErrors.map((e) => `  - ${e}`).join("\n")}`,
          );
        }
      }

      console.log("✅ Configuration validated, uploading screenshots...");

      submissionId = this.generateSubmissionId();
      const uploadedScreenshots = await this.uploadScreenshots(
        submissionId,
        payload.screenshots,
      );

      // Create a new payload with the uploaded screenshot URLs
      processedPayload = {
        ...payload,
        screenshots: uploadedScreenshots,
      };
    }

    const title = this.formatTitle(processedPayload);
    let body = this.formatBody(processedPayload);

    // Append metadata comment if we uploaded assets
    if (submissionId) {
      const metadata: UIFeedbackMetadata = {
        submissionId,
        branch: this.mediaBranch,
        assetsPath: this.assetsPath,
      };
      body += this.formatMetadataComment(metadata);
    }

    // Determine labels based on feedback type
    const typeLabel = feedbackTypeLabels[payload.type];
    const labels = [...this.defaultLabels];
    if (typeLabel && !labels.includes(typeLabel)) {
      labels.push(typeLabel);
    }

    const url = `${this.apiBaseUrl}/repos/${this.owner}/${this.repo}/issues`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body,
        labels,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      number: number;
      url: string;
      html_url: string;
    };

    return {
      number: data.number,
      url: data.url,
      htmlUrl: data.html_url,
    };
  }

  /**
   * Check if screenshot data contains any actual screenshots
   */
  private hasScreenshots(screenshots: ScreenshotData): boolean {
    return !!(
      screenshots.element ||
      screenshots.container ||
      screenshots.viewport
    );
  }

  /**
   * Validate that the adapter is configured correctly
   */
  async validateConfiguration(): Promise<boolean> {
    const result = await this.runDiagnostics();
    return result.repoAccessible && result.tokenValid;
  }

  /**
   * Run comprehensive diagnostics on the adapter configuration
   * Returns detailed information about what's working and what's not
   */
  async runDiagnostics(): Promise<{
    tokenValid: boolean;
    tokenScopes: string | null;
    repoAccessible: boolean;
    repoPermissions: { push: boolean; pull: boolean } | null;
    mediaBranchExists: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let tokenValid = false;
    let tokenScopes: string | null = null;
    let repoAccessible = false;
    let repoPermissions: { push: boolean; pull: boolean } | null = null;
    let mediaBranchExists = false;

    // Check 1: Validate token by checking rate limit (works even without repo access)
    try {
      const rateLimitResponse = await fetch(`${this.apiBaseUrl}/rate_limit`, {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (rateLimitResponse.ok) {
        tokenValid = true;
        tokenScopes = rateLimitResponse.headers.get("x-oauth-scopes");
        console.log("✅ Token is valid");
        if (tokenScopes) {
          console.log(`   Scopes: ${tokenScopes}`);
        } else {
          console.log("   (Fine-grained token - scopes not listed in header)");
        }
      } else {
        errors.push(
          `Token validation failed: ${rateLimitResponse.status} ${rateLimitResponse.statusText}`,
        );
        console.log("❌ Token is invalid or expired");
      }
    } catch (e) {
      errors.push(
        `Token check failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Check 2: Check repository access and permissions
    try {
      const repoUrl = `${this.apiBaseUrl}/repos/${this.owner}/${this.repo}`;
      const repoResponse = await fetch(repoUrl, {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (repoResponse.ok) {
        repoAccessible = true;
        const repoData = (await repoResponse.json()) as {
          permissions?: { push?: boolean; pull?: boolean };
        };
        repoPermissions = {
          push: repoData.permissions?.push ?? false,
          pull: repoData.permissions?.pull ?? false,
        };
        console.log(`✅ Repository ${this.owner}/${this.repo} is accessible`);
        console.log(
          `   Permissions: push=${repoPermissions.push}, pull=${repoPermissions.pull}`,
        );

        if (!repoPermissions.push) {
          errors.push(
            `Token does not have push (write) permission to ${this.owner}/${this.repo}`,
          );
        }
      } else if (repoResponse.status === 404) {
        errors.push(
          `Repository ${this.owner}/${this.repo} not found or not accessible with this token`,
        );
        console.log(
          `❌ Repository ${this.owner}/${this.repo} not found or not accessible`,
        );
      } else {
        errors.push(
          `Repository check failed: ${repoResponse.status} ${repoResponse.statusText}`,
        );
      }
    } catch (e) {
      errors.push(
        `Repository check failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Check 3: Check if media branch exists
    try {
      mediaBranchExists = await this.mediaBranchExists();
      if (mediaBranchExists) {
        console.log(`✅ Media branch '${this.mediaBranch}' exists`);
      } else {
        errors.push(
          `Media branch '${this.mediaBranch}' does not exist. Run setup-media-branch to create it.`,
        );
        console.log(`❌ Media branch '${this.mediaBranch}' does not exist`);
      }
    } catch (e) {
      errors.push(
        `Media branch check failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    return {
      tokenValid,
      tokenScopes,
      repoAccessible,
      repoPermissions,
      mediaBranchExists,
      errors,
    };
  }

  /**
   * Check if the media branch exists
   */
  async mediaBranchExists(): Promise<boolean> {
    const url = `${this.apiBaseUrl}/repos/${this.owner}/${this.repo}/git/ref/heads/${this.mediaBranch}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create the media branch as an orphan branch for storing feedback assets
   * This should be called once during initial setup
   * @returns The commit SHA of the created branch, or null if branch already exists
   */
  async ensureMediaBranch(): Promise<string | null> {
    // Check if branch already exists
    if (await this.mediaBranchExists()) {
      return null;
    }

    // Step 1: Create a blob with a README
    const readmeContent = `# Feedback Assets

This branch stores screenshot assets for GitHub Issues created by @ewjdev/anyclick-github.

## Structure

\`\`\`
${this.assetsPath}/
└── <submission-id>/
    ├── element.png     # Screenshot of the selected element
    ├── container.png   # Screenshot of the element's container
    └── viewport.png    # Full viewport screenshot
\`\`\`

Do not manually edit this branch unless cleaning up old assets.
`;

    const blobResponse = await fetch(
      `${this.apiBaseUrl}/repos/${this.owner}/${this.repo}/git/blobs`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: Buffer.from(readmeContent).toString("base64"),
          encoding: "base64",
        }),
      },
    );

    if (!blobResponse.ok) {
      const error = await blobResponse.text().catch(() => "Unknown error");
      throw new Error(
        `Failed to create blob: ${blobResponse.status} - ${error}`,
      );
    }

    const blob = (await blobResponse.json()) as { sha: string };

    // Step 2: Create a tree with the README
    const treeResponse = await fetch(
      `${this.apiBaseUrl}/repos/${this.owner}/${this.repo}/git/trees`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tree: [
            {
              path: "README.md",
              mode: "100644",
              type: "blob",
              sha: blob.sha,
            },
          ],
        }),
      },
    );

    if (!treeResponse.ok) {
      const error = await treeResponse.text().catch(() => "Unknown error");
      throw new Error(
        `Failed to create tree: ${treeResponse.status} - ${error}`,
      );
    }

    const tree = (await treeResponse.json()) as { sha: string };

    // Step 3: Create an orphan commit (no parents)
    const commitResponse = await fetch(
      `${this.apiBaseUrl}/repos/${this.owner}/${this.repo}/git/commits`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Initialize feedback assets branch\n\nCreated by @ewjdev/anyclick-github",
          tree: tree.sha,
          parents: [], // Empty parents = orphan commit
        }),
      },
    );

    if (!commitResponse.ok) {
      const error = await commitResponse.text().catch(() => "Unknown error");
      throw new Error(
        `Failed to create commit: ${commitResponse.status} - ${error}`,
      );
    }

    const commit = (await commitResponse.json()) as { sha: string };

    // Step 4: Create the branch reference
    const refResponse = await fetch(
      `${this.apiBaseUrl}/repos/${this.owner}/${this.repo}/git/refs`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: `refs/heads/${this.mediaBranch}`,
          sha: commit.sha,
        }),
      },
    );

    if (!refResponse.ok) {
      const error = await refResponse.text().catch(() => "Unknown error");
      throw new Error(
        `Failed to create branch: ${refResponse.status} - ${error}`,
      );
    }

    return commit.sha;
  }
}

/**
 * Create a GitHub adapter instance
 */
export function createGitHubAdapter(
  options: GitHubAdapterOptions,
): GitHubAdapter {
  return new GitHubAdapter(options);
}
