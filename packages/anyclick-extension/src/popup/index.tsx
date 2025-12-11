import React from "react";
import { createRoot } from "react-dom/client";
import { PopupApp } from "./PopupApp";

// CSS is built separately via Tailwind CLI and loaded via <link> in popup.html

// Mount the React popup
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
} else {
  console.error("[Anyclick Popup] Could not find #root element");
}
