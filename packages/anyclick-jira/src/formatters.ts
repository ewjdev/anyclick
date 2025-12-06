import type { AnyclickPayload, ScreenshotCapture } from "@ewjdev/anyclick-core";
import type { AdfDocument, AdfNode } from "./types";

/**
 * Default summary formatter for Jira issues
 */
export function defaultFormatSummary(payload: AnyclickPayload): string {
  const typeLabels: Record<string, string> = {
    issue: "🐛 Bug",
    feature: "✨ Feature",
    like: "👍 Feedback",
  };

  const label = typeLabels[payload.type] ?? "Feedback";
  const elementInfo = payload.element.id
    ? `#${payload.element.id}`
    : payload.element.tag;

  // Jira summary has a 255 character limit
  const title = `[${label}] ${elementInfo} - ${truncate(payload.page.title, 50)}`;
  return truncate(title, 255);
}

/**
 * Default description formatter for Jira issues
 * Returns Atlassian Document Format (ADF)
 */
export function defaultFormatDescription(
  payload: AnyclickPayload,
): AdfDocument {
  const content: AdfNode[] = [];

  // Header
  content.push(makeHeading("Feedback Details", 2));

  // Type and comment
  content.push(
    makeParagraph([
      makeText("Type: ", [{ type: "strong" }]),
      makeText(capitalize(payload.type)),
    ]),
  );

  if (payload.comment) {
    content.push(
      makeParagraph([
        makeText("Comment: ", [{ type: "strong" }]),
        makeText(payload.comment),
      ]),
    );
  }

  // Screenshots section
  if (payload.screenshots) {
    const { element, container, viewport } = payload.screenshots;

    if (element || container || viewport) {
      content.push(makeRule());
      content.push(makeHeading("Screenshots", 2));

      if (element) {
        content.push(
          makeParagraph([
            makeText("🎯 Target Element", [{ type: "strong" }]),
          ]),
        );
        content.push(
          makeParagraph([
            makeText(
              `${element.width}×${element.height}px • ${formatBytes(element.sizeBytes)}`,
              [{ type: "em" }],
            ),
          ]),
        );
        // Note: Screenshot URLs will be added as attachments
        // Jira will display them automatically
      }

      if (container) {
        content.push(
          makeParagraph([
            makeText("📦 Container Context", [{ type: "strong" }]),
          ]),
        );
        content.push(
          makeParagraph([
            makeText(
              `${container.width}×${container.height}px • ${formatBytes(container.sizeBytes)}`,
              [{ type: "em" }],
            ),
          ]),
        );
      }
    }
  }

  // Page context
  content.push(makeRule());
  content.push(makeHeading("Page Context", 2));
  content.push(
    makeBulletList([
      `URL: ${payload.page.url}`,
      `Title: ${payload.page.title}`,
      `Viewport: ${payload.page.viewport.width}x${payload.page.viewport.height}`,
      `Timestamp: ${payload.page.timestamp}`,
    ]),
  );

  // Element context
  content.push(makeRule());
  content.push(makeHeading("Element Context", 2));
  const elementDetails: string[] = [
    `Selector: ${payload.element.selector}`,
    `Tag: ${payload.element.tag}`,
  ];
  if (payload.element.id) {
    elementDetails.push(`ID: ${payload.element.id}`);
  }
  if (payload.element.classes.length > 0) {
    elementDetails.push(`Classes: ${payload.element.classes.join(", ")}`);
  }
  content.push(makeBulletList(elementDetails));

  // Element text
  if (
    payload.element.innerText &&
    payload.element.innerText.trim().length > 0
  ) {
    content.push(
      makeParagraph([makeText("Element Text:", [{ type: "strong" }])]),
    );
    content.push(
      makeCodeBlock(truncate(payload.element.innerText.trim(), 500)),
    );
  }

  // Element HTML
  content.push(
    makeParagraph([makeText("Element HTML:", [{ type: "strong" }])]),
  );
  content.push(makeCodeBlock(payload.element.outerHTML, "html"));

  // Ancestors
  if (payload.element.ancestors.length > 0) {
    content.push(
      makeParagraph([makeText("Element Hierarchy:", [{ type: "strong" }])]),
    );
    const hierarchyText = payload.element.ancestors
      .map((ancestor, index) => {
        const indent = "  ".repeat(index);
        return `${indent}${ancestor.tag}${ancestor.id ? `#${ancestor.id}` : ""}`;
      })
      .join("\n");
    content.push(makeCodeBlock(hierarchyText));
  }

  // Data attributes
  const dataAttrs = Object.entries(payload.element.dataAttributes);
  if (dataAttrs.length > 0) {
    content.push(
      makeParagraph([makeText("Data Attributes:", [{ type: "strong" }])]),
    );
    const tableRows: AdfNode[] = dataAttrs.map(([key, value]) => ({
      type: "tableRow",
      content: [
        {
          type: "tableCell",
          content: [makeParagraph([makeText(`data-${key}`)])],
        },
        {
          type: "tableCell",
          content: [makeParagraph([makeText(value)])],
        },
      ],
    }));
    content.push({
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              content: [makeParagraph([makeText("Attribute")])],
            },
            {
              type: "tableHeader",
              content: [makeParagraph([makeText("Value")])],
            },
          ],
        },
        ...tableRows,
      ],
    });
  }

  // Metadata
  if (payload.metadata && Object.keys(payload.metadata).length > 0) {
    content.push(makeRule());
    content.push(makeHeading("Additional Metadata", 2));
    content.push(
      makeCodeBlock(JSON.stringify(payload.metadata, null, 2), "json"),
    );
  }

  // Browser info
  content.push(makeRule());
  content.push(makeHeading("Browser Info", 2));
  const browserDetails: string[] = [
    `User Agent: ${payload.page.userAgent}`,
    `Screen: ${payload.page.screen.width}x${payload.page.screen.height}`,
  ];
  if (payload.page.referrer) {
    browserDetails.push(`Referrer: ${payload.page.referrer}`);
  }
  content.push(makeBulletList(browserDetails));

  return {
    type: "doc",
    version: 1,
    content,
  };
}

// ADF Helper Functions

function makeHeading(text: string, level: number = 2): AdfNode {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}

function makeParagraph(content: AdfNode[]): AdfNode {
  return {
    type: "paragraph",
    content,
  };
}

function makeText(
  text: string,
  marks?: Array<{ type: string; attrs?: Record<string, any> }>,
): AdfNode {
  return {
    type: "text",
    text,
    ...(marks && marks.length > 0 ? { marks } : {}),
  };
}

function makeBulletList(items: string[]): AdfNode {
  return {
    type: "bulletList",
    content: items.map((text) => ({
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text }],
        },
      ],
    })),
  };
}

function makeCodeBlock(code: string, language?: string): AdfNode {
  return {
    type: "codeBlock",
    attrs: language ? { language } : {},
    content: [{ type: "text", text: code }],
  };
}

function makeRule(): AdfNode {
  return {
    type: "rule",
  };
}

// Utility Functions

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

