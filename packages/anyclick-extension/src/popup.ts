import "./styles/tailwind.css";
import {
  type CaptureStatus,
  DEFAULTS,
  DEFAULT_T3CHAT_SYSTEM_PROMPT,
  STORAGE_KEYS,
} from "./types";

// ========== DOM Elements ==========

const enableToggle = document.getElementById(
  "enableToggle",
) as HTMLInputElement;
const toggleLabel = document.getElementById("toggleLabel") as HTMLSpanElement;
const endpointInput = document.getElementById("endpoint") as HTMLInputElement;
const tokenInput = document.getElementById("token") as HTMLInputElement;
const lastCaptureEl = document.getElementById("lastCapture") as HTMLSpanElement;
const lastStatusEl = document.getElementById("lastStatus") as HTMLSpanElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;

// Integration elements
const uploadthingEnabled = document.getElementById(
  "uploadthingEnabled",
) as HTMLInputElement;
const uploadthingEndpoint = document.getElementById(
  "uploadthingEndpoint",
) as HTMLInputElement;
const uploadthingToken = document.getElementById(
  "uploadthingToken",
) as HTMLInputElement;
const t3chatEnabled = document.getElementById(
  "t3chatEnabled",
) as HTMLInputElement;
const t3chatBaseUrl = document.getElementById(
  "t3chatBaseUrl",
) as HTMLInputElement;
const t3chatAutoRefine = document.getElementById(
  "t3chatAutoRefine",
) as HTMLInputElement;
const t3chatSystemPrompt = document.getElementById(
  "t3chatSystemPrompt",
) as HTMLTextAreaElement;
const t3chatRefineEndpoint = document.getElementById(
  "t3chatRefineEndpoint",
) as HTMLInputElement;
const resetSystemPromptBtn = document.getElementById(
  "resetSystemPrompt",
) as HTMLButtonElement;
const systemPromptCharCount = document.getElementById(
  "systemPromptCharCount",
) as HTMLSpanElement;
const testRefineEndpointBtn = document.getElementById(
  "testRefineEndpoint",
) as HTMLButtonElement;
const testResultEl = document.getElementById(
  "testResult",
) as HTMLParagraphElement;
const customMenuOverride = document.getElementById(
  "customMenuOverride",
) as HTMLInputElement;

// ========== Initialization ==========

/**
 * Load saved settings on popup open
 */
async function loadSettings(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [
        STORAGE_KEYS.ENABLED,
        STORAGE_KEYS.ENDPOINT,
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.LAST_CAPTURE,
        STORAGE_KEYS.LAST_STATUS,
        // Integration settings
        STORAGE_KEYS.UPLOADTHING_ENABLED,
        STORAGE_KEYS.UPLOADTHING_ENDPOINT,
        STORAGE_KEYS.UPLOADTHING_API_KEY,
        STORAGE_KEYS.T3CHAT_ENABLED,
        STORAGE_KEYS.T3CHAT_BASE_URL,
        STORAGE_KEYS.T3CHAT_AUTO_REFINE,
        STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT,
        STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT,
        STORAGE_KEYS.CUSTOM_MENU_OVERRIDE,
      ],
      (result) => {
        // Set toggle state
        const enabled = result[STORAGE_KEYS.ENABLED] ?? DEFAULTS.ENABLED;
        enableToggle.checked = enabled;
        updateToggleLabel(enabled);
        updateSettingsDisabledState(enabled);

        // Set input values
        endpointInput.value =
          result[STORAGE_KEYS.ENDPOINT] ?? DEFAULTS.ENDPOINT;
        tokenInput.value = result[STORAGE_KEYS.TOKEN] ?? DEFAULTS.TOKEN;

        // Set integration values
        uploadthingEnabled.checked =
          result[STORAGE_KEYS.UPLOADTHING_ENABLED] ??
          DEFAULTS.UPLOADTHING_ENABLED;
        uploadthingEndpoint.value =
          result[STORAGE_KEYS.UPLOADTHING_ENDPOINT] ??
          DEFAULTS.UPLOADTHING_ENDPOINT;
        uploadthingToken.value = result[STORAGE_KEYS.UPLOADTHING_API_KEY] ?? "";
        t3chatEnabled.checked =
          result[STORAGE_KEYS.T3CHAT_ENABLED] ?? DEFAULTS.T3CHAT_ENABLED;
        t3chatBaseUrl.value =
          result[STORAGE_KEYS.T3CHAT_BASE_URL] ?? DEFAULTS.T3CHAT_BASE_URL;

        // T3Chat prompt refinement settings
        t3chatAutoRefine.checked =
          result[STORAGE_KEYS.T3CHAT_AUTO_REFINE] ??
          DEFAULTS.T3CHAT_AUTO_REFINE;
        t3chatSystemPrompt.value =
          result[STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT] || "";
        t3chatRefineEndpoint.value =
          result[STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT] ||
          DEFAULTS.T3CHAT_REFINE_ENDPOINT;
        updateSystemPromptCharCount();

        // Set custom menu override toggle
        customMenuOverride.checked =
          result[STORAGE_KEYS.CUSTOM_MENU_OVERRIDE] ??
          DEFAULTS.CUSTOM_MENU_OVERRIDE;

        // Set status display
        updateStatusDisplay(
          result[STORAGE_KEYS.LAST_CAPTURE],
          result[STORAGE_KEYS.LAST_STATUS],
        );

        resolve();
      },
    );
  });
}

/**
 * Update toggle label text
 */
function updateToggleLabel(enabled: boolean): void {
  toggleLabel.textContent = enabled ? "Enabled" : "Disabled";
}

/**
 * Get all form elements that should be disabled when extension is disabled
 */
function getAllSettingsElements(): Array<
  HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
> {
  return [
    endpointInput,
    tokenInput,
    customMenuOverride,
    uploadthingEnabled,
    uploadthingEndpoint,
    uploadthingToken,
    t3chatEnabled,
    t3chatBaseUrl,
    t3chatAutoRefine,
    t3chatRefineEndpoint,
    t3chatSystemPrompt,
    testRefineEndpointBtn,
    resetSystemPromptBtn,
    saveBtn,
  ];
}

/**
 * Update disabled state of all settings based on main toggle
 */
function updateSettingsDisabledState(enabled: boolean): void {
  const elements = getAllSettingsElements();
  elements.forEach((element) => {
    element.disabled = !enabled;
  });
}

/**
 * Notify the active tab so the content script can apply the new enabled state
 * without requiring a page refresh.
 */
function notifyActiveTabEnabled(enabled: boolean): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;
    chrome.tabs
      .sendMessage(tabId, { type: "SET_ENABLED_STATE", enabled })
      .catch(() => {
        // Content script may not be present (restricted pages); ignore.
      });
  });
}

/**
 * Update system prompt character count display
 */
function updateSystemPromptCharCount(): void {
  const count = t3chatSystemPrompt.value.length;
  systemPromptCharCount.textContent = `${count} / 1000`;
  if (count > 1000) {
    systemPromptCharCount.classList.add("over-limit");
  } else {
    systemPromptCharCount.classList.remove("over-limit");
  }
}

/**
 * Update status display from stored values
 */
function updateStatusDisplay(
  lastCapture?: string,
  lastStatusJson?: string,
): void {
  // Last capture time
  if (lastCapture) {
    const date = new Date(lastCapture);
    lastCaptureEl.textContent = formatRelativeTime(date);
  } else {
    lastCaptureEl.textContent = "None";
  }

  // Last status
  if (lastStatusJson) {
    try {
      const status: CaptureStatus = JSON.parse(lastStatusJson);
      lastStatusEl.textContent = status.message;
      lastStatusEl.className =
        "status-value " + (status.success ? "success" : "error");
    } catch {
      lastStatusEl.textContent = "Ready";
      lastStatusEl.className = "status-value";
    }
  } else {
    lastStatusEl.textContent = "Ready";
    lastStatusEl.className = "status-value";
  }
}

/**
 * Format date as relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

// ========== Event Handlers ==========

/**
 * Handle toggle change
 */
enableToggle.addEventListener("change", () => {
  const enabled = enableToggle.checked;
  updateToggleLabel(enabled);
  updateSettingsDisabledState(enabled);
  chrome.storage.local.set({ [STORAGE_KEYS.ENABLED]: enabled });
  notifyActiveTabEnabled(enabled);
});

/**
 * Handle save button click
 */
saveBtn.addEventListener("click", async () => {
  const endpoint = endpointInput.value.trim();
  const token = tokenInput.value.trim();
  const utEndpoint = uploadthingEndpoint.value.trim();
  const utToken = uploadthingToken.value.trim();
  const t3Url = t3chatBaseUrl.value.trim();
  const systemPrompt = t3chatSystemPrompt.value.trim();
  const refineEndpoint = t3chatRefineEndpoint.value.trim();

  // Validate endpoint URLs
  if (endpoint && !isValidUrl(endpoint)) {
    showToast("Invalid capture endpoint URL", true);
    return;
  }
  if (utEndpoint && !isValidUrl(utEndpoint)) {
    showToast("Invalid UploadThing endpoint URL", true);
    return;
  }
  if (t3Url && !isValidUrl(t3Url)) {
    showToast("Invalid t3.chat URL", true);
    return;
  }
  if (refineEndpoint && !isValidUrl(refineEndpoint)) {
    showToast("Invalid refine endpoint URL", true);
    return;
  }

  // Validate system prompt length
  if (systemPrompt.length > 1000) {
    showToast("System prompt is too long (max 1000 chars)", true);
    return;
  }

  // Save settings
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set(
        {
          [STORAGE_KEYS.ENDPOINT]: endpoint,
          [STORAGE_KEYS.TOKEN]: token,
          // Integration settings
          [STORAGE_KEYS.UPLOADTHING_ENABLED]: uploadthingEnabled.checked,
          [STORAGE_KEYS.UPLOADTHING_ENDPOINT]: utEndpoint,
          [STORAGE_KEYS.UPLOADTHING_API_KEY]: utToken,
          [STORAGE_KEYS.T3CHAT_ENABLED]: t3chatEnabled.checked,
          [STORAGE_KEYS.T3CHAT_BASE_URL]: t3Url || DEFAULTS.T3CHAT_BASE_URL,
          // T3Chat prompt refinement settings
          [STORAGE_KEYS.T3CHAT_AUTO_REFINE]: t3chatAutoRefine.checked,
          [STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT]: systemPrompt,
          [STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT]:
            refineEndpoint || DEFAULTS.T3CHAT_REFINE_ENDPOINT,
          // Context menu override setting
          [STORAGE_KEYS.CUSTOM_MENU_OVERRIDE]: customMenuOverride.checked,
        },
        resolve,
      );
    });

    showToast("Settings saved!");
  } catch (error) {
    showToast("Failed to save settings", true);
    console.error("[Anyclick Popup] Save error:", error);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Settings";
  }
});

/**
 * Handle system prompt textarea input for character count
 */
t3chatSystemPrompt.addEventListener("input", () => {
  updateSystemPromptCharCount();
});

/**
 * Handle reset system prompt button click
 */
resetSystemPromptBtn.addEventListener("click", () => {
  t3chatSystemPrompt.value = DEFAULT_T3CHAT_SYSTEM_PROMPT;
  updateSystemPromptCharCount();
  showToast("System prompt reset to default");
});

/**
 * Handle test refine endpoint button click
 * Tests the connection to the refine API endpoint
 */
testRefineEndpointBtn.addEventListener("click", async () => {
  const endpoint = t3chatRefineEndpoint.value.trim();
  if (!endpoint) {
    testResultEl.textContent = "Please enter an endpoint URL";
    testResultEl.style.color = "#ef4444";
    return;
  }

  testRefineEndpointBtn.disabled = true;
  testRefineEndpointBtn.textContent = "Testing...";
  testResultEl.textContent = "Testing connection...";
  testResultEl.style.color = "#888";

  try {
    // Send a test request via the background script
    const response = await chrome.runtime.sendMessage({
      type: "REFINE_PROMPT",
      selectedText: "test",
      context: "Test connection",
      systemPrompt: "Just respond with 'OK'",
      refineEndpoint: endpoint,
      timestamp: new Date().toISOString(),
    });

    console.log("[Anyclick Popup] Test response:", response);

    if (response?.success) {
      testResultEl.textContent = "Connection successful!";
      testResultEl.style.color = "#22c55e";
    } else {
      testResultEl.textContent = `Failed: ${response?.error || "Unknown error"}`;
      testResultEl.style.color = "#ef4444";
    }
  } catch (error) {
    console.error("[Anyclick Popup] Test failed:", error);
    testResultEl.textContent = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    testResultEl.style.color = "#ef4444";
  } finally {
    testRefineEndpointBtn.disabled = false;
    testRefineEndpointBtn.textContent = "Test";
  }
});

/**
 * Validate URL format
 */
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ========== Toast Notifications ==========

/**
 * Show toast notification in popup
 */
function showToast(message: string, isError = false): void {
  // Remove existing toast
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast" + (isError ? " error" : "");
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger show animation
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Auto-hide
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ========== Storage Change Listener ==========

/**
 * Listen for storage changes to update UI
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (changes[STORAGE_KEYS.LAST_CAPTURE] || changes[STORAGE_KEYS.LAST_STATUS]) {
    updateStatusDisplay(
      changes[STORAGE_KEYS.LAST_CAPTURE]?.newValue,
      changes[STORAGE_KEYS.LAST_STATUS]?.newValue,
    );
  }
});

// ========== Initialize ==========

loadSettings().catch(console.error);
