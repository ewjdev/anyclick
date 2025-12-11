import React, { useCallback, useEffect, useState } from "react";
import { Root, createRoot } from "react-dom/client";
import { DEFAULTS, STORAGE_KEYS } from "./types";

const HOST_ID = "anyclick-react-shadow-host";
const APP_ID = "anyclick-react-app";

let root: Root | null = null;
let shadowHost: HTMLElement | null = null;

type OverlayState = "ready" | "inactive" | "error";

// Minimal styles so the overlay stays styled even if Tailwind CSS
// cannot be fetched (e.g., during HMR when extension context is invalid).
// This only covers the classes used in this file.
const FALLBACK_OVERLAY_STYLES = `
.ac\\:fixed { position: fixed; }
.ac\\:bottom-20 { bottom: 1rem; }
.ac\\:right-20 { right: 1rem; }
.ac\\:w-12 { width: 3rem; }
.ac\\:h-12 { height: 3rem; }
.ac\\:cursor-pointer { cursor: pointer; }
.ac\\:cursor-default { cursor: default; }
.ac\\:transition-transform { transition-property: transform; }
.ac\\:transition-all { transition-property: all; }
.ac\\:duration-200 { transition-duration: 200ms; }
.ac\\:transform { transform: translateZ(0); }
.ac\\:scale-100 { transform: scale(1); }
.ac\\:hover\\:ac\\:scale-110:hover { transform: scale(1.1); }
.ac\\:w-full { width: 100%; }
.ac\\:h-full { height: 100%; }
.ac\\:object-contain { object-fit: contain; }
.ac\\:drop-shadow-\\[0_0_8px_rgba\\(0,0,0,0\\.3\\)\\] { filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.3)); }
.ac\\:absolute { position: absolute; }
.ac\\:-top-0\\.5 { top: -0.125rem; }
.ac\\:-right-0\\.5 { right: -0.125rem; }
.ac\\:w-3 { width: 0.75rem; }
.ac\\:h-3 { height: 0.75rem; }
.ac\\:rounded-full { border-radius: 9999px; }
.ac\\:border-2 { border-width: 2px; }
.ac\\:border-white { border-color: #fff; }
.ac\\:flex { display: flex; }
.ac\\:items-center { align-items: center; }
.ac\\:justify-center { justify-content: center; }
.ac\\:text-white { color: #fff; }
.ac\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
.ac\\:font-bold { font-weight: 700; }
`;

/**
 * Check if extension context is still valid
 */
function isExtensionContextValid(): boolean {
  try {
    // This will throw if context is invalidated
    return !!chrome?.runtime?.id;
  } catch {
    return false;
  }
}

/**
 * Safely get extension resource URL
 */
function getExtensionURL(path: string): string | null {
  if (!isExtensionContextValid()) {
    return null;
  }
  try {
    const url = chrome.runtime.getURL(path);
    // Check if URL is valid (not "chrome-extension://invalid/")
    if (url && !url.includes("invalid")) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

function OverlayApp() {
  // Get icon URL using chrome.runtime.getURL for shadow DOM compatibility
  const ANYCLICK_LOGO = getExtensionURL("icons/icon48.png");
  const [state, setState] = useState<OverlayState>("inactive");

  // Check extension state
  const checkState = useCallback(() => {
    if (!chrome?.storage?.local) {
      setState("error");
      return;
    }

    chrome.storage.local.get(
      [STORAGE_KEYS.ENABLED, STORAGE_KEYS.CUSTOM_MENU_OVERRIDE],
      (result) => {
        try {
          const extensionEnabled =
            result[STORAGE_KEYS.ENABLED] ?? DEFAULTS.ENABLED;
          const menuOverride =
            result[STORAGE_KEYS.CUSTOM_MENU_OVERRIDE] ??
            DEFAULTS.CUSTOM_MENU_OVERRIDE;

          // Ready if both enabled, inactive otherwise
          if (extensionEnabled && menuOverride) {
            setState("ready");
          } else {
            setState("inactive");
          }
        } catch {
          setState("error");
        }
      },
    );
  }, []);

  // Listen for storage changes
  useEffect(() => {
    checkState();

    if (chrome?.storage?.onChanged) {
      const listener = (
        changes: Record<string, chrome.storage.StorageChange>,
        areaName: string,
      ) => {
        if (areaName !== "local") return;
        if (
          changes[STORAGE_KEYS.ENABLED] ||
          changes[STORAGE_KEYS.CUSTOM_MENU_OVERRIDE]
        ) {
          checkState();
        }
      };

      chrome.storage.onChanged.addListener(listener);
      return () => {
        chrome.storage.onChanged.removeListener(listener);
      };
    }
  }, [checkState]);

  // Show fallback message when popup can't be opened programmatically
  const showFallbackMessage = useCallback(() => {
    const event = new CustomEvent("anyclick-overlay-click", {
      detail: {
        message: "Click the Anyclick extension icon in your toolbar",
        action: "popup-fallback",
      },
      bubbles: true,
    });
    document.dispatchEvent(event);
  }, []);

  // Handle click - enable Anyclick if inactive, open popup if ready
  const handleClick = useCallback(() => {
    if (state === "error") {
      return; // Don't do anything on error state
    }

    if (state === "inactive") {
      // Enable Anyclick by setting both settings to true
      try {
        chrome.storage.local.set(
          {
            [STORAGE_KEYS.ENABLED]: true,
            [STORAGE_KEYS.CUSTOM_MENU_OVERRIDE]: true,
          },
          () => {
            console.log("[Anyclick Overlay] Extension enabled");
            // Dispatch event to notify content script
            const event = new CustomEvent("anyclick-overlay-click", {
              detail: {
                message: "Anyclick enabled",
                action: "enabled",
              },
              bubbles: true,
            });
            document.dispatchEvent(event);
          },
        );
      } catch (error) {
        console.error("[Anyclick Overlay] Error enabling extension:", error);
      }
    } else if (state === "ready") {
      // Try to open the popup
      try {
        chrome.runtime.sendMessage(
          { type: "OPEN_POPUP", timestamp: new Date().toISOString() },
          (response) => {
            if (chrome.runtime.lastError) {
              console.warn(
                "[Anyclick Overlay] Error sending message:",
                chrome.runtime.lastError.message,
              );
              showFallbackMessage();
              return;
            }

            if (!response?.success) {
              console.log(
                "[Anyclick Overlay] Popup open failed, showing fallback",
              );
              showFallbackMessage();
            }
          },
        );
      } catch (error) {
        console.error("[Anyclick Overlay] Error opening popup:", error);
        showFallbackMessage();
      }
    }
  }, [state, showFallbackMessage]);

  // Handle right-click - disable Anyclick if it's on
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent the context menu from appearing
      e.stopPropagation();

      if (state === "ready") {
        // Disable Anyclick by setting both settings to false
        try {
          chrome.storage.local.set(
            {
              [STORAGE_KEYS.ENABLED]: false,
              [STORAGE_KEYS.CUSTOM_MENU_OVERRIDE]: false,
            },
            () => {
              console.log("[Anyclick Overlay] Extension disabled");
              // Dispatch event to notify content script
              const event = new CustomEvent("anyclick-overlay-click", {
                detail: {
                  message: "Anyclick disabled",
                  action: "disabled",
                },
                bubbles: true,
              });
              document.dispatchEvent(event);
            },
          );
        } catch (error) {
          console.error("[Anyclick Overlay] Error disabling extension:", error);
        }
      }
    },
    [state],
  );

  // Determine icon color based on state
  const getIconColor = () => {
    switch (state) {
      case "ready":
        return "#10b981"; // green
      case "error":
        return "#ef4444"; // red
      case "inactive":
      default:
        return "#6b7280"; // grey
    }
  };

  // Get CSS filter to tint the logo image based on state
  const getLogoFilter = () => {
    switch (state) {
      case "ready":
        // Green tint: brightness + saturate + hue-rotate to approximate #10b981
        return "brightness(0.8) saturate(1.2) hue-rotate(20deg)";
      case "error":
        // Red tint: brightness + saturate to approximate #ef4444
        return "brightness(0.9) saturate(1.5) hue-rotate(0deg)";
      case "inactive":
      default:
        // Grey: desaturate and reduce brightness to approximate #6b7280
        return "brightness(0.6) saturate(0)";
    }
  };

  const isClickable = state === "inactive" || state === "ready";
  const logoColor = getIconColor();
  const logoFilter = getLogoFilter();

  return (
    <div
      data-anyclick-root
      onClick={isClickable ? handleClick : undefined}
      onContextMenu={handleContextMenu}
      className={`ac:fixed ac:bottom-20 ac:right-20 ac:w-12 ac:h-12 ${isClickable ? "ac:cursor-pointer ac:hover:ac:scale-110" : "ac:cursor-default"} ac:transition-transform ac:duration-200 ac:transform ac:scale-100`}
      style={{ zIndex: 2147483646 }}
      title={
        state === "inactive"
          ? "Click to enable Anyclick"
          : state === "ready"
            ? "Click to open settings • Right-click to disable"
            : "Anyclick error"
      }
    >
      {ANYCLICK_LOGO ? (
        <img
          src={ANYCLICK_LOGO}
          alt="Anyclick"
          className="ac:w-full ac:h-full ac:object-contain ac:drop-shadow-[0_0_8px_rgba(0,0,0,0.3)] ac:transition-all ac:duration-200"
          style={{
            filter: logoFilter,
            transition: "filter 200ms ease-in-out",
          }}
        />
      ) : (
        <div
          className="ac:w-full ac:h-full ac:rounded-full ac:flex ac:items-center ac:justify-center ac:text-white ac:text-2xl ac:font-bold"
          style={{
            backgroundColor: logoColor,
          }}
        >
          A
        </div>
      )}
      {/* Status indicator ring */}
      {/* <div
        className="ac:absolute ac:-top-0.5 ac:-right-0.5 ac:w-3 ac:h-3 ac:rounded-full ac:border-2 ac:border-white"
        style={{
          backgroundColor: iconColor,
          boxShadow: `0 0 4px ${iconColor}`,
        }}
      /> */}
    </div>
  );
}

async function injectTailwindStyles(shadow: ShadowRoot): Promise<void> {
  // Check if styles are already injected
  if (shadow.getElementById("anyclick-tailwind-styles")) {
    return;
  }

  // Check if extension context is valid
  if (!isExtensionContextValid()) {
    console.warn(
      "[Anyclick Overlay] Extension context invalidated, skipping Tailwind CSS injection",
    );
    return;
  }

  try {
    // Get the CSS file URL from the extension
    const cssUrl = getExtensionURL("popup.css");
    if (!cssUrl) {
      console.warn(
        "[Anyclick Overlay] Could not get CSS URL, extension context may be invalidated",
      );
      return;
    }

    // Fetch the CSS content
    const response = await fetch(cssUrl);
    if (!response.ok) {
      console.warn(
        "[Anyclick Overlay] Failed to load Tailwind CSS, using fallback",
      );
      return;
    }

    const cssText = await response.text();

    // Create and inject style element into shadow root
    const styleElement = document.createElement("style");
    styleElement.id = "anyclick-tailwind-styles";
    styleElement.textContent = cssText;
    shadow.appendChild(styleElement);
  } catch (error) {
    console.error("[Anyclick Overlay] Error injecting Tailwind CSS:", error);
  }
}

function injectFallbackStyles(shadow: ShadowRoot): void {
  if (shadow.getElementById("anyclick-overlay-fallback-styles")) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.id = "anyclick-overlay-fallback-styles";
  styleElement.textContent = FALLBACK_OVERLAY_STYLES;
  shadow.appendChild(styleElement);
}

function ensureShadowHost(): HTMLElement {
  const existing = document.getElementById(HOST_ID);
  if (existing) return existing;
  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  host.style.zIndex = "2147483646";
  document.documentElement.appendChild(host);
  shadowHost = host;
  return host;
}

export async function mountOverlay() {
  if (root) return;

  // Check if extension context is valid before proceeding
  if (!isExtensionContextValid()) {
    console.warn(
      "[Anyclick Overlay] Extension context invalidated, cannot mount overlay",
    );
    return;
  }

  const host = ensureShadowHost();
  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });

  // Always inject minimal fallback styles so overlay remains styled even if Tailwind fails to load
  injectFallbackStyles(shadow);

  // Inject Tailwind CSS into shadow DOM
  await injectTailwindStyles(shadow);

  // Host for React
  let app = shadow.getElementById(APP_ID);
  if (!app) {
    app = document.createElement("div");
    app.id = APP_ID;
    shadow.appendChild(app);
  }

  root = createRoot(app);
  root.render(<OverlayApp />);
}

export function unmountOverlay() {
  if (root) {
    root.unmount();
    root = null;
  }
  if (shadowHost?.parentElement) {
    shadowHost.parentElement.removeChild(shadowHost);
    shadowHost = null;
  }
}
