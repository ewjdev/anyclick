import { defineConfig } from "tsup";

export default defineConfig([
  // Background service worker
  {
    entry: { background: "src/background.ts" },
    format: ["esm"],
    outDir: "dist",
    outExtension: () => ({ js: ".mjs" }),
    clean: true,
    minify: true,
    sourcemap: false,
    splitting: false,
    noExternal: [/.*/],
  },
  // Content script (injected into pages)
  {
    entry: { content: "src/content.ts" },
    format: ["iife"],
    outDir: "dist",
    outExtension: () => ({ js: ".js" }),
    clean: false,
    minify: true,
    sourcemap: false,
    splitting: false,
    noExternal: [/.*/],
    globalName: "AnyclickContent",
  },
  // Popup script
  {
    entry: { popup: "src/popup.ts" },
    format: ["iife"],
    outDir: "dist",
    outExtension: () => ({ js: ".js" }),
    clean: false,
    minify: true,
    sourcemap: false,
    splitting: false,
    noExternal: [/.*/],
    globalName: "AnyclickPopup",
  },
  // DevTools entry script
  {
    entry: { devtools: "src/devtools.ts" },
    format: ["iife"],
    outDir: "dist",
    outExtension: () => ({ js: ".js" }),
    clean: false,
    minify: true,
    sourcemap: false,
    splitting: false,
    noExternal: [/.*/],
    globalName: "AnyclickDevTools",
  },
  // DevTools panel script
  {
    entry: { panel: "src/panel.ts" },
    format: ["iife"],
    outDir: "dist",
    outExtension: () => ({ js: ".js" }),
    clean: false,
    minify: true,
    sourcemap: false,
    splitting: false,
    noExternal: [/.*/],
    globalName: "AnyclickPanel",
  },
  // Inspector window script (standalone popup)
  {
    entry: { inspector: "src/inspector.ts" },
    format: ["iife"],
    outDir: "dist",
    outExtension: () => ({ js: ".js" }),
    clean: false,
    minify: true,
    sourcemap: false,
    splitting: false,
    noExternal: [/.*/],
    globalName: "AnyclickInspector",
  },
  // Types export (for consumers who want to work with payloads)
  {
    entry: { types: "src/index.ts" },
    format: ["esm", "cjs"],
    outDir: "dist",
    clean: false,
    dts: true,
    sourcemap: false,
    splitting: false,
  },
]);
