import type {
  FeedbackAdapter,
  FeedbackClientOptions,
  FeedbackMenuEvent,
  FeedbackPayload,
  FeedbackResult,
  FeedbackTriggerEvent,
  FeedbackType,
  ScreenshotData,
} from "./types";
import { buildFeedbackPayload } from "./payload";

/** Default touch hold duration in milliseconds */
const DEFAULT_TOUCH_HOLD_DURATION_MS = 500;

/** Default touch move threshold in pixels */
const DEFAULT_TOUCH_MOVE_THRESHOLD = 10;

/**
 * Default target filter - ignores html, body, and elements with data-feedback-ignore
 */
function defaultTargetFilter(
  _event: FeedbackTriggerEvent,
  target: Element,
): boolean {
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
  private targetFilter: (event: FeedbackTriggerEvent, target: Element) => boolean;
  private maxInnerTextLength: number;
  private maxOuterHTMLLength: number;
  private maxAncestors: number;
  private cooldownMs: number;
  private stripAttributes: string[];
  private touchHoldDurationMs: number;
  private touchMoveThreshold: number;

  private lastSubmissionTime = 0;
  private pendingElement: Element | null = null;
  private contextMenuHandler: ((e: MouseEvent) => void) | null = null;
  private isAttached = false;

  // Touch event state
  private touchStartHandler: ((e: TouchEvent) => void) | null = null;
  private touchMoveHandler: ((e: TouchEvent) => void) | null = null;
  private touchEndHandler: ((e: TouchEvent) => void) | null = null;
  private touchCancelHandler: ((e: TouchEvent) => void) | null = null;
  private touchHoldTimer: ReturnType<typeof setTimeout> | null = null;
  private touchStartPosition: { x: number; y: number } | null = null;
  private touchTargetElement: Element | null = null;
  private touchStartEvent: TouchEvent | null = null;
  private touchHoldTriggered = false;

  /** Callback when context menu should be shown */
  public onContextMenu?: (event: FeedbackMenuEvent, element: Element) => void;

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
    this.touchHoldDurationMs =
      options.touchHoldDurationMs ?? DEFAULT_TOUCH_HOLD_DURATION_MS;
    this.touchMoveThreshold =
      options.touchMoveThreshold ?? DEFAULT_TOUCH_MOVE_THRESHOLD;
  }

  /**
   * Clear touch state and timer
   */
  private clearTouchState(): void {
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
    this.touchStartPosition = null;
    this.touchTargetElement = null;
    this.touchStartEvent = null;
    this.touchHoldTriggered = false;
  }

  /**
   * Calculate distance between two points
   */
  private getDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Handle touch hold completion (after duration expires)
   */
  private handleTouchHold(): void {
    if (!this.touchTargetElement || !this.touchStartPosition || !this.touchStartEvent) {
      return;
    }

    this.touchHoldTriggered = true;

    // Store the pending element for later submission
    this.pendingElement = this.touchTargetElement;

    // Create synthetic event for positioning
    const menuEvent: FeedbackMenuEvent = {
      clientX: this.touchStartPosition.x,
      clientY: this.touchStartPosition.y,
      originalEvent: this.touchStartEvent,
      isTouch: true,
    };

    // Call the onContextMenu callback if set
    if (this.onContextMenu) {
      this.onContextMenu(menuEvent, this.touchTargetElement);
    }
  }

  /**
   * Attach event listeners to the document
   */
  attach(): void {
    if (this.isAttached) return;
    if (typeof document === "undefined") return;

    // Context menu handler (right-click)
    this.contextMenuHandler = (event: MouseEvent) => {
      const target = event.target as Element;

      if (!this.targetFilter(event, target)) {
        return;
      }

      // Store the pending element for later submission
      this.pendingElement = target;

      // Create synthetic event for positioning
      const menuEvent: FeedbackMenuEvent = {
        clientX: event.clientX,
        clientY: event.clientY,
        originalEvent: event,
        isTouch: false,
      };

      // Call the onContextMenu callback if set
      if (this.onContextMenu) {
        event.preventDefault();
        this.onContextMenu(menuEvent, target);
      }
    };

    // Touch start handler
    this.touchStartHandler = (event: TouchEvent) => {
      // Only handle single touch
      if (event.touches.length !== 1) {
        this.clearTouchState();
        return;
      }

      const touch = event.touches[0];
      const target = event.target as Element;

      if (!this.targetFilter(event, target)) {
        return;
      }

      // Store touch state
      this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
      this.touchTargetElement = target;
      this.touchStartEvent = event;
      this.touchHoldTriggered = false;

      // Start hold timer
      this.touchHoldTimer = setTimeout(() => {
        this.handleTouchHold();
      }, this.touchHoldDurationMs);
    };

    // Touch move handler
    this.touchMoveHandler = (event: TouchEvent) => {
      if (!this.touchStartPosition || !this.touchHoldTimer) {
        return;
      }

      // If hold already triggered, prevent default to stop scrolling
      if (this.touchHoldTriggered) {
        event.preventDefault();
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        this.clearTouchState();
        return;
      }

      // Calculate distance moved
      const distance = this.getDistance(
        this.touchStartPosition.x,
        this.touchStartPosition.y,
        touch.clientX,
        touch.clientY,
      );

      // Cancel hold if moved too much
      if (distance > this.touchMoveThreshold) {
        this.clearTouchState();
      }
    };

    // Touch end handler
    this.touchEndHandler = (event: TouchEvent) => {
      // If hold was triggered, prevent default actions (click, etc.)
      if (this.touchHoldTriggered) {
        event.preventDefault();
      }
      this.clearTouchState();
    };

    // Touch cancel handler
    this.touchCancelHandler = () => {
      this.clearTouchState();
    };

    // Attach event listeners
    document.addEventListener("contextmenu", this.contextMenuHandler);
    document.addEventListener("touchstart", this.touchStartHandler, {
      passive: true,
    });
    document.addEventListener("touchmove", this.touchMoveHandler, {
      passive: false, // Need to be able to prevent default
    });
    document.addEventListener("touchend", this.touchEndHandler, {
      passive: false,
    });
    document.addEventListener("touchcancel", this.touchCancelHandler, {
      passive: true,
    });

    this.isAttached = true;
  }

  /**
   * Detach event listeners from the document
   */
  detach(): void {
    if (!this.isAttached) return;
    if (typeof document === "undefined") return;

    // Remove context menu handler
    if (this.contextMenuHandler) {
      document.removeEventListener("contextmenu", this.contextMenuHandler);
      this.contextMenuHandler = null;
    }

    // Remove touch handlers
    if (this.touchStartHandler) {
      document.removeEventListener("touchstart", this.touchStartHandler);
      this.touchStartHandler = null;
    }
    if (this.touchMoveHandler) {
      document.removeEventListener("touchmove", this.touchMoveHandler);
      this.touchMoveHandler = null;
    }
    if (this.touchEndHandler) {
      document.removeEventListener("touchend", this.touchEndHandler);
      this.touchEndHandler = null;
    }
    if (this.touchCancelHandler) {
      document.removeEventListener("touchcancel", this.touchCancelHandler);
      this.touchCancelHandler = null;
    }

    // Clear touch state
    this.clearTouchState();

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
