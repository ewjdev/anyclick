import { defineConfig } from "tsup";

const define = {
  "process.env.NODE_ENV": JSON.stringify("production"),
  // Ensure process is defined for browser builds; avoids runtime ReferenceError
  process: "{}",
};

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
    define,
    esbuildOptions(options) {
      options.conditions = ["style", "import", "module", "default"];
    },
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
    define,
    esbuildOptions(options) {
      options.conditions = ["style", "import", "module", "default"];
    },
  },
  // Popup script (React)
  {
    entry: { popup: "src/popup/index.tsx" },
    format: ["iife"],
    outDir: "dist",
    outExtension: () => ({ js: ".js" }),
    clean: false,
    minify: true,
    sourcemap: false,
    splitting: false,
    noExternal: [/.*/],
    globalName: "AnyclickPopup",
    define,
    esbuildOptions(options) {
      options.conditions = ["style", "import", "module", "default"];
      options.jsx = "automatic";
    },
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
    define,
    esbuildOptions(options) {
      options.conditions = ["style", "import", "module", "default"];
    },
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
    define,
    esbuildOptions(options) {
      options.conditions = ["style", "import", "module", "default"];
    },
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
    define,
    esbuildOptions(options) {
      options.conditions = ["style", "import", "module", "default"];
    },
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
    define,
    esbuildOptions(options) {
      options.conditions = ["style", "import", "module", "default"];
    },
  },
]);
