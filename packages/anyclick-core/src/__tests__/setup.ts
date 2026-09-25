import { vi } from "vitest";

if (typeof CSS === "undefined" || !CSS.escape) {
  (globalThis as unknown as { CSS: { escape: (str: string) => string } }).CSS =
    {
      escape: (str: string) =>
        str.replace(/([^\w-])/g, (match) => `\\${match}`),
    };
}
