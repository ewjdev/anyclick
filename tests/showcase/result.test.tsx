// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ConversationResultView } from "../../packages/anyclick-react/src/Conversation/Result";

afterEach(cleanup);
it("preserves edited input when preview preparation fails", async () => {
  const action = vi.fn().mockRejectedValue(new Error("Record changed"));
  render(
    <ConversationResultView
      result={{
        kind: "draft",
        title: "Reply",
        actionId: "reply",
        objectId: "comment",
        fields: [{ name: "text", label: "Reply text", value: "Draft" }],
      }}
      onAction={action}
    />,
  );
  const input = screen.getByLabelText("Reply text");
  await userEvent.clear(input);
  await userEvent.type(input, "My revised response");
  await userEvent.click(screen.getByRole("button", { name: "Review action" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Record changed",
  );
  expect(input).toHaveProperty("value", "My revised response");
  expect(action).toHaveBeenCalledWith({
    actionId: "reply",
    objectId: "comment",
    values: { text: "My revised response" },
  });
});
