import { STORAGE_KEYS, DEFAULTS, type CaptureStatus } from "./types";

// ========== DOM Elements ==========

const enableToggle = document.getElementById("enableToggle") as HTMLInputElement;
const toggleLabel = document.getElementById("toggleLabel") as HTMLSpanElement;
const endpointInput = document.getElementById("endpoint") as HTMLInputElement;
const tokenInput = document.getElementById("token") as HTMLInputElement;
const lastCaptureEl = document.getElementById("lastCapture") as HTMLSpanElement;
const lastStatusEl = document.getElementById("lastStatus") as HTMLSpanElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;

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
      ],
      (result) => {
        // Set toggle state
        const enabled = result[STORAGE_KEYS.ENABLED] ?? DEFAULTS.ENABLED;
        enableToggle.checked = enabled;
        updateToggleLabel(enabled);

        // Set input values
        endpointInput.value = result[STORAGE_KEYS.ENDPOINT] ?? DEFAULTS.ENDPOINT;
        tokenInput.value = result[STORAGE_KEYS.TOKEN] ?? DEFAULTS.TOKEN;

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
      lastStatusEl.className = "status-value " + (status.success ? "success" : "error");
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
  chrome.storage.local.set({ [STORAGE_KEYS.ENABLED]: enabled });
});

/**
 * Handle save button click
 */
saveBtn.addEventListener("click", async () => {
  const endpoint = endpointInput.value.trim();
  const token = tokenInput.value.trim();

  // Validate endpoint URL
  if (endpoint && !isValidUrl(endpoint)) {
    showToast("Invalid endpoint URL", true);
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


