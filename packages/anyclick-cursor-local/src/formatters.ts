import type { AnyclickPayload, ScreenshotCapture } from "@ewjdev/anyclick-core";

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
  lines.push(`### ${emoji} ${label}`);
  lines.push(
    `*${screenshot.width}×${screenshot.height}px • ${formatBytes(screenshot.sizeBytes)}*\n`,
  );
  lines.push(`![${label}](${screenshot.dataUrl})`);
  return lines.join("\n");
}

/**
 * Default prompt formatter for cursor-agent CLI
 * Creates a detailed prompt that cursor-agent can act on
 * Includes all available screenshots (element, container, viewport)
 */
export function defaultFormatPrompt(payload: AnyclickPayload): string {
  const { type, comment, element, page, screenshots } = payload;

  const lines: string[] = [];

  // Clear instruction header
  lines.push(`# UI Feedback: ${type.toUpperCase()}`);
  lines.push("");

  // User's request/comment is the most important
  if (comment) {
    lines.push("## User Request");
    lines.push(comment);
    lines.push("");
  }

  // Screenshots section - ALL screenshots for Cursor agent
  if (screenshots) {
    const hasScreenshots =
      screenshots.element || screenshots.container || screenshots.viewport;

    if (hasScreenshots) {
      lines.push("## Visual Context (Screenshots)");
      lines.push("");
      lines.push(
        "The following screenshots show the UI at the time of feedback:",
      );
      lines.push("");

      // Element screenshot - most focused view
      if (screenshots.element) {
        lines.push(
          formatScreenshotMarkdown(screenshots.element, "Target Element", "🎯"),
        );
        lines.push("");
      }

      // Container screenshot - surrounding context
      if (screenshots.container) {
        lines.push(
          formatScreenshotMarkdown(
            screenshots.container,
            "Container Context",
            "📦",
          ),
        );
        lines.push("");
      }

      // Viewport screenshot - full page context
      if (screenshots.viewport) {
        lines.push(
          formatScreenshotMarkdown(screenshots.viewport, "Full Viewport", "🖥️"),
        );
        lines.push("");
      }

      lines.push("---");
      lines.push("");
    }
  }

  // Type-specific instructions
  lines.push("## Task");
  switch (type) {
    case "issue":
      lines.push(
        "Fix the bug or issue with the UI element described below. " +
          "Look for styling problems, functionality issues, or incorrect behavior. " +
          "Use the screenshots above to understand the visual context.",
      );
      break;
    case "feature":
      lines.push(
        "Implement the feature request for the UI element described below. " +
          "Follow the user's description and the existing code patterns. " +
          "Reference the screenshots to understand the current state.",
      );
      break;
    case "like":
      lines.push(
        "The user likes this element. Document what makes it good " +
          "or consider applying similar patterns elsewhere. " +
          "Review the screenshots to see what they appreciated.",
      );
      break;
    default:
      lines.push(
        "Address the feedback for the UI element described below. " +
          "Use the screenshots for visual context.",
      );
  }
  lines.push("");

  // Element context - essential for finding the right code
  lines.push("## Target Element");
  lines.push(`- Selector: \`${element.selector}\``);
  lines.push(`- Tag: \`<${element.tag}>\``);
  if (element.id) {
    lines.push(`- ID: \`#${element.id}\``);
  }
  if (element.classes.length > 0) {
    lines.push(`- Classes: \`${element.classes.join(" ")}\``);
  }
  lines.push("");

  // Text content helps identify the element
  if (element.innerText && element.innerText.trim()) {
    lines.push("## Element Text");
    lines.push("```");
    lines.push(element.innerText.trim().slice(0, 200));
    lines.push("```");
    lines.push("");
  }

  // HTML structure for context
  lines.push("## Element HTML");
  lines.push("```html");
  lines.push(element.outerHTML);
  lines.push("```");
  lines.push("");

  // Data attributes often contain component/test identifiers
  if (Object.keys(element.dataAttributes).length > 0) {
    lines.push("## Data Attributes");
    for (const [key, value] of Object.entries(element.dataAttributes)) {
      lines.push(`- \`data-${key}="${value}"\``);
    }
    lines.push("");
  }

  // DOM hierarchy helps locate the component
  if (element.ancestors.length > 0) {
    lines.push("## Component Hierarchy");
    const hierarchy = element.ancestors
      .map((a) => {
        let selector = a.tag;
        if (a.id) selector += `#${a.id}`;
        if (a.classes.length > 0)
          selector += `.${a.classes.slice(0, 2).join(".")}`;
        return selector;
      })
      .join(" > ");
    lines.push(`\`${hierarchy} > ${element.tag}\``);
    lines.push("");
  }

  // Page context
  lines.push("## Page Context");
  lines.push(`- URL: ${page.url}`);
  lines.push(`- Title: ${page.title}`);
  lines.push("");

  // Final instruction
  lines.push("## Instructions");
  lines.push("1. Review the screenshots to understand the visual context");
  lines.push("2. Find the component/file that renders this element");
  lines.push(
    "3. Make the necessary changes based on the feedback type and user request",
  );
  lines.push("4. Ensure the changes follow existing code patterns and styles");

  return lines.join("\n");
}
