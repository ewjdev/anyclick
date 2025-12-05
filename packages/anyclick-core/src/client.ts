import type {
  AnyclickAdapter,
  AnyclickClientOptions,
  AnyclickMenuEvent,
  AnyclickPayload,
  AnyclickResult,
  AnyclickTriggerEvent,
  AnyclickType,
  ScreenshotData,
} from "./types";
import { buildAnyclickPayload } from "./payload";

/** Default touch hold duration in milliseconds */
const DEFAULT_TOUCH_HOLD_DURATION_MS = 500;

/** Default touch move threshold in pixels */
const DEFAULT_TOUCH_MOVE_THRESHOLD = 10;

/**
 * Default target filter - ignores html, body, and elements with data-anyclick-ignore
 */
function defaultTargetFilter(
  _event: AnyclickTriggerEvent,
  target: Element,
): boolean {
  const tag = target.tagName.toLowerCase();
  if (tag === "html" || tag === "body") return false;
  if (target.closest("[data-anyclick-ignore]")) return false;
  return true;
}

/**
 * AnyclickClient manages DOM event handling and anyclick submission
 */
export class AnyclickClient {
  private adapter: AnyclickAdapter;
  private targetFilter: (
    event: AnyclickTriggerEvent,
    target: Element,
  ) => boolean;
  private maxInnerTextLength: number;
  private maxOuterHTMLLength: number;
  private maxAncestors: number;
  private cooldownMs: number;
  private stripAttributes: string[];
  private container: Element | null;
  private attachedTarget: EventTarget | null = null;
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
  private contextMenuFromTouchHandler: ((e: Event) => void) | null = null;

  // Additional cleanup handlers
  private clickCleanupHandler: ((e: Event) => void) | null = null;
  private pointerDownCleanupHandler: ((e: Event) => void) | null = null;

  /**
   * Callback when context menu should be shown.
   * Return `false` to allow the native context menu (e.g., for disabled scopes).
   * Return `true` or `void` to prevent the native menu and show the custom menu.
   */
  public onContextMenu?: (
    event: AnyclickMenuEvent,
    element: Element,
  ) => boolean | void;

  /** Callback after successful submission */
  public onSubmitSuccess?: (payload: AnyclickPayload) => void;

  /** Callback after failed submission */
  public onSubmitError?: (error: Error, payload: AnyclickPayload) => void;

  constructor(options: AnyclickClientOptions) {
    this.adapter = options.adapter;
    this.targetFilter = options.targetFilter ?? defaultTargetFilter;
    this.maxInnerTextLength = options.maxInnerTextLength ?? 500;
    this.maxOuterHTMLLength = options.maxOuterHTMLLength ?? 1000;
    this.maxAncestors = options.maxAncestors ?? 5;
    this.cooldownMs = options.cooldownMs ?? 1000;
    this.stripAttributes = options.stripAttributes ?? [];
    this.container = options.container ?? null;
    this.touchHoldDurationMs =
      options.touchHoldDurationMs ?? DEFAULT_TOUCH_HOLD_DURATION_MS;
    this.touchMoveThreshold =
      options.touchMoveThreshold ?? DEFAULT_TOUCH_MOVE_THRESHOLD;
  }

  /**
   * Clear touch state and timer
   */
  private clearTouchState(): void {
    const hadState =
      this.touchHoldTimer ||
      this.touchStartPosition ||
      this.touchTargetElement ||
      this.touchStartEvent;

    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
    this.touchStartPosition = null;
    this.touchTargetElement = null;
    this.touchStartEvent = null;

    // Log only if we actually cleared something (avoid noise)
    if (process.env.NODE_ENV === "development" && hadState) {
      console.log("[Anyclick] Touch state cleared", {
        wasHoldTriggered: this.touchHoldTriggered,
      });
    }

    this.touchHoldTriggered = false;
  }

  /**
   * Calculate distance between two points
   */
  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Handle touch hold completion (after duration expires)
   */
  private handleTouchHold(): void {
    // Defensive check - verify state is still valid
    if (
      !this.touchTargetElement ||
      !this.touchStartPosition ||
      !this.touchStartEvent
    ) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Anyclick] handleTouchHold called but state was cleared");
      }
      this.clearTouchState();
      return;
    }

    // Verify the target element is still in the document
    if (!document.contains(this.touchTargetElement)) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Anyclick] Touch target element is no longer in document");
      }
      this.clearTouchState();
      return;
    }

    this.touchHoldTriggered = true;

    // Store the pending element for later submission
    this.pendingElement = this.touchTargetElement;

      // Create synthetic event for positioning
      const menuEvent: AnyclickMenuEvent = {
        clientX: this.touchStartPosition.x,
        clientY: this.touchStartPosition.y,
        originalEvent: this.touchStartEvent,
        isTouch: true,
      };

    if (process.env.NODE_ENV === "development") {
      console.log("[Anyclick] Touch hold triggered", {
        position: this.touchStartPosition,
        target: this.touchTargetElement.tagName,
      });
    }

    // Call the onContextMenu callback if set
    if (this.onContextMenu) {
      const handled = this.onContextMenu(menuEvent, this.touchTargetElement);
      // If handled is not false, the menu was shown
      if (handled !== false) {
        // Menu was shown - we'll clear state after user interacts
      }
    }
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

      // Create synthetic event for positioning
      const menuEvent: AnyclickMenuEvent = {
        clientX: event.clientX,
        clientY: event.clientY,
        originalEvent: event,
        isTouch: false,
      };

      // Call the onContextMenu callback if set
      if (this.onContextMenu) {
        if (process.env.NODE_ENV === "development") {
          console.log(`${debugPrefix} Handling event`, {
            willStopPropagation: isScoped,
            target: `${targetTag}`,
          });
        }

        // Call the callback first - it returns true if it handled the event
        // If it returns false (e.g., for disabled scopes), we let the native menu show
        const handled = this.onContextMenu(menuEvent, target);

        if (handled !== false) {
          event.preventDefault();
          // Stop propagation for scoped providers to prevent parent providers
          // from also handling the same event
          if (this.container) {
            event.stopPropagation();
            event.stopImmediatePropagation(); // Also stop other listeners on same element
          }
        }
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

      // If scoped to a container, ensure target is within the container
      if (this.container && !this.container.contains(target)) {
        return;
      }

      if (!this.targetFilter(event, target)) {
        return;
      }

      // Don't prevent default here - allow normal scrolling
      // We'll prevent the contextmenu event instead

      // Store touch state
      this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
      this.touchTargetElement = target;
      this.touchStartEvent = event;
      this.touchHoldTriggered = false;

      if (process.env.NODE_ENV === "development") {
        console.log("[Anyclick] Touch started", {
          target: target.tagName,
          position: { x: touch.clientX, y: touch.clientY },
          holdDuration: this.touchHoldDurationMs,
        });
      }

      // Start hold timer
      this.touchHoldTimer = setTimeout(() => {
        this.handleTouchHold();
      }, this.touchHoldDurationMs);
    };

    // Touch move handler
    // This handler only cancels the hold if the user moves too much
    // We don't prevent default here to allow normal scrolling
    // The contextMenuFromTouchHandler handles blocking the native menu
    this.touchMoveHandler = (event: TouchEvent) => {
      // If no active touch tracking, nothing to do
      if (!this.touchStartPosition) {
        return;
      }

      // If hold already triggered (menu is showing), prevent default to stop scrolling
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

      // Cancel hold if moved too much (allow normal scrolling)
      if (distance > this.touchMoveThreshold) {
        this.clearTouchState();
      }
      // Don't prevent default here - allow scrolling during hold
      // The native menu will be blocked by contextMenuFromTouchHandler
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

    // Handler to prevent native contextmenu event from touch devices
    // This fires after a long press and shows "Copy" / "Search with Google"
    // We prevent it if we're actively tracking a touch hold
    this.contextMenuFromTouchHandler = (event: Event) => {
      // Only prevent if we have an active touch sequence
      if (this.touchStartEvent && this.touchTargetElement) {
        const mouseEvent = event as MouseEvent;
        // Check if this is from touch (not mouse right-click)
        // Mouse right-clicks have button === 2
        // Touch long-press has button === 0, undefined, or might not have the property
        // Also check if we're on a touch device by checking if there are no modifier keys
        // and the event is not from a mouse button 2
        const isLikelyTouch =
          mouseEvent.button !== 2 &&
          !mouseEvent.ctrlKey &&
          !mouseEvent.metaKey &&
          !mouseEvent.shiftKey &&
          !mouseEvent.altKey;

        if (isLikelyTouch) {
          if (process.env.NODE_ENV === "development") {
            console.log("[Anyclick] Blocking native contextmenu from touch", {
              holdTriggered: this.touchHoldTriggered,
              timerActive: !!this.touchHoldTimer,
            });
          }

          // This is likely from touch, prevent the native menu
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          // If we haven't triggered the menu yet but the hold timer is active,
          // the native menu is trying to show - trigger our menu now
          if (!this.touchHoldTriggered && this.touchHoldTimer) {
            // Clear the timer and trigger immediately
            if (this.touchHoldTimer) {
              clearTimeout(this.touchHoldTimer);
              this.touchHoldTimer = null;
            }
            this.handleTouchHold();
          }
        }
      }
    };

    // Click handler to clear any stale touch state
    // This ensures state is cleared when user clicks away from a touch-triggered menu
    this.clickCleanupHandler = () => {
      // Only clear if we have stale state (menu was triggered but user clicked elsewhere)
      if (this.touchHoldTriggered) {
        if (process.env.NODE_ENV === "development") {
          console.log("[Anyclick] Clearing touch state on click");
        }
        this.clearTouchState();
      }
    };

    // Pointer down handler to clear stale touch state
    // This handles cases where a new pointer interaction starts
    this.pointerDownCleanupHandler = (event: Event) => {
      const pointerEvent = event as PointerEvent;

      // Only clear if this is a new pointer interaction (not the same touch)
      // and we have pending touch state
      if (
        pointerEvent.pointerType !== "touch" &&
        (this.touchStartEvent || this.touchHoldTriggered)
      ) {
        if (process.env.NODE_ENV === "development") {
          console.log("[Anyclick] Clearing touch state on pointer down", {
            pointerType: pointerEvent.pointerType,
          });
        }
        this.clearTouchState();
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

    // Attach touch event listeners
    // All touch events are passive except touchmove when menu is shown
    // This allows smooth scrolling while still blocking native menu
    this.attachedTarget.addEventListener(
      "touchstart",
      this.touchStartHandler as EventListener,
      {
        passive: true,
      },
    );
    // touchmove must be non-passive to prevent scrolling after menu shows
    this.attachedTarget.addEventListener(
      "touchmove",
      this.touchMoveHandler as EventListener,
      {
        passive: false,
      },
    );
    this.attachedTarget.addEventListener(
      "touchend",
      this.touchEndHandler as EventListener,
      {
        passive: false, // May need to prevent default when hold triggered
      },
    );
    this.attachedTarget.addEventListener(
      "touchcancel",
      this.touchCancelHandler as EventListener,
      {
        passive: true,
      },
    );

    // Add contextmenu handler to prevent native menu from touch devices
    // This needs to be in capture phase to run before other handlers
    this.attachedTarget.addEventListener(
      "contextmenu",
      this.contextMenuFromTouchHandler,
      true, // capture phase
    );

    // Add click handler for cleanup
    this.attachedTarget.addEventListener("click", this.clickCleanupHandler, {
      passive: true,
    });

    // Add pointer down handler for cleanup
    this.attachedTarget.addEventListener(
      "pointerdown",
      this.pointerDownCleanupHandler,
      { passive: true },
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

    // Remove touch handlers
    if (this.touchStartHandler) {
      this.attachedTarget.removeEventListener(
        "touchstart",
        this.touchStartHandler as EventListener,
      );
      this.touchStartHandler = null;
    }
    if (this.touchMoveHandler) {
      this.attachedTarget.removeEventListener(
        "touchmove",
        this.touchMoveHandler as EventListener,
      );
      this.touchMoveHandler = null;
    }
    if (this.touchEndHandler) {
      this.attachedTarget.removeEventListener(
        "touchend",
        this.touchEndHandler as EventListener,
      );
      this.touchEndHandler = null;
    }
    if (this.touchCancelHandler) {
      this.attachedTarget.removeEventListener(
        "touchcancel",
        this.touchCancelHandler as EventListener,
      );
      this.touchCancelHandler = null;
    }

    // Remove contextmenu handler for touch
    if (this.contextMenuFromTouchHandler) {
      this.attachedTarget.removeEventListener(
        "contextmenu",
        this.contextMenuFromTouchHandler,
        true, // capture phase
      );
      this.contextMenuFromTouchHandler = null;
    }

    // Remove click cleanup handler
    if (this.clickCleanupHandler) {
      this.attachedTarget.removeEventListener(
        "click",
        this.clickCleanupHandler,
      );
      this.clickCleanupHandler = null;
    }

    // Remove pointer down cleanup handler
    if (this.pointerDownCleanupHandler) {
      this.attachedTarget.removeEventListener(
        "pointerdown",
        this.pointerDownCleanupHandler,
      );
      this.pointerDownCleanupHandler = null;
    }

    // Clear touch state
    this.clearTouchState();

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
    type: AnyclickType,
    options: {
      comment?: string;
      metadata?: Record<string, unknown>;
      screenshots?: ScreenshotData;
    } = {},
  ): AnyclickPayload {
    const payload = buildAnyclickPayload(element, type, {
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
   * Submit anyclick for an element
   */
  async submitAnyclick(
    element: Element,
    type: AnyclickType,
    options: {
      comment?: string;
      metadata?: Record<string, unknown>;
      screenshots?: ScreenshotData;
    } = {},
  ): Promise<AnyclickResult> {
    // Check rate limiting
    if (this.isRateLimited()) {
      const error = new Error(
        "Rate limited: please wait before submitting again",
      );
      return { success: false, error };
    }

    const payload = this.buildPayload(element, type, options);

    try {
      await this.adapter.submitAnyclick(payload);
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
   * Submit anyclick for the pending element (the one that was right-clicked)
   */
  async submitPendingAnyclick(
    type: AnyclickType,
    options: {
      comment?: string;
      metadata?: Record<string, unknown>;
      screenshots?: ScreenshotData;
    } = {},
  ): Promise<AnyclickResult> {
    if (!this.pendingElement) {
      return {
        success: false,
        error: new Error("No pending element to submit anyclick for"),
      };
    }

    const result = await this.submitAnyclick(
      this.pendingElement,
      type,
      options,
    );
    this.pendingElement = null;
    return result;
  }
}

/**
 * Create a new AnyclickClient instance
 */
export function createAnyclickClient(
  options: AnyclickClientOptions,
): AnyclickClient {
  return new AnyclickClient(options);
}
