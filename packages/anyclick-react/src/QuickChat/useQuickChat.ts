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
import { DefaultChatTransport } from "ai";
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
 * Extract text content from UIMessage parts array.
 */
function getMessageText(msg: UIMessage): string {
  // Prefer v2 format (parts), but fall back to legacy/interop `content` if present.
  // NOTE: After SDK upgrades, part shapes/types can vary (e.g. "text", "output_text").
  // We treat any part with a string `text` field as displayable text.
  const partsText =
    msg.parts
      ?.map((p) => {
        const maybeText = (p as unknown as { text?: unknown }).text;
        if (typeof maybeText === "string") return maybeText;
        const maybeContent = (p as unknown as { content?: unknown }).content;
        if (typeof maybeContent === "string") return maybeContent;
        return "";
      })
      .join("") ?? "";

  if (partsText) return partsText;

  const maybeContent = (msg as unknown as { content?: unknown }).content;
  return typeof maybeContent === "string" ? maybeContent : "";
}

/**
 * Convert ai-sdk UIMessage to our ChatMessage format.
 */
function aiMessageToChatMessage(msg: UIMessage): ChatMessage {
  return {
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    content: getMessageText(msg),
    timestamp: Date.now(),
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
  console.count("[useQuickChat] Initializing useChat hook");

  // Memoize transport to prevent re-creation
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: mergedConfig.endpoint,
        body: chatBody,
        fetch: async (input, init) => {
          const start = Date.now();
          const res = await fetch(input, init);

          try {
            console.log("[useQuickChat] Chat fetch response", {
              url: typeof input === "string" ? input : String(input),
              status: res.status,
              ok: res.ok,
              contentType: res.headers.get("content-type"),
              cacheControl: res.headers.get("cache-control"),
              requestId: res.headers.get("x-anyclick-request-id"),
            });
          } catch {
            // ignore
          }

          // Clone for inspection so we don't consume the real stream.
          // We parse the SSE payload to see which event types are actually arriving.
          try {
            const clone = res.clone();
            if (!clone.body) {
              console.log(
                "[useQuickChat] Response body is null (not streaming)",
                {
                  ms: Date.now() - start,
                },
              );
              return res;
            }

            void (async () => {
              const reader = clone.body!.getReader();
              const decoder = new TextDecoder();
              const seenTypes: string[] = [];
              let buffer = "";
              let chunks = 0;
              let totalBytes = 0;
              let firstLogged = false;

              try {
                while (
                  chunks < 30 &&
                  totalBytes < 16_000 &&
                  seenTypes.length < 12
                ) {
                  const { value, done } = await reader.read();
                  if (done) break;
                  if (!value) continue;
                  chunks += 1;
                  totalBytes += value.byteLength;
                  const text = decoder.decode(value, { stream: true });
                  buffer += text;

                  if (!firstLogged) {
                    firstLogged = true;
                    console.log("[useQuickChat] First stream bytes observed", {
                      ms: Date.now() - start,
                      bytes: value.byteLength,
                      preview: text.slice(0, 200),
                    });
                  }

                  // SSE events are separated by blank lines.
                  const events = buffer.split("\n\n");
                  buffer = events.pop() ?? "";

                  for (const evt of events) {
                    const dataLines = evt
                      .split("\n")
                      .filter((l) => l.startsWith("data:"))
                      .map((l) => l.slice(5).trim());
                    for (const data of dataLines) {
                      // Most ai-sdk UI streams send JSON payloads per data line.
                      try {
                        const parsed = JSON.parse(data) as { type?: unknown };
                        const t =
                          typeof parsed?.type === "string"
                            ? parsed.type
                            : "unknown";
                        if (seenTypes.length < 12) seenTypes.push(t);
                      } catch {
                        // Non-JSON data; capture a compact marker.
                        if (seenTypes.length < 12) seenTypes.push("non-json");
                      }
                    }
                  }
                }

                console.log("[useQuickChat] SSE event types observed", {
                  ms: Date.now() - start,
                  chunks,
                  totalBytes,
                  types: seenTypes,
                });
              } catch (e) {
                console.log("[useQuickChat] SSE inspection failed", {
                  ms: Date.now() - start,
                  error: e instanceof Error ? e.message : String(e),
                });
              } finally {
                try {
                  reader.releaseLock();
                } catch {
                  // ignore
                }
              }
            })();
          } catch (e) {
            console.log("[useQuickChat] Stream inspection setup failed", {
              ms: Date.now() - start,
              error: e instanceof Error ? e.message : String(e),
            });
          }

          return res;
        },
      }),
    [mergedConfig.endpoint, chatBody],
  );

  const {
    messages: aiMessages,
    sendMessage: aiSendMessage,
    status,
    stop,
    setMessages: setAiMessages,
  } = useChat({
    transport,
    onFinish: ({ message }) => {
      // Log full message object to see all properties including parts
      console.log(
        "[useQuickChat] onFinish callback fired - RAW MESSAGE:",
        message,
      );
      try {
        console.log("[useQuickChat] onFinish parts summary", {
          partsLength: message.parts?.length ?? 0,
          parts: message.parts?.map((p) => ({
            type: (p as unknown as { type?: unknown }).type,
            keys: Object.keys(p as unknown as Record<string, unknown>),
            textPreview:
              typeof (p as unknown as { text?: unknown }).text === "string"
                ? (p as unknown as { text: string }).text.slice(0, 80)
                : null,
            contentPreview:
              typeof (p as unknown as { content?: unknown }).content ===
              "string"
                ? (p as unknown as { content: string }).content.slice(0, 80)
                : null,
          })),
        });
      } catch {
        // ignore
      }
      const messageText = getMessageText(message);
      console.log("[useQuickChat] onFinish callback fired", {
        messageId: message.id,
        role: message.role,
        contentLength: messageText.length,
        contentPreview: messageText.substring(0, 100),
        fullContent: messageText,
        messageKeys: Object.keys(message),
        hasParts: !!message.parts,
        partsLength: message.parts?.length,
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
          contentLength: messageText.length,
        });
        addMessage({
          role: message.role as "user" | "assistant" | "system",
          content: messageText,
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
      status,
      messages: aiMessages.map((m) => {
        const messageText = getMessageText(m);
        const maybeContent = (m as unknown as { content?: unknown }).content;
        return {
          id: m.id,
          role: m.role,
          contentLength: messageText.length,
          contentPreview: messageText.substring(0, 100),
          fullContent: messageText,
          hasParts: !!m.parts,
          partsLength: m.parts?.length,
          hasContent: typeof maybeContent === "string",
          rawContentLength:
            typeof maybeContent === "string" ? maybeContent.length : null,
          messageKeys: Object.keys(m as unknown as Record<string, unknown>),
        };
      }),
      lastMessage: aiMessages[aiMessages.length - 1]
        ? (() => {
            const last = aiMessages[aiMessages.length - 1];
            const lastText = getMessageText(last);
            const maybeContent = (last as unknown as { content?: unknown })
              .content;
            return {
              id: last.id,
              role: last.role,
              contentLength: lastText.length,
              fullContent: lastText,
              hasParts: !!last.parts,
              hasContent: typeof maybeContent === "string",
            };
          })()
        : null,
    });
  }, [aiMessages, status]);

  // Convert ai messages to our ChatMessage format
  const messages: ChatMessage[] = aiMessages.map((msg) => {
    const messageText = getMessageText(msg);
    const chatMsg = {
      ...aiMessageToChatMessage(msg),
      isStreaming:
        status === "streaming" &&
        msg.role === "assistant" &&
        msg === aiMessages[aiMessages.length - 1],
      actions:
        msg.role === "assistant" && status === "ready"
          ? [
              {
                id: "copy",
                label: "Copy",
                onClick: () => {
                  navigator.clipboard.writeText(messageText);
                },
              },
              {
                id: "research",
                label: "Research more",
                onClick: () => {
                  setInput(`Tell me more about: ${messageText.slice(0, 50)}`);
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

  // Determine if streaming/sending based on status
  const isStreaming = status === "streaming";
  const isSending =
    status === "submitted" || status === "streaming" || manualSending;

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
          const aiMsgs: UIMessage[] = data.messages.map((msg: ChatMessage) => ({
            id: msg.id,
            role: msg.role,
            parts: [{ type: "text" as const, text: msg.content }],
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
      const aiMsgs: UIMessage[] = storedMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: [{ type: "text" as const, text: msg.content }],
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

        await aiSendMessage({ text });
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
      aiSendMessage,
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
