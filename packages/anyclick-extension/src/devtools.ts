/**
 * DevTools entry point for Anyclick extension.
 *
 * Creates the Anyclick panel in Chrome DevTools.
 */

console.log("[Anyclick DevTools] Script loading...");
console.log(
  "[Anyclick DevTools] chrome.devtools available:",
  !!chrome.devtools,
);
console.log(
  "[Anyclick DevTools] inspectedWindow.tabId:",
  chrome.devtools?.inspectedWindow?.tabId,
);

// Create the Anyclick panel in DevTools
console.log("[Anyclick DevTools] Creating panel...");
chrome.devtools.panels.create(
  "Anyclick", // Panel title
  "icons/icon16.png", // Icon path
  "panel.html", // Panel page
  (panel) => {
    console.log("[Anyclick DevTools] Panel created successfully:", panel);

    // Track panel visibility for optimization
    let panelWindow: Window | null = null;

    panel.onShown.addListener((window) => {
      panelWindow = window;
      console.log("[Anyclick DevTools] Panel shown, window:", !!panelWindow);

      // Notify panel that it's now visible
      if (
        panelWindow &&
        (panelWindow as Window & { onPanelShown?: () => void }).onPanelShown
      ) {
        console.log("[Anyclick DevTools] Calling onPanelShown callback");
        (panelWindow as Window & { onPanelShown?: () => void }).onPanelShown!();
      }
    });

    panel.onHidden.addListener(() => {
      console.log("[Anyclick DevTools] Panel hidden");

      // Notify panel that it's now hidden
      if (
        panelWindow &&
        (panelWindow as Window & { onPanelHidden?: () => void }).onPanelHidden
      ) {
        console.log("[Anyclick DevTools] Calling onPanelHidden callback");
        (panelWindow as Window & { onPanelHidden?: () => void })
          .onPanelHidden!();
      }

      panelWindow = null;
    });
  },
);

// Listen for element selection in Elements panel (optional integration)
chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
  // Get info about selected element in Elements panel
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      const el = $0;
      if (!el) return null;
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classes: Array.from(el.classList),
        selector: el.id ? '#' + el.id : el.tagName.toLowerCase()
      };
    })()`,
    (result, exceptionInfo) => {
      if (exceptionInfo) {
        console.error(
          "[Anyclick DevTools] Error getting selection:",
          exceptionInfo,
        );
        return;
      }

      if (result) {
        console.log("[Anyclick DevTools] Elements panel selection:", result);
        // Could broadcast this to the panel if needed
      }
    },
  );
});
