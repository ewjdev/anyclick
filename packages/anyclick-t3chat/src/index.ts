// T3.Chat Adapter
export { T3ChatAdapter, createT3ChatAdapter } from "./t3chatAdapter";

// Utilities
export {
  buildT3ChatUrl,
  DEFAULT_T3CHAT_BASE_URL,
  getSelectedText,
  getTextSelectionContext,
  hasTextSelection,
  navigateToUrl,
} from "./utils";

// Types
export type {
  T3ChatAdapterOptions,
  T3ChatResult,
  TextSelectionContext,
} from "./types";
