import type { UIMessage } from "@ai-sdk/react";
import type { ChatMessage, QuickAction } from "./types";

type TextPartLike = {
  text?: unknown;
  content?: unknown;
};

/**
 * Extract text content from a UIMessage.
 *
 * The ai-sdk "parts" format can vary between versions (e.g. "text",
 * "output_text"). We treat any part with a string `text` or string `content`
 * field as displayable text.
 */
export function getUIMessageText(msg: UIMessage): string {
  const partsText =
    msg.parts
      ?.map((p) => {
        const part = p as unknown as TextPartLike;
        if (typeof part.text === "string") return part.text;
        if (typeof part.content === "string") return part.content;
        return "";
      })
      .join("") ?? "";

  if (partsText) return partsText;

  const maybeContent = (msg as unknown as { content?: unknown }).content;
  return typeof maybeContent === "string" ? maybeContent : "";
}

export function chatMessagesToUiMessages(messages: ChatMessage[]): UIMessage[] {
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: [{ type: "text" as const, text: msg.content }],
  }));
}

function safeCopyToClipboard(text: string) {
  try {
    if (typeof navigator === "undefined") return;
    void navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

export function buildAssistantActions(
  messageText: string,
  setInput: (value: string) => void,
): QuickAction[] {
  return [
    {
      id: "copy",
      label: "Copy",
      onClick: () => safeCopyToClipboard(messageText),
    },
    {
      id: "research",
      label: "Research more",
      onClick: () =>
        setInput(`Tell me more about: ${messageText.slice(0, 50)}`),
    },
  ];
}

export function uiMessagesToChatMessages(args: {
  uiMessages: UIMessage[];
  status: string;
  setInput: (value: string) => void;
}): ChatMessage[] {
  const { uiMessages, status, setInput } = args;
  const last = uiMessages[uiMessages.length - 1];

  return uiMessages.map((msg) => {
    const text = getUIMessageText(msg);
    const isStreaming =
      status === "streaming" && msg.role === "assistant" && msg === last;

    const actions =
      msg.role === "assistant" && status === "ready"
        ? buildAssistantActions(text, setInput)
        : undefined;

    return {
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      content: text,
      timestamp: Date.now(),
      isStreaming,
      actions,
    };
  });
}
