import type { FeedbackPayload, ScreenshotCapture } from "@anyclick/core";

/**
 * Default title formatter for GitHub issues
 */
export function defaultFormatTitle(payload: FeedbackPayload): string {
  const typeLabels: Record<string, string> = {
    issue: "🐛 Bug Report",
    feature: "✨ Feature Request",
    like: "👍 Positive Feedback",
  };

  const label = typeLabels[payload.type] ?? "Feedback";
  const elementInfo = payload.element.id
    ? `#${payload.element.id}`
    : payload.element.tag;

  return `[${label}] ${elementInfo} - ${truncate(payload.page.title, 50)}`;
}

/**
 * Format a screenshot as a markdown image
 * Uses base64 data URL directly in markdown
 */
function formatScreenshotMarkdown(
  screenshot: ScreenshotCapture,
  label: string,
): string {
  const lines: string[] = [];
  lines.push(`### ${label}`);
  lines.push(
    `*${screenshot.width}×${screenshot.height}px • ${formatBytes(screenshot.sizeBytes)}*\n`,
  );
  lines.push(`![${label}](${screenshot.dataUrl})`);
  return lines.join("\n");
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Default body formatter for GitHub issues
 * Includes element and container screenshots if available
 */
export function defaultFormatBody(payload: FeedbackPayload): string {
  const lines: string[] = [];

  // Header
  lines.push("## Feedback Details\n");

  // Type and comment
  lines.push(`**Type:** ${capitalize(payload.type)}`);
  if (payload.comment) {
    lines.push(`\n**Comment:**\n> ${payload.comment}`);
  }

  // Screenshots section (element and container only for GitHub)
  if (payload.screenshots) {
    const { element, container } = payload.screenshots;

    if (element || container) {
      lines.push("\n---\n");
      lines.push("## Screenshots\n");

      // Element screenshot
      if (element) {
        lines.push(formatScreenshotMarkdown(element, "🎯 Target Element"));
        lines.push("");
      }

      // Container screenshot
      if (container) {
        lines.push(formatScreenshotMarkdown(container, "📦 Container Context"));
        lines.push("");
      }
    }
  }

  // Page context
  lines.push("\n---\n");
  lines.push("## Page Context\n");
  lines.push(`- **URL:** ${payload.page.url}`);
  lines.push(`- **Title:** ${payload.page.title}`);
  lines.push(
    `- **Viewport:** ${payload.page.viewport.width}x${payload.page.viewport.height}`,
  );
  lines.push(`- **Timestamp:** ${payload.page.timestamp}`);

  // Element context
  lines.push("\n---\n");
  lines.push("## Element Context\n");
  lines.push(`- **Selector:** \`${payload.element.selector}\``);
  lines.push(`- **Tag:** \`${payload.element.tag}\``);
  if (payload.element.id) {
    lines.push(`- **ID:** \`${payload.element.id}\``);
  }
  if (payload.element.classes.length > 0) {
    lines.push(`- **Classes:** \`${payload.element.classes.join(", ")}\``);
  }

  // Element text (if present and meaningful)
  if (
    payload.element.innerText &&
    payload.element.innerText.trim().length > 0
  ) {
    const text = truncate(payload.element.innerText.trim(), 200);
    lines.push(`\n**Element Text:**\n\`\`\`\n${text}\n\`\`\``);
  }

  // Outer HTML (collapsed)
  lines.push("\n<details>");
  lines.push("<summary>Element HTML</summary>\n");
  lines.push("```html");
  lines.push(payload.element.outerHTML);
  lines.push("```");
  lines.push("</details>");

  // Ancestors
  if (payload.element.ancestors.length > 0) {
    lines.push("\n<details>");
    lines.push("<summary>Element Hierarchy</summary>\n");
    lines.push("```");
    payload.element.ancestors.forEach((ancestor, index) => {
      const indent = "  ".repeat(index);
      lines.push(
        `${indent}${ancestor.tag}${ancestor.id ? `#${ancestor.id}` : ""}`,
      );
    });
    lines.push("```");
    lines.push("</details>");
  }

  // Data attributes (if any)
  const dataAttrs = Object.entries(payload.element.dataAttributes);
  if (dataAttrs.length > 0) {
    lines.push("\n<details>");
    lines.push("<summary>Data Attributes</summary>\n");
    lines.push("| Attribute | Value |");
    lines.push("|-----------|-------|");
    dataAttrs.forEach(([key, value]) => {
      lines.push(`| data-${key} | ${value} |`);
    });
    lines.push("</details>");
  }

  // Metadata (if any)
  if (payload.metadata && Object.keys(payload.metadata).length > 0) {
    lines.push("\n---\n");
    lines.push("## Additional Metadata\n");
    lines.push("```json");
    lines.push(JSON.stringify(payload.metadata, null, 2));
    lines.push("```");
  }

  // Browser info
  lines.push("\n---\n");
  lines.push("<details>");
  lines.push("<summary>Browser Info</summary>\n");
  lines.push(`- **User Agent:** ${payload.page.userAgent}`);
  lines.push(
    `- **Screen:** ${payload.page.screen.width}x${payload.page.screen.height}`,
  );
  if (payload.page.referrer) {
    lines.push(`- **Referrer:** ${payload.page.referrer}`);
  }
  lines.push("</details>");

  return lines.join("\n");
}

// Utilities

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
