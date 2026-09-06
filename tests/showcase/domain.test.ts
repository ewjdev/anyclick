import { describe, expect, it } from "vitest";
import {
  getObject,
  initialScenario,
  mutateScenario,
  resultForTask,
  scenarioIds,
  scenarios,
  validateAction,
} from "../../apps/web/src/lib/showcase/domain";

describe("all twelve journeys", () => {
  for (const id of scenarioIds)
    for (const task of scenarios[id].tasks) {
      it(`${id}: ${task.label} uses valid data and produces the promised result`, () => {
        const state = initialScenario(id);
        const input = {
          scenario: id,
          actionId: task.id,
          objectId: task.objectId,
          values: Object.fromEntries(
            task.fields.map((field) => [field.name, field.value]),
          ),
        };
        expect(() => validateAction(state, input)).not.toThrow();
        expect(resultForTask(state, task).objectId).toBe(task.objectId);
        if (task.id !== "issue") {
          const next = mutateScenario(state, input, "execution-1", 10);
          expect(next.revision).toBe(1);
          expect(next.activity[0].id).toBe("execution-1");
          expect(next.objects).not.toEqual(state.objects);
          expect(state.revision).toBe(0); // Updates cannot mutate the captured before-state.
        }
      });
    }
  it("rejects actions on unrelated objects", () => {
    expect(() =>
      validateAction(initialScenario("software"), {
        scenario: "software",
        actionId: "improve",
        objectId: "checkout",
        values: { text: "Changed" },
      }),
    ).toThrow("does not apply");
  });
  it("rejects invented appointment slots", () => {
    expect(() =>
      validateAction(initialScenario("healthcare"), {
        scenario: "healthcare",
        actionId: "reschedule",
        objectId: "appointment-204",
        values: { slot: "Friday 23:00" },
      }),
    ).toThrow("available");
  });
  it("prevents duplicate replacements and allows explicit cancellation", () => {
    const input = {
      scenario: "commerce" as const,
      actionId: "replacement",
      objectId: "order-1042",
      values: { quantity: "1" },
    };
    const next = mutateScenario(initialScenario("commerce"), input, "one", 1);
    expect(() => mutateScenario(next, input, "two", 2)).toThrow(
      "already pending",
    );
    const cancelled = mutateScenario(
      next,
      { ...input, actionId: "cancel", values: {} },
      "three",
      3,
    );
    expect(getObject(cancelled, input.objectId).fields.replacement).toBe(
      "Cancelled",
    );
  });
  it("supports publishing, editing, and removing a sample reply", () => {
    let state = initialScenario("social");
    for (const actionId of ["reply", "edit-reply", "remove-reply"])
      state = mutateScenario(
        state,
        {
          scenario: "social",
          actionId,
          objectId: "comment-73",
          values: { text: "A reviewed reply" },
        },
        actionId,
        1,
      );
    expect(getObject(state, "comment-73").fields.reply).toBeUndefined();
  });
  it("compares catalog facts without model-generated numbers", () => {
    const result = resultForTask(
      initialScenario("commerce"),
      scenarios.commerce.tasks[2],
    );
    expect(result.rows).toContainEqual(["price", "$32", "$44"]);
  });
});
