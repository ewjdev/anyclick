import {
  type MenuCallbacks,
  closeMenu,
  isMenuVisible,
  showMenu,
} from "./contextMenu";
import {
  type ActionMetadata,
  type AncestorInfo,
  type CapturePayload,
  type ElementContext,
  type ExtensionMessage,
  PERF_LIMITS,
  type PageContext,
  type SettingsResponseMessage,
  createMessage,
} from "./types";

// ========== Caches ==========

/** Cache selectors to avoid repeated DOM walks */
const selectorCache = new WeakMap<Element, string>();

// ========== State ==========

/** Currently hovered/targeted element from context menu */
let targetElement: Element | null = null;

/** Element that was right-clicked (preserved for menu actions) */
let rightClickedElement: Element | null = null;

/** Whether to preserve highlight after menu closes (e.g., for inspect) */
let preserveHighlight = false;

/** Last recorded mouse position */
let lastMouseX = 0;
let lastMouseY = 0;

/** Debounce timer for mousemove */
let mouseMoveTimer: ReturnType<typeof setTimeout> | null = null;

/** Whether the custom context menu is enabled */
let customMenuEnabled = true;

// ========== Event Listeners ==========

/**
 * Track mouse position for element targeting (debounced)
 */
document.addEventListener(
  "mousemove",
  (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    // Debounce element detection
    if (mouseMoveTimer) clearTimeout(mouseMoveTimer);
    mouseMoveTimer = setTimeout(() => {
      targetElement = document.elementFromPoint(lastMouseX, lastMouseY);
    }, 16); // ~60fps
  },
  { passive: true },
);

/**
 * Intercept right-click and show custom context menu
 */
document.addEventListener(
  "contextmenu",
  (e) => {
    targetElement = e.target as Element;
    rightClickedElement = e.target as Element; // Preserve for menu actions
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    // Skip if extension context is invalidated (extension was reloaded)
    if (!isExtensionContextValid()) {
      console.warn(
        "[Anyclick Content] Extension context invalidated, allowing native menu",
      );
      return;
    }

    // Skip if custom menu is disabled or if already showing our menu
    if (!customMenuEnabled || isMenuVisible()) {
      return;
    }

    // Skip if target is our own menu element
    if ((e.target as Element).closest?.("[data-anyclick-menu]")) {
      return;
    }

    // Prevent native context menu
    e.preventDefault();
    e.stopPropagation();

    // Show custom menu
    showCustomMenu({ x: e.clientX, y: e.clientY });
  },
  { capture: true },
);

/**
 * Show custom context menu at position
 */
function showCustomMenu(position: { x: number; y: number }): void {
  const callbacks: MenuCallbacks = {
    onSelect: handleMenuSelect,
    onClose: handleMenuClose,
    onInspect: handleInspectElement,
  };

  showMenu(position, callbacks);

  // Highlight the target element
  if (targetElement) {
    applyHighlight(targetElement);
  }
}

/**
 * Handle menu item selection
 */
function handleMenuSelect(type: string, comment?: string): void {
  if (type === "capture") {
    // Direct capture
    handleCapture().catch(console.error);
  } else {
    // Feedback capture with type
    handleFeedbackCapture(type, comment).catch(console.error);
  }
  clearHighlight();
}

/**
 * Handle menu close
 */
function handleMenuClose(): void {
  if (!preserveHighlight) {
    clearHighlight();
  }
  preserveHighlight = false;
}

/**
 * Handle inspect element action - opens DevTools on the element
 */
function handleInspectElement(): void {
  // Use the preserved right-clicked element, not the current hover target
  const elementToInspect = rightClickedElement;

  console.log("[Anyclick Content] handleInspectElement called", {
    hasTargetElement: !!elementToInspect,
    targetTag: elementToInspect?.tagName,
  });

  if (!elementToInspect) {
    console.warn("[Anyclick Content] No target element for inspection");
    return;
  }

  // Build element context for DevTools panel
  const elementContext = buildElementContext(elementToInspect);
  console.log("[Anyclick Content] Built element context", {
    selector: elementContext.selector,
    tag: elementContext.tag,
    id: elementContext.id,
  });

  // Send to background for DevTools sync
  const message = createMessage({
    type: "INSPECT_ELEMENT" as const,
    element: elementContext,
    position: { x: lastMouseX, y: lastMouseY },
    openDevtools: true,
  });
  console.log(
    "[Anyclick Content] Sending INSPECT_ELEMENT message (open DevTools panel)",
    message,
  );

  // Preserve highlight after menu closes so user can see inspected element
  preserveHighlight = true;

  sendMessage(message)
    .then((response) => {
      console.log("[Anyclick Content] INSPECT_ELEMENT response", response);
      if ("panelConnected" in response && response.panelConnected === false) {
        const isMac = navigator.platform.toUpperCase().includes("MAC");
        const shortcut = isMac ? "⌘⌥I" : "F12";
        showToast(
          `Press ${shortcut} → open Anyclick panel to view selection`,
          "info",
        );
      }
    })
    .catch((error) => {
      console.error("[Anyclick Content] INSPECT_ELEMENT error", error);
    });
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; timestamp?: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    if (message.type === "CONTEXT_MENU_CLICKED") {
      handleCapture().catch(console.error);
      sendResponse({ received: true });
    } else if (message.type === "TOGGLE_CUSTOM_MENU") {
      customMenuEnabled = !customMenuEnabled;
      sendResponse({ enabled: customMenuEnabled });
    } else if (message.type === "GET_ELEMENT_AT_POINT") {
      // Used by DevTools panel to get element info
      const element = document.elementFromPoint(lastMouseX, lastMouseY);
      if (element) {
        sendResponse({ element: buildElementContext(element) });
      } else {
        sendResponse({ element: null });
      }
    } else if (message.type === "TRIGGER_REFRESH_ELEMENT") {
      // Triggered by Inspector window refresh button
      if (rightClickedElement) {
        const elementContext = buildElementContext(rightClickedElement);
        sendMessage(
          createMessage({
            type: "INSPECT_ELEMENT" as const,
            element: elementContext,
            position: { x: lastMouseX, y: lastMouseY },
          }),
        ).catch(console.error);
      }
      sendResponse({ received: true });
    } else if (message.type === "TRIGGER_CAPTURE_ELEMENT") {
      // Triggered by Inspector window capture button
      handleCapture().catch(console.error);
      sendResponse({ received: true });
    }
    return false;
  },
);

/**
 * Listen for DevTools panel custom events
 */
document.addEventListener("anyclick-refresh-element", () => {
  if (targetElement) {
    const elementContext = buildElementContext(targetElement);
    sendMessage(
      createMessage({
        type: "INSPECT_ELEMENT" as const,
        element: elementContext,
        position: { x: lastMouseX, y: lastMouseY },
      }),
    ).catch(console.error);
  }
});

document.addEventListener("anyclick-capture-element", () => {
  handleCapture().catch(console.error);
});

// ========== Highlight Functions ==========

let highlightOverlay: HTMLElement | null = null;

/**
 * Apply highlight overlay to target element
 */
function applyHighlight(element: Element): void {
  clearHighlight();

  const rect = element.getBoundingClientRect();
  highlightOverlay = document.createElement("div");
  highlightOverlay.setAttribute("data-anyclick-highlight", "true");
  highlightOverlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 2147483646;
    border: 2px solid #3b82f6;
    border-radius: 4px;
    background-color: rgba(59, 130, 246, 0.1);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
    transition: all 0.1s ease-out;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
  `;
  document.body.appendChild(highlightOverlay);
}

/**
 * Clear highlight overlay
 */
function clearHighlight(): void {
  if (highlightOverlay) {
    highlightOverlay.remove();
    highlightOverlay = null;
  }
}

/**
 * Clear highlight when clicking outside the highlighted element
 */
document.addEventListener(
  "click",
  (e) => {
    // Don't clear if clicking on our own UI elements
    if ((e.target as Element).closest?.("[data-anyclick-menu]")) return;
    if ((e.target as Element).closest?.("[data-anyclick-highlight]")) return;
    if ((e.target as Element).closest?.("[data-anyclick-toast]")) return;

    // Clear persistent highlight on any other click
    if (highlightOverlay) {
      clearHighlight();
    }
  },
  { capture: true },
);

// ========== Capture Flow ==========

/**
 * Main capture flow triggered by context menu
 */
async function handleCapture(): Promise<void> {
  try {
    // Get settings first to check if enabled
    const settings = await getSettings();
    if (!settings.enabled) {
      showToast("Anyclick is disabled", "info");
      return;
    }

    if (!settings.endpoint) {
      showToast("Configure endpoint in extension popup", "warning");
      return;
    }

    // Get target element
    const element =
      targetElement || document.elementFromPoint(lastMouseX, lastMouseY);
    if (!element) {
      showToast("No element to capture", "error");
      return;
    }

    const captureStart = performance.now();
    const elementContext = buildElementContext(element);
    const pageContext = buildPageContext();
    const actionMetadata = buildActionMetadata();
    const captureTimeMs = Math.round(performance.now() - captureStart);

    const payload: CapturePayload = {
      type: "extension-capture",
      element: elementContext,
      page: pageContext,
      action: actionMetadata,
      metadata: {
        captureTimeMs,
        extensionVersion: "0.1.0",
      },
    };

    const queueStart = performance.now();
    await queuePayload(payload);
    const queueTimeMs = Math.round(performance.now() - queueStart);

    // Log lightweight perf metrics in dev
    console.debug("[Anyclick] capture queued", {
      captureTimeMs,
      queueTimeMs,
    });

    showToast("Captured! Sending in background", "success");
  } catch (error) {
    console.error("[Anyclick Content] Capture error:", error);
    showToast(
      error instanceof Error ? error.message : "Capture failed",
      "error",
    );
  }
}

/**
 * Handle feedback capture with type and optional comment
 */
async function handleFeedbackCapture(
  feedbackType: string,
  comment?: string,
): Promise<void> {
  try {
    const settings = await getSettings();
    if (!settings.enabled) {
      showToast("Anyclick is disabled", "info");
      return;
    }

    if (!settings.endpoint) {
      showToast("Configure endpoint in extension popup", "warning");
      return;
    }

    const element =
      targetElement || document.elementFromPoint(lastMouseX, lastMouseY);
    if (!element) {
      showToast("No element to capture", "error");
      return;
    }

    const captureStart = performance.now();
    const elementContext = buildElementContext(element);
    const pageContext = buildPageContext();
    const actionMetadata = buildActionMetadata();
    const captureTimeMs = Math.round(performance.now() - captureStart);

    const payload: CapturePayload = {
      type: "extension-capture",
      element: elementContext,
      page: pageContext,
      action: actionMetadata,
      metadata: {
        captureTimeMs,
        extensionVersion: "0.1.0",
        feedbackType,
        comment,
      },
    };

    const queueStart = performance.now();
    await queuePayload(payload);
    const queueTimeMs = Math.round(performance.now() - queueStart);

    console.debug("[Anyclick] feedback queued", {
      feedbackType,
      captureTimeMs,
      queueTimeMs,
    });

    showToast(`Feedback sent: ${feedbackType}`, "success");
  } catch (error) {
    console.error("[Anyclick Content] Feedback capture error:", error);
    showToast(
      error instanceof Error ? error.message : "Capture failed",
      "error",
    );
  }
}

// ========== DOM Capture ==========

/**
 * Build element context with lean limits
 */
function buildElementContext(element: Element): ElementContext {
  const rect = element.getBoundingClientRect();
  const outerHTML = element.outerHTML;
  const outerHTMLBytes = byteLength(outerHTML);

  return {
    selector: getUniqueSelector(element),
    tag: element.tagName.toLowerCase(),
    id: element.id || undefined,
    classes: Array.from(element.classList),
    innerText: truncate(
      element instanceof HTMLElement
        ? element.innerText
        : element.textContent || "",
      PERF_LIMITS.MAX_INNER_TEXT,
    ),
    outerHTML:
      outerHTMLBytes > PERF_LIMITS.MAX_OUTER_HTML_BYTES
        ? ""
        : truncate(outerHTML, PERF_LIMITS.MAX_OUTER_HTML),
    boundingRect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    dataAttributes: getDataAttributes(element),
    ancestors: getAncestors(element, PERF_LIMITS.MAX_ANCESTORS),
  };
}

/**
 * Build page context
 */
function buildPageContext(): PageContext {
  return {
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build action metadata from last interaction
 */
function buildActionMetadata(): ActionMetadata {
  return {
    actionType: "contextmenu",
    clientX: lastMouseX,
    clientY: lastMouseY,
    pageX: lastMouseX + window.scrollX,
    pageY: lastMouseY + window.scrollY,
    modifiers: {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    },
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate unique CSS selector for element
 */
function getUniqueSelector(element: Element): string {
  const cached = selectorCache.get(element);
  if (cached) return cached;

  if (element.id) {
    const selector = `#${CSS.escape(element.id)}`;
    selectorCache.set(element, selector);
    return selector;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      path.unshift(selector);
      break;
    }

    // Add first 2 classes for readability
    const classes = Array.from(current.classList).slice(0, 2);
    if (classes.length > 0) {
      selector += classes.map((c) => `.${CSS.escape(c)}`).join("");
    }

    // Add nth-of-type if needed to disambiguate
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  const selector = path.join(" > ");
  selectorCache.set(element, selector);
  return selector;
}

/**
 * Get ancestors up to limit
 */
function getAncestors(element: Element, maxDepth: number): AncestorInfo[] {
  const ancestors: AncestorInfo[] = [];
  let current = element.parentElement;
  let depth = 0;

  while (current && current !== document.body && depth < maxDepth) {
    ancestors.push({
      tag: current.tagName.toLowerCase(),
      id: current.id || undefined,
      classes: Array.from(current.classList),
      selector: getUniqueSelector(current),
    });
    current = current.parentElement;
    depth++;
  }

  return ancestors;
}

/**
 * Get data-* attributes from element
 */
function getDataAttributes(element: Element): Record<string, string> {
  const data: Record<string, string> = {};

  if (element instanceof HTMLElement) {
    for (const [key, value] of Object.entries(element.dataset)) {
      if (value !== undefined) {
        data[key] = value;
      }
    }
  }

  return data;
}

/**
 * Truncate string to max length
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

/**
 * Approximate byte length for outerHTML trimming
 */
function byteLength(str: string): number {
  return new Blob([str]).size;
}

// ========== Messaging ==========

/**
 * Get settings from background
 */
async function getSettings(): Promise<{
  enabled: boolean;
  endpoint: string;
  token: string;
}> {
  const response = (await sendMessage(
    createMessage({ type: "GET_SETTINGS" as const }),
  )) as SettingsResponseMessage;
  return response.settings;
}

/**
 * Queue payload via background for async processing
 */
async function queuePayload(payload: CapturePayload): Promise<void> {
  const response = await sendMessage(
    createMessage({ type: "QUEUE_ADD" as const, payload }),
  );

  if (
    "success" in response &&
    response.success === false &&
    "error" in response
  ) {
    throw new Error(response.error || "Failed to queue payload");
  }
}

/**
 * Check if extension context is still valid
 */
function isExtensionContextValid(): boolean {
  try {
    // This will throw if context is invalidated
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

/**
 * Send message to background script and await response
 */
function sendMessage(
  message: Record<string, unknown>,
): Promise<ExtensionMessage> {
  return new Promise((resolve, reject) => {
    // Check if context is still valid before sending
    if (!isExtensionContextValid()) {
      const error = new Error(
        "Extension was reloaded. Please refresh this page.",
      );
      console.warn("[Anyclick Content] Extension context invalidated");
      showToast("Extension reloaded - please refresh the page", "warning");
      reject(error);
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response: ExtensionMessage) => {
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message || "Unknown error";
          console.error("[Anyclick Content] sendMessage error:", errorMsg);

          // Check for context invalidation
          if (errorMsg.includes("Extension context invalidated")) {
            showToast(
              "Extension reloaded - please refresh the page",
              "warning",
            );
          }

          reject(new Error(errorMsg));
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      console.error("[Anyclick Content] sendMessage exception:", error);
      if (
        error instanceof Error &&
        error.message.includes("Extension context invalidated")
      ) {
        showToast("Extension reloaded - please refresh the page", "warning");
      }
      reject(error);
    }
  });
}

// ========== Toast Notifications ==========

/** Toast element reference */
let toastElement: HTMLElement | null = null;
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Show a small toast notification
 */
function showToast(
  message: string,
  type: "success" | "error" | "warning" | "info" = "info",
): void {
  // Remove existing toast
  if (toastElement) {
    toastElement.remove();
    toastElement = null;
  }
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Create toast element
  toastElement = document.createElement("div");
  toastElement.setAttribute("data-anyclick-toast", "true");

  const colors: Record<typeof type, { bg: string; border: string }> = {
    success: { bg: "#10b981", border: "#059669" },
    error: { bg: "#ef4444", border: "#dc2626" },
    warning: { bg: "#f59e0b", border: "#d97706" },
    info: { bg: "#3b82f6", border: "#2563eb" },
  };

  const { bg, border } = colors[type];

  toastElement.style.cssText = `
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    background: ${bg} !important;
    border: 1px solid ${border} !important;
    color: white !important;
    padding: 10px 16px !important;
    border-radius: 6px !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
    opacity: 0 !important;
    transform: translateY(10px) !important;
    transition: opacity 0.2s, transform 0.2s !important;
  `;

  toastElement.textContent = message;
  document.body.appendChild(toastElement);

  // Trigger animation
  requestAnimationFrame(() => {
    if (toastElement) {
      toastElement.style.opacity = "1";
      toastElement.style.transform = "translateY(0)";
    }
  });

  // Auto-hide after delay
  toastTimeout = setTimeout(() => {
    if (toastElement) {
      toastElement.style.opacity = "0";
      toastElement.style.transform = "translateY(10px)";
      setTimeout(() => {
        toastElement?.remove();
        toastElement = null;
      }, 200);
    }
  }, 2500);
}
