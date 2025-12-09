import path from "path";
import { defineConfig } from "vite";

// Vite build for extension surfaces. We keep tsup for types; Vite handles bundling.
export default defineConfig({
  css: {
    postcss: path.resolve(__dirname, "postcss.config.cjs"),
  },
  build: {
    outDir: "dist/vite",
    sourcemap: true,
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, "src/background.ts"),
        content: path.resolve(__dirname, "src/content.ts"),
        popup: path.resolve(__dirname, "src/popup.ts"),
        panel: path.resolve(__dirname, "src/panel.ts"),
        devtools: path.resolve(__dirname, "src/devtools.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    target: "esnext",
  },
});
