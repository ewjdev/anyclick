/**
 * QuickChat module exports.
 *
 * @module QuickChat
 * @since 3.1.0
 */
export { QuickChat } from "./QuickChat";
export { useQuickChat } from "./useQuickChat";
export { quickChatStyles, quickChatKeyframes } from "./styles";
export {
  useQuickChatStore,
  useActiveMessages,
  useMessagesCount,
  generateMessageId,
} from "./store";
export type { QuickChatStore } from "./store";
export type {
  ChatMessage,
  ContextChunk,
  QuickAction,
  QuickChatConfig,
  QuickChatProps,
  QuickChatState,
  SuggestedPrompt,
  T3ChatIntegrationConfig,
} from "./types";
export { DEFAULT_QUICK_CHAT_CONFIG } from "./types";
