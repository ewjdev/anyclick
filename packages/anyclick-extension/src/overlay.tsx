import React, { useEffect } from "react";
import { Root, createRoot } from "react-dom/client";

const HOST_ID = "anyclick-react-shadow-host";
const APP_ID = "anyclick-react-app";

let root: Root | null = null;
let shadowHost: HTMLElement | null = null;

function OverlayApp() {
  useEffect(() => {
    // Placeholder: wire menu/quickchat here using shared components.
    return () => {
      /* cleanup if needed */
    };
  }, []);

  return (
    <div
      data-anyclick-root
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        background: "var(--ac-surface, #0f172a)",
        color: "var(--ac-text, #e5e7eb)",
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        minWidth: "220px",
      }}
    >
      <div style={{ fontSize: "12px", marginBottom: "4px", opacity: 0.7 }}>
        Anyclick overlay (React, Shadow DOM)
      </div>
      <div style={{ fontSize: "13px" }}>Ready to render shared components.</div>
    </div>
  );
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

export function mountOverlay() {
  if (root) return;
  const host = ensureShadowHost();
  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });

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
