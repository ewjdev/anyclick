/**
 * Anyclick DevTools Panel script.
 *
 * Displays element information and allows capture from the DevTools panel.
 */
import type { ElementContext, PageContext } from "./types";
import { DEFAULTS, DEFAULT_T3CHAT_SYSTEM_PROMPT, STORAGE_KEYS } from "./types";

// ========== Types ==========

interface ElementData {
  element: ElementContext;
  page?: PageContext;
  screenshotPending?: boolean;
}

// ========== State ==========

let currentElement: ElementData | null = null;
let isConnected = true;
let backgroundPort: chrome.runtime.Port | null = null;

// ========== DOM Elements ==========

const contentEl = document.getElementById("content")!;
const emptyStateEl = document.getElementById("empty-state")!;
const statusDotEl = document.getElementById("status-dot")!;
const statusTextEl = document.getElementById("status-text")!;
const pageUrlEl = document.getElementById("page-url")!;
const refreshBtn = document.getElementById("refresh-btn")!;
const captureBtn = document.getElementById("capture-btn")!;

// T3Chat settings elements
const t3chatSettingsSection = document.getElementById(
  "t3chat-settings-section",
)!;
const t3chatSettingsHeader = document.getElementById("t3chat-settings-header")!;
const panelT3chatAutoRefine = document.getElementById(
  "panel-t3chat-auto-refine",
) as HTMLInputElement;
const panelT3chatSystemPrompt = document.getElementById(
  "panel-t3chat-system-prompt",
) as HTMLTextAreaElement;
const panelResetSystemPrompt = document.getElementById(
  "panel-reset-system-prompt",
)!;
const panelSystemPromptCharCount = document.getElementById(
  "panel-system-prompt-char-count",
)!;

// ========== Icons ==========

const CHEVRON_DOWN = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

// ========== Connection ==========

function connectToBackground(): void {
  console.log("[Anyclick Panel] Connecting to background...");

  try {
    backgroundPort = chrome.runtime.connect({ name: "devtools-panel" });
    console.log("[Anyclick Panel] Port created:", backgroundPort);
  } catch (error) {
    console.error("[Anyclick Panel] Failed to connect:", error);
    return;
  }

  backgroundPort.onMessage.addListener((message) => {
    console.log("[Anyclick Panel] Message received from background:", message);
    if (message.type === "DEVTOOLS_ELEMENT_UPDATE") {
      console.log("[Anyclick Panel] Handling element update:", {
        hasElement: !!message.element,
        selector: message.element?.selector,
      });
      handleElementUpdate(message);
    } else {
      console.log("[Anyclick Panel] Unknown message type:", message.type);
    }
  });

  backgroundPort.onDisconnect.addListener(() => {
    console.log("[Anyclick Panel] Disconnected from background");
    isConnected = false;
    updateStatus();
    backgroundPort = null;

    // Try to reconnect after a delay
    setTimeout(connectToBackground, 1000);
  });

  // Send initialization message with the inspected tab ID
  const tabId = chrome.devtools.inspectedWindow.tabId;
  console.log("[Anyclick Panel] Sending PANEL_INIT with tabId:", tabId);
  backgroundPort.postMessage({
    type: "PANEL_INIT",
    tabId,
  });

  isConnected = true;
  updateStatus();
  console.log("[Anyclick Panel] Connected and initialized for tab:", tabId);

  // Request current tab info
  chrome.devtools.inspectedWindow.eval(
    "window.location.href",
    (result: string) => {
      console.log("[Anyclick Panel] Got page URL:", result);
      if (result) {
        pageUrlEl.textContent = truncateUrl(result, 40);
        pageUrlEl.title = result;
      }
    },
  );
}

function truncateUrl(url: string, maxLength: number): string {
  if (url.length <= maxLength) return url;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname + parsed.search;
    if (path.length > maxLength - 3) {
      return "..." + path.slice(-(maxLength - 3));
    }
    return parsed.host + path;
  } catch {
    return url.slice(0, maxLength - 3) + "...";
  }
}

// ========== Update Handlers ==========

function handleElementUpdate(message: {
  element: ElementContext | null;
  page?: PageContext;
  screenshotPending?: boolean;
}): void {
  console.log("[Anyclick Panel] handleElementUpdate called:", {
    hasElement: !!message.element,
    selector: message.element?.selector,
    tag: message.element?.tag,
  });

  if (!message.element) {
    console.log("[Anyclick Panel] No element in message, showing empty state");
    currentElement = null;
    renderEmptyState();
    return;
  }

  currentElement = {
    element: message.element,
    page: message.page,
    screenshotPending: message.screenshotPending,
  };

  console.log("[Anyclick Panel] Rendering element:", {
    selector: currentElement.element.selector,
    tag: currentElement.element.tag,
  });
  renderElement();
}

function updateStatus(): void {
  if (isConnected) {
    statusDotEl.classList.remove("disconnected", "pending");
    statusTextEl.textContent = "Connected";
  } else {
    statusDotEl.classList.add("disconnected");
    statusDotEl.classList.remove("pending");
    statusTextEl.textContent = "Disconnected";
  }
}

// ========== Rendering ==========

function renderEmptyState(): void {
  emptyStateEl.style.display = "flex";
  // Remove any element content
  const elementContent = contentEl.querySelector(".element-content");
  if (elementContent) {
    elementContent.remove();
  }
}

function renderElement(): void {
  if (!currentElement) {
    renderEmptyState();
    return;
  }

  emptyStateEl.style.display = "none";

  const { element, page } = currentElement;

  // Remove existing element content
  const existingContent = contentEl.querySelector(".element-content");
  if (existingContent) {
    existingContent.remove();
  }

  const container = document.createElement("div");
  container.className = "element-content";

  // Element identity section
  container.appendChild(renderIdentity(element));

  // Selector section
  container.appendChild(
    renderSection("Selector", renderSelector(element.selector)),
  );

  // Bounding rect section
  container.appendChild(
    renderSection("Position & Size", renderBoundingRect(element.boundingRect)),
  );

  // Data attributes section (if any)
  const dataAttrs = Object.entries(element.dataAttributes);
  if (dataAttrs.length > 0) {
    container.appendChild(
      renderSection("Data Attributes", renderDataAttributes(dataAttrs)),
    );
  }

  // Ancestors section (if any)
  if (element.ancestors.length > 0) {
    container.appendChild(
      renderSection("Ancestors", renderAncestors(element.ancestors)),
    );
  }

  // Page info section (if available)
  if (page) {
    container.appendChild(renderSection("Page", renderPageInfo(page)));
  }

  // Text content section (if any)
  if (element.innerText.trim()) {
    container.appendChild(
      renderSection("Text Content", renderTextContent(element.innerText)),
    );
  }

  contentEl.appendChild(container);
}

function renderIdentity(element: ElementContext): HTMLElement {
  const div = document.createElement("div");
  div.className = "element-identity";

  const tagLine = document.createElement("div");
  tagLine.className = "element-tag-line";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = `<${element.tag}>`;
  tagLine.appendChild(tag);

  if (element.id) {
    const id = document.createElement("span");
    id.className = "id";
    id.textContent = `#${element.id}`;
    tagLine.appendChild(id);
  }

  div.appendChild(tagLine);

  if (element.classes.length > 0) {
    const classes = document.createElement("div");
    classes.className = "classes";
    for (const cls of element.classes.slice(0, 6)) {
      const badge = document.createElement("span");
      badge.className = "class-badge";
      badge.textContent = `.${cls}`;
      classes.appendChild(badge);
    }
    if (element.classes.length > 6) {
      const more = document.createElement("span");
      more.className = "class-badge";
      more.textContent = `+${element.classes.length - 6} more`;
      classes.appendChild(more);
    }
    div.appendChild(classes);
  }

  return div;
}

function renderSection(
  title: string,
  content: HTMLElement,
  collapsed = false,
): HTMLElement {
  const section = document.createElement("div");
  section.className = `section${collapsed ? " collapsed" : ""}`;

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div class="section-title">
      ${CHEVRON_DOWN}
      <span>${title}</span>
    </div>
  `;
  header.addEventListener("click", () => {
    section.classList.toggle("collapsed");
  });

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "section-content";
  contentWrapper.appendChild(content);

  section.appendChild(header);
  section.appendChild(contentWrapper);

  return section;
}

function renderSelector(selector: string): HTMLElement {
  const container = document.createElement("div");
  container.className = "selector-container";

  const code = document.createElement("code");
  code.className = "selector-code";
  code.textContent = selector;
  container.appendChild(code);

  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-btn";
  copyBtn.innerHTML = COPY_ICON;
  copyBtn.title = "Copy selector";
  copyBtn.addEventListener("click", () => copyToClipboard(selector, copyBtn));
  container.appendChild(copyBtn);

  return container;
}

function renderBoundingRect(rect: {
  top: number;
  left: number;
  width: number;
  height: number;
}): HTMLElement {
  const container = document.createElement("div");

  const rows = [
    { label: "Top", value: `${Math.round(rect.top)}px` },
    { label: "Left", value: `${Math.round(rect.left)}px` },
    { label: "Width", value: `${Math.round(rect.width)}px` },
    { label: "Height", value: `${Math.round(rect.height)}px` },
  ];

  for (const row of rows) {
    const rowEl = document.createElement("div");
    rowEl.className = "property-row";
    rowEl.innerHTML = `
      <span class="property-label">${row.label}</span>
      <span class="property-value">${row.value}</span>
    `;
    container.appendChild(rowEl);
  }

  return container;
}

function renderDataAttributes(attrs: [string, string][]): HTMLElement {
  const container = document.createElement("div");
  container.className = "data-attrs";

  for (const [key, value] of attrs) {
    const attr = document.createElement("div");
    attr.className = "data-attr";
    attr.innerHTML = `
      <span class="data-attr-key">data-${key}</span>
      <span class="data-attr-value">${escapeHtml(value)}</span>
    `;
    container.appendChild(attr);
  }

  return container;
}

function renderAncestors(
  ancestors: {
    tag: string;
    id?: string;
    classes: string[];
    selector: string;
  }[],
): HTMLElement {
  const container = document.createElement("div");
  container.className = "ancestors-list";

  ancestors.forEach((ancestor, index) => {
    const item = document.createElement("div");
    item.className = "ancestor-item";

    const depth = document.createElement("span");
    depth.className = "ancestor-depth";
    depth.textContent = `${index + 1}`;
    item.appendChild(depth);

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = `<${ancestor.tag}>`;
    item.appendChild(tag);

    if (ancestor.id) {
      const id = document.createElement("span");
      id.className = "id";
      id.textContent = `#${ancestor.id}`;
      item.appendChild(id);
    }

    container.appendChild(item);
  });

  return container;
}

function renderPageInfo(page: PageContext): HTMLElement {
  const container = document.createElement("div");

  const rows = [
    { label: "Title", value: page.title || "(no title)" },
    {
      label: "Viewport",
      value: `${page.viewport.width} × ${page.viewport.height}`,
    },
  ];

  for (const row of rows) {
    const rowEl = document.createElement("div");
    rowEl.className = "property-row";
    rowEl.innerHTML = `
      <span class="property-label">${row.label}</span>
      <span class="property-value">${escapeHtml(row.value)}</span>
    `;
    container.appendChild(rowEl);
  }

  return container;
}

function renderTextContent(text: string): HTMLElement {
  const container = document.createElement("div");
  container.className = "selector-container";

  const code = document.createElement("code");
  code.className = "selector-code";
  code.textContent = text.slice(0, 200) + (text.length > 200 ? "..." : "");
  container.appendChild(code);

  return container;
}

// ========== Utilities ==========

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function copyToClipboard(
  text: string,
  button: HTMLElement,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    const originalHtml = button.innerHTML;
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    setTimeout(() => {
      button.innerHTML = originalHtml;
    }, 1500);
  } catch (err) {
    console.error("[Anyclick Panel] Copy failed:", err);
  }
}

// ========== Event Handlers ==========

refreshBtn.addEventListener("click", () => {
  if (!backgroundPort) return;

  // Request fresh element data from content script
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      const evt = new CustomEvent('anyclick-refresh-element');
      document.dispatchEvent(evt);
      return true;
    })()`,
    () => {
      console.log("[Anyclick Panel] Refresh requested");
    },
  );
});

captureBtn.addEventListener("click", () => {
  if (!currentElement || !backgroundPort) return;

  // Trigger capture via content script
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      const evt = new CustomEvent('anyclick-capture-element');
      document.dispatchEvent(evt);
      return true;
    })()`,
    () => {
      console.log("[Anyclick Panel] Capture requested");
    },
  );

  // Update status to show pending
  statusDotEl.classList.add("pending");
  statusTextEl.textContent = "Capturing...";

  // Reset after delay
  setTimeout(() => {
    if (isConnected) {
      statusDotEl.classList.remove("pending");
      statusTextEl.textContent = "Connected";
    }
  }, 2000);
});

// ========== T3Chat Settings ==========

/**
 * Load t3.chat settings from storage
 */
function loadT3ChatSettings(): void {
  chrome.storage.local.get(
    [STORAGE_KEYS.T3CHAT_AUTO_REFINE, STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT],
    (result) => {
      panelT3chatAutoRefine.checked =
        result[STORAGE_KEYS.T3CHAT_AUTO_REFINE] ?? DEFAULTS.T3CHAT_AUTO_REFINE;
      panelT3chatSystemPrompt.value =
        result[STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT] || "";
      updatePanelSystemPromptCharCount();
    },
  );
}

/**
 * Save t3.chat settings to storage
 */
function saveT3ChatSettings(): void {
  const systemPrompt = panelT3chatSystemPrompt.value.trim();
  chrome.storage.local.set({
    [STORAGE_KEYS.T3CHAT_AUTO_REFINE]: panelT3chatAutoRefine.checked,
    [STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT]: systemPrompt,
  });
}

/**
 * Update the system prompt character count display
 */
function updatePanelSystemPromptCharCount(): void {
  const count = panelT3chatSystemPrompt.value.length;
  panelSystemPromptCharCount.textContent = `${count} / 1000`;
  if (count > 1000) {
    panelSystemPromptCharCount.classList.add("over-limit");
  } else {
    panelSystemPromptCharCount.classList.remove("over-limit");
  }
}

// T3Chat settings section toggle
t3chatSettingsHeader.addEventListener("click", () => {
  t3chatSettingsSection.classList.toggle("collapsed");
});

// Auto-refine toggle handler
panelT3chatAutoRefine.addEventListener("change", () => {
  saveT3ChatSettings();
});

// System prompt textarea handler
panelT3chatSystemPrompt.addEventListener("input", () => {
  updatePanelSystemPromptCharCount();
});

// Save system prompt on blur (after editing)
panelT3chatSystemPrompt.addEventListener("blur", () => {
  saveT3ChatSettings();
});

// Reset button handler
panelResetSystemPrompt.addEventListener("click", () => {
  panelT3chatSystemPrompt.value = DEFAULT_T3CHAT_SYSTEM_PROMPT;
  updatePanelSystemPromptCharCount();
  saveT3ChatSettings();
});

// Listen for storage changes to sync with popup
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (changes[STORAGE_KEYS.T3CHAT_AUTO_REFINE]) {
    panelT3chatAutoRefine.checked =
      changes[STORAGE_KEYS.T3CHAT_AUTO_REFINE].newValue ??
      DEFAULTS.T3CHAT_AUTO_REFINE;
  }
  if (changes[STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT]) {
    panelT3chatSystemPrompt.value =
      changes[STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT].newValue || "";
    updatePanelSystemPromptCharCount();
  }
});

// ========== Lifecycle ==========

console.log("[Anyclick Panel] Script loading...");

// Panel visibility callbacks (called from devtools.ts)
(window as Window & { onPanelShown?: () => void }).onPanelShown = () => {
  console.log("[Anyclick Panel] Panel shown callback");
  if (!backgroundPort) {
    console.log("[Anyclick Panel] No background port, connecting...");
    connectToBackground();
  }
};

(window as Window & { onPanelHidden?: () => void }).onPanelHidden = () => {
  console.log("[Anyclick Panel] Panel hidden callback");
};

// Initialize
console.log("[Anyclick Panel] Initializing panel...");
console.log("[Anyclick Panel] chrome.devtools available:", !!chrome.devtools);
console.log(
  "[Anyclick Panel] inspectedWindow.tabId:",
  chrome.devtools?.inspectedWindow?.tabId,
);

connectToBackground();
renderEmptyState();
loadT3ChatSettings();
console.log("[Anyclick Panel] Initialization complete");
