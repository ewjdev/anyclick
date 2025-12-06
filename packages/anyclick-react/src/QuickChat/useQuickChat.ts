/**
 * Hook for managing QuickChat state and logic.
 *
 * @module QuickChat/useQuickChat
 * @since 2.0.0
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getElementInspectInfo } from "@ewjdev/anyclick-core";
import type {
  ChatMessage,
  ContextChunk,
  QuickChatConfig,
  QuickChatState,
  SuggestedPrompt,
} from "./types";
import { DEFAULT_QUICK_CHAT_CONFIG } from "./types";

const PINNED_STATE_KEY = "anyclick-quick-chat-pinned";
const CHAT_HISTORY_KEY = "anyclick-quick-chat-history";

/**
 * Generates a unique ID.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get pinned state from session storage.
 */
function getPinnedState(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(PINNED_STATE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Set pinned state in session storage.
 */
function setPinnedState(pinned: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (pinned) {
      sessionStorage.setItem(PINNED_STATE_KEY, "true");
    } else {
      sessionStorage.removeItem(PINNED_STATE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get chat history from session storage.
 */
function getChatHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem(CHAT_HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Remove streaming flags and actions from stored messages
      return parsed.map((msg: ChatMessage) => ({
        ...msg,
        isStreaming: false,
        actions: undefined,
      }));
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Save chat history to session storage.
 */
function saveChatHistory(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    // Only store last 10 messages to avoid storage limits
    const toStore = messages.slice(-10).map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    }));
    sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toStore));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear chat history from session storage.
 */
function clearChatHistory(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHAT_HISTORY_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Extracts context chunks from target element.
 */
function extractContextChunks(
  targetElement: Element | null,
  containerElement: Element | null,
): ContextChunk[] {
  const chunks: ContextChunk[] = [];

  if (!targetElement) return chunks;

  try {
    const info = getElementInspectInfo(targetElement);

    // Add tag info
    const tagContent = `<${info.tagName.toLowerCase()}${info.id ? ` id="${info.id}"` : ""}${info.classNames.length > 0 ? ` class="${info.classNames.join(" ")}"` : ""}>`;
    chunks.push({
      id: "element-tag",
      label: "Element Tag",
      content: tagContent,
      type: "element",
      included: true,
      size: tagContent.length,
    });

    // Add text content if present
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

    // Add computed styles summary
    if (info.computedStyles) {
      // Get a few key styles from different categories
      const styleEntries: string[] = [];
      for (const [category, styles] of Object.entries(info.computedStyles)) {
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

    // Add accessibility info
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

    // Add box model info
    if (info.boxModel) {
      const boxContent = `${Math.round(info.boxModel.content.width)}x${Math.round(info.boxModel.content.height)}px`;
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
    console.error("Failed to extract context:", error);
  }

  return chunks;
}

/**
 * Builds the context string from included chunks.
 */
function buildContextString(chunks: ContextChunk[]): string {
  const includedChunks = chunks.filter((c) => c.included);
  if (includedChunks.length === 0) return "";

  return includedChunks.map((c) => `[${c.label}]: ${c.content}`).join("\n");
}

/**
 * Hook for managing QuickChat state and interactions.
 */
export function useQuickChat(
  targetElement: Element | null,
  containerElement: Element | null,
  config: QuickChatConfig = {},
) {
  const mergedConfig = { ...DEFAULT_QUICK_CHAT_CONFIG, ...config };
  const abortControllerRef = useRef<AbortController | null>(null);
  const initializedRef = useRef(false);

  const [state, setState] = useState<QuickChatState>({
    input: "",
    messages: [],
    isLoadingSuggestions: false,
    isSending: false,
    isStreaming: false,
    suggestedPrompts: [],
    contextChunks: [],
    error: null,
  });

  // Initialize from session storage on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const isPinned = getPinnedState();
    if (isPinned) {
      const history = getChatHistory();
      if (history.length > 0) {
        setState((prev) => ({ ...prev, messages: history }));
      }
    }
  }, []);

  // Extract context when target element changes
  // When pinned, preserve the last context if targetElement becomes null
  useEffect(() => {
    if (targetElement) {
      const chunks = extractContextChunks(targetElement, containerElement);
      setState((prev) => ({ ...prev, contextChunks: chunks }));
    }
    // Don't clear context when targetElement is null - preserve last context for pinned state
  }, [targetElement, containerElement]);

  // Fetch suggested prompts when context is available
  useEffect(() => {
    if (
      !mergedConfig.showSuggestions ||
      state.contextChunks.length === 0 ||
      state.suggestedPrompts.length > 0
    ) {
      return;
    }

    const fetchSuggestions = async () => {
      setState((prev) => ({ ...prev, isLoadingSuggestions: true }));

      try {
        const contextString = buildContextString(state.contextChunks);
        const response = await fetch(mergedConfig.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "suggest",
            context: contextString,
            model: mergedConfig.prePassModel,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.suggestions && Array.isArray(data.suggestions)) {
            setState((prev) => ({
              ...prev,
              suggestedPrompts: data.suggestions.map(
                (text: string, i: number) => ({
                  id: `suggestion-${i}`,
                  text,
                }),
              ),
              isLoadingSuggestions: false,
            }));
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }

      // Fallback default suggestions
      setState((prev) => ({
        ...prev,
        suggestedPrompts: [
          { id: "s1", text: "What is this element?" },
          { id: "s2", text: "How can I style this?" },
          { id: "s3", text: "Is this accessible?" },
        ],
        isLoadingSuggestions: false,
      }));
    };

    fetchSuggestions();
  }, [
    state.contextChunks,
    state.suggestedPrompts.length,
    mergedConfig.showSuggestions,
    mergedConfig.endpoint,
    mergedConfig.prePassModel,
  ]);

  // Set input value
  const setInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  // Toggle context chunk inclusion
  const toggleChunk = useCallback((chunkId: string) => {
    setState((prev) => ({
      ...prev,
      contextChunks: prev.contextChunks.map((chunk) =>
        chunk.id === chunkId ? { ...chunk, included: !chunk.included } : chunk,
      ),
    }));
  }, []);

  // Toggle all chunks
  const toggleAllChunks = useCallback((included: boolean) => {
    setState((prev) => ({
      ...prev,
      contextChunks: prev.contextChunks.map((chunk) => ({
        ...chunk,
        included,
      })),
    }));
  }, []);

  // Select a suggested prompt
  const selectSuggestion = useCallback((prompt: SuggestedPrompt) => {
    setState((prev) => ({ ...prev, input: prompt.text }));
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (messageText?: string) => {
      const text = (messageText || state.input).trim();
      if (!text) return;

      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      const assistantMessageId = generateId();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      setState((prev) => ({
        ...prev,
        input: "",
        messages: [...prev.messages, userMessage, assistantMessage],
        isSending: true,
        isStreaming: true,
        error: null,
      }));

      try {
        const contextString = buildContextString(state.contextChunks);
        const response = await fetch(mergedConfig.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "chat",
            message: text,
            context: contextString,
            model: mergedConfig.model,
            systemPrompt: mergedConfig.systemPrompt,
            maxLength: mergedConfig.maxResponseLength,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          // Truncate if exceeds max length
          if (fullContent.length > mergedConfig.maxResponseLength) {
            fullContent =
              fullContent.slice(0, mergedConfig.maxResponseLength) + "...";
          }

          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullContent }
                : msg,
            ),
          }));
        }

        // Finalize message with actions
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: fullContent,
                  isStreaming: false,
                  actions: [
                    {
                      id: "copy",
                      label: "Copy",
                      onClick: () => {
                        navigator.clipboard.writeText(fullContent);
                      },
                    },
                    {
                      id: "research",
                      label: "Research more",
                      onClick: () => {
                        setState((p) => ({
                          ...p,
                          input: `Tell me more about: ${text}`,
                        }));
                      },
                    },
                  ],
                }
              : msg,
          ),
          isSending: false,
          isStreaming: false,
        }));
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("Chat error:", error);
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    "Sorry, I couldn't process your request. Please try again.",
                  isStreaming: false,
                }
              : msg,
          ),
          isSending: false,
          isStreaming: false,
          error: (error as Error).message,
        }));
      }
    },
    [state.input, state.contextChunks, mergedConfig],
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearChatHistory();
    setState((prev) => ({
      ...prev,
      messages: [],
      error: null,
    }));
  }, []);

  // Save messages to session storage when they change (if pinned)
  useEffect(() => {
    if (state.messages.length > 0 && getPinnedState()) {
      // Only save completed messages (not streaming)
      const completedMessages = state.messages.filter(
        (msg) => !msg.isStreaming,
      );
      if (completedMessages.length > 0) {
        saveChatHistory(completedMessages);
      }
    }
  }, [state.messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    config: mergedConfig,
    setInput,
    toggleChunk,
    toggleAllChunks,
    selectSuggestion,
    sendMessage,
    clearMessages,
  };
}
