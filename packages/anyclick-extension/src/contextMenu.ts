/**
 * Vanilla JS context menu for the Anyclick extension.
 *
 * Features:
 * - Vercel/shadcn-inspired aesthetic
 * - Dark/light theme support with manual toggle
 * - Delightful micro-interactions and animations
 * - Full keyboard navigation
 * - ARIA accessibility attributes
 */

// ========== Types ==========

export interface ExtensionMenuItem {
  type: string;
  label: string;
  icon?: string; // SVG string
  showComment?: boolean;
  children?: ExtensionMenuItem[];
  dividerBefore?: boolean; // Show divider before this item
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

export type MenuTheme = "dark" | "light";

// ========== Icons ==========

const CAPTURE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`;
const INSPECT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M10 20H4v-6"/><path d="M20 4L4 20"/></svg>`;
const BUG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>`;
const FEATURE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
const LIKE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>`;
const CHEVRON_RIGHT = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
const CHEVRON_LEFT = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
const T3CHAT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>`;
const UPLOAD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`;
const SUN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const MOON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

// ========== Default Menu Items ==========

export const DEFAULT_MENU_ITEMS: ExtensionMenuItem[] = [
  { type: "capture", label: "Capture Element", icon: CAPTURE_ICON },
  { type: "inspect", label: "Inspect in DevTools", icon: INSPECT_ICON },
  {
    type: "feedback",
    label: "Send Feedback",
    dividerBefore: true,
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
      dividerBefore: true,
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

// ========== Theme System ==========

const THEME_STORAGE_KEY = "anyclick-menu-theme";

const CSS_VARIABLES = {
  dark: `
    --ac-bg: #0a0a0a;
    --ac-bg-blur: rgba(10, 10, 10, 0.85);
    --ac-surface: #18181b;
    --ac-surface-hover: #27272a;
    --ac-border: rgba(255, 255, 255, 0.08);
    --ac-border-subtle: rgba(255, 255, 255, 0.04);
    --ac-text: #fafafa;
    --ac-text-muted: #a1a1aa;
    --ac-text-subtle: #71717a;
    --ac-accent: #3b82f6;
    --ac-accent-muted: rgba(59, 130, 246, 0.15);
    --ac-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08);
    --ac-shadow-elevated: 0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
  `,
  light: `
    --ac-bg: #ffffff;
    --ac-bg-blur: rgba(255, 255, 255, 0.85);
    --ac-surface: #f4f4f5;
    --ac-surface-hover: #e4e4e7;
    --ac-border: rgba(0, 0, 0, 0.08);
    --ac-border-subtle: rgba(0, 0, 0, 0.04);
    --ac-text: #18181b;
    --ac-text-muted: #71717a;
    --ac-text-subtle: #a1a1aa;
    --ac-accent: #2563eb;
    --ac-accent-muted: rgba(37, 99, 235, 0.1);
    --ac-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.08);
    --ac-shadow-elevated: 0 16px 48px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.1);
  `,
};

// ========== Animation Keyframes ==========

const ANIMATION_STYLES = `
  @keyframes ac-menu-enter {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  @keyframes ac-menu-exit {
    from {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to {
      opacity: 0;
      transform: scale(0.95) translateY(-4px);
    }
  }
  
  @keyframes ac-slide-left {
    from {
      opacity: 0;
      transform: translateX(8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes ac-slide-right {
    from {
      opacity: 0;
      transform: translateX(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes ac-t3chat-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(124, 58, 237, 0.3), 0 0 40px rgba(236, 72, 153, 0.2);
    }
    50% {
      box-shadow: 0 0 25px rgba(124, 58, 237, 0.4), 0 0 50px rgba(236, 72, 153, 0.3);
    }
  }
  
  @keyframes ac-icon-pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .ac-menu,
    .ac-menu * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// ========== Styles ==========

const VIEWPORT_PADDING = 10;

const getContainerStyles = (animate = true) => `
  position: fixed;
  z-index: 2147483647;
  background: var(--ac-bg-blur);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 12px;
  box-shadow: var(--ac-shadow);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  font-size: 13px;
  min-width: 220px;
  max-width: 280px;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  ${animate ? "animation: ac-menu-enter 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards;" : ""}
  contain: content;
  will-change: transform, opacity;
  transition: background 200ms ease, box-shadow 200ms ease;
`;

const getFooterStyles = () => `
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--ac-border-subtle);
  background: var(--ac-surface);
`;

const getTitleStyles = () => `
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--ac-text-muted);
`;

const getHeaderControlsStyles = () => `
  display: flex;
  align-items: center;
  gap: 4px;
`;

const getIconButtonStyles = () => `
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ac-text-muted);
  border-radius: 6px;
  transition: background 120ms ease, color 120ms ease, transform 120ms ease;
  outline: none;
`;

const getItemListStyles = () => `
  padding: 6px;
`;

const getItemStyles = () => `
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--ac-text);
  font-size: 13px;
  font-weight: 450;
  text-align: left;
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease, box-shadow 120ms ease;
  min-height: 40px;
  outline: none;
  position: relative;
`;

const getT3ChatItemStyles = () => `
  background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
  color: #ffffff;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
  margin-bottom: 4px;
`;

const getItemIconStyles = () => `
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
`;

const getItemLabelStyles = () => `
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const getSubmenuIconStyles = () => `
  opacity: 0.5;
  margin-left: auto;
  display: flex;
  align-items: center;
  transition: transform 150ms ease, opacity 150ms ease;
`;

const getBackButtonStyles = () => `
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--ac-text-muted);
  font-size: 13px;
  font-weight: 450;
  text-align: left;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
  min-height: 40px;
  margin-bottom: 4px;
  outline: none;
`;

const getBackIconStyles = () => `
  opacity: 0.7;
  display: flex;
  align-items: center;
`;

const getBackLabelStyles = () => `
  opacity: 0.8;
`;

const getDividerStyles = () => `
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--ac-border), transparent);
  margin: 6px 12px;
`;

const getCommentSectionStyles = () => `
  padding: 12px;
  border-top: 1px solid var(--ac-border-subtle);
`;

const getCommentInputStyles = () => `
  width: 100%;
  min-height: 72px;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 13px;
  color: var(--ac-text);
  background: var(--ac-surface);
  border: 1px solid var(--ac-border);
  border-radius: 8px;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 150ms ease, box-shadow 150ms ease;
`;

const getButtonRowStyles = () => `
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
`;

const getButtonStyles = () => `
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 120ms ease, transform 80ms ease, opacity 120ms ease;
  outline: none;
`;

const getCancelButtonStyles = () => `
  background: var(--ac-surface);
  color: var(--ac-text-muted);
  border: 1px solid var(--ac-border);
`;

const getSubmitButtonStyles = () => `
  background: var(--ac-accent);
  color: #ffffff;
`;

const getFocusRingStyles = () => `
  box-shadow: 0 0 0 2px var(--ac-accent-muted), 0 0 0 4px var(--ac-accent);
`;

// ========== Menu State ==========

let menuElement: HTMLElement | null = null;
let styleElement: HTMLStyleElement | null = null;
let currentCallbacks: MenuCallbacks | null = null;
let submenuStack: ExtensionMenuItem[][] = [];
let selectedType: string | null = null;
let currentView: "menu" | "comment" = "menu";
let currentTheme: MenuTheme = "dark";
let focusedIndex = -1;
let menuItems: HTMLElement[] = [];
let slideDirection: "left" | "right" | "none" = "none";

// ========== Theme Management ==========

async function loadThemePreference(): Promise<MenuTheme> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const result = await chrome.storage.local.get(THEME_STORAGE_KEY);
      if (
        result[THEME_STORAGE_KEY] === "light" ||
        result[THEME_STORAGE_KEY] === "dark"
      ) {
        return result[THEME_STORAGE_KEY];
      }
    }
  } catch {
    // Fallback to dark if storage unavailable
  }
  return "dark";
}

async function saveThemePreference(theme: MenuTheme): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme });
    }
  } catch {
    // Ignore storage errors
  }
}

function toggleTheme(): void {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  saveThemePreference(currentTheme);
  // Re-render the menu with new theme (preserves position via lastPosition)
  if (menuElement) {
    rerenderWithoutAnimation();
  }
}

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

  if (x + menuWidth > viewportWidth - VIEWPORT_PADDING) {
    x = viewportWidth - menuWidth - VIEWPORT_PADDING;
  }
  if (x < VIEWPORT_PADDING) {
    x = VIEWPORT_PADDING;
  }

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

function injectStyles(): void {
  if (styleElement) return;
  styleElement = document.createElement("style");
  styleElement.textContent = ANIMATION_STYLES;
  styleElement.setAttribute("data-anyclick-styles", "true");
  document.head.appendChild(styleElement);
}

function removeStyles(): void {
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }
}

// ========== Focus Management ==========

function updateFocusedItem(index: number): void {
  // Remove focus from all items
  menuItems.forEach((item, i) => {
    item.style.background = "transparent";
    item.style.boxShadow = "none";
    item.setAttribute("tabindex", i === index ? "0" : "-1");
  });

  // Add focus to current item
  if (index >= 0 && index < menuItems.length) {
    focusedIndex = index;
    const item = menuItems[index];
    const isT3Chat = item.getAttribute("data-type") === "t3chat";

    if (!isT3Chat) {
      item.style.background = "var(--ac-surface-hover)";
    }
    item.focus();
  }
}

function focusNextItem(): void {
  const nextIndex = focusedIndex < menuItems.length - 1 ? focusedIndex + 1 : 0;
  updateFocusedItem(nextIndex);
}

function focusPrevItem(): void {
  const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : menuItems.length - 1;
  updateFocusedItem(prevIndex);
}

// ========== Render Functions ==========

function renderFooter(): HTMLElement {
  const footer = createElement("div", getFooterStyles());
  footer.setAttribute("role", "toolbar");
  footer.setAttribute("aria-label", "Menu controls");
  footer.setAttribute("data-ac-control", "footer");

  // Prevent clicks in footer from closing the menu
  footer.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });

  const title = createElement("span", getTitleStyles());
  title.textContent = "Anyclick";
  footer.appendChild(title);

  const controls = createElement("div", getHeaderControlsStyles());

  // Theme toggle button
  const themeBtn = createElement(
    "button",
    getIconButtonStyles(),
    currentTheme === "dark" ? SUN_ICON : MOON_ICON,
  );
  themeBtn.setAttribute("data-ac-control", "theme-toggle");
  themeBtn.title = `Switch to ${currentTheme === "dark" ? "light" : "dark"} theme`;
  themeBtn.setAttribute(
    "aria-label",
    `Switch to ${currentTheme === "dark" ? "light" : "dark"} theme`,
  );
  themeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleTheme();
    themeBtn.innerHTML = currentTheme === "dark" ? SUN_ICON : MOON_ICON;
    themeBtn.title = `Switch to ${currentTheme === "dark" ? "light" : "dark"} theme`;
  });
  themeBtn.addEventListener("mouseenter", () => {
    themeBtn.style.background = "var(--ac-surface-hover)";
    themeBtn.style.color = "var(--ac-text)";
  });
  themeBtn.addEventListener("mouseleave", () => {
    themeBtn.style.background = "transparent";
    themeBtn.style.color = "var(--ac-text-muted)";
  });
  themeBtn.addEventListener("focus", () => {
    themeBtn.style.cssText = getIconButtonStyles() + getFocusRingStyles();
  });
  themeBtn.addEventListener("blur", () => {
    themeBtn.style.cssText = getIconButtonStyles();
  });
  controls.appendChild(themeBtn);

  footer.appendChild(controls);

  return footer;
}

function renderMenuItem(item: ExtensionMenuItem, index: number): HTMLElement {
  const isT3Chat = item.type === "t3chat";
  const baseStyles = isT3Chat
    ? getItemStyles() + getT3ChatItemStyles()
    : getItemStyles();
  const btn = createElement("button", baseStyles);

  // ARIA attributes
  btn.setAttribute("role", "menuitem");
  btn.setAttribute("tabindex", index === 0 ? "0" : "-1");
  btn.setAttribute("data-type", item.type);
  btn.setAttribute("data-index", String(index));

  if (item.children && item.children.length > 0) {
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
  }

  if (item.icon) {
    const iconSpan = createElement("span", getItemIconStyles(), item.icon);
    iconSpan.setAttribute("aria-hidden", "true");
    btn.appendChild(iconSpan);
  }

  const labelSpan = createElement("span", getItemLabelStyles());
  labelSpan.textContent = item.label;
  btn.appendChild(labelSpan);

  if (item.children && item.children.length > 0) {
    const chevron = createElement(
      "span",
      getSubmenuIconStyles(),
      CHEVRON_RIGHT,
    );
    chevron.setAttribute("aria-hidden", "true");
    btn.appendChild(chevron);
  }

  // Hover effects
  btn.addEventListener("mouseenter", () => {
    if (isT3Chat) {
      btn.style.transform = "translateY(-1px)";
      btn.style.boxShadow =
        "0 4px 16px rgba(124, 58, 237, 0.4), 0 0 24px rgba(236, 72, 153, 0.3)";
      // Icon pulse
      const icon = btn.querySelector("span:first-child") as HTMLElement;
      if (icon) {
        icon.style.transform = "scale(1.1)";
      }
    } else {
      btn.style.background = "var(--ac-surface-hover)";
      btn.style.transform = "translateY(-1px)";
      // Icon scale
      const icon = btn.querySelector("span:first-child") as HTMLElement;
      if (icon) {
        icon.style.transform = "scale(1.05)";
      }
    }
    // Chevron animation
    const chevron = btn.querySelector("span:last-child") as HTMLElement;
    if (chevron && item.children) {
      chevron.style.transform = "translateX(2px)";
      chevron.style.opacity = "1";
    }
    focusedIndex = index;
  });

  btn.addEventListener("mouseleave", () => {
    if (isT3Chat) {
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "0 2px 8px rgba(124, 58, 237, 0.3)";
    } else {
      btn.style.background = "transparent";
      btn.style.transform = "translateY(0)";
    }
    // Reset icon
    const icon = btn.querySelector("span:first-child") as HTMLElement;
    if (icon) {
      icon.style.transform = "scale(1)";
    }
    // Reset chevron
    const chevron = btn.querySelector("span:last-child") as HTMLElement;
    if (chevron && item.children) {
      chevron.style.transform = "translateX(0)";
      chevron.style.opacity = "0.5";
    }
  });

  // Active/press state
  btn.addEventListener("mousedown", () => {
    btn.style.transform = "scale(0.98)";
  });

  btn.addEventListener("mouseup", () => {
    btn.style.transform = isT3Chat ? "translateY(-1px)" : "translateY(-1px)";
  });

  // Focus styles
  btn.addEventListener("focus", () => {
    if (!isT3Chat) {
      btn.style.background = "var(--ac-surface-hover)";
    }
    btn.style.boxShadow = isT3Chat
      ? "0 4px 16px rgba(124, 58, 237, 0.4), 0 0 0 2px var(--ac-accent-muted)"
      : "0 0 0 2px var(--ac-accent-muted)";
  });

  btn.addEventListener("blur", () => {
    if (!isT3Chat) {
      btn.style.background = "transparent";
    }
    btn.style.boxShadow = isT3Chat
      ? "0 2px 8px rgba(124, 58, 237, 0.3)"
      : "none";
  });

  // Click handler
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleItemClick(item);
  });

  return btn;
}

function renderBackButton(): HTMLElement {
  const btn = createElement("button", getBackButtonStyles());
  btn.setAttribute("role", "menuitem");
  btn.setAttribute("tabindex", "0");
  btn.setAttribute("data-type", "back");
  btn.setAttribute("data-index", "0");

  const iconSpan = createElement("span", getBackIconStyles(), CHEVRON_LEFT);
  iconSpan.setAttribute("aria-hidden", "true");
  btn.appendChild(iconSpan);

  const labelSpan = createElement("span", getBackLabelStyles());
  labelSpan.textContent = "Back";
  btn.appendChild(labelSpan);

  btn.addEventListener("mouseenter", () => {
    btn.style.background = "var(--ac-surface-hover)";
    btn.style.color = "var(--ac-text)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "transparent";
    btn.style.color = "var(--ac-text-muted)";
  });
  btn.addEventListener("focus", () => {
    btn.style.background = "var(--ac-surface-hover)";
    btn.style.boxShadow = "0 0 0 2px var(--ac-accent-muted)";
  });
  btn.addEventListener("blur", () => {
    btn.style.background = "transparent";
    btn.style.boxShadow = "none";
  });
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleBack();
  });

  return btn;
}

function renderDivider(): HTMLElement {
  const divider = createElement("div", getDividerStyles());
  divider.setAttribute("role", "separator");
  divider.setAttribute("aria-hidden", "true");
  return divider;
}

function renderCommentForm(): HTMLElement {
  const section = createElement("div", getCommentSectionStyles());

  const textarea = createElement(
    "textarea",
    getCommentInputStyles(),
  ) as HTMLTextAreaElement;
  textarea.placeholder = "Add a comment (optional)...";
  textarea.setAttribute("aria-label", "Comment");

  textarea.addEventListener("focus", () => {
    textarea.style.borderColor = "var(--ac-accent)";
    textarea.style.boxShadow = "0 0 0 3px var(--ac-accent-muted)";
  });
  textarea.addEventListener("blur", () => {
    textarea.style.borderColor = "var(--ac-border)";
    textarea.style.boxShadow = "none";
  });
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleCommentSubmit(textarea.value);
    } else if (e.key === "Escape") {
      handleCommentCancel();
    }
  });
  section.appendChild(textarea);

  const buttonRow = createElement("div", getButtonRowStyles());

  const cancelBtn = createElement(
    "button",
    getButtonStyles() + getCancelButtonStyles(),
  );
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleCommentCancel();
  });
  cancelBtn.addEventListener("mouseenter", () => {
    cancelBtn.style.background = "var(--ac-surface-hover)";
  });
  cancelBtn.addEventListener("mouseleave", () => {
    cancelBtn.style.background = "var(--ac-surface)";
  });
  cancelBtn.addEventListener("mousedown", () => {
    cancelBtn.style.transform = "scale(0.97)";
  });
  cancelBtn.addEventListener("mouseup", () => {
    cancelBtn.style.transform = "scale(1)";
  });
  buttonRow.appendChild(cancelBtn);

  const submitBtn = createElement(
    "button",
    getButtonStyles() + getSubmitButtonStyles(),
  );
  submitBtn.textContent = "Send";
  submitBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleCommentSubmit(textarea.value);
  });
  submitBtn.addEventListener("mouseenter", () => {
    submitBtn.style.opacity = "0.9";
  });
  submitBtn.addEventListener("mouseleave", () => {
    submitBtn.style.opacity = "1";
  });
  submitBtn.addEventListener("mousedown", () => {
    submitBtn.style.transform = "scale(0.97)";
  });
  submitBtn.addEventListener("mouseup", () => {
    submitBtn.style.transform = "scale(1)";
  });
  buttonRow.appendChild(submitBtn);

  section.appendChild(buttonRow);

  // Focus textarea after render
  requestAnimationFrame(() => textarea.focus());

  return section;
}

function renderMenuItems(items: ExtensionMenuItem[]): HTMLElement {
  const list = createElement("div", getItemListStyles());
  list.setAttribute("role", "menu");
  list.setAttribute("aria-label", "Context menu");

  // Apply slide animation based on navigation direction
  if (slideDirection === "left") {
    list.style.animation =
      "ac-slide-left 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards";
  } else if (slideDirection === "right") {
    list.style.animation =
      "ac-slide-right 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards";
  }

  menuItems = [];
  let itemIndex = 0;

  if (submenuStack.length > 0) {
    const backBtn = renderBackButton();
    list.appendChild(backBtn);
    menuItems.push(backBtn);
    itemIndex++;
  }

  for (const item of items) {
    if (item.dividerBefore) {
      list.appendChild(renderDivider());
    }
    const menuItem = renderMenuItem(item, itemIndex);
    list.appendChild(menuItem);
    menuItems.push(menuItem);
    itemIndex++;
  }

  // Reset slide direction
  slideDirection = "none";

  return list;
}

function renderMenu(position: MenuPosition, items: ExtensionMenuItem[]): void {
  // Remove existing menu
  if (menuElement) {
    menuElement.remove();
  }

  // Inject animation styles
  injectStyles();

  const container = createElement(
    "div",
    getContainerStyles(!skipEntranceAnimation) + CSS_VARIABLES[currentTheme],
  );
  container.classList.add("ac-menu");
  container.setAttribute("data-anyclick-menu", "true");
  container.setAttribute("data-theme", currentTheme);
  container.setAttribute("role", "dialog");
  container.setAttribute("aria-modal", "true");
  container.setAttribute("aria-label", "Anyclick context menu");

  // Position off-screen initially for measurement
  container.style.left = "-9999px";
  container.style.top = "-9999px";

  if (currentView === "menu") {
    const currentItems =
      submenuStack.length > 0 ? submenuStack[submenuStack.length - 1] : items;
    container.appendChild(renderMenuItems(currentItems));
  } else if (currentView === "comment") {
    container.appendChild(renderCommentForm());
  }

  // Add footer at the bottom
  container.appendChild(renderFooter());

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

  // Focus first menu item after render
  if (currentView === "menu" && menuItems.length > 0) {
    requestAnimationFrame(() => {
      focusedIndex = 0;
      menuItems[0]?.focus();
    });
  }
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
    slideDirection = "left";
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
    slideDirection = "right";
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
  // Don't handle if we're in comment mode (let textarea handle it)
  if (currentView === "comment" && e.key !== "Escape") {
    return;
  }

  switch (e.key) {
    case "Escape":
      e.preventDefault();
      if (currentView === "comment") {
        handleCommentCancel();
      } else if (submenuStack.length > 0) {
        handleBack();
      } else {
        closeMenu();
      }
      break;

    case "ArrowDown":
    case "j":
      e.preventDefault();
      focusNextItem();
      break;

    case "ArrowUp":
    case "k":
      e.preventDefault();
      focusPrevItem();
      break;

    case "ArrowRight":
    case "l":
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < menuItems.length) {
        const item = menuItems[focusedIndex];
        const type = item.getAttribute("data-type");
        // Find the item and check if it has children
        const currentItems =
          submenuStack.length > 0
            ? submenuStack[submenuStack.length - 1]
            : lastItems;
        const menuItem = currentItems.find((i) => i.type === type);
        if (menuItem?.children && menuItem.children.length > 0) {
          handleItemClick(menuItem);
        }
      }
      break;

    case "ArrowLeft":
    case "h":
    case "Backspace":
      e.preventDefault();
      if (submenuStack.length > 0) {
        handleBack();
      }
      break;

    case "Enter":
    case " ":
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < menuItems.length) {
        const item = menuItems[focusedIndex];
        const type = item.getAttribute("data-type");
        if (type === "back") {
          handleBack();
        } else {
          const currentItems =
            submenuStack.length > 0
              ? submenuStack[submenuStack.length - 1]
              : lastItems;
          const menuItem = currentItems.find((i) => i.type === type);
          if (menuItem) {
            handleItemClick(menuItem);
          }
        }
      }
      break;

    case "Tab":
      // Allow tab to cycle through items
      e.preventDefault();
      if (e.shiftKey) {
        focusPrevItem();
      } else {
        focusNextItem();
      }
      break;
  }
}

function handleClickOutside(e: MouseEvent): void {
  const target = e.target as HTMLElement;

  // Don't close if clicking on a menu control (like theme toggle)
  if (target.closest?.("[data-ac-control]")) {
    return;
  }

  if (menuElement && !menuElement.contains(target)) {
    closeMenu();
  }
}

// ========== Rerender ==========

let lastPosition: MenuPosition = { x: 0, y: 0 };
let lastItems: ExtensionMenuItem[] = DEFAULT_MENU_ITEMS;
let skipEntranceAnimation = false;

function rerender(): void {
  renderMenu(lastPosition, lastItems);
}

function rerenderWithoutAnimation(): void {
  skipEntranceAnimation = true;
  renderMenu(lastPosition, lastItems);
  skipEntranceAnimation = false;
}

// ========== Public API ==========

/**
 * Show the context menu at the specified position.
 */
export async function showMenu(
  position: MenuPosition,
  callbacks: MenuCallbacks,
  items: ExtensionMenuItem[] = DEFAULT_MENU_ITEMS,
): Promise<void> {
  // Load theme preference
  currentTheme = await loadThemePreference();

  // Reset state
  submenuStack = [];
  selectedType = null;
  currentView = "menu";
  currentCallbacks = callbacks;
  lastPosition = position;
  lastItems = items;
  focusedIndex = -1;
  menuItems = [];
  slideDirection = "none";

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
    // Animate out
    menuElement.style.animation = "ac-menu-exit 100ms ease forwards";
    const element = menuElement;
    setTimeout(() => {
      element.remove();
    }, 100);
    menuElement = null;
  }

  // Cleanup
  removeStyles();
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("mousedown", handleClickOutside);

  // Notify callback
  currentCallbacks?.onClose();
  currentCallbacks = null;

  // Reset state
  submenuStack = [];
  selectedType = null;
  currentView = "menu";
  focusedIndex = -1;
  menuItems = [];
}

/**
 * Check if the menu is currently visible.
 */
export function isMenuVisible(): boolean {
  return menuElement !== null;
}

/**
 * Set the menu theme programmatically.
 */
export function setMenuTheme(theme: MenuTheme): void {
  currentTheme = theme;
  saveThemePreference(theme);
  if (menuElement) {
    rerenderWithoutAnimation();
  }
}

/**
 * Get the current menu theme.
 */
export function getMenuTheme(): MenuTheme {
  return currentTheme;
}
