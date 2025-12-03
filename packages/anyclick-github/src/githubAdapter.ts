import type {
  FeedbackPayload,
  ScreenshotData,
  ScreenshotCapture,
} from "@anyclick/core";
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

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch: this.mediaBranch,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `GitHub Content API error: ${response.status} ${response.statusText} - ${errorText}`,
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

    // If there are screenshots, upload them and replace dataUrls with raw GitHub URLs
    if (payload.screenshots && this.hasScreenshots(payload.screenshots)) {
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
    const url = `${this.apiBaseUrl}/repos/${this.owner}/${this.repo}`;

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
}

/**
 * Create a GitHub adapter instance
 */
export function createGitHubAdapter(
  options: GitHubAdapterOptions,
): GitHubAdapter {
  return new GitHubAdapter(options);
}
