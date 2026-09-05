"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ConversationResultView } from "./Result";
import { insertCompletion, localCompletions } from "./completions";
import "./conversation.css";
import type {
  CompletionItem,
  ConversationMessage,
  ConversationProps,
} from "./types";

const EMPTY_COMMANDS: CompletionItem[] = [];
const EMPTY_OBJECTS: ConversationProps["context"] = [];

/** Mount one controller per thread. The SDK owns the transcript; the host owns persisted history. */
export function Conversation(props: ConversationProps) {
  return <ConversationThread key={props.conversationId} {...props} />;
}

function ConversationThread({
  conversationId,
  endpoint,
  historyEndpoint,
  context,
  onContextChange,
  commands = EMPTY_COMMANDS,
  objects = EMPTY_OBJECTS,
  suggestionProvider,
  actionDispatcher,
  renderResult,
  initialInput = "",
  title = "Ask about this",
  disabled,
  presentation = "docked",
  onClose,
}: ConversationProps) {
  const [input, setInput] = useState(initialInput);
  const [caret, setCaret] = useState(initialInput.length);
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [active, setActive] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(!historyEndpoint);
  const [historyError, setHistoryError] = useState("");
  const [reload, setReload] = useState(0);
  const [copyError, setCopyError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submittedDraft = useRef("");
  const contextRef = useRef(context);
  contextRef.current = context;
  const listId = useId();
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: endpoint,
        body: () => ({ conversationId, context: contextRef.current }),
      }),
    [endpoint, conversationId],
  );
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error,
    stop,
    clearError,
  } = useChat<ConversationMessage>({
    id: conversationId,
    transport,
    onFinish: ({ isAbort, isError }) => {
      if (!isAbort && !isError)
        setInput((current) =>
          current === submittedDraft.current ? "" : current,
        );
    },
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (initialInput) {
      setInput(initialInput);
      setCaret(initialInput.length);
      inputRef.current?.focus();
    }
  }, [initialInput]);
  useEffect(() => {
    const key = `anyclick-draft:${conversationId}`;
    try {
      if (!initialInput) setInput(sessionStorage.getItem(key) ?? "");
    } catch {
      /* Storage may be unavailable. */
    }
  }, [conversationId]);
  useEffect(() => {
    try {
      sessionStorage.setItem(`anyclick-draft:${conversationId}`, input);
    } catch {
      /* Draft still works in memory. */
    }
  }, [input, conversationId]);
  useEffect(() => {
    if (!historyEndpoint) return;
    const abort = new AbortController();
    setHydrated(false);
    setHistoryError("");
    fetch(
      `${historyEndpoint}?conversationId=${encodeURIComponent(conversationId)}`,
      { signal: abort.signal },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load conversation.");
        setMessages(data.messages);
        setHydrated(true);
      })
      .catch((cause) => {
        if (!abort.signal.aborted) setHistoryError(cause.message);
      });
    return () => {
      abort.abort();
    };
  }, [historyEndpoint, conversationId, setMessages, reload]);
  useEffect(
    () => () => {
      void stop();
    },
    [stop],
  );

  useEffect(() => {
    const abort = new AbortController();
    setActive(-1);
    const local = localCompletions(input, caret, commands, objects);
    setCompletions(local);
    if (
      local.length ||
      !suggestionProvider ||
      input.trim().length < 3 ||
      /(?:^|\s)[/@][^\s]*$/.test(input.slice(0, caret)) ||
      busy ||
      dismissed
    )
      return () => abort.abort();
    const timer = setTimeout(() => {
      suggestionProvider({ input, caret, context, signal: abort.signal })
        .then((items) => {
          if (!abort.signal.aborted) setCompletions(items.slice(0, 5));
        })
        .catch(() => {
          /* Suggestions are optional; never block typing. */
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [
    input,
    caret,
    commands,
    objects,
    context,
    suggestionProvider,
    busy,
    dismissed,
  ]);

  const visible = !dismissed && completions.length > 0;
  function accept(item: CompletionItem) {
    setInput(insertCompletion(input, caret, item));
    if (
      item.context &&
      !context.some((object) => object.id === item.context!.id)
    )
      onContextChange([...context, item.context]);
    setDismissed(true);
    setActive(-1);
    inputRef.current?.focus();
  }
  async function submit() {
    if (!input.trim() || busy || disabled || !hydrated) return;
    const text = input.trim();
    submittedDraft.current = input;
    clearError();
    setDismissed(true);
    await sendMessage({
      role: "user",
      parts: [
        { type: "text", text },
        {
          type: "data-context",
          data: context.map((object) => ({ ...object })),
        },
      ],
    }); // Keep the draft until completion; failures never erase it.
  }

  return (
    <section
      className={`ac-conversation ac-conversation-${presentation}`}
      aria-label={title}
      data-anyclick-ui
    >
      <header>
        <div>
          <strong>{title}</strong>
          <p>Select something. Ask a question. Take the next step.</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close conversation"
          >
            Close
          </button>
        )}
      </header>
      <div className="ac-context" aria-label="Included context">
        {context.length ? (
          context.map((object) => (
            <button
              key={object.id}
              type="button"
              title={object.description}
              onClick={() =>
                onContextChange(context.filter((item) => item.id !== object.id))
              }
              aria-label={`Remove ${object.label} from context`}
            >
              {object.label} <span aria-hidden>×</span>
            </button>
          ))
        ) : (
          <p>No objects included. Use @ to add context.</p>
        )}
      </div>
      <div
        className="ac-transcript"
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        aria-relevant="additions"
      >
        {!messages.length && (
          <div className="ac-chat-empty">
            <h3>Start with what’s in front of you.</h3>
            <p>
              Ask about a selected object, use / to find an action, or @ to
              bring another object into the conversation.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <article
            className={`ac-message ac-message-${message.role}`}
            key={message.id}
          >
            <strong>{message.role === "user" ? "You" : "AnyClick"}</strong>
            {message.parts.map((part, index) =>
              part.type === "text" ? (
                <p key={index} style={{ whiteSpace: "pre-wrap" }}>
                  {part.text}
                </p>
              ) : part.type === "data-result" ? (
                <div key={index}>
                  {renderResult ? (
                    renderResult(part.data)
                  ) : (
                    <ConversationResultView
                      draftKey={`${conversationId}:${message.id}:${index}`}
                      result={part.data}
                      onAction={actionDispatcher}
                    />
                  )}
                </div>
              ) : part.type === "data-context" ? (
                <small key={index}>
                  Context:{" "}
                  {part.data.map((object) => object.label).join(", ") || "none"}
                </small>
              ) : null,
            )}
            {message.role === "assistant" && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      message.parts
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("\n"),
                    );
                    setCopyError("Copied response.");
                  } catch {
                    setCopyError(
                      "Clipboard unavailable. Select the response text to copy it.",
                    );
                  }
                }}
              >
                Copy response
              </button>
            )}
          </article>
        ))}
      </div>
      {copyError && <p role="status">{copyError}</p>}
      {historyError && (
        <p role="alert">
          {historyError}{" "}
          <button onClick={() => setReload((value) => value + 1)}>
            Retry loading
          </button>
        </p>
      )}
      {error && (
        <p role="alert">
          {error.message} Your draft is preserved.{" "}
          <button
            onClick={() => {
              clearError();
              setReload((value) => value + 1);
            }}
          >
            Reload conversation
          </button>
        </p>
      )}
      <form
        className="ac-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label htmlFor={`${listId}-input`}>
          Ask a question or type / for actions
        </label>
        <textarea
          ref={inputRef}
          id={`${listId}-input`}
          value={input}
          rows={3}
          maxLength={4000}
          aria-autocomplete="list"
          aria-describedby={`${listId}-help`}
          aria-controls={visible ? listId : undefined}
          aria-activedescendant={
            visible && active >= 0 ? `${listId}-${active}` : undefined
          }
          onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
          onChange={(event) => {
            setInput(event.target.value);
            setCaret(event.target.selectionStart);
            setDismissed(false);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Escape") {
              setDismissed(true);
              setActive(-1);
            } else if (
              visible &&
              ["ArrowDown", "ArrowUp"].includes(event.key)
            ) {
              event.preventDefault();
              setActive((value) =>
                value < 0
                  ? event.key === "ArrowDown"
                    ? 0
                    : completions.length - 1
                  : (value +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      completions.length) %
                    completions.length,
              );
            } else if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (visible && active >= 0) accept(completions[active]);
              else void submit();
            }
          }}
          placeholder="What would you like to do with this?"
        />
        {visible && (
          <ul id={listId} role="listbox" aria-label="Suggestions">
            {completions.map((item, index) => (
              <li
                role="option"
                id={`${listId}-${index}`}
                aria-selected={index === active}
                key={item.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => accept(item)}
              >
                <strong>{item.label}</strong>
                {item.description && <small>{item.description}</small>}
              </li>
            ))}
          </ul>
        )}
        <div className="ac-composer-footer">
          <small id={`${listId}-help`}>
            Enter to send · Shift + Enter for a new line · Arrow keys for
            suggestions
          </small>
          {busy ? (
            <button type="button" onClick={() => void stop()}>
              Stop response
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || !hydrated || !input.trim()}
            >
              Send
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
