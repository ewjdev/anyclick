import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Library-friendly Vite config: externals react/react-dom, keeps tsup for dts.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: new URL("./src/index.ts", import.meta.url).pathname,
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
