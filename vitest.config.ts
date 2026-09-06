import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": resolve(__dirname, "apps/web/src") } },
  test: {
    include: ["tests/showcase/**/*.test.{ts,tsx}"],
    environment: "node",
    restoreMocks: true,
  },
});
