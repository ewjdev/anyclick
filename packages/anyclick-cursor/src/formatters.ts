import type { AnyclickPayload, ScreenshotCapture } from "@ewjdev/anyclick-core";
import type { AgentPrompt, AgentPromptImage } from "./types";

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
 * Format a screenshot as a markdown image with metadata
 */
function formatScreenshotMarkdown(
  screenshot: ScreenshotCapture,
  label: string,
  emoji: string,
): string {
  const lines: string[] = [];
  lines.push(`#### ${emoji} ${label}`);
  lines.push(
    `*${screenshot.width}×${screenshot.height}px • ${formatBytes(screenshot.sizeBytes)}*\n`,
  );
  lines.push(`![${label}](${screenshot.dataUrl})`);
  return lines.join("\n");
}

/**
 * Default prompt formatter - converts feedback payload to agent prompt
 * Includes all available screenshots (element, container, viewport)
 */
export function defaultFormatPrompt(payload: AnyclickPayload): AgentPrompt {
  const { type, comment, element, page, screenshots } = payload;

  const lines: string[] = [];

  // Header with feedback type
  lines.push(`## Feedback: ${type.toUpperCase()}`);
  lines.push("");

  // User comment if provided
  if (comment) {
    lines.push("### User Request");
    lines.push(comment);
    lines.push("");
  }

  // Screenshots section - ALL screenshots for Cursor agent
  if (screenshots) {
    const hasScreenshots =
      screenshots.element || screenshots.container || screenshots.viewport;

    if (hasScreenshots) {
      lines.push("### Visual Context (Screenshots)");
      lines.push("");
      lines.push("Images of the UI at the time of feedback:");
      lines.push("");

      // Container screenshot - surrounding context
      if (screenshots.container) {
        lines.push(`![Container](refenced in screenshots.container.dataUrl)`);
        lines.push("");
      }

      // Viewport screenshot - full page context
      if (screenshots.viewport) {
        lines.push(`![Viewport](refenced in screenshots.viewport.dataUrl)`);
        lines.push("");
      }
    }
  }

  // Element context
  lines.push("### Target Element");
  lines.push(`- **Selector:** \`${element.selector}\``);
  lines.push(`- **Tag:** \`${element.tag}\``);
  if (element.id) {
    lines.push(`- **ID:** \`${element.id}\``);
  }
  if (element.classes.length > 0) {
    lines.push(`- **Classes:** \`${element.classes.join(", ")}\``);
  }
  lines.push("");

  // Inner text (if meaningful)
  if (element.innerText && element.innerText.trim()) {
    lines.push("### Element Text Content");
    lines.push("```");
    lines.push(element.innerText.trim());
    lines.push("```");
    lines.push("");
  }

  // HTML structure
  lines.push("### Element HTML");
  lines.push("```html");
  lines.push(element.outerHTML);
  lines.push("```");
  lines.push("");

  // Data attributes
  if (Object.keys(element.dataAttributes).length > 0) {
    lines.push("### Data Attributes");
    for (const [key, value] of Object.entries(element.dataAttributes)) {
      lines.push(`- \`data-${key}\`: \`${value}\``);
    }
    lines.push("");
  }

  // Ancestor context
  if (element.ancestors.length > 0) {
    lines.push("### DOM Hierarchy");
    for (const ancestor of element.ancestors) {
      const parts = [ancestor.tag];
      if (ancestor.id) parts.push(`#${ancestor.id}`);
      if (ancestor.classes.length > 0)
        parts.push(`.${ancestor.classes.join(".")}`);
      lines.push(`- \`${parts.join("")}\``);
    }
    lines.push("");
  }

  // Page context
  lines.push("### Page Context");
  lines.push(`- **URL:** ${page.url}`);
  lines.push(`- **Title:** ${page.title}`);
  lines.push(`- **Viewport:** ${page.viewport.width}x${page.viewport.height}`);
  lines.push("");

  // Instructions based on feedback type
  lines.push("### Instructions");
  switch (type) {
    case "issue":
      lines.push(
        "Please investigate and fix any issues with the element described above. " +
          "Look for bugs, styling problems, or functionality issues based on the user's feedback. " +
          "Review the screenshots for visual context.",
      );
      break;
    case "feature":
      lines.push(
        "Please implement the feature request described above. " +
          "Focus on the element context and the user's description to understand what they want. " +
          "Use the screenshots to see the current state.",
      );
      break;
    case "like":
      lines.push(
        "The user likes this element! Consider documenting what makes it good " +
          "or applying similar patterns elsewhere in the codebase. " +
          "Review the screenshots to see what they appreciated.",
      );
      break;
    default:
      lines.push(
        "Please review the feedback above and make appropriate changes to the codebase. " +
          "Use the screenshots for visual reference.",
      );
  }

  const screenshotImages: AgentPromptImage[] = [];
  [screenshots?.element, screenshots?.container, screenshots?.viewport].forEach(
    (screenshot) => {
      if (screenshot) {
        screenshotImages.push({
          data: screenshot.dataUrl.replace("data:image/jpeg;base64,", ""),
          dimension: {
            width: screenshot.width,
            height: screenshot.height,
          },
        });
      }
    },
  );

  return {
    text: lines.join("\n"),
    images: screenshotImages,
  };
}

/**
 * Default agent name formatter
 */
export function defaultFormatAgentName(payload: AnyclickPayload): string {
  const typeLabels: Record<string, string> = {
    issue: "Fix",
    feature: "Implement",
    like: "Document",
  };

  const prefix = typeLabels[payload.type] ?? "Handle";

  // Try to create a meaningful name from the element
  let elementName = "";
  if (payload.element.id) {
    elementName = `#${payload.element.id}`;
  } else if (payload.element.classes.length > 0) {
    elementName = `.${payload.element.classes[0]}`;
  } else {
    elementName = payload.element.tag;
  }

  // Truncate comment if used
  const commentPart = payload.comment
    ? `: ${payload.comment.slice(0, 50)}${payload.comment.length > 50 ? "..." : ""}`
    : "";

  return `${prefix} ${elementName}${commentPart}`;
}
