// @vitest-environment jsdom
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Conversation } from "../../packages/anyclick-react/src/Conversation/Conversation";

const { sendMessage, stop, setMessages } = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  stop: vi.fn(),
  setMessages: vi.fn(),
}));
vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: [],
    setMessages,
    sendMessage,
    status: "ready",
    error: null,
    stop,
    clearError: vi.fn(),
  }),
}));
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.clearAllMocks();
});
it("renders without optional providers and does not loop", () => {
  render(
    <Conversation
      conversationId="software:one"
      endpoint="/api/chat"
      context={[]}
      onContextChange={() => {}}
    />,
  );
  expect(screen.getByRole("textbox")).toBeTruthy();
});
it("ignores a stale completion after the input changes", async () => {
  let finishFirst: (items: unknown[]) => void = () => {};
  const provider = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishFirst = resolve;
        }),
    )
    .mockResolvedValueOnce([
      {
        id: "new",
        label: "New completion",
        value: "New completion",
        kind: "completion",
      },
    ]);
  render(
    <Conversation
      conversationId="software:two"
      endpoint="/api/chat"
      context={[]}
      onContextChange={() => {}}
      suggestionProvider={provider}
    />,
  );
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "First input" } });
  await waitFor(() => expect(provider).toHaveBeenCalledTimes(1));
  fireEvent.change(input, { target: { value: "Second input" } });
  await screen.findByRole("option", { name: "New completion" });
  finishFirst([
    { id: "old", label: "Stale completion", value: "Old", kind: "completion" },
  ]);
  await waitFor(() =>
    expect(screen.queryByText("Stale completion")).toBeNull(),
  );
});
it("does not send when Enter completes an IME composition", () => {
  render(
    <Conversation
      conversationId="software:three"
      endpoint="/api/chat"
      context={[]}
      onContextChange={() => {}}
    />,
  );
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "入力" } });
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  expect(sendMessage).not.toHaveBeenCalled();
});
