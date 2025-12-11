import React from "react";
import { type Root, createRoot } from "react-dom/client";
import CustomPointer from "./CustomPointer";

const POINTER_HOST_ID = "anyclick-pointer-root";

let pointerRoot: Root | null = null;
let pointerHost: HTMLElement | null = null;

function ensureHost(): HTMLElement {
  // Check if host already exists and is in DOM
  const existing = document.getElementById(POINTER_HOST_ID);
  if (existing) {
    console.log("[Anyclick][pointer] ensureHost: found existing host", {
      parent: existing.parentElement?.tagName,
      inBody: document.body.contains(existing),
      inDocumentElement: document.documentElement.contains(existing),
    });
    pointerHost = existing;
    return existing;
  }

  console.log("[Anyclick][pointer] ensureHost: creating new host");

  const host = document.createElement("div");
  host.id = POINTER_HOST_ID;

  // Minimal styles - let the pointer component handle most styling
  host.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 0 !important;
    height: 0 !important;
    overflow: visible !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
  `;
  host.setAttribute("aria-hidden", "true");

  // Append to document.documentElement (html element) to avoid body styling issues
  document.documentElement.appendChild(host);
  pointerHost = host;

  console.log("[Anyclick][pointer] ensureHost: host created and appended", {
    parent: host.parentElement?.tagName,
    inDOM: document.documentElement.contains(host),
  });

  return host;
}

export function mountPointer(enabled: boolean = true): void {
  console.log("[Anyclick][pointer] mountPointer called", {
    enabled,
    existingHost: !!document.getElementById(POINTER_HOST_ID),
    existingRoot: !!pointerRoot,
  });

  if (!enabled) {
    unmountPointer();
    return;
  }

  const host = ensureHost();

  if (!pointerRoot) {
    console.log("[Anyclick][pointer] Creating React root");
    pointerRoot = createRoot(host);
  }

  console.log("[Anyclick][pointer] Rendering CustomPointer");
  pointerRoot.render(<CustomPointer enabled={enabled} />);

  // Verify render after a tick
  setTimeout(() => {
    console.log("[Anyclick][pointer] Post-render verification", {
      hostChildren: host.childElementCount,
      hostInnerHTML: host.innerHTML.substring(0, 300),
      pointerElement: !!host.querySelector("[data-anyclick-pointer]"),
    });
  }, 100);
}

export function updatePointerEnabled(enabled: boolean): void {
  console.log("[Anyclick][pointer] updatePointerEnabled", { enabled });
  mountPointer(enabled);
}

export function unmountPointer(): void {
  console.log("[Anyclick][pointer] unmountPointer called");

  if (pointerRoot) {
    pointerRoot.unmount();
    pointerRoot = null;
  }

  if (pointerHost?.parentElement) {
    pointerHost.parentElement.removeChild(pointerHost);
  }
  pointerHost = null;

  // Also clean up cursor hide style
  document.getElementById("anyclick-pointer-cursor-hide")?.remove();
}
