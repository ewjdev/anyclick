import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  external: ["react", "react-dom"],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    process: "{}",
  },
  esbuildOptions(options) {
    // Allow tailwindcss v4 style export to resolve
    options.conditions = ["style", "import", "module", "default"];
    options.banner ??= {};
  },
});
