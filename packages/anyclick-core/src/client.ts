import type {
  FeedbackAdapter,
  FeedbackClientOptions,
  FeedbackPayload,
  FeedbackResult,
  FeedbackType,
  ScreenshotData,
} from "./types";
import { buildFeedbackPayload } from "./payload";

/**
 * Default target filter - ignores html, body, and elements with data-feedback-ignore
 */
function defaultTargetFilter(_event: MouseEvent, target: Element): boolean {
  const tag = target.tagName.toLowerCase();
  if (tag === "html" || tag === "body") return false;
  if (target.closest("[data-feedback-ignore]")) return false;
  return true;
}

/**
 * FeedbackClient manages DOM event handling and feedback submission
 */
export class FeedbackClient {
  private adapter: FeedbackAdapter;
  private targetFilter: (event: MouseEvent, target: Element) => boolean;
  private maxInnerTextLength: number;
  private maxOuterHTMLLength: number;
  private maxAncestors: number;
  private cooldownMs: number;
  private stripAttributes: string[];

  private lastSubmissionTime = 0;
  private pendingElement: Element | null = null;
  private contextMenuHandler: ((e: MouseEvent) => void) | null = null;
  private isAttached = false;

  /** Callback when context menu should be shown */
  public onContextMenu?: (event: MouseEvent, element: Element) => void;

  /** Callback after successful submission */
  public onSubmitSuccess?: (payload: FeedbackPayload) => void;

  /** Callback after failed submission */
  public onSubmitError?: (error: Error, payload: FeedbackPayload) => void;

  constructor(options: FeedbackClientOptions) {
    this.adapter = options.adapter;
    this.targetFilter = options.targetFilter ?? defaultTargetFilter;
    this.maxInnerTextLength = options.maxInnerTextLength ?? 500;
    this.maxOuterHTMLLength = options.maxOuterHTMLLength ?? 1000;
    this.maxAncestors = options.maxAncestors ?? 5;
    this.cooldownMs = options.cooldownMs ?? 1000;
    this.stripAttributes = options.stripAttributes ?? [];
  }

  /**
   * Attach event listeners to the document
   */
  attach(): void {
    if (this.isAttached) return;
    if (typeof document === "undefined") return;

    this.contextMenuHandler = (event: MouseEvent) => {
      const target = event.target as Element;

      if (!this.targetFilter(event, target)) {
        return;
      }

      // Store the pending element for later submission
      this.pendingElement = target;

      // Call the onContextMenu callback if set
      if (this.onContextMenu) {
        event.preventDefault();
        this.onContextMenu(event, target);
      }
    };

    document.addEventListener("contextmenu", this.contextMenuHandler);
    this.isAttached = true;
  }

  /**
   * Detach event listeners from the document
   */
  detach(): void {
    if (!this.isAttached || !this.contextMenuHandler) return;
    if (typeof document === "undefined") return;

    document.removeEventListener("contextmenu", this.contextMenuHandler);
    this.contextMenuHandler = null;
    this.isAttached = false;
    this.pendingElement = null;
  }

  /**
   * Check if submission is rate-limited
   */
  isRateLimited(): boolean {
    return Date.now() - this.lastSubmissionTime < this.cooldownMs;
  }

  /**
   * Get the currently pending element (the one that was right-clicked)
   */
  getPendingElement(): Element | null {
    return this.pendingElement;
  }

  /**
   * Clear the pending element
   */
  clearPendingElement(): void {
    this.pendingElement = null;
  }

  /**
   * Build a payload for a specific element
   */
  buildPayload(
    element: Element,
    type: FeedbackType,
    options: {
      comment?: string;
      metadata?: Record<string, unknown>;
      screenshots?: ScreenshotData;
    } = {},
  ): FeedbackPayload {
    const payload = buildFeedbackPayload(element, type, {
      comment: options.comment,
      metadata: options.metadata,
      maxInnerTextLength: this.maxInnerTextLength,
      maxOuterHTMLLength: this.maxOuterHTMLLength,
      maxAncestors: this.maxAncestors,
      stripAttributes: this.stripAttributes,
    });

    // Add screenshots if provided
    if (options.screenshots) {
      payload.screenshots = options.screenshots;
    }

    return payload;
  }

  /**
   * Submit feedback for an element
   */
  async submitFeedback(
    element: Element,
    type: FeedbackType,
    options: {
      comment?: string;
      metadata?: Record<string, unknown>;
      screenshots?: ScreenshotData;
    } = {},
  ): Promise<FeedbackResult> {
    // Check rate limiting
    if (this.isRateLimited()) {
      const error = new Error(
        "Rate limited: please wait before submitting again",
      );
      return { success: false, error };
    }

    const payload = this.buildPayload(element, type, options);

    try {
      await this.adapter.submitFeedback(payload);
      this.lastSubmissionTime = Date.now();
      this.onSubmitSuccess?.(payload);
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.onSubmitError?.(error, payload);
      return { success: false, error };
    }
  }

  /**
   * Submit feedback for the pending element (the one that was right-clicked)
   */
  async submitPendingFeedback(
    type: FeedbackType,
    options: {
      comment?: string;
      metadata?: Record<string, unknown>;
      screenshots?: ScreenshotData;
    } = {},
  ): Promise<FeedbackResult> {
    if (!this.pendingElement) {
      return {
        success: false,
        error: new Error("No pending element to submit feedback for"),
      };
    }

    const result = await this.submitFeedback(
      this.pendingElement,
      type,
      options,
    );
    this.pendingElement = null;
    return result;
  }
}

/**
 * Create a new FeedbackClient instance
 */
export function createFeedbackClient(
  options: FeedbackClientOptions,
): FeedbackClient {
  return new FeedbackClient(options);
}
