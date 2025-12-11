/**
 * Hook for managing QuickChat state and logic using ai-sdk-ui and zustand.
 *
 * @module QuickChat/useQuickChat
 * @since 3.1.0
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UIMessage, useChat } from "@ai-sdk/react";
import { getElementInspectInfo } from "@ewjdev/anyclick-core";
import {
  generateMessageId,
  useActiveMessages,
  useQuickChatStore,
} from "./store";
import type {
  ChatMessage,
  ContextChunk,
  QuickChatConfig,
  SuggestedPrompt,
} from "./types";
import { DEFAULT_QUICK_CHAT_CONFIG } from "./types";

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
 * Convert ai-sdk Message to our ChatMessage format.
 */
function aiMessageToChatMessage(msg: UIMessage): ChatMessage {
  return {
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    content: msg.parts
    timestamp: msg.message?.createdAt?.getTime() ?? Date.now(),
  };
}

type DebugInfo = {
  status: number;
  ok: boolean;
  contentType: string | null;
  rawTextPreview: string;
  parsedKeys?: string[];
  contentPreview?: string;
  payloadPreview?: string;
  timestamp: number;
  error?: string;
};

/**
 * Hook for managing QuickChat state and interactions.
 * Uses ai-sdk-ui for streaming and zustand for persistence.
 */
export function useQuickChat(
  targetElement: Element | null,
  containerElement: Element | null,
  config: QuickChatConfig = {},
) {
  const mergedConfig = { ...DEFAULT_QUICK_CHAT_CONFIG, ...config };
  const initializedRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [manualSending, setManualSending] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

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
    updateMessage,
    clearMessages: storeClearMessages,
    setLastSyncedAt,
    lastSyncedAt,
    setIsSending: setStoreIsSending,
    setIsStreaming: setStoreIsStreaming,
  } = useQuickChatStore();

  // Get active (non-expired) messages from store
  const storedMessages = useActiveMessages();

  // Memoize the context string to prevent useChat from re-initializing
  const contextString = useMemo(
    () => buildContextString(contextChunks),
    [contextChunks],
  );

  // Memoize the body object to prevent useChat from re-initializing
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

  // ai-sdk-ui useChat hook
  console.log("[useQuickChat] Initializing useChat hook", {
    endpoint: mergedConfig.endpoint,
    contextChunks: contextChunks.length,
    contextString: contextString.substring(0, 100),
    bodyHash: JSON.stringify(chatBody),
  });

  const {
    messages: aiMessages,
    append,
    isLoading: aiIsSending,
    stop,
    setMessages: setAiMessages,
  } = useChat({
    api: mergedConfig.endpoint,
    body: chatBody,
    onFinish: (message) => {
      // Log full message object to see all properties including parts
      console.log(
        "[useQuickChat] onFinish callback fired - RAW MESSAGE:",
        message,
      );
      console.log("[useQuickChat] onFinish callback fired", {
        messageId: message.id,
        role: message.role,
        contentLength: message.content.length,
        contentPreview: message.content.substring(0, 100),
        fullContent: message.content,
        messageKeys: Object.keys(message),
        // Check if parts exist (ai-sdk v4 format)
        hasParts: "parts" in message,
        parts: (message as unknown as { parts?: unknown[] }).parts,
        partsLength: (message as unknown as { parts?: unknown[] }).parts
          ?.length,
      });
      // Sync completed message to store for persistence
      const existingMsg = storedMessages.find((m) => m.id === message.id);
      console.log("[useQuickChat] Checking existing message", {
        messageId: message.id,
        exists: !!existingMsg,
      });
      if (!existingMsg) {
        console.log("[useQuickChat] Adding message to store", {
          messageId: message.id,
          role: message.role,
          contentLength: message.content.length,
        });
        addMessage({
          role: message.role as "user" | "assistant" | "system",
          content: message.content,
          isStreaming: false,
        });
      } else {
        console.log(
          "[useQuickChat] Message already exists in store, skipping add",
        );
      }
      // Schedule backend sync
      scheduleBackendSync();
      setStoreIsStreaming(false);
      setStoreIsSending(false);
    },
    onError: (err) => {
      console.error("[useQuickChat] onError callback fired", {
        error: err,
        errorMessage: err.message,
        errorStack: err.stack,
      });
      setError(err.message);
      setDebugInfo({
        status:
          (err as unknown as { status?: number }).status ??
          (err as unknown as { response?: { status?: number } }).response
            ?.status ??
          -1,
        ok: false,
        contentType:
          (
            err as unknown as { response?: { headers?: Headers } }
          ).response?.headers?.get?.("content-type") ?? null,
        rawTextPreview:
          (err as unknown as { responseText?: string }).responseText ??
          (err as unknown as { message?: string }).message ??
          "",
        timestamp: Date.now(),
        error: err.message,
      });
      setStoreIsStreaming(false);
      setStoreIsSending(false);
    },
  });

  // Log aiMessages changes
  useEffect(() => {
    // Log raw messages to see full structure including parts
    console.log("[useQuickChat] aiMessages changed - RAW:", aiMessages);
    console.log("[useQuickChat] aiMessages changed", {
      count: aiMessages.length,
      messages: aiMessages.map((m) => {
        const msg = m as unknown as {
          id: string;
          role: string;
          content: string;
          parts?: unknown[];
          createdAt?: Date;
        };
        return {
          id: msg.id,
          role: msg.role,
          contentLength: msg.content?.length || 0,
          contentPreview: msg.content?.substring(0, 100) || "",
          fullContent: msg.content || "",
          createdAt: msg.createdAt?.toISOString(),
          hasParts: !!msg.parts,
          partsLength: msg.parts?.length,
          parts: msg.parts,
        };
      }),
      isSending: aiIsSending,
      lastMessage: aiMessages[aiMessages.length - 1]
        ? (() => {
            const last = aiMessages[aiMessages.length - 1] as unknown as {
              id: string;
              role: string;
              content: string;
              parts?: unknown[];
            };
            return {
              id: last.id,
              role: last.role,
              contentLength: last.content?.length || 0,
              fullContent: last.content || "",
              hasParts: !!last.parts,
              parts: last.parts,
            };
          })()
        : null,
    });
  }, [aiMessages, aiIsSending]);

  // Convert ai messages to our ChatMessage format
  const messages: ChatMessage[] = aiMessages.map((msg) => {
    const chatMsg = {
      ...aiMessageToChatMessage(msg),
      isStreaming:
        aiIsSending &&
        msg.role === "assistant" &&
        msg === aiMessages[aiMessages.length - 1],
      actions:
        msg.role === "assistant" && !aiIsSending
          ? [
              {
                id: "copy",
                label: "Copy",
                onClick: () => {
                  navigator.clipboard.writeText(msg.content);
                },
              },
              {
                id: "research",
                label: "Research more",
                onClick: () => {
                  setInput(`Tell me more about: ${msg.content.slice(0, 50)}`);
                },
              },
            ]
          : undefined,
    };
    return chatMsg;
  });

  // Log converted messages
  useEffect(() => {
    console.log("[useQuickChat] Converted messages", {
      count: messages.length,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        contentLength: m.content.length,
        contentPreview: m.content.substring(0, 100),
        isStreaming: m.isStreaming,
        hasActions: !!m.actions,
      })),
    });
  }, [messages]);

  // Determine if streaming/sending
  const isStreaming = aiIsSending && aiMessages.length > 0;
  const isSending = aiIsSending || manualSending;

  /**
   * Schedule a backend sync after a short delay to batch updates.
   */
  const scheduleBackendSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const currentMessages = useQuickChatStore
          .getState()
          .getActiveMessages();
        if (currentMessages.length === 0) return;

        await fetch(`${mergedConfig.endpoint}/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save",
            messages: currentMessages,
          }),
        });
        setLastSyncedAt(Date.now());
      } catch (err) {
        console.error("Failed to sync chat history to backend:", err);
      }
    }, 1000);
  }, [mergedConfig.endpoint, setLastSyncedAt]);

  /**
   * Load chat history from backend on initial mount.
   */
  const loadFromBackend = useCallback(async () => {
    try {
      const response = await fetch(`${mergedConfig.endpoint}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load" }),
      });
      if (response.ok) {
        const data = await response.json();
        if (
          data.messages &&
          Array.isArray(data.messages) &&
          data.messages.length > 0
        ) {
          // Hydrate store with backend messages
          useQuickChatStore.getState().hydrate(data.messages);
          // Also set ai messages for display
          const aiMsgs: Message[] = data.messages.map((msg: ChatMessage) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: new Date(msg.timestamp),
          }));
          setAiMessages(aiMsgs);
        }
      }
    } catch (err) {
      console.error("Failed to load chat history from backend:", err);
    }
  }, [mergedConfig.endpoint, setAiMessages]);

  // Initialize: load from backend if store is empty, or restore from store
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // If we have stored messages, restore them to ai-sdk
    if (storedMessages.length > 0) {
      const aiMsgs: Message[] = storedMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.timestamp),
      }));
      setAiMessages(aiMsgs);
    } else {
      // Try to load from backend
      loadFromBackend();
    }
  }, [storedMessages, setAiMessages, loadFromBackend]);

  // Extract context when target element changes
  useEffect(() => {
    if (targetElement) {
      const chunks = extractContextChunks(targetElement, containerElement);
      setContextChunks(chunks);
    }
  }, [targetElement, containerElement, setContextChunks]);

  // Fetch suggested prompts when context is available
  useEffect(() => {
    if (
      !mergedConfig.showSuggestions ||
      contextChunks.length === 0 ||
      suggestedPrompts.length > 0
    ) {
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);

      try {
        const contextString = buildContextString(contextChunks);
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
            setSuggestedPrompts(
              data.suggestions.map((text: string, i: number) => ({
                id: `suggestion-${i}`,
                text,
              })),
            );
            setIsLoadingSuggestions(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      }

      // Fallback default suggestions
      setSuggestedPrompts([
        { id: "s1", text: "What is this element?" },
        { id: "s2", text: "How can I style this?" },
        { id: "s3", text: "Is this accessible?" },
      ]);
      setIsLoadingSuggestions(false);
    };

    fetchSuggestions();
  }, [
    contextChunks,
    suggestedPrompts.length,
    mergedConfig.showSuggestions,
    mergedConfig.endpoint,
    mergedConfig.prePassModel,
    setIsLoadingSuggestions,
    setSuggestedPrompts,
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
      console.log("[useQuickChat] sendMessage called", {
        text: text.substring(0, 100),
        textLength: text.length,
        hasText: !!text,
      });

      if (!text) {
        console.log("[useQuickChat] sendMessage: empty text, returning early");
        return;
      }

      setInput("");
      setError(null);
      setManualSending(true);
      setStoreIsSending(true);
      setStoreIsStreaming(true);
      setDebugInfo(null);

      try {
        // Persist user message immediately (ai-sdk handles UI state)
        addMessage({
          role: "user",
          content: text,
        });

        await append({
          content: text,
          role: "user",
        });
      } catch (err) {
        console.error("[useQuickChat] sendMessage failed", {
          error: err,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setManualSending(false);
        setStoreIsSending(false);
        setStoreIsStreaming(false);
      }
    },
    [
      input,
      setInput,
      setError,
      addMessage,
      append,
      setStoreIsSending,
      setStoreIsStreaming,
      setDebugInfo,
    ],
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    stop();
    storeClearMessages();
    setAiMessages([]);
    // Also clear from backend
    fetch(`${mergedConfig.endpoint}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" }),
    }).catch((err) => console.error("Failed to clear backend history:", err));
  }, [stop, storeClearMessages, setAiMessages, mergedConfig.endpoint]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
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
  };
}
