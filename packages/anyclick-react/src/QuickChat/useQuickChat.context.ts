import { getElementInspectInfo } from "@ewjdev/anyclick-core";
import type { ContextChunk } from "./types";

/**
 * Extracts context chunks from the target element.
 *
 * Note: `containerElement` is currently unused, but kept in the signature to
 * allow future enhancements (e.g. walking a scoped subtree) without changing
 * the hook API.
 */
export function extractContextChunks(
  targetElement: Element | null,
  _containerElement: Element | null,
): ContextChunk[] {
  const chunks: ContextChunk[] = [];
  if (!targetElement) return chunks;

  try {
    const info = getElementInspectInfo(targetElement);

    const tagContent = `<${info.tagName.toLowerCase()}${
      info.id ? ` id="${info.id}"` : ""
    }${
      info.classNames.length > 0 ? ` class="${info.classNames.join(" ")}"` : ""
    }>`;
    chunks.push({
      id: "element-tag",
      label: "Element Tag",
      content: tagContent,
      type: "element",
      included: true,
      size: tagContent.length,
    });

    if (info.innerText && info.innerText.length > 0) {
      const textContent = info.innerText.slice(0, 200);
      chunks.push({
        id: "element-text",
        label: "Text Content",
        content: textContent,
        type: "text",
        included: true,
        size: textContent.length,
      });
    }

    if (info.computedStyles) {
      const styleEntries: string[] = [];
      for (const [, styles] of Object.entries(info.computedStyles)) {
        if (styles && typeof styles === "object") {
          const entries = Object.entries(styles).slice(0, 2);
          for (const [k, v] of entries) {
            if (v) styleEntries.push(`${k}: ${v}`);
          }
        }
        if (styleEntries.length >= 8) break;
      }
      const stylesContent = styleEntries.join("; ");
      if (stylesContent) {
        chunks.push({
          id: "element-styles",
          label: "Key Styles",
          content: stylesContent,
          type: "element",
          included: true,
          size: stylesContent.length,
        });
      }
    }

    if (info.accessibility) {
      const a11yContent = [
        info.accessibility.role && `role="${info.accessibility.role}"`,
        info.accessibility.accessibleName &&
          `aria-label="${info.accessibility.accessibleName}"`,
      ]
        .filter(Boolean)
        .join(", ");

      if (a11yContent) {
        chunks.push({
          id: "element-a11y",
          label: "Accessibility",
          content: a11yContent,
          type: "element",
          included: true,
          size: a11yContent.length,
        });
      }
    }

    if (info.boxModel) {
      const boxContent = `${Math.round(info.boxModel.content.width)}x${Math.round(
        info.boxModel.content.height,
      )}px`;
      chunks.push({
        id: "element-dimensions",
        label: "Dimensions",
        content: boxContent,
        type: "element",
        included: true,
        size: boxContent.length,
      });
    }
  } catch (error) {
    console.error("[useQuickChat] Failed to extract context:", error);
  }

  return chunks;
}

/**
 * Builds the context string from included chunks.
 */
export function buildContextString(chunks: ContextChunk[]): string {
  const included = chunks.filter((c) => c.included);
  if (included.length === 0) return "";
  return included.map((c) => `[${c.label}]: ${c.content}`).join("\n");
}
