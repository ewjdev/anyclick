/**
 * Zustand store for QuickChat with 24h localStorage persistence.
 *
 * @module QuickChat/store
 * @since 3.1.0
 */
"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChatMessage, ContextChunk, SuggestedPrompt } from "./types";

const STORE_NAME = "anyclick-quick-chat-store";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Generate a unique message ID.
 */
export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Stored message with expiry timestamp.
 */
interface StoredMessage extends ChatMessage {
  /** Unix timestamp when this message expires */
  expiresAt: number;
}

/**
 * Chat store state.
 */
export interface QuickChatStore {
  /** Chat messages with 24h expiry */
  messages: StoredMessage[];
  /** Whether the chat is pinned */
  isPinned: boolean;
  /** Current input value */
  input: string;
  /** Context chunks for current session */
  contextChunks: ContextChunk[];
  /** Suggested prompts */
  suggestedPrompts: SuggestedPrompt[];
  /** Loading state for suggestions */
  isLoadingSuggestions: boolean;
  /** Sending state */
  isSending: boolean;
  /** Streaming state */
  isStreaming: boolean;
  /** Error message */
  error: string | null;
  /** Last sync timestamp with backend */
  lastSyncedAt: number | null;

  // Actions
  setInput: (input: string) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setIsPinned: (pinned: boolean) => void;
  setContextChunks: (chunks: ContextChunk[]) => void;
  toggleChunk: (chunkId: string) => void;
  toggleAllChunks: (included: boolean) => void;
  setSuggestedPrompts: (prompts: SuggestedPrompt[]) => void;
  setIsLoadingSuggestions: (loading: boolean) => void;
  setIsSending: (sending: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  setLastSyncedAt: (timestamp: number | null) => void;
  pruneExpiredMessages: () => void;
  getActiveMessages: () => ChatMessage[];
  hydrate: (messages: ChatMessage[]) => void;
}

/**
 * Custom storage that handles 24h expiry on rehydration.
 */
type PersistedQuickChatState = Pick<
  QuickChatStore,
  "messages" | "isPinned" | "lastSyncedAt"
>;

const storage = createJSONStorage<PersistedQuickChatState>(() => localStorage);

/**
 * Filter out expired messages.
 */
function filterExpiredMessages(messages: StoredMessage[]): StoredMessage[] {
  const now = Date.now();
  return messages.filter((msg) => msg.expiresAt > now);
}

/**
 * Create the QuickChat store with persistence.
 */
export const useQuickChatStore = create<QuickChatStore>()(
  persist<QuickChatStore, [], [], PersistedQuickChatState>(
    (set, get) => ({
      messages: [],
      isPinned: false,
      input: "",
      contextChunks: [],
      suggestedPrompts: [],
      isLoadingSuggestions: false,
      isSending: false,
      isStreaming: false,
      error: null,
      lastSyncedAt: null,

      setInput: (input) => set({ input }),

      addMessage: (message) => {
        const id = generateMessageId();
        const now = Date.now();
        const storedMessage: StoredMessage = {
          ...message,
          id,
          timestamp: now,
          expiresAt: now + TWENTY_FOUR_HOURS_MS,
        };
        set((state) => {
          const newMessages = [...state.messages, storedMessage];
          return {
            messages: newMessages,
          };
        });
        return id;
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg,
          ),
        }));
      },

      clearMessages: () => set({ messages: [], error: null }),

      setIsPinned: (pinned) => set({ isPinned: pinned }),

      setContextChunks: (chunks) => set({ contextChunks: chunks }),

      toggleChunk: (chunkId) => {
        set((state) => ({
          contextChunks: state.contextChunks.map((chunk) =>
            chunk.id === chunkId
              ? { ...chunk, included: !chunk.included }
              : chunk,
          ),
        }));
      },

      toggleAllChunks: (included) => {
        set((state) => ({
          contextChunks: state.contextChunks.map((chunk) => ({
            ...chunk,
            included,
          })),
        }));
      },

      setSuggestedPrompts: (prompts) => set({ suggestedPrompts: prompts }),

      setIsLoadingSuggestions: (loading) =>
        set({ isLoadingSuggestions: loading }),

      setIsSending: (sending) => set({ isSending: sending }),

      setIsStreaming: (streaming) => set({ isStreaming: streaming }),

      setError: (error) => set({ error }),

      setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),

      pruneExpiredMessages: () => {
        set((state) => ({
          messages: filterExpiredMessages(state.messages),
        }));
      },

      getActiveMessages: () => {
        const state = get();
        const now = Date.now();
        return state.messages
          .filter((msg) => msg.expiresAt > now)
          .map(({ expiresAt, ...msg }) => msg);
      },

      hydrate: (messages) => {
        const now = Date.now();
        const storedMessages: StoredMessage[] = messages.map((msg) => ({
          ...msg,
          expiresAt: now + TWENTY_FOUR_HOURS_MS,
        }));
        set({ messages: storedMessages, lastSyncedAt: now });
      },
    }),
    {
      name: STORE_NAME,
      storage,
      partialize: (state) => ({
        messages: state.messages,
        isPinned: state.isPinned,
        lastSyncedAt: state.lastSyncedAt,
      }),
      onRehydrateStorage: () => (state) => {
        // Prune expired messages on rehydration
        if (state) {
          state.pruneExpiredMessages();
        }
      },
    },
  ),
);

/**
 * Hook to get only active (non-expired) messages as ChatMessage[].
 */
export function useActiveMessages(): ChatMessage[] {
  const messages = useQuickChatStore((state) => state.messages);
  const now = Date.now();
  return messages
    .filter((msg) => msg.expiresAt > now)
    .map(({ expiresAt, ...msg }) => msg);
}

/**
 * Selector for messages count (for display purposes).
 */
export function useMessagesCount(): number {
  const messages = useQuickChatStore((state) => state.messages);
  const now = Date.now();
  return messages.filter((msg) => msg.expiresAt > now).length;
}
