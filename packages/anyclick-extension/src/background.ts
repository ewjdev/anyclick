import {
  addToQueue,
  getQueue,
  removeFromQueue,
  updateQueueItem,
} from "./queue";
import {
  type CapturePayload,
  type CaptureStatus,
  DEFAULTS,
  type ElementContext,
  type ExtensionMessage,
  type ExtensionSettings,
  PERF_LIMITS,
  type PageContext,
  type QueuedPayload,
  type RefinePromptMessage,
  STORAGE_KEYS,
  createMessage,
} from "./types";

let isProcessingQueue = false;

// ========== DevTools Panel Connections ==========

/** Connected DevTools panel ports, keyed by tab ID */
const devtoolsPanels = new Map<number, chrome.runtime.Port>();

/** Connected Inspector window ports, keyed by tab ID */
const inspectorWindows = new Map<number, chrome.runtime.Port>();

/** Inspector window IDs, keyed by tab ID */
const inspectorWindowIds = new Map<number, number>();

/** Last inspected element for each tab */
const lastInspectedElement = new Map<
  number,
  { element: ElementContext; page?: PageContext }
>();

/**
 * Handle DevTools panel and Inspector window connections
 */
chrome.runtime.onConnect.addListener((port) => {
  console.log("[Anyclick Background] Port connection received:", {
    name: port.name,
    sender: port.sender,
  });

  if (port.name === "devtools-panel") {
    handleDevToolsPanelConnection(port);
  } else if (port.name === "inspector-window") {
    handleInspectorWindowConnection(port);
  } else {
    console.log("[Anyclick Background] Ignoring unknown port:", port.name);
  }
});

/**
 * Handle DevTools panel port connection
 */
function handleDevToolsPanelConnection(port: chrome.runtime.Port): void {
  let tabId: number | null = null;

  port.onMessage.addListener((message) => {
    console.log("[Anyclick Background] Message from DevTools panel:", message);

    if (message.type === "PANEL_INIT" && typeof message.tabId === "number") {
      const connectedTabId: number = message.tabId;
      tabId = connectedTabId;
      devtoolsPanels.set(connectedTabId, port);
      console.log(
        `[Anyclick Background] DevTools panel connected for tab ${connectedTabId}`,
      );
      console.log(
        "[Anyclick Background] Total connected panels:",
        devtoolsPanels.size,
      );

      // Send last inspected element if available
      const lastElement = lastInspectedElement.get(connectedTabId);
      console.log("[Anyclick Background] Last inspected element for tab:", {
        tabId: connectedTabId,
        hasElement: !!lastElement,
        selector: lastElement?.element?.selector,
      });

      if (lastElement) {
        const updateMsg = createMessage({
          type: "DEVTOOLS_ELEMENT_UPDATE" as const,
          element: lastElement.element,
          page: lastElement.page,
        });
        console.log(
          "[Anyclick Background] Sending cached element to panel:",
          updateMsg,
        );
        port.postMessage(updateMsg);
      }
    }
  });

  port.onDisconnect.addListener(() => {
    console.log("[Anyclick Background] DevTools panel port disconnected", {
      tabId,
    });
    if (tabId !== null) {
      devtoolsPanels.delete(tabId);
      console.log(
        `[Anyclick Background] DevTools panel disconnected for tab ${tabId}`,
      );
    }
  });
}

/**
 * Handle Inspector window port connection
 */
function handleInspectorWindowConnection(port: chrome.runtime.Port): void {
  let tabId: number | null = null;

  port.onMessage.addListener(async (message) => {
    console.log(
      "[Anyclick Background] Message from Inspector window:",
      message,
    );

    if (
      message.type === "INSPECTOR_INIT" &&
      typeof message.tabId === "number"
    ) {
      const connectedTabId: number = message.tabId;
      tabId = connectedTabId;
      inspectorWindows.set(connectedTabId, port);
      console.log(
        `[Anyclick Background] Inspector window connected for tab ${connectedTabId}`,
      );

      // Send last inspected element if available
      const lastElement = lastInspectedElement.get(connectedTabId);
      if (lastElement) {
        const updateMsg = createMessage({
          type: "DEVTOOLS_ELEMENT_UPDATE" as const,
          element: lastElement.element,
          page: lastElement.page,
        });
        port.postMessage(updateMsg);
      }

      // Send page info
      try {
        const tab = await chrome.tabs.get(connectedTabId);
        port.postMessage({
          type: "INSPECTOR_PAGE_INFO",
          url: tab.url,
          title: tab.title,
        });
      } catch (error) {
        console.warn("[Anyclick Background] Failed to get tab info:", error);
      }
    } else if (
      message.type === "INSPECTOR_REFRESH" &&
      typeof message.tabId === "number"
    ) {
      // Request refresh from content script
      try {
        await chrome.tabs.sendMessage(message.tabId, {
          type: "TRIGGER_REFRESH_ELEMENT",
        });
      } catch (error) {
        console.warn("[Anyclick Background] Failed to trigger refresh:", error);
      }
    } else if (
      message.type === "INSPECTOR_CAPTURE" &&
      typeof message.tabId === "number"
    ) {
      // Request capture from content script
      try {
        await chrome.tabs.sendMessage(message.tabId, {
          type: "TRIGGER_CAPTURE_ELEMENT",
        });
      } catch (error) {
        console.warn("[Anyclick Background] Failed to trigger capture:", error);
      }
    }
  });

  port.onDisconnect.addListener(() => {
    console.log("[Anyclick Background] Inspector window port disconnected", {
      tabId,
    });
    if (tabId !== null) {
      inspectorWindows.delete(tabId);
      inspectorWindowIds.delete(tabId);
      console.log(
        `[Anyclick Background] Inspector window disconnected for tab ${tabId}`,
      );
    }
  });
}

/**
 * Broadcast element update to DevTools panel and Inspector window for a specific tab
 */
function broadcastToDevToolsPanel(
  tabId: number,
  element: ElementContext | null,
  page?: PageContext,
): void {
  console.log("[Anyclick Background] broadcastToDevToolsPanel called", {
    tabId,
    hasElement: !!element,
    selector: element?.selector,
    connectedPanels: Array.from(devtoolsPanels.keys()),
    connectedInspectors: Array.from(inspectorWindows.keys()),
  });

  const message = createMessage({
    type: "DEVTOOLS_ELEMENT_UPDATE" as const,
    element,
    page,
  });

  // Send to DevTools panel
  const panelPort = devtoolsPanels.get(tabId);
  if (panelPort) {
    try {
      console.log("[Anyclick Background] Posting message to panel:", message);
      panelPort.postMessage(message);
      console.log("[Anyclick Background] Message posted to panel successfully");
    } catch (error) {
      console.error(
        "[Anyclick Background] Failed to send to DevTools panel:",
        error,
      );
      devtoolsPanels.delete(tabId);
    }
  }

  // Send to Inspector window
  const inspectorPort = inspectorWindows.get(tabId);
  if (inspectorPort) {
    try {
      console.log(
        "[Anyclick Background] Posting message to inspector:",
        message,
      );
      inspectorPort.postMessage(message);
      console.log(
        "[Anyclick Background] Message posted to inspector successfully",
      );
    } catch (error) {
      console.error(
        "[Anyclick Background] Failed to send to Inspector window:",
        error,
      );
      inspectorWindows.delete(tabId);
    }
  }

  if (!panelPort && !inspectorPort) {
    console.warn(
      `[Anyclick Background] No DevTools panel or Inspector window connected for tab ${tabId}`,
    );
  }
}

/**
 * Open the Anyclick Inspector window for a specific tab.
 * If already open, focus it instead.
 */
async function openInspectorWindow(tabId: number): Promise<boolean> {
  console.log("[Anyclick Background] openInspectorWindow called", { tabId });

  // Check if inspector window already exists for this tab
  const existingWindowId = inspectorWindowIds.get(tabId);
  if (existingWindowId) {
    try {
      // Try to focus the existing window
      await chrome.windows.update(existingWindowId, { focused: true });
      console.log("[Anyclick Background] Focused existing inspector window", {
        tabId,
        windowId: existingWindowId,
      });
      return true;
    } catch (error) {
      // Window might have been closed, remove from tracking
      console.log(
        "[Anyclick Background] Existing inspector window not found, creating new one",
      );
      inspectorWindowIds.delete(tabId);
    }
  }

  // Create new inspector window
  try {
    const inspectorUrl = chrome.runtime.getURL(`inspector.html?tabId=${tabId}`);
    console.log("[Anyclick Background] Creating inspector window", {
      tabId,
      url: inspectorUrl,
    });

    const window = await chrome.windows.create({
      url: inspectorUrl,
      type: "popup",
      width: 400,
      height: 600,
      focused: true,
    });

    if (window.id) {
      inspectorWindowIds.set(tabId, window.id);
      console.log("[Anyclick Background] Inspector window created", {
        tabId,
        windowId: window.id,
      });
    }

    return true;
  } catch (error) {
    console.error(
      "[Anyclick Background] Failed to create inspector window:",
      error,
    );
    return false;
  }
}

// ========== Context Menu Setup ==========

/**
 * Create context menu on extension install/update
 */
chrome.runtime.onInstalled.addListener(() => {
  // Main capture menu item
  chrome.contextMenus.create({
    id: "anyclick-capture",
    title: "Capture with Anyclick",
    contexts: ["all"],
  });

  // t3.chat menu item - appears when text is selected
  chrome.contextMenus.create({
    id: "anyclick-t3chat",
    title: "Ask t3.chat",
    contexts: ["selection"],
  });

  // UploadThing menu item - appears on images
  chrome.contextMenus.create({
    id: "anyclick-upload-image",
    title: "Upload image to UploadThing",
    contexts: ["image"],
  });

  // Initialize default settings if not set
  chrome.storage.local.get(
    [
      STORAGE_KEYS.ENABLED,
      STORAGE_KEYS.ENDPOINT,
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.T3CHAT_ENABLED,
      STORAGE_KEYS.T3CHAT_BASE_URL,
      STORAGE_KEYS.UPLOADTHING_ENABLED,
      STORAGE_KEYS.UPLOADTHING_ENDPOINT,
    ],
    (result) => {
      const updates: Record<string, unknown> = {};
      if (result[STORAGE_KEYS.ENABLED] === undefined) {
        updates[STORAGE_KEYS.ENABLED] = DEFAULTS.ENABLED;
      }
      if (result[STORAGE_KEYS.ENDPOINT] === undefined) {
        updates[STORAGE_KEYS.ENDPOINT] = DEFAULTS.ENDPOINT;
      }
      if (result[STORAGE_KEYS.TOKEN] === undefined) {
        updates[STORAGE_KEYS.TOKEN] = DEFAULTS.TOKEN;
      }
      // T3Chat settings
      if (result[STORAGE_KEYS.T3CHAT_ENABLED] === undefined) {
        updates[STORAGE_KEYS.T3CHAT_ENABLED] = DEFAULTS.T3CHAT_ENABLED;
      }
      if (result[STORAGE_KEYS.T3CHAT_BASE_URL] === undefined) {
        updates[STORAGE_KEYS.T3CHAT_BASE_URL] = DEFAULTS.T3CHAT_BASE_URL;
      }
      // UploadThing settings
      if (result[STORAGE_KEYS.UPLOADTHING_ENABLED] === undefined) {
        updates[STORAGE_KEYS.UPLOADTHING_ENABLED] =
          DEFAULTS.UPLOADTHING_ENABLED;
      }
      if (result[STORAGE_KEYS.UPLOADTHING_ENDPOINT] === undefined) {
        updates[STORAGE_KEYS.UPLOADTHING_ENDPOINT] =
          DEFAULTS.UPLOADTHING_ENDPOINT;
      }
      if (Object.keys(updates).length > 0) {
        chrome.storage.local.set(updates);
      }
    },
  );

  ensureQueueAlarm();
});

// Process queue on cold start
chrome.runtime.onStartup.addListener(() => {
  ensureQueueAlarm();
  processQueue("startup").catch(console.error);
});

/**
 * Handle context menu click - trigger content script capture or t3.chat
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const tabId = tab?.id;

  // Handle t3.chat menu click
  if (info.menuItemId === "anyclick-t3chat") {
    const selectedText = info.selectionText?.trim() ?? "";
    if (selectedText) {
      // Get base URL from settings
      chrome.storage.local.get([STORAGE_KEYS.T3CHAT_BASE_URL], (result) => {
        const baseUrl =
          result[STORAGE_KEYS.T3CHAT_BASE_URL] || DEFAULTS.T3CHAT_BASE_URL;
        const url = `${baseUrl}/?q=${encodeURIComponent(selectedText)}`;
        chrome.tabs.create({ url });
      });
    }
    return;
  }

  // Handle UploadThing image upload
  if (info.menuItemId === "anyclick-upload-image") {
    if (!info.srcUrl || !tabId) return;

    // Get UploadThing settings and send to content script
    chrome.storage.local.get(
      [STORAGE_KEYS.UPLOADTHING_ENDPOINT, STORAGE_KEYS.UPLOADTHING_API_KEY],
      (result) => {
        chrome.tabs.sendMessage(tabId, {
          type: "UPLOAD_IMAGE",
          payload: {
            src: info.srcUrl,
            endpoint: result[STORAGE_KEYS.UPLOADTHING_ENDPOINT],
            apiKey: result[STORAGE_KEYS.UPLOADTHING_API_KEY],
          },
        });
      },
    );
    return;
  }

  // Handle main capture menu
  if (info.menuItemId !== "anyclick-capture" || !tabId) return;
  if (typeof tabId !== "number") return;

  // Send message to content script to initiate capture (best-effort)
  void (async () => {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "CONTEXT_MENU_CLICKED",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Content script may not be injected (e.g., restricted pages); swallow
      console.warn(
        "[Anyclick Background] Unable to reach content script:",
        error instanceof Error ? error.message : String(error),
      );
    }
  })();
});

// ========== Message Handling ==========

/**
 * Handle messages from content script
 */
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionMessage) => void,
  ) => {
    console.log("[Anyclick Background] Message received:", {
      type: message.type,
      tabId: sender.tab?.id,
      url: sender.tab?.url?.slice(0, 50),
    });

    // Allow popup to send REFINE_PROMPT for the test button (no tab context)
    if (!sender.tab?.id && message.type === "REFINE_PROMPT") {
      void handleRefinePrompt(message)
        .then((response) => {
          sendResponse(response);
        })
        .catch((error) => {
          console.error(
            "[Anyclick Background] Error handling popup refine:",
            error,
          );
          sendResponse(
            createMessage({
              type: "CAPTURE_RESPONSE",
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          );
        });
      return true;
    }

    // Validate sender is from a content script
    if (!sender.tab?.id) {
      console.warn(
        "[Anyclick Background] Message from non-tab sender:",
        sender,
      );
      return false;
    }

    handleMessage(message, sender.tab.id)
      .then((response) => {
        console.log("[Anyclick Background] Sending response:", {
          type: response.type,
          success: "success" in response ? response.success : undefined,
        });
        sendResponse(response);
      })
      .catch((error) => {
        console.error("[Anyclick Background] Error:", error);
        sendResponse(
          createMessage({
            type: "CAPTURE_RESPONSE",
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        );
      });

    // Return true to indicate async response
    return true;
  },
);

/**
 * Route message to appropriate handler
 */
async function handleMessage(
  message: ExtensionMessage,
  tabId: number,
): Promise<ExtensionMessage> {
  console.log("[Anyclick Background] handleMessage routing:", {
    type: message.type,
    tabId,
  });

  switch (message.type) {
    case "QUEUE_ADD":
      console.log("[Anyclick Background] Routing to handleQueueAdd");
      return handleQueueAdd(message.payload, tabId);

    case "PROCESS_QUEUE":
      console.log("[Anyclick Background] Routing to processQueue");
      await processQueue("manual");
      return createMessage({ type: "PONG" as const });

    case "SCREENSHOT_REQUEST":
      console.log("[Anyclick Background] Routing to handleScreenshotRequest");
      return handleScreenshotRequest(tabId);

    case "SUBMIT_REQUEST":
      console.log("[Anyclick Background] Routing to handleSubmitRequest");
      return handleSubmitRequest(message.payload);

    case "GET_SETTINGS":
      console.log("[Anyclick Background] Routing to handleGetSettings");
      return handleGetSettings();

    case "PING":
      console.log("[Anyclick Background] Routing to PONG");
      return createMessage({ type: "PONG" as const });

    case "INSPECT_ELEMENT":
      console.log("[Anyclick Background] Routing to handleInspectElement");
      return handleInspectElement(
        message as ExtensionMessage & {
          element: ElementContext;
          position: { x: number; y: number };
        },
        tabId,
      );

    case "REFINE_PROMPT":
      console.log("[Anyclick Background] Routing to handleRefinePrompt");
      return handleRefinePrompt(message);

    case "OPEN_POPUP":
      console.log("[Anyclick Background] Routing to handleOpenPopup");
      return handleOpenPopup();

    default:
      console.warn("[Anyclick Background] Unknown message type:", message.type);
      return createMessage({
        type: "CAPTURE_RESPONSE",
        success: false,
        error: `Unknown message type: ${message.type}`,
      });
  }
}

/**
 * Handle inspect element request from content script
 */
async function handleInspectElement(
  message: ExtensionMessage & {
    element: ElementContext;
    position: { x: number; y: number };
    openDevtools?: boolean;
  },
  tabId: number,
): Promise<ExtensionMessage> {
  console.log("[Anyclick Background] handleInspectElement called", {
    tabId,
    hasElement: !!message.element,
    selector: message.element?.selector,
    position: message.position,
    openDevtools: message.openDevtools,
  });

  // Store for later panel/inspector connections
  lastInspectedElement.set(tabId, {
    element: message.element,
  });
  console.log(
    "[Anyclick Background] Stored element for tab",
    tabId,
    "Total stored:",
    lastInspectedElement.size,
  );

  // Check if any viewer (panel or inspector) is already connected
  const panelConnected = devtoolsPanels.has(tabId);
  const inspectorConnected = inspectorWindows.has(tabId);
  const anyViewerConnected = panelConnected || inspectorConnected;

  // If openDevtools is requested and no viewer is connected, open inspector window
  if (message.openDevtools && !anyViewerConnected) {
    console.log(
      "[Anyclick Background] No viewer connected, opening inspector window",
    );
    await openInspectorWindow(tabId);
  } else if (message.openDevtools && inspectorConnected) {
    // Focus existing inspector window
    const windowId = inspectorWindowIds.get(tabId);
    if (windowId) {
      try {
        await chrome.windows.update(windowId, { focused: true });
      } catch (error) {
        // Window might be closed, will be handled by broadcast
      }
    }
  }

  // Broadcast to connected DevTools panel and/or Inspector window
  broadcastToDevToolsPanel(tabId, message.element);

  console.log("[Anyclick Background] Element inspection complete", {
    tabId,
    selector: message.element.selector,
    panelConnected,
    inspectorConnected,
  });

  return createMessage({
    type: "CAPTURE_RESPONSE" as const,
    success: true,
    panelConnected: panelConnected || inspectorConnected,
  });
}

// ========== Open Popup ==========

/**
 * Handle request to open the extension popup
 * Uses chrome.action.openPopup() which requires user gesture context
 */
async function handleOpenPopup(): Promise<ExtensionMessage> {
  try {
    // chrome.action.openPopup() is available in Chrome 99+
    // It requires being called in a user gesture context
    if (chrome.action?.openPopup) {
      await chrome.action.openPopup();
      console.log("[Anyclick Background] Popup opened successfully");
      return createMessage({
        type: "CAPTURE_RESPONSE" as const,
        success: true,
      });
    } else {
      // Fallback for older Chrome versions
      return createMessage({
        type: "CAPTURE_RESPONSE" as const,
        success: false,
        error: "chrome.action.openPopup not available",
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.warn("[Anyclick Background] Failed to open popup:", errorMsg);
    return createMessage({
      type: "CAPTURE_RESPONSE" as const,
      success: false,
      error: errorMsg,
    });
  }
}

// ========== Screenshot Capture ==========

/**
 * Capture viewport screenshot using chrome.tabs API
 */
async function handleScreenshotRequest(tabId: number) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.windowId) {
      throw new Error("Tab has no window");
    }

    // Capture visible tab as JPEG for smaller size
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "jpeg",
      quality: Math.round(PERF_LIMITS.SCREENSHOT_QUALITY * 100),
    });

    // Calculate approximate size
    const base64Data = dataUrl.split(",")[1] || "";
    const sizeBytes = Math.round((base64Data.length * 3) / 4);

    // Get dimensions from tab
    const width = tab.width || 0;
    const height = tab.height || 0;

    return createMessage({
      type: "SCREENSHOT_RESPONSE" as const,
      success: true,
      dataUrl,
      width,
      height,
      sizeBytes,
    });
  } catch (error) {
    console.error("[Anyclick Background] Screenshot error:", error);
    return createMessage({
      type: "SCREENSHOT_RESPONSE" as const,
      success: false,
      error: error instanceof Error ? error.message : "Screenshot failed",
    });
  }
}

/**
 * Capture screenshot for queued item (may skip if tab is missing)
 */
async function captureScreenshotForQueue(tabId?: number) {
  if (!tabId) return null;
  try {
    return await handleScreenshotRequest(tabId);
  } catch (error) {
    console.warn("[Anyclick Background] Queue screenshot skipped:", error);
    return null;
  }
}

// ========== Payload Submission ==========

/**
 * Submit capture payload to configured endpoint with retries
 */
async function handleSubmitRequest(payload: CapturePayload) {
  try {
    const settings = await getSettings();

    if (!settings.enabled) {
      return createMessage({
        type: "SUBMIT_RESPONSE" as const,
        success: false,
        error: "Extension is disabled",
      });
    }

    if (!settings.endpoint) {
      return createMessage({
        type: "SUBMIT_RESPONSE" as const,
        success: false,
        error: "No endpoint configured",
      });
    }

    // Validate payload size
    const payloadStr = JSON.stringify(payload);
    if (payloadStr.length > PERF_LIMITS.MAX_PAYLOAD_SIZE) {
      return createMessage({
        type: "SUBMIT_RESPONSE" as const,
        success: false,
        error: `Payload too large: ${payloadStr.length} bytes (max ${PERF_LIMITS.MAX_PAYLOAD_SIZE})`,
      });
    }

    // Submit with retries
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= PERF_LIMITS.MAX_RETRIES; attempt++) {
      try {
        await submitPayload(settings.endpoint, settings.token, payload);
        await updateCaptureStatus(
          true,
          "Submitted successfully",
          payload.page.url,
        );
        return createMessage({
          type: "SUBMIT_RESPONSE" as const,
          success: true,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        if (attempt < PERF_LIMITS.MAX_RETRIES) {
          await delay(PERF_LIMITS.RETRY_DELAY);
        }
      }
    }

    await updateCaptureStatus(false, lastError?.message || "Submission failed");
    return createMessage({
      type: "SUBMIT_RESPONSE" as const,
      success: false,
      error: lastError?.message || "Submission failed after retries",
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    await updateCaptureStatus(false, errorMsg);
    return createMessage({
      type: "SUBMIT_RESPONSE" as const,
      success: false,
      error: errorMsg,
    });
  }
}

// ========== Prompt Refinement ==========

/**
 * Handle prompt refinement request from content script
 * This runs in the background script to bypass CORS restrictions
 */
async function handleRefinePrompt(
  message: RefinePromptMessage,
): Promise<ExtensionMessage> {
  console.log("[Anyclick Background] handleRefinePrompt called with:", {
    selectedTextLength: message.selectedText?.length,
    contextLength: message.context?.length,
    hasSystemPrompt: !!message.systemPrompt,
    refineEndpoint: message.refineEndpoint,
  });

  try {
    const { selectedText, context, systemPrompt, refineEndpoint } = message;

    // Use the configured refine endpoint, or default to localhost
    const apiUrl = refineEndpoint || "http://localhost:3000/api/anyclick/chat";

    console.log("[Anyclick Background] Making fetch request to:", apiUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("[Anyclick Background] Request timeout, aborting...");
      controller.abort();
    }, 15000);

    try {
      const requestBody = {
        action: "refine",
        selectedText,
        context,
        systemPrompt,
      };

      console.log("[Anyclick Background] Request body:", {
        action: requestBody.action,
        selectedTextLength: requestBody.selectedText?.length,
        contextLength: requestBody.context?.length,
        hasSystemPrompt: !!requestBody.systemPrompt,
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      console.log("[Anyclick Background] Fetch response received:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("[Anyclick Background] API error response:", errorText);
        throw new Error(
          `API request failed: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();

      console.log("[Anyclick Background] API response data:", {
        hasRefinedPrompt: !!data.refinedPrompt,
        refinedPromptLength: data.refinedPrompt?.length,
        keys: Object.keys(data),
      });

      if (!data.refinedPrompt) {
        throw new Error("No refined prompt in response");
      }

      console.log("[Anyclick Background] Refinement successful");

      return createMessage({
        type: "CAPTURE_RESPONSE" as const,
        success: true,
        payload: {
          refinedPrompt: data.refinedPrompt,
        } as unknown as CapturePayload,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[Anyclick Background] Prompt refinement failed:", {
      message: errorMsg,
      stack: errorStack,
      error,
    });
    return createMessage({
      type: "CAPTURE_RESPONSE" as const,
      success: false,
      error: errorMsg,
    });
  }
}

/**
 * Make HTTP request to submit payload
 */
async function submitPayload(
  endpoint: string,
  token: string,
  payload: CapturePayload,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    PERF_LIMITS.SUBMIT_TIMEOUT,
  );

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ========== Queue Processing ==========

/**
 * Handle queue add requests from content script
 */
async function handleQueueAdd(payload: CapturePayload, tabId: number) {
  await addToQueue(payload, tabId);
  // Kick processing but do not block response
  processQueue("message").catch(console.error);

  return createMessage({
    type: "CAPTURE_RESPONSE" as const,
    success: true,
  });
}

/**
 * Ensure periodic queue processing via alarms (every ~5s)
 */
function ensureQueueAlarm(): void {
  chrome.alarms.create("anyclick-process-queue", { periodInMinutes: 0.0833 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "anyclick-process-queue") {
    processQueue("alarm").catch(console.error);
  }
});

/**
 * Process queued payloads sequentially
 */
async function processQueue(
  trigger: "alarm" | "startup" | "message" | "manual",
) {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  try {
    const settings = await getSettings();
    const queue = await getQueue();
    const now = Date.now();

    for (const item of queue) {
      if (item.nextRetry > now) continue;
      await processQueueItem(item, settings);
    }
  } catch (error) {
    console.error("[Anyclick Background] Queue processing error:", error);
  } finally {
    isProcessingQueue = false;
  }
}

/**
 * Process a single queue item
 */
async function processQueueItem(
  item: QueuedPayload,
  settings: ExtensionSettings,
): Promise<void> {
  if (!settings.enabled) {
    await updateQueueItem(item.id, {
      lastError: "Extension disabled",
      nextRetry: Date.now() + PERF_LIMITS.RETRY_DELAY,
    });
    return;
  }

  if (!settings.endpoint) {
    await updateQueueItem(item.id, {
      lastError: "No endpoint configured",
      nextRetry: Date.now() + PERF_LIMITS.RETRY_DELAY,
    });
    return;
  }

  const queueWaitMs = Date.now() - item.createdAt;
  const processStart = Date.now();
  const attemptNumber = item.attempts + 1;
  let screenshotTimeMs: number | undefined;
  let submitTimeMs: number | undefined;

  let payload: CapturePayload = {
    ...item.payload,
    metadata: {
      ...item.payload.metadata,
      queueTimeMs: queueWaitMs,
      attempt: attemptNumber,
    },
  };

  // Capture screenshot in background (non-blocking path)
  const screenshotStart = Date.now();
  const screenshot = await captureScreenshotForQueue(item.tabId);
  screenshotTimeMs = Date.now() - screenshotStart;
  if (
    screenshot &&
    screenshot.success &&
    "dataUrl" in screenshot &&
    screenshot.dataUrl
  ) {
    const { dataUrl, width = 0, height = 0, sizeBytes = 0 } = screenshot;
    payload = {
      ...payload,
      screenshots: {
        viewport: {
          dataUrl,
          width,
          height,
          sizeBytes,
        },
        capturedAt: new Date().toISOString(),
      },
    };
    payload = {
      ...payload,
      metadata: {
        ...payload.metadata,
        screenshotTimeMs,
      },
    };
  }

  try {
    // Validate size post-screenshot
    const payloadStr = JSON.stringify(payload);
    if (payloadStr.length > PERF_LIMITS.MAX_PAYLOAD_SIZE) {
      throw new Error(
        `Payload too large: ${payloadStr.length} bytes (max ${PERF_LIMITS.MAX_PAYLOAD_SIZE})`,
      );
    }

    const submitStart = Date.now();
    await submitPayload(settings.endpoint, settings.token, payload);
    submitTimeMs = Date.now() - submitStart;
    await updateCaptureStatus(true, "Submitted successfully", payload.page.url);
    await removeFromQueue(item.id);

    const processTimeMs = Date.now() - processStart;
    console.debug("[Anyclick] queue item processed", {
      processTimeMs,
      submitTimeMs,
      screenshotTimeMs,
      queueWaitMs,
      attempt: attemptNumber,
    });
  } catch (error) {
    const attempts = item.attempts + 1;
    const backoff =
      PERF_LIMITS.RETRY_DELAY * Math.pow(2, Math.max(0, attempts - 1));
    const nextRetry = Date.now() + backoff;
    const message = error instanceof Error ? error.message : "Unknown error";

    await updateQueueItem(item.id, {
      attempts,
      nextRetry,
      lastError: message,
    });
    await updateCaptureStatus(false, message, payload.page.url);
  }
}

// ========== Settings Management ==========

/**
 * Get current settings from storage
 */
async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [STORAGE_KEYS.ENABLED, STORAGE_KEYS.ENDPOINT, STORAGE_KEYS.TOKEN],
      (result) => {
        resolve({
          enabled: result[STORAGE_KEYS.ENABLED] ?? DEFAULTS.ENABLED,
          endpoint: result[STORAGE_KEYS.ENDPOINT] ?? DEFAULTS.ENDPOINT,
          token: result[STORAGE_KEYS.TOKEN] ?? DEFAULTS.TOKEN,
        });
      },
    );
  });
}

/**
 * Handle get settings request
 */
async function handleGetSettings() {
  const settings = await getSettings();
  return createMessage({
    type: "SETTINGS_RESPONSE" as const,
    settings,
  });
}

/**
 * Update capture status in storage
 */
async function updateCaptureStatus(
  success: boolean,
  message: string,
  url?: string,
): Promise<void> {
  const status: CaptureStatus = {
    timestamp: new Date().toISOString(),
    success,
    message,
    url,
  };

  await chrome.storage.local.set({
    [STORAGE_KEYS.LAST_CAPTURE]: status.timestamp,
    [STORAGE_KEYS.LAST_STATUS]: JSON.stringify(status),
  });
}

// ========== Utilities ==========

/**
 * Delay helper for retries
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
