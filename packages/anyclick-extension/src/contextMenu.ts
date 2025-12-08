/**
 * Vanilla JS context menu for the Anyclick extension.
 *
 * Mirrors the visual style of @ewjdev/anyclick-react ContextMenu
 * without the React dependency for minimal content script footprint.
 */

// ========== Types ==========

export interface ExtensionMenuItem {
  type: string;
  label: string;
  icon?: string; // SVG string
  showComment?: boolean;
  children?: ExtensionMenuItem[];
}

export interface MenuPosition {
  x: number;
  y: number;
}

export interface MenuCallbacks {
  onSelect: (type: string, comment?: string) => void;
  onClose: () => void;
  onInspect?: () => void;
}

// ========== Default Menu Items ==========

const CAPTURE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`;
const INSPECT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M10 20H4v-6"/><path d="M20 4L4 20"/></svg>`;
const BUG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>`;
const FEATURE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
const LIKE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>`;
const CHEVRON_RIGHT = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
const CHEVRON_LEFT = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const T3CHAT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>`;
const UPLOAD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`;

export const DEFAULT_MENU_ITEMS: ExtensionMenuItem[] = [
  { type: "capture", label: "Capture Element", icon: CAPTURE_ICON },
  { type: "inspect", label: "Inspect in DevTools", icon: INSPECT_ICON },
  {
    type: "feedback",
    label: "Send Feedback",
    children: [
      {
        type: "issue",
        label: "Report Issue",
        icon: BUG_ICON,
        showComment: true,
      },
      {
        type: "feature",
        label: "Request Feature",
        icon: FEATURE_ICON,
        showComment: true,
      },
      { type: "like", label: "I Like This", icon: LIKE_ICON },
    ],
  },
];

// Export icons for dynamic menu building
export const MENU_ICONS = {
  CAPTURE: CAPTURE_ICON,
  INSPECT: INSPECT_ICON,
  BUG: BUG_ICON,
  FEATURE: FEATURE_ICON,
  LIKE: LIKE_ICON,
  T3CHAT: T3CHAT_ICON,
  UPLOAD: UPLOAD_ICON,
} as const;

/**
 * Build menu items dynamically based on context
 */
export function buildMenuItems(options: {
  hasTextSelection?: boolean;
  isImageTarget?: boolean;
}): ExtensionMenuItem[] {
  const items: ExtensionMenuItem[] = [];

  // Add t3.chat option when text is selected (at the top for prominence)
  if (options.hasTextSelection) {
    items.push({
      type: "t3chat",
      label: "Ask t3.chat",
      icon: T3CHAT_ICON,
    });
  }

  // Add upload option when right-clicking an image
  if (options.isImageTarget) {
    items.push({
      type: "upload-image",
      label: "Upload to UploadThing",
      icon: UPLOAD_ICON,
    });
  }

  // Add standard items
  items.push(
    { type: "capture", label: "Capture Element", icon: CAPTURE_ICON },
    { type: "inspect", label: "Inspect in DevTools", icon: INSPECT_ICON },
    {
      type: "feedback",
      label: "Send Feedback",
      children: [
        {
          type: "issue",
          label: "Report Issue",
          icon: BUG_ICON,
          showComment: true,
        },
        {
          type: "feature",
          label: "Request Feature",
          icon: FEATURE_ICON,
          showComment: true,
        },
        { type: "like", label: "I Like This", icon: LIKE_ICON },
      ],
    },
  );

  return items;
}

// ========== Styles (matching anyclick-react) ==========

const VIEWPORT_PADDING = 10;

const STYLES = {
  container: `
    position: fixed;
    z-index: 2147483647;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    min-width: 200px;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
  `,
  header: `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #666666;
    border-bottom: 1px solid #e5e5e5;
  `,
  closeButton: `
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666666;
    border-radius: 4px;
    transition: background-color 0.15s;
  `,
  itemList: `
    padding: 4px 0;
  `,
  item: `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    width: 100%;
    background: transparent;
    border: none;
    color: #333333;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s;
    min-height: 38px;
  `,
  itemHover: `
    background-color: #f5f5f5;
  `,
  itemIcon: `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  `,
  itemLabel: `
    flex: 1;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  `,
  submenuIcon: `
    opacity: 0.5;
    margin-left: auto;
    display: flex;
    align-items: center;
  `,
  backButton: `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid #e5e5e5;
    color: #333333;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s;
    min-height: 38px;
    margin-bottom: 4px;
  `,
  backIcon: `
    opacity: 0.5;
    display: flex;
    align-items: center;
  `,
  backLabel: `
    opacity: 0.7;
  `,
  commentSection: `
    padding: 12px 16px;
    border-top: 1px solid #e5e5e5;
  `,
  commentInput: `
    width: 100%;
    min-height: 60px;
    padding: 8px 12px;
    font-family: inherit;
    font-size: 14px;
    color: #333333;
    background-color: #ffffff;
    border: 1px solid #dddddd;
    border-radius: 6px;
    outline: none;
    resize: vertical;
    box-sizing: border-box;
  `,
  buttonRow: `
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  `,
  button: `
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s, opacity 0.15s;
  `,
  cancelButton: `
    background-color: #f0f0f0;
    color: #666666;
  `,
  submitButton: `
    background-color: #0066cc;
    color: #ffffff;
  `,
  divider: `
    height: 1px;
    background-color: #e5e5e5;
    margin: 4px 0;
  `,
};

// ========== Menu State ==========

let menuElement: HTMLElement | null = null;
let currentCallbacks: MenuCallbacks | null = null;
let submenuStack: ExtensionMenuItem[][] = [];
let selectedType: string | null = null;
let currentView: "menu" | "comment" = "menu";

// ========== Helper Functions ==========

function calculateInViewPosition(
  requestedX: number,
  requestedY: number,
  menuWidth: number,
  menuHeight: number,
): MenuPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let x = requestedX;
  let y = requestedY;

  // Adjust X if menu would go off the right edge
  if (x + menuWidth > viewportWidth - VIEWPORT_PADDING) {
    x = viewportWidth - menuWidth - VIEWPORT_PADDING;
  }
  if (x < VIEWPORT_PADDING) {
    x = VIEWPORT_PADDING;
  }

  // Adjust Y if menu would go off the bottom edge
  if (y + menuHeight > viewportHeight - VIEWPORT_PADDING) {
    y = viewportHeight - menuHeight - VIEWPORT_PADDING;
  }
  if (y < VIEWPORT_PADDING) {
    y = VIEWPORT_PADDING;
  }

  return { x, y };
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style?: string,
  innerHTML?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (style) el.style.cssText = style;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

// ========== Render Functions ==========

function renderHeader(): HTMLElement {
  const header = createElement("div", STYLES.header);

  const title = createElement("span");
  title.textContent = "Anyclick";
  header.appendChild(title);

  const closeBtn = createElement("button", STYLES.closeButton, CLOSE_ICON);
  closeBtn.title = "Close menu (Esc)";
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMenu();
  });
  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.backgroundColor = "#e5e5e5";
  });
  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.backgroundColor = "transparent";
  });
  header.appendChild(closeBtn);

  return header;
}

function renderMenuItem(item: ExtensionMenuItem): HTMLElement {
  const btn = createElement("button", STYLES.item);

  if (item.icon) {
    const iconSpan = createElement("span", STYLES.itemIcon, item.icon);
    btn.appendChild(iconSpan);
  }

  const labelSpan = createElement("span", STYLES.itemLabel);
  labelSpan.textContent = item.label;
  btn.appendChild(labelSpan);

  if (item.children && item.children.length > 0) {
    const chevron = createElement("span", STYLES.submenuIcon, CHEVRON_RIGHT);
    btn.appendChild(chevron);
  }

  // Hover effects
  btn.addEventListener("mouseenter", () => {
    btn.style.backgroundColor = "#f5f5f5";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.backgroundColor = "transparent";
  });

  // Click handler
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleItemClick(item);
  });

  return btn;
}

function renderBackButton(): HTMLElement {
  const btn = createElement("button", STYLES.backButton);

  const iconSpan = createElement("span", STYLES.backIcon, CHEVRON_LEFT);
  btn.appendChild(iconSpan);

  const labelSpan = createElement("span", STYLES.backLabel);
  labelSpan.textContent = "Back";
  btn.appendChild(labelSpan);

  btn.addEventListener("mouseenter", () => {
    btn.style.backgroundColor = "#f5f5f5";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.backgroundColor = "transparent";
  });
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleBack();
  });

  return btn;
}

function renderCommentForm(): HTMLElement {
  const section = createElement("div", STYLES.commentSection);

  const textarea = createElement(
    "textarea",
    STYLES.commentInput,
  ) as HTMLTextAreaElement;
  textarea.placeholder = "Add a comment (optional)...";
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleCommentSubmit(textarea.value);
    } else if (e.key === "Escape") {
      handleCommentCancel();
    }
  });
  section.appendChild(textarea);

  const buttonRow = createElement("div", STYLES.buttonRow);

  const cancelBtn = createElement(
    "button",
    `${STYLES.button} ${STYLES.cancelButton}`,
  );
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleCommentCancel();
  });
  buttonRow.appendChild(cancelBtn);

  const submitBtn = createElement(
    "button",
    `${STYLES.button} ${STYLES.submitButton}`,
  );
  submitBtn.textContent = "Send";
  submitBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleCommentSubmit(textarea.value);
  });
  buttonRow.appendChild(submitBtn);

  section.appendChild(buttonRow);

  // Focus textarea after render
  requestAnimationFrame(() => textarea.focus());

  return section;
}

function renderMenuItems(items: ExtensionMenuItem[]): HTMLElement {
  const list = createElement("div", STYLES.itemList);

  if (submenuStack.length > 0) {
    list.appendChild(renderBackButton());
  }

  for (const item of items) {
    list.appendChild(renderMenuItem(item));
  }

  return list;
}

function renderMenu(position: MenuPosition, items: ExtensionMenuItem[]): void {
  // Remove existing menu
  if (menuElement) {
    menuElement.remove();
  }

  const container = createElement("div", STYLES.container);
  container.setAttribute("data-anyclick-menu", "true");

  // Position off-screen initially for measurement
  container.style.left = "-9999px";
  container.style.top = "-9999px";

  container.appendChild(renderHeader());

  if (currentView === "menu") {
    const currentItems =
      submenuStack.length > 0 ? submenuStack[submenuStack.length - 1] : items;
    container.appendChild(renderMenuItems(currentItems));
  } else if (currentView === "comment") {
    container.appendChild(renderCommentForm());
  }

  document.body.appendChild(container);
  menuElement = container;

  // Calculate in-view position after rendering
  const rect = container.getBoundingClientRect();
  const adjusted = calculateInViewPosition(
    position.x,
    position.y,
    rect.width,
    rect.height,
  );
  container.style.left = `${adjusted.x}px`;
  container.style.top = `${adjusted.y}px`;
}

// ========== Event Handlers ==========

function handleItemClick(item: ExtensionMenuItem): void {
  console.log("[Anyclick ContextMenu] Item clicked:", {
    type: item.type,
    label: item.label,
    hasChildren: !!(item.children && item.children.length > 0),
  });

  if (item.children && item.children.length > 0) {
    submenuStack.push(item.children);
    rerender();
    return;
  }

  // Special handling for inspect
  if (item.type === "inspect") {
    console.log("[Anyclick ContextMenu] Inspect clicked, calling onInspect");
    console.log(
      "[Anyclick ContextMenu] onInspect callback exists:",
      !!currentCallbacks?.onInspect,
    );
    currentCallbacks?.onInspect?.();
    closeMenu();
    return;
  }

  if (item.showComment) {
    selectedType = item.type;
    currentView = "comment";
    rerender();
    return;
  }

  // Direct selection
  currentCallbacks?.onSelect(item.type);
  closeMenu();
}

function handleBack(): void {
  if (submenuStack.length > 0) {
    submenuStack.pop();
    rerender();
  }
}

function handleCommentSubmit(comment: string): void {
  if (selectedType) {
    currentCallbacks?.onSelect(selectedType, comment || undefined);
    closeMenu();
  }
}

function handleCommentCancel(): void {
  selectedType = null;
  currentView = "menu";
  rerender();
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    if (currentView === "comment") {
      handleCommentCancel();
    } else if (submenuStack.length > 0) {
      handleBack();
    } else {
      closeMenu();
    }
  }
}

function handleClickOutside(e: MouseEvent): void {
  if (menuElement && !menuElement.contains(e.target as Node)) {
    closeMenu();
  }
}

// ========== Rerender ==========

let lastPosition: MenuPosition = { x: 0, y: 0 };
let lastItems: ExtensionMenuItem[] = DEFAULT_MENU_ITEMS;

function rerender(): void {
  renderMenu(lastPosition, lastItems);
}

// ========== Public API ==========

/**
 * Show the context menu at the specified position.
 */
export function showMenu(
  position: MenuPosition,
  callbacks: MenuCallbacks,
  items: ExtensionMenuItem[] = DEFAULT_MENU_ITEMS,
): void {
  // Reset state
  submenuStack = [];
  selectedType = null;
  currentView = "menu";
  currentCallbacks = callbacks;
  lastPosition = position;
  lastItems = items;

  renderMenu(position, items);

  // Attach global listeners
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("mousedown", handleClickOutside);
}

/**
 * Close the context menu.
 */
export function closeMenu(): void {
  if (menuElement) {
    menuElement.remove();
    menuElement = null;
  }

  // Cleanup listeners
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("mousedown", handleClickOutside);

  // Notify callback
  currentCallbacks?.onClose();
  currentCallbacks = null;

  // Reset state
  submenuStack = [];
  selectedType = null;
  currentView = "menu";
}

/**
 * Check if the menu is currently visible.
 */
export function isMenuVisible(): boolean {
  return menuElement !== null;
}
