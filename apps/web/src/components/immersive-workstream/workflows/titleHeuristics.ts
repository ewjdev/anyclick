import type { WorkflowCaptureData } from "./types";

export interface SelectorBundle {
  css: string;
  snippet: string;
  testId: string;
  xpath: string;
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function selectorToken(selector: string): string {
  if (!selector) return "selected element";
  const clean = selector
    .replace(/:nth-of-type\(\d+\)/g, "")
    .replace(/\s*>\s*/g, " ")
    .trim();
  const parts = clean.split(" ").filter(Boolean);
  return truncate(parts[parts.length - 1] || clean, 32);
}

function extractTargetText(capture: WorkflowCaptureData): string {
  const targetText = compactWhitespace(capture.targetContext?.innerText || "");
  if (!targetText) return "";
  return truncate(targetText, 42);
}

function extractContainerLabel(capture: WorkflowCaptureData): string {
  if (capture.containerContext?.id) {
    return `#${capture.containerContext.id}`;
  }

  const classes = capture.containerContext?.classes || [];
  if (classes.length > 0) {
    return `.${classes[0]}`;
  }

  return selectorToken(capture.containerSelector);
}

export function generateHeuristicIssueTitle(
  capture: WorkflowCaptureData,
): string {
  const targetText = extractTargetText(capture);
  const targetLabel = targetText
    ? `"${targetText}"`
    : selectorToken(capture.targetSelector);
  const containerLabel = extractContainerLabel(capture);
  const pageLabel = truncate(capture.pageContext.title || "Untitled page", 32);

  return `Bug: ${targetLabel} fails inside ${containerLabel} on ${pageLabel}`;
}

function selectorSegmentToXPath(segment: string): string {
  const cleaned = segment.trim();
  if (!cleaned) return "*";

  const tagMatch = cleaned.match(/^[a-zA-Z][a-zA-Z0-9-]*/);
  const tag = tagMatch ? tagMatch[0] : "*";

  const idMatch = cleaned.match(/#([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return `${tag}[@id="${idMatch[1]}"]`;
  }

  const classMatch = cleaned.match(/\.([a-zA-Z0-9_-]+)/);
  const nthMatch = cleaned.match(/:nth-of-type\((\d+)\)/);

  if (classMatch && nthMatch) {
    return `${tag}[contains(@class,"${classMatch[1]}")][${nthMatch[1]}]`;
  }

  if (classMatch) {
    return `${tag}[contains(@class,"${classMatch[1]}")]`;
  }

  if (nthMatch) {
    return `${tag}[${nthMatch[1]}]`;
  }

  return tag;
}

function cssToXPath(selector: string): string {
  const parts = selector
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(selectorSegmentToXPath);

  if (parts.length === 0) {
    return "//*";
  }

  return `//${parts.join("/")}`;
}

function inferTestIdSelector(capture: WorkflowCaptureData): string {
  const dataAttrs = capture.targetContext?.dataAttributes || {};
  const candidateKeys = ["testid", "testId", "qa", "cy", "test"];

  for (const key of candidateKeys) {
    const value = dataAttrs[key];
    if (value) {
      if (key === "testid" || key === "testId") {
        return `[data-testid="${value}"]`;
      }
      return `[data-${key}="${value}"]`;
    }
  }

  const primaryClass = capture.targetContext?.classes?.[0];
  const tag = capture.targetContext?.tag || "element";
  const fallback = primaryClass ? `${tag}-${primaryClass}` : `${tag}-target`;

  return `[data-testid="${fallback}"]`;
}

export function buildSelectorBundle(
  capture: WorkflowCaptureData,
): SelectorBundle {
  const css = capture.targetSelector || "unknown";
  const xpath = cssToXPath(css);
  const testId = inferTestIdSelector(capture);

  const snippet = [
    `// Anyclick selector bundle`,
    `const targetCss = \"${css}\";`,
    `const targetXpath = \"${xpath}\";`,
    `const targetTestId = \"${testId}\";`,
    capture.containerSelector
      ? `const containerCss = \"${capture.containerSelector}\";`
      : "const containerCss = \"\";",
  ].join("\n");

  return {
    css,
    snippet,
    testId,
    xpath,
  };
}
