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
  private container: Element | null;
  private attachedTarget: EventTarget | null = null;

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
    this.container = options.container ?? null;
  }

  /**
   * Update the container element for scoped event handling
   */
  setContainer(container: Element | null): void {
    if (process.env.NODE_ENV === "development") {
      console.log("[Anyclick] setContainer called", {
        hadContainer: !!this.container,
        newContainer: !!container,
        wasAttached: this.isAttached,
      });
    }

    const wasAttached = this.isAttached;
    if (wasAttached) {
      this.detach();
    }
    this.container = container;
    if (wasAttached) {
      this.attach();
    }
  }

  /**
   * Get the current container element
   */
  getContainer(): Element | null {
    return this.container;
  }

  /**
   * Attach event listeners to the container or document
   */
  attach(): void {
    if (this.isAttached) return;
    if (typeof document === "undefined") return;

    const isScoped = !!this.container;
    const debugPrefix = isScoped ? "[Anyclick:Scoped]" : "[Anyclick:Global]";

    if (process.env.NODE_ENV === "development") {
      console.log(`${debugPrefix} Attaching event listener`, {
        isScoped,
        container: this.container,
        useCapture: isScoped,
      });
    }

    this.contextMenuHandler = (event: MouseEvent) => {
      const target = event.target as Element;
      const targetTag = target.tagName?.toLowerCase() || "unknown";
      const targetClass = target.className || "";

      if (process.env.NODE_ENV === "development") {
        console.log(`${debugPrefix} Context menu event received`, {
          target: `${targetTag}.${targetClass.toString().slice(0, 50)}`,
          eventPhase:
            event.eventPhase === 1
              ? "CAPTURE"
              : event.eventPhase === 2
                ? "TARGET"
                : "BUBBLE",
          hasContainer: !!this.container,
        });
      }

      // If scoped to a container, ensure target is within the container
      if (this.container && !this.container.contains(target)) {
        if (process.env.NODE_ENV === "development") {
          console.log(`${debugPrefix} Target not in container, skipping`);
        }
        return;
      }

      if (!this.targetFilter(event, target)) {
        if (process.env.NODE_ENV === "development") {
          console.log(`${debugPrefix} Target filtered out`);
        }
        return;
      }

      // Store the pending element for later submission
      this.pendingElement = target;

      // Call the onContextMenu callback if set
      if (this.onContextMenu) {
        if (process.env.NODE_ENV === "development") {
          console.log(`${debugPrefix} Handling event`, {
            willStopPropagation: isScoped,
            target: `${targetTag}`,
          });
        }

        event.preventDefault();
        // Stop propagation for scoped providers to prevent parent providers
        // from also handling the same event
        if (this.container) {
          event.stopPropagation();
          event.stopImmediatePropagation(); // Also stop other listeners on same element
        }
        this.onContextMenu(event, target);
      }
    };

    // For scoped providers, always attach to document but filter by container
    // This avoids issues with display:contents not receiving events
    this.attachedTarget = document;

    // Use capture phase for scoped providers to handle events before bubble phase
    // This ensures scoped handlers run before global handlers
    this.attachedTarget.addEventListener(
      "contextmenu",
      this.contextMenuHandler as EventListener,
      isScoped ? true : false, // capture phase for scoped
    );
    this.isAttached = true;

    if (process.env.NODE_ENV === "development") {
      console.log(`${debugPrefix} Event listener attached successfully`);
    }
  }

  /**
   * Detach event listeners from the container or document
   */
  detach(): void {
    if (!this.isAttached || !this.contextMenuHandler || !this.attachedTarget)
      return;
    if (typeof document === "undefined") return;

    const isScoped = !!this.container;
    const debugPrefix = isScoped ? "[Anyclick:Scoped]" : "[Anyclick:Global]";

    if (process.env.NODE_ENV === "development") {
      console.log(`${debugPrefix} Detaching event listener`);
    }

    // Remove with same capture option that was used when adding
    this.attachedTarget.removeEventListener(
      "contextmenu",
      this.contextMenuHandler as EventListener,
      this.container ? true : false,
    );
    this.contextMenuHandler = null;
    this.attachedTarget = null;
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
