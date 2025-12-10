import type { ContextMenuItem } from "@ewjdev/anyclick-react";

export function parseMenuItems(code: string): ContextMenuItem[] | null {
  try {
    const match = code.match(/const\s+menuItems\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) return null;

    const fn = new Function(`return ${match[1]}`);
    const result = fn();

    if (!Array.isArray(result)) return null;

    return result.filter(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.label === "string" &&
        typeof item.type === "string",
    );
  } catch {
    return null;
  }
}
