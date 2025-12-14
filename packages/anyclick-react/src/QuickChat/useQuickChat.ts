/**
 * Hook for managing QuickChat state and logic using ai-sdk-ui and zustand.
 *
 * @module QuickChat/useQuickChat
 * @since 3.1.0
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useActiveMessages, useQuickChatStore } from "./store";
import type { ChatMessage, QuickChatConfig, SuggestedPrompt } from "./types";
import { DEFAULT_QUICK_CHAT_CONFIG } from "./types";
import {
  buildContextString,
  extractContextChunks,
} from "./useQuickChat.context";
import type { DebugInfo } from "./useQuickChat.debug";
import { createDebugInfo } from "./useQuickChat.debug";
import {
  chatMessagesToUiMessages,
  getUIMessageText,
  uiMessagesToChatMessages,
} from "./useQuickChat.messages";
import type { RateLimitNotice } from "./useQuickChat.rateLimit";
import {
  rateLimitNoticeFromError,
  rateLimitNoticeFromResponse,
} from "./useQuickChat.rateLimit";

export type { RateLimitNotice } from "./useQuickChat.rateLimit";

/**
 * Return type for useQuickChat hook.
 */
export interface UseQuickChatReturn {
  /** Current input value */
  input: string;
  /** Array of chat messages */
  messages: ChatMessage[];
  /** Whether suggestions are being loaded */
  isLoadingSuggestions: boolean;
  /** Whether a message is being sent */
  isSending: boolean;
  /** Whether a response is currently streaming */
  isStreaming: boolean;
  /** Suggested prompts from AI pre-pass */
  suggestedPrompts: SuggestedPrompt[];
  /** Context chunks extracted from target element */
  contextChunks: import("./types").ContextChunk[];
  /** Error message if any */
  error: string | null;
  /** Debug information for troubleshooting */
  debugInfo: DebugInfo | null;
  /** Rate limit notice if rate limited */
  rateLimitNotice: RateLimitNotice | null;
  /** Whether chat is pinned */
  isPinned: boolean;
  /** Last sync timestamp with backend */
  lastSyncedAt: number | null;
  /** Merged configuration */
  config: Required<QuickChatConfig>;
  /** Set input value */
  setInput: (value: string) => void;
  /** Toggle a context chunk's included state */
  toggleChunk: (chunkId: string) => void;
  /** Toggle all context chunks */
  toggleAllChunks: (included: boolean) => void;
  /** Select a suggested prompt (sets it as input) */
  selectSuggestion: (prompt: SuggestedPrompt) => void;
  /** Send a message (uses current input if no messageText provided) */
  sendMessage: (messageText?: string) => Promise<void>;
  /** Clear all messages */
  clearMessages: () => void;
  /** Set pinned state */
  setIsPinned: (pinned: boolean) => void;
  /** Clear rate limit notice */
  clearRateLimitNotice: () => void;
}

/**
 * Hook for managing QuickChat state and interactions.
 *
 * Provides a complete chat interface with:
 * - AI-powered streaming responses via ai-sdk
 * - Context extraction from DOM elements
 * - Message persistence (24h localStorage)
 * - Suggested prompts
 * - Rate limiting handling
 * - Backend synchronization
 *
 * @param targetElement - The DOM element to extract context from (e.g., right-clicked element)
 * @param containerElement - Optional container element for scoped context extraction
 * @param config - Configuration options (endpoint, model, systemPrompt, etc.)
 *
 * @returns Object containing chat state and control functions
 *
 * @example
 * ```tsx
 * const { messages, input, sendMessage, isSending } = useQuickChat(
 *   targetElement,
 *   containerElement,
 *   { endpoint: '/api/chat', model: 'gpt-4' }
 * );
 * ```
 */
export function useQuickChat(
  targetElement: Element | null,
  containerElement: Element | null,
  config: QuickChatConfig = {},
): UseQuickChatReturn {
  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_QUICK_CHAT_CONFIG, ...config }),
    [config],
  );

  const initializedRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [manualSending, setManualSending] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [rateLimitNotice, setRateLimitNotice] =
    useState<RateLimitNotice | null>(null);

  // Zustand store
  const {
    input,
    setInput,
    isPinned,
    setIsPinned,
    contextChunks,
    setContextChunks,
    toggleChunk,
    toggleAllChunks,
    suggestedPrompts,
    setSuggestedPrompts,
    isLoadingSuggestions,
    setIsLoadingSuggestions,
    error,
    setError,
    addMessage,
    clearMessages: storeClearMessages,
    setLastSyncedAt,
    lastSyncedAt,
    setIsSending: setStoreIsSending,
    setIsStreaming: setStoreIsStreaming,
  } = useQuickChatStore();

  // Active (non-expired) messages persisted for 24h
  const storedMessages = useActiveMessages();

  const contextString = useMemo(
    () => buildContextString(contextChunks),
    [contextChunks],
  );

  // Memoize chat body - only recreate when dependencies change
  const chatBody = useMemo(
    () => ({
      action: "chat",
      context: contextString,
      model: mergedConfig.model,
      systemPrompt: mergedConfig.systemPrompt,
      maxLength: mergedConfig.maxResponseLength,
    }),
    [
      contextString,
      mergedConfig.model,
      mergedConfig.systemPrompt,
      mergedConfig.maxResponseLength,
    ],
  );

  // Memoize transport - recreate only when endpoint or body structure changes
  // Note: useChat will handle transport changes gracefully
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: mergedConfig.endpoint,
        body: chatBody,
      }),
    [mergedConfig.endpoint, chatBody],
  );

  const handleRateLimitResponse = useCallback(
    async (res: Response, endpoint: string) => {
      const notice = await rateLimitNoticeFromResponse(res, endpoint);
      if (!notice) return false;
      setRateLimitNotice(notice);
      setError(null);
      return true;
    },
    [setError],
  );

  /**
   * Schedule a backend sync after a short delay to batch updates.
   */
  const scheduleBackendSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const currentMessages = useQuickChatStore
          .getState()
          .getActiveMessages();
        if (currentMessages.length === 0) return;

        const endpoint = `${mergedConfig.endpoint}/history`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save",
            messages: currentMessages,
          }),
        });

        if (await handleRateLimitResponse(res, endpoint)) return;
        if (res.ok) setLastSyncedAt(Date.now());
      } catch (err) {
        console.error("[useQuickChat] Failed to sync chat history:", err);
      }
    }, 1000);
  }, [handleRateLimitResponse, mergedConfig.endpoint, setLastSyncedAt]);

  const {
    messages: aiMessages,
    sendMessage: aiSendMessage,
    status,
    stop,
    setMessages: setAiMessages,
  } = useChat({
    transport,
    onError: (err) => {
      const response =
        (err as unknown as { response?: Response }).response ?? undefined;
      const statusCode =
        (err as unknown as { status?: number }).status ??
        (response ? response.status : undefined) ??
        -1;

      const responseText =
        (err as unknown as { responseText?: string }).responseText ??
        (err as unknown as { message?: string }).message ??
        "";

      setDebugInfo(
        createDebugInfo({
          status: statusCode,
          ok: false,
          contentType: response?.headers?.get?.("content-type") ?? null,
          rawText: responseText,
          error: err.message,
        }),
      );

      setStoreIsStreaming(false);
      setStoreIsSending(false);

      const notice = rateLimitNoticeFromError({
        statusCode,
        response,
        responseText,
        endpoint: mergedConfig.endpoint,
      });

      if (notice) {
        setRateLimitNotice(notice);
        setError(null);
        return;
      }

      setRateLimitNotice(null);
      setError(err.message);
    },
    onFinish: ({ message }) => {
      const messageText = getUIMessageText(message);

      // Persist assistant message to store for 24h history + backend sync.
      // Store IDs are generated, so we dedupe using the trailing message.
      const current = useQuickChatStore.getState().getActiveMessages();
      const last = current[current.length - 1];
      const alreadyHaveSameTail =
        last?.role === "assistant" && last.content === messageText;

      if (!alreadyHaveSameTail && messageText) {
        addMessage({
          role: message.role as "user" | "assistant" | "system",
          content: messageText,
          isStreaming: false,
        });
      }

      scheduleBackendSync();
      setStoreIsStreaming(false);
      setStoreIsSending(false);
    },
  });

  const loadFromBackend = useCallback(async () => {
    try {
      const endpoint = `${mergedConfig.endpoint}/history`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load" }),
      });

      if (await handleRateLimitResponse(response, endpoint)) return;
      if (!response.ok) return;

      const data = (await response.json().catch(() => null)) as {
        messages?: ChatMessage[];
      } | null;

      if (!data?.messages || !Array.isArray(data.messages)) return;
      if (data.messages.length === 0) return;

      useQuickChatStore.getState().hydrate(data.messages);
      setAiMessages(chatMessagesToUiMessages(data.messages));
    } catch (err) {
      console.error("[useQuickChat] Failed to load chat history:", err);
    }
  }, [handleRateLimitResponse, mergedConfig.endpoint, setAiMessages]);

  // Convert ai-sdk messages to our ChatMessage format for display
  const messages: ChatMessage[] = useMemo(
    () =>
      uiMessagesToChatMessages({
        uiMessages: aiMessages,
        status,
        setInput,
      }),
    [aiMessages, setInput, status],
  );

  const isStreaming = status === "streaming";
  const isSending =
    status === "submitted" || status === "streaming" || manualSending;

  // Initialize: load from backend if store is empty, or restore from store
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (storedMessages.length > 0) {
      setAiMessages(chatMessagesToUiMessages(storedMessages));
    } else {
      void loadFromBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Extract context when target element changes
  useEffect(() => {
    if (!targetElement) {
      setContextChunks([]);
      return;
    }
    const chunks = extractContextChunks(targetElement, containerElement);
    setContextChunks(chunks);
  }, [targetElement, containerElement, setContextChunks]);

  // Fetch suggested prompts when context is available
  useEffect(() => {
    if (!mergedConfig.showSuggestions) return;
    if (!contextString) return;
    if (suggestedPrompts.length > 0) return;

    let cancelled = false;

    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);

      try {
        const response = await fetch(mergedConfig.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "suggest",
            context: contextString,
            model: mergedConfig.prePassModel,
          }),
        });

        if (await handleRateLimitResponse(response, mergedConfig.endpoint)) {
          if (!cancelled) setIsLoadingSuggestions(false);
          return;
        }

        if (response.ok) {
          const data = (await response.json().catch(() => null)) as {
            suggestions?: string[];
          } | null;

          if (data?.suggestions && Array.isArray(data.suggestions)) {
            if (!cancelled) {
              setSuggestedPrompts(
                data.suggestions.map((text: string, i: number) => ({
                  id: `suggestion-${i}`,
                  text,
                })),
              );
              setIsLoadingSuggestions(false);
            }
            return;
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[useQuickChat] Failed to fetch suggestions:", err);
        }
      }

      if (!cancelled) {
        // Fallback suggestions
        setSuggestedPrompts([
          { id: "s1", text: "What is this element?" },
          { id: "s2", text: "How can I style this?" },
          { id: "s3", text: "Is this accessible?" },
        ]);
        setIsLoadingSuggestions(false);
      }
    };

    void fetchSuggestions();

    return () => {
      cancelled = true;
    };
  }, [
    contextString,
    handleRateLimitResponse,
    mergedConfig.endpoint,
    mergedConfig.prePassModel,
    mergedConfig.showSuggestions,
    setIsLoadingSuggestions,
    setSuggestedPrompts,
    suggestedPrompts.length,
  ]);

  // Select a suggested prompt
  const selectSuggestion = useCallback(
    (prompt: SuggestedPrompt) => {
      setInput(prompt.text);
    },
    [setInput],
  );

  // Send a message using streaming (ai-sdk useChat)
  const sendMessage = useCallback(
    async (messageText?: string) => {
      const text = (messageText || input).trim();
      if (!text) return;

      setInput("");
      setError(null);
      setManualSending(true);
      setStoreIsSending(true);
      setStoreIsStreaming(true);
      setDebugInfo(null);

      try {
        addMessage({
          role: "user",
          content: text,
        });

        await aiSendMessage({ text });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setManualSending(false);
        setStoreIsSending(false);
        setStoreIsStreaming(false);
      }
    },
    [
      addMessage,
      aiSendMessage,
      input,
      setError,
      setInput,
      setStoreIsSending,
      setStoreIsStreaming,
    ],
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    stop();
    storeClearMessages();
    setAiMessages([]);

    const endpoint = `${mergedConfig.endpoint}/history`;
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" }),
    })
      .then((res) => handleRateLimitResponse(res, endpoint))
      .catch((err) =>
        console.error("[useQuickChat] Failed to clear backend history:", err),
      );
  }, [
    handleRateLimitResponse,
    mergedConfig.endpoint,
    setAiMessages,
    stop,
    storeClearMessages,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  return {
    input,
    messages,
    isLoadingSuggestions,
    isSending,
    isStreaming,
    suggestedPrompts,
    contextChunks,
    error,
    debugInfo,
    rateLimitNotice,
    isPinned,
    lastSyncedAt,
    config: mergedConfig,
    setInput,
    toggleChunk,
    toggleAllChunks,
    selectSuggestion,
    sendMessage,
    clearMessages,
    setIsPinned,
    clearRateLimitNotice: () => setRateLimitNotice(null),
  } satisfies UseQuickChatReturn;
}
