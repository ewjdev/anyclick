import { expect, it } from "vitest";
import {
  insertCompletion,
  localCompletions,
} from "../../packages/anyclick-react/src/Conversation/completions";

it("inserts a mention at the caret without deleting the remaining sentence", () => {
  const item = {
    id: "bottle",
    label: "Trail Bottle",
    value: "@bottle",
    kind: "mention" as const,
  };
  expect(insertCompletion("Compare @bo with this", 11, item)).toBe(
    "Compare @bottle  with this",
  );
});
it("filters only the active token and limits local matches", () => {
  const objects = Array.from({ length: 10 }, (_, index) => ({
    id: `item-${index}`,
    label: `Bottle ${index}`,
  }));
  expect(localCompletions("Compare @bo", 11, [], objects)).toHaveLength(5);
  expect(localCompletions("Compare a bottle", 16, [], objects)).toEqual([]);
});
