import {
  type MenuCallbacks,
  buildMenuItems,
  closeMenu,
  isMenuVisible,
  showMenu,
} from "./contextMenu";
import { mountOverlay, unmountOverlay } from "./overlay";
import {
  type ActionMetadata,
  type AncestorInfo,
  type CapturePayload,
  DEFAULTS,
  DEFAULT_T3CHAT_SYSTEM_PROMPT,
  type ElementContext,
  type ExtensionMessage,
  PERF_LIMITS,
  type PageContext,
  STORAGE_KEYS,
  type ScreenshotResponseMessage,
  type SettingsResponseMessage,
  type T3ChatRefinementContext,
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
let customMenuEnabled = DEFAULTS.CUSTOM_MENU_OVERRIDE;

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

    // Check if clicking on the overlay icon (shadow host)
    const targetEl = e.target as Element;
    if (
      targetEl.id === "anyclick-react-shadow-host" ||
      targetEl.closest?.("#anyclick-react-shadow-host")
    ) {
      // Prevent native and custom context menu on overlay icon
      e.preventDefault();
      e.stopPropagation();

      // Toggle Anyclick off if it's currently on
      if (customMenuEnabled) {
        chrome.storage.local.set(
          {
            [STORAGE_KEYS.ENABLED]: false,
            [STORAGE_KEYS.CUSTOM_MENU_OVERRIDE]: false,
          },
          () => {
            console.log(
              "[Anyclick Content] Extension disabled via overlay right-click",
            );
            showToast("Anyclick disabled", "info");
          },
        );
      }
      return;
    }

    // Skip if extension context is invalidated (extension was reloaded)
    if (!isExtensionContextValid()) {
      console.warn(
        "[Anyclick Content] Extension context invalidated, allowing native menu",
      );
      return;
    }

    // Skip if extension is disabled, custom menu is disabled, or if already showing our menu
    // Check both main enabled toggle and custom menu override setting
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
    showCustomMenu({ x: e.clientX, y: e.clientY }).catch(console.error);
  },
  { capture: true },
);

// Autofill t3.chat input when opened with ?q=... (fallback when site doesn't auto-handle)
initT3ChatAutofill();

/**
 * Show custom context menu at position
 */
async function showCustomMenu(position: {
  x: number;
  y: number;
}): Promise<void> {
  const callbacks: MenuCallbacks = {
    onSelect: handleMenuSelect,
    onClose: handleMenuClose,
    onInspect: handleInspectElement,
  };

  // Load integration settings from storage
  const settings = await new Promise<{
    t3chatEnabled: boolean;
    uploadthingEnabled: boolean;
  }>((resolve) => {
    chrome.storage.local.get(
      [STORAGE_KEYS.T3CHAT_ENABLED, STORAGE_KEYS.UPLOADTHING_ENABLED],
      (result) => {
        resolve({
          t3chatEnabled:
            result[STORAGE_KEYS.T3CHAT_ENABLED] ?? DEFAULTS.T3CHAT_ENABLED,
          uploadthingEnabled:
            result[STORAGE_KEYS.UPLOADTHING_ENABLED] ??
            DEFAULTS.UPLOADTHING_ENABLED,
        });
      },
    );
  });

  // Build dynamic menu items based on context
  const hasTextSelection = !!window.getSelection()?.toString().trim();
  const isImageTarget =
    targetElement instanceof HTMLImageElement ||
    targetElement?.tagName?.toLowerCase() === "img";

  const menuItems = buildMenuItems({
    hasTextSelection,
    isImageTarget,
    t3chatEnabled: settings.t3chatEnabled,
    uploadthingEnabled: settings.uploadthingEnabled,
  });

  showMenu(position, callbacks, menuItems);

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
  } else if (type === "t3chat") {
    // Send selected text to t3.chat (with optional refinement)
    handleSendToT3Chat().catch(console.error);
  } else if (type === "upload-image") {
    // Upload image to UploadThing
    handleUploadImageFromTarget();
  } else {
    // Feedback capture with type
    handleFeedbackCapture(type, comment).catch(console.error);
  }
  clearHighlight();
}

/**
 * Send selected text to t3.chat
 * If auto-refine is enabled, first refines the prompt using gpt-5-mini
 */
async function handleSendToT3Chat(): Promise<void> {
  console.log("[Anyclick Content] handleSendToT3Chat called");

  const selectedText = window.getSelection()?.toString().trim() ?? "";
  console.log("[Anyclick Content] Selected text:", {
    length: selectedText.length,
    preview: selectedText.slice(0, 100),
  });

  if (!selectedText) {
    showToast("No text selected", "warning");
    return;
  }

  // Get settings from storage
  console.log("[Anyclick Content] Loading settings from storage...");
  const settings = await new Promise<{
    baseUrl: string;
    autoRefine: boolean;
    systemPrompt: string;
    refineEndpoint: string;
  }>((resolve) => {
    chrome.storage.local.get(
      [
        STORAGE_KEYS.T3CHAT_BASE_URL,
        STORAGE_KEYS.T3CHAT_AUTO_REFINE,
        STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT,
        STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT,
      ],
      (result) => {
        console.log("[Anyclick Content] Storage result:", result);
        resolve({
          baseUrl:
            result[STORAGE_KEYS.T3CHAT_BASE_URL] || DEFAULTS.T3CHAT_BASE_URL,
          autoRefine:
            result[STORAGE_KEYS.T3CHAT_AUTO_REFINE] ??
            DEFAULTS.T3CHAT_AUTO_REFINE,
          systemPrompt:
            result[STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT] ||
            DEFAULT_T3CHAT_SYSTEM_PROMPT,
          refineEndpoint:
            result[STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT] ||
            DEFAULTS.T3CHAT_REFINE_ENDPOINT,
        });
      },
    );
  });

  console.log("[Anyclick Content] Settings loaded:", {
    baseUrl: settings.baseUrl,
    autoRefine: settings.autoRefine,
    hasSystemPrompt: !!settings.systemPrompt,
    refineEndpoint: settings.refineEndpoint,
  });

  let finalPrompt = selectedText;

  // If auto-refine is enabled, refine the prompt
  if (settings.autoRefine) {
    console.log(
      "[Anyclick Content] Auto-refine is enabled, starting refinement...",
    );
    showToast("Refining prompt...", "info");

    try {
      finalPrompt = await refinePromptForT3Chat(
        selectedText,
        settings.systemPrompt,
        settings.refineEndpoint,
      );
      console.log("[Anyclick Content] Refinement successful:", {
        originalLength: selectedText.length,
        refinedLength: finalPrompt.length,
      });
      showToast("Prompt refined!", "success");
    } catch (error) {
      console.error("[Anyclick Content] Prompt refinement failed:", error);
      showToast("Refinement failed, using original text", "warning");
      // Fallback to original text
      finalPrompt = selectedText;
    }
  } else {
    console.log(
      "[Anyclick Content] Auto-refine is disabled, using original text",
    );
  }

  // Open t3.chat with the (possibly refined) prompt
  const url = `${settings.baseUrl}/?q=${encodeURIComponent(finalPrompt)}`;
  console.log("[Anyclick Content] Opening t3.chat with URL:", url);
  window.open(url, "_blank");
}

/**
 * Refine prompt using the API before sending to t3.chat
 * Routes through background script to bypass CORS restrictions
 */
async function refinePromptForT3Chat(
  selectedText: string,
  systemPrompt: string,
  refineEndpoint: string,
): Promise<string> {
  // Build context from the right-clicked element
  const context = buildT3ChatContext(selectedText, rightClickedElement);
  const contextString = formatT3ChatContextString(context);

  console.log("[Anyclick Content] Sending REFINE_PROMPT to background:", {
    selectedTextLength: selectedText.length,
    contextLength: contextString.length,
    hasSystemPrompt: !!systemPrompt,
    refineEndpoint,
  });

  // Send message to background script to make the API call
  // Background script has permission to make cross-origin requests
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "REFINE_PROMPT",
        selectedText,
        context: contextString,
        systemPrompt,
        refineEndpoint,
        timestamp: new Date().toISOString(),
      },
      (response) => {
        console.log("[Anyclick Content] REFINE_PROMPT response received:", {
          hasResponse: !!response,
          lastError: chrome.runtime.lastError?.message,
          response,
        });

        if (chrome.runtime.lastError) {
          console.error(
            "[Anyclick Content] Chrome runtime error:",
            chrome.runtime.lastError,
          );
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          console.error("[Anyclick Content] No response from background");
          reject(new Error("No response from background script"));
          return;
        }

        if (!response.success) {
          console.error(
            "[Anyclick Content] Refinement failed:",
            response.error,
          );
          reject(new Error(response.error || "Refinement failed"));
          return;
        }

        // Extract refined prompt from the response payload
        const refinedPrompt = response.payload?.refinedPrompt;
        console.log("[Anyclick Content] Refinement result:", {
          hasPayload: !!response.payload,
          hasRefinedPrompt: !!refinedPrompt,
          refinedPromptLength: refinedPrompt?.length,
        });

        if (!refinedPrompt) {
          reject(new Error("No refined prompt in response"));
          return;
        }

        resolve(refinedPrompt);
      },
    );
  });
}

/**
 * Upload targeted image to UploadThing
 */
function handleUploadImageFromTarget(): void {
  console.log("[Anyclick Upload] handleUploadImageFromTarget called", {
    hasRightClickedElement: !!rightClickedElement,
    elementTag: rightClickedElement?.tagName,
  });

  if (!rightClickedElement) {
    console.warn("[Anyclick Upload] No right-clicked element found");
    showToast("No image selected", "error");
    return;
  }

  // Try multiple ways to get image source
  let imgSrc: string | null = null;

  if (rightClickedElement instanceof HTMLImageElement) {
    imgSrc = rightClickedElement.src;
    console.log("[Anyclick Upload] Got src from HTMLImageElement:", imgSrc);
  } else {
    imgSrc = rightClickedElement.getAttribute("src");
    console.log("[Anyclick Upload] Got src from getAttribute:", imgSrc);
  }

  // Also try data-src for lazy-loaded images
  if (!imgSrc) {
    imgSrc = rightClickedElement.getAttribute("data-src");
    console.log("[Anyclick Upload] Trying data-src:", imgSrc);
  }

  // Try srcset
  if (!imgSrc && rightClickedElement instanceof HTMLImageElement) {
    const srcset = rightClickedElement.srcset;
    if (srcset) {
      // Get the first URL from srcset
      const firstSrc = srcset.split(",")[0]?.trim().split(" ")[0];
      imgSrc = firstSrc || null;
      console.log("[Anyclick Upload] Got src from srcset:", imgSrc);
    }
  }

  // Try background image
  if (!imgSrc) {
    const computedStyle = window.getComputedStyle(rightClickedElement);
    const bgImage = computedStyle.backgroundImage;
    if (bgImage && bgImage !== "none") {
      const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (match) {
        imgSrc = match[1];
        console.log("[Anyclick Upload] Got src from background-image:", imgSrc);
      }
    }
  }

  if (!imgSrc) {
    console.error(
      "[Anyclick Upload] Could not extract image source from element",
      {
        element: rightClickedElement,
        tagName: rightClickedElement.tagName,
        attributes: Array.from(rightClickedElement.attributes).map(
          (a) => `${a.name}=${a.value}`,
        ),
      },
    );
    showToast("Could not get image source", "error");
    return;
  }

  console.log("[Anyclick Upload] Image source found:", {
    src: imgSrc,
    isDataUrl: imgSrc.startsWith("data:"),
    isBlobUrl: imgSrc.startsWith("blob:"),
    isRelative:
      !imgSrc.startsWith("http") &&
      !imgSrc.startsWith("data:") &&
      !imgSrc.startsWith("blob:"),
  });

  // Convert relative URLs to absolute
  if (
    !imgSrc.startsWith("http") &&
    !imgSrc.startsWith("data:") &&
    !imgSrc.startsWith("blob:")
  ) {
    const absoluteUrl = new URL(imgSrc, window.location.href).href;
    console.log(
      "[Anyclick Upload] Converted relative URL to absolute:",
      absoluteUrl,
    );
    imgSrc = absoluteUrl;
  }

  // Get upload settings and upload
  chrome.storage.local.get(
    ["anyclick_uploadthing_endpoint", "anyclick_uploadthing_api_key"],
    (result) => {
      console.log("[Anyclick Upload] Storage settings retrieved:", {
        hasEndpoint: !!result.anyclick_uploadthing_endpoint,
        endpoint: result.anyclick_uploadthing_endpoint,
        hasApiKey: !!result.anyclick_uploadthing_api_key,
      });

      handleUploadImage(
        imgSrc!,
        result.anyclick_uploadthing_endpoint,
        result.anyclick_uploadthing_api_key,
      ).catch((error) => {
        console.error("[Anyclick Upload] handleUploadImage threw:", error);
      });
    },
  );
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
    message: {
      type: string;
      timestamp?: string;
      payload?: unknown;
      enabled?: boolean;
    },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    if (message.type === "CONTEXT_MENU_CLICKED") {
      handleCapture().catch(console.error);
      sendResponse({ received: true });
    } else if (message.type === "TOGGLE_CUSTOM_MENU") {
      // Load from storage - check both main enabled and custom menu override
      chrome.storage.local.get(
        [STORAGE_KEYS.ENABLED, STORAGE_KEYS.CUSTOM_MENU_OVERRIDE],
        (result) => {
          const extensionEnabled =
            result[STORAGE_KEYS.ENABLED] ?? DEFAULTS.ENABLED;
          const menuOverride =
            result[STORAGE_KEYS.CUSTOM_MENU_OVERRIDE] ??
            DEFAULTS.CUSTOM_MENU_OVERRIDE;
          // Both must be true for context menu override to work
          customMenuEnabled = extensionEnabled && menuOverride;
          sendResponse({ enabled: customMenuEnabled });
        },
      );
      return true; // Async response
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
    } else if (message.type === "UPLOAD_IMAGE") {
      // Handle UploadThing image upload
      const payload = message.payload as {
        src: string;
        endpoint?: string;
        apiKey?: string;
      };
      handleUploadImage(payload.src, payload.endpoint, payload.apiKey)
        .then((result) => sendResponse(result))
        .catch((error) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
          });
        });
      return true; // Async response
    } else if (message.type === "PING") {
      // Simple liveness check so popup can show refresh CTA if needed.
      sendResponse({ ok: true });
      return true;
    } else if (message.type === "SET_ENABLED_STATE") {
      // Update enabled state immediately on the current tab (no refresh)
      chrome.storage.local.get(
        [STORAGE_KEYS.CUSTOM_MENU_OVERRIDE],
        (result) => {
          const menuOverride =
            result[STORAGE_KEYS.CUSTOM_MENU_OVERRIDE] ??
            DEFAULTS.CUSTOM_MENU_OVERRIDE;
          customMenuEnabled = Boolean(message.enabled) && menuOverride;
          syncOverlayMount();
          sendResponse({ enabled: customMenuEnabled });
        },
      );
      return true;
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

// ========== UploadThing Integration ==========

/**
 * Upload an image from URL to UploadThing
 * Strategy:
 * 1. For data URLs - send as dataUrl to server
 * 2. For same-origin URLs - try to fetch as blob, send as file
 * 3. For cross-origin URLs - send URL to server, let server fetch it
 */
async function handleUploadImage(
  src: string,
  endpoint?: string,
  apiKey?: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const filenameFor = (ext?: string) => buildUploadFilename(src, ext);
  const domainLabel = getDomainLabel(src);

  console.log("[Anyclick Upload] handleUploadImage called:", {
    src: src.substring(0, 100) + (src.length > 100 ? "..." : ""),
    endpoint,
    hasApiKey: !!apiKey,
    domainLabel,
  });

  if (!endpoint) {
    console.warn("[Anyclick Upload] No endpoint configured");
    showToast(
      "No upload endpoint configured. Set it in extension settings.",
      "warning",
    );
    return { success: false, error: "No upload endpoint configured" };
  }

  try {
    showToast("Uploading image...", "info");

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["x-uploadthing-api-key"] = apiKey;
    }

    let formData: FormData;

    // Handle data URLs - send as dataUrl to server
    if (src.startsWith("data:")) {
      console.log("[Anyclick Upload] Sending data URL to server...");
      formData = new FormData();
      formData.append("dataUrl", src);
      formData.append("filename", filenameFor("png"));
    }
    // Handle blob URLs - need to fetch and send as file (same-origin only)
    else if (src.startsWith("blob:")) {
      console.log("[Anyclick Upload] Fetching blob URL...");
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const filename = filenameFor("png");
        formData = new FormData();
        formData.append("file", blob, filename);
        console.log("[Anyclick Upload] Got blob:", {
          size: blob.size,
          type: blob.type,
        });
      } catch (error) {
        console.error("[Anyclick Upload] Failed to fetch blob URL:", error);
        throw new Error("Failed to access blob URL");
      }
    }
    // Handle regular URLs - check if same-origin, otherwise send URL to server
    else {
      const srcUrl = new URL(src);
      const currentUrl = new URL(window.location.href);
      const isSameOrigin = srcUrl.origin === currentUrl.origin;

      console.log("[Anyclick Upload] URL analysis:", {
        srcOrigin: srcUrl.origin,
        currentOrigin: currentUrl.origin,
        isSameOrigin,
      });

      if (isSameOrigin) {
        // Same origin - we can fetch it directly
        console.log("[Anyclick Upload] Same-origin URL, fetching directly...");
        try {
          const response = await fetch(src);
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
          }
          const blob = await response.blob();
          const filename = filenameFor("png");
          formData = new FormData();
          formData.append("file", blob, filename);
          console.log("[Anyclick Upload] Fetched same-origin image:", {
            size: blob.size,
            type: blob.type,
          });
        } catch (error) {
          console.error("[Anyclick Upload] Same-origin fetch failed:", error);
          // Fall back to sending URL to server
          console.log("[Anyclick Upload] Falling back to server-side fetch...");
          formData = new FormData();
          formData.append("url", src);
          formData.append("filename", filenameFor("png"));
        }
      } else {
        // Cross-origin - first try to fetch with extension permissions/cookies,
        // then fall back to server-side fetch if blocked.
        console.log(
          "[Anyclick Upload] Cross-origin URL, trying client fetch with credentials...",
        );
        try {
          const response = await fetch(src, {
            credentials: "include",
            mode: "cors",
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch cross-origin: ${response.status}`);
          }
          const blob = await response.blob();
          const filename = filenameFor("png");
          formData = new FormData();
          formData.append("file", blob, filename);
          console.log(
            "[Anyclick Upload] Cross-origin fetch succeeded via extension:",
            {
              size: blob.size,
              type: blob.type,
            },
          );
        } catch (error) {
          console.warn(
            "[Anyclick Upload] Cross-origin fetch blocked, falling back to server fetch",
            error,
          );
          // Try screenshot fallback via background capture to avoid CORS
          const screenshot = await requestScreenshot();
          const crop = getCurrentElementCrop();

          if (screenshot.success && screenshot.dataUrl) {
            const dataUrlForUpload = crop
              ? await cropDataUrl(
                  screenshot.dataUrl,
                  crop,
                  screenshot.width,
                  screenshot.height,
                )
              : screenshot.dataUrl;

            formData = new FormData();
            formData.append("dataUrl", dataUrlForUpload);
            formData.append("filename", filenameFor("png"));
            console.log(
              "[Anyclick Upload] Using screenshot fallback for upload",
              {
                width: screenshot.width,
                height: screenshot.height,
                sizeBytes: screenshot.sizeBytes,
                cropped: !!crop,
              },
            );
          } else {
            // Last resort: let the server attempt to fetch (may 403)
            formData = new FormData();
            formData.append("url", src);
            formData.append("filename", filenameFor("png"));
            console.warn(
              "[Anyclick Upload] Screenshot fallback unavailable, using server fetch",
              screenshot.error,
            );
          }
        }
      }
    }

    // Upload to endpoint
    console.log("[Anyclick Upload] Sending to endpoint:", endpoint);
    const uploadResponse = await fetch(endpoint, {
      method: "POST",
      headers,
      body: formData,
    });

    console.log("[Anyclick Upload] Upload response:", {
      ok: uploadResponse.ok,
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("[Anyclick Upload] Upload failed:", {
        status: uploadResponse.status,
        body: errorText,
      });
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const result = await uploadResponse.json();
    console.log("[Anyclick Upload] Upload result:", result);

    // Copy URL to clipboard
    if (result.url) {
      try {
        await navigator.clipboard.writeText(result.url);
        console.log("[Anyclick Upload] URL copied to clipboard:", result.url);
        showToast("Image uploaded! URL copied to clipboard.", "success");
      } catch (clipboardError) {
        console.warn(
          "[Anyclick Upload] Failed to copy to clipboard:",
          clipboardError,
        );
        showToast("Image uploaded! URL: " + result.url, "success");
      }
    } else if (result.success) {
      showToast("Image uploaded successfully!", "success");
    } else {
      console.warn("[Anyclick Upload] Upload response missing URL:", result);
      showToast("Image uploaded but no URL returned", "warning");
    }

    return { success: true, url: result.url };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Upload failed";
    console.error("[Anyclick Upload] Error:", {
      message: errorMsg,
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    showToast(errorMsg, "error");
    return { success: false, error: errorMsg };
  }
}

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
      showToast(
        "No action taken. Configure endpoint in extension popup",
        "warning",
      );
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
      showToast(
        "No action taken. Configure endpoint in extension popup",
        "warning",
      );
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
 * Build context for t3.chat prompt refinement
 * Returns a formatted string with selected text, element, and page context
 */
function buildT3ChatContext(
  selectedText: string,
  element: Element | null,
): T3ChatRefinementContext {
  const context: T3ChatRefinementContext = {
    selectedText,
    page: {
      url: window.location.href,
      title: document.title,
    },
  };

  if (element) {
    context.element = {
      tag: element.tagName.toLowerCase(),
      selector: getUniqueSelector(element),
      innerText: truncate(
        element instanceof HTMLElement
          ? element.innerText
          : element.textContent || "",
        100,
      ),
      classes: Array.from(element.classList).slice(0, 5),
    };
  }

  return context;
}

/**
 * Format T3Chat context as a string for the API
 */
function formatT3ChatContextString(context: T3ChatRefinementContext): string {
  const parts: string[] = [];

  parts.push(`Page: ${context.page.title}`);
  parts.push(`URL: ${context.page.url}`);

  if (context.element) {
    parts.push(`Element: <${context.element.tag}>`);
    if (context.element.selector) {
      parts.push(`Selector: ${context.element.selector}`);
    }
    if (context.element.classes && context.element.classes.length > 0) {
      parts.push(`Classes: ${context.element.classes.join(", ")}`);
    }
    if (context.element.innerText) {
      parts.push(`Element text: ${context.element.innerText}`);
    }
  }

  return parts.join("\n");
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
 * Request a screenshot from the background script
 */
async function requestScreenshot(): Promise<ScreenshotResponseMessage> {
  try {
    const response = (await sendMessage(
      createMessage({ type: "SCREENSHOT_REQUEST" as const }),
    )) as ScreenshotResponseMessage;
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Screenshot failed";
    console.error(
      "[Anyclick Upload] Screenshot request error:",
      message,
      error,
    );
    return {
      type: "SCREENSHOT_RESPONSE",
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get current element crop (page coords + dpr) for screenshot cropping
 */
function getCurrentElementCrop(): {
  x: number;
  y: number;
  width: number;
  height: number;
  dpr: number;
} | null {
  const el = rightClickedElement || targetElement;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  return {
    x: rect.x + window.scrollX,
    y: rect.y + window.scrollY,
    width: rect.width,
    height: rect.height,
    dpr,
  };
}

/**
 * Crop a screenshot data URL to the provided element rectangle.
 */
async function cropDataUrl(
  dataUrl: string,
  crop: { x: number; y: number; width: number; height: number; dpr: number },
  reportedWidth?: number,
  reportedHeight?: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Determine scale between reported width/height and actual image pixels
        const scaleX =
          reportedWidth && reportedWidth > 0 ? img.width / reportedWidth : 1;
        const scaleY =
          reportedHeight && reportedHeight > 0
            ? img.height / reportedHeight
            : 1;

        const sx = crop.x * scaleX;
        const sy = crop.y * scaleY;
        const sw = crop.width * scaleX;
        const sh = crop.height * scaleY;

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(sw));
        canvas.height = Math.max(1, Math.round(sh));

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = (error) => reject(error);
    img.src = dataUrl;
  });
}

/**
 * Derive a domain label from the source URL (second-level if available).
 */
function getDomainLabel(src: string): string {
  const fallback = window.location.hostname || "unknown";
  const host = (() => {
    try {
      return new URL(src).hostname || fallback;
    } catch {
      return fallback;
    }
  })();
  const parts = host.split(".").filter(Boolean);
  const label =
    parts.length >= 2 ? parts[parts.length - 2] : parts[0] || "unknown";
  return label.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
}

/**
 * Build upload filename: <domain>-<timestamp>.ext
 */
function buildUploadFilename(src: string, ext = "png"): string {
  const domain = getDomainLabel(src);
  const timestamp = new Date().toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  return `${domain}-${timestamp}.${ext}`;
}

/**
 * Autofill t3.chat input from ?q=... and trigger send (Enter) as a fallback
 * when the site does not auto-handle the query parameter.
 */
function initT3ChatAutofill(): void {
  if (!window.location.hostname.includes("t3.chat")) return;

  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");
  if (!query) return;

  const selectors = [
    "#chat-input",
    'textarea[name="input"]',
    'textarea[aria-label="Message input"]',
    'textarea[placeholder="Type your message here..."]',
  ];

  const tryFill = () => {
    for (const sel of selectors) {
      const el = document.querySelector(sel) as HTMLTextAreaElement | null;
      if (el) {
        fillT3ChatInput(el, query);
        return true;
      }
    }
    return false;
  };

  let attempts = 0;
  const maxAttempts = 30; // ~9s if 300ms interval
  const intervalId = window.setInterval(() => {
    attempts += 1;
    if (tryFill() || attempts >= maxAttempts) {
      clearInterval(intervalId);
    }
  }, 300);

  // Also attempt once after DOM is ready
  if (document.readyState !== "complete") {
    window.addEventListener(
      "DOMContentLoaded",
      () => {
        tryFill();
      },
      { once: true },
    );
  } else {
    tryFill();
  }
}

function fillT3ChatInput(input: HTMLTextAreaElement, text: string): void {
  input.focus();
  input.value = text;
  input.dispatchEvent(
    new InputEvent("input", { bubbles: true, cancelable: true }),
  );

  // Simulate Enter key to submit
  const enterEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  input.dispatchEvent(enterEvent);

  const enterUp = new KeyboardEvent("keyup", {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  input.dispatchEvent(enterUp);
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
    right: 100px !important; // space for overlay icon
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
  }, 4000);
}

// ========== Initialization ==========

/**
 * Load custom menu override setting from storage
 * Context menu override only works if BOTH main extension enabled AND custom menu override are true
 */
function loadCustomMenuSetting(): void {
  chrome.storage.local.get(
    [STORAGE_KEYS.ENABLED, STORAGE_KEYS.CUSTOM_MENU_OVERRIDE],
    (result) => {
      const extensionEnabled = result[STORAGE_KEYS.ENABLED] ?? DEFAULTS.ENABLED;
      const menuOverride =
        result[STORAGE_KEYS.CUSTOM_MENU_OVERRIDE] ??
        DEFAULTS.CUSTOM_MENU_OVERRIDE;
      // Both must be true for context menu override to work
      customMenuEnabled = extensionEnabled && menuOverride;
      syncOverlayMount();
    },
  );
}

/**
 * Listen for storage changes to update customMenuEnabled in real-time
 * Context menu override only works if BOTH main extension enabled AND custom menu override are true
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  // Update if either the main enabled toggle or custom menu override changed
  if (
    changes[STORAGE_KEYS.ENABLED] ||
    changes[STORAGE_KEYS.CUSTOM_MENU_OVERRIDE]
  ) {
    chrome.storage.local.get(
      [STORAGE_KEYS.ENABLED, STORAGE_KEYS.CUSTOM_MENU_OVERRIDE],
      (result) => {
        const extensionEnabled =
          result[STORAGE_KEYS.ENABLED] ?? DEFAULTS.ENABLED;
        const menuOverride =
          result[STORAGE_KEYS.CUSTOM_MENU_OVERRIDE] ??
          DEFAULTS.CUSTOM_MENU_OVERRIDE;
        // Both must be true for context menu override to work
        customMenuEnabled = extensionEnabled && menuOverride;
        syncOverlayMount();
      },
    );
  }
});

// Initialize custom menu setting on load
loadCustomMenuSetting();

/**
 * Ensure the React overlay matches current enabled state.
 * Overlay should always be mounted to show status (ready/inactive/error).
 * The overlay component itself will handle showing the correct state based on enabled status.
 */
function syncOverlayMount(): void {
  // Always mount overlay so it can show status
  // The overlay component will check storage and show green (ready), grey (inactive), or red (error)
  mountOverlay();
}

/**
 * Listen for overlay click events (when user clicks overlay icon)
 */
document.addEventListener("anyclick-overlay-click", ((e: CustomEvent) => {
  const action = e.detail?.action;
  const message = e.detail?.message;

  switch (action) {
    case "enabled":
      showToast(
        "Anyclick enabled! Right-click any element to get started.",
        "success",
      );
      break;
    case "disabled":
      showToast("Anyclick disabled", "info");
      break;
    case "popup-fallback":
      showToast(
        message || "Click the Anyclick extension icon in your toolbar",
        "info",
      );
      break;
    default:
      if (message) {
        showToast(message, "info");
      }
  }
}) as EventListener);
