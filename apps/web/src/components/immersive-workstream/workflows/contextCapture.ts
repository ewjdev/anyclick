import {
  buildElementContext,
  buildPageContext,
  captureScreenshot,
} from "@ewjdev/anyclick-core";
import type { WorkflowCaptureData } from "./types";

const FALLBACK_SELECTOR = "unknown";

export async function captureWorkflowContext(
  targetElement: Element | null,
  containerElement: Element | null,
): Promise<WorkflowCaptureData> {
  const pageContext = buildPageContext();

  const targetContext = targetElement
    ? buildElementContext(targetElement, {
        maxAncestors: 8,
        maxInnerTextLength: 600,
        maxOuterHTMLLength: 2500,
      })
    : null;

  const containerContext = containerElement
    ? buildElementContext(containerElement, {
        maxAncestors: 8,
        maxInnerTextLength: 600,
        maxOuterHTMLLength: 2500,
      })
    : null;

  let screenshotError: string | undefined;
  let containerScreenshot: WorkflowCaptureData["containerScreenshot"];

  if (targetElement) {
    try {
      const result = await captureScreenshot(
        targetElement,
        containerElement,
        "container",
        {
          maxSizeBytes: 700 * 1024,
          quality: 0.8,
          showPreview: false,
        },
      );

      if (result.capture) {
        containerScreenshot = result.capture;
      }

      if (result.error) {
        screenshotError = result.error.message;
      }
    } catch (error) {
      screenshotError =
        error instanceof Error ? error.message : "Failed to capture screenshot";
    }
  } else {
    screenshotError = "No right-click target available.";
  }

  return {
    capturedAt: new Date().toISOString(),
    containerContext,
    containerSelector: containerContext?.selector || FALLBACK_SELECTOR,
    containerScreenshot,
    pageContext,
    screenshotError,
    targetContext,
    targetSelector: targetContext?.selector || FALLBACK_SELECTOR,
  };
}
