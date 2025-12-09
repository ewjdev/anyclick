import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// Library-friendly Vite config: externals react/react-dom, keeps tsup for dts.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    // Let Tailwind/PostCSS handle styling; classes are prefixed via config.
    postcss: path.resolve(__dirname, "postcss.config.cjs"),
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "AnyclickReact",
      fileName: (fmt) => `index.${fmt}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["react", "react-dom"],
    },
    sourcemap: true,
  },
});
