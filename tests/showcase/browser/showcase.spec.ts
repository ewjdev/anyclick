import { expect, test } from "@playwright/test";
import {
  type ActionInput,
  initialScenario,
  mutateScenario,
  scenarioIds,
  scenarios,
} from "../../../apps/web/src/lib/showcase/domain";

// Browser transport fixtures are confined to the test runner. Production never falls back to them.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/showcase/workspace", (route) =>
    route.fulfill({
      json: {
        workspaceId: "test-workspace",
        expiresAt: Date.now() + 86400000,
        states: scenarioIds.map(initialScenario),
        capabilities: { ai: true, github: true, githubRepo: "example/demo" },
      },
    }),
  );
  await page.route("**/api/showcase/history?*", (route) =>
    route.fulfill({ json: { messages: [], revision: 0 } }),
  );
  await page.route("**/api/showcase/suggestions", (route) =>
    route.fulfill({ json: { items: [] } }),
  );
  await page.route("**/api/showcase/events", (route) =>
    route.fulfill({ json: { recorded: true } }),
  );
  await page.goto("/");
});

for (const scenario of scenarioIds)
  for (const task of scenarios[scenario].tasks) {
    test(`${scenario}: review and complete ${task.label}`, async ({ page }) => {
      let states = scenarioIds.map(initialScenario);
      let draft: ActionInput;
      await page.route("**/api/showcase/workspace", (route) =>
        route.fulfill({
          json: {
            workspaceId: "test-workspace",
            expiresAt: Date.now() + 86400000,
            states,
            capabilities: {
              ai: true,
              github: true,
              githubRepo: "example/demo",
            },
          },
        }),
      );
      await page.route("**/api/showcase/preview", async (route) => {
        draft = route.request().postDataJSON();
        await route.fulfill({
          json: {
            id: "preview",
            input: draft,
            revision: 0,
            title: task.label,
            destination:
              task.id === "issue"
                ? "GitHub · example/demo"
                : "Your hosted sample workspace",
          },
        });
      });
      await page.route("**/api/showcase/execute", async (route) => {
        if (task.id !== "issue")
          states = states.map((state) =>
            state.id === scenario
              ? mutateScenario(state, draft, "execution", Date.now())
              : state,
          );
        await route.fulfill({
          json: {
            id: "execution",
            status: "succeeded",
            scenario,
            actionId: task.id,
            objectId: task.objectId,
            message: "Action saved to the test workspace.",
            revision: 1,
            ...(task.id === "issue"
              ? { url: "https://github.com/example/demo/issues/1" }
              : {}),
          },
        });
      });
      await page
        .getByRole("tab", { name: scenarios[scenario].title, exact: true })
        .click();
      await page.getByRole("button", { name: task.label, exact: true }).click();
      await page
        .getByRole("button", { name: "Review action", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Review your action" }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Confirm and save", exact: true })
        .click();
      await expect(
        page.getByRole("region", { name: "Action result" }),
      ).toContainText("Action saved");
      await expect(
        page.getByRole("button", { name: "Continue in chat", exact: true }),
      ).toBeVisible();
    });
  }

test("captures the selected element and retains a rendered artifact", async ({
  page,
  isMobile,
}, testInfo) => {
  await page
    .getByRole("button", { name: "Report a problem", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Attach selected element screenshot",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("img", { name: "Selected element capture preview" }),
  ).toBeVisible({ timeout: 20000 });
  if (isMobile)
    await page.getByRole("button", { name: "Return to application" }).click();
  await page.locator(".showcase-intro").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("showcase.png") });
});
test("all four industries expose three complete task starters", async ({
  page,
}) => {
  for (const name of ["Software", "Commerce", "Healthcare", "Social"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(
      page
        .getByRole("region", { name: "Interactive AnyClick workbench" })
        .locator(".showcase-task-list button"),
    ).toHaveCount(3);
    await expect(page.locator(".showcase-object").first()).toBeVisible();
  }
});
test("action fields remain edited after a failed preview", async ({
  page,
  isMobile,
}) => {
  await page.route("**/api/showcase/preview", (route) =>
    route.fulfill({
      status: 409,
      json: { error: "This record changed. Review your edits." },
    }),
  );
  await page.getByRole("tab", { name: "Social", exact: true }).click();
  await page
    .getByRole("button", { name: "Rewrite a post", exact: true })
    .click();
  const input = page.getByRole("textbox", { name: "Post copy", exact: true });
  await input.fill("My carefully edited caption");
  await page
    .getByRole("button", { name: "Review action", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Interactive AnyClick workbench" })
      .getByRole("alert"),
  ).toContainText("record changed");
  await expect(input).toHaveValue("My carefully edited caption");
  if (isMobile) {
    await page.getByRole("button", { name: "Return to application" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
});
test("mention completion is editable and Enter accepts without sending", async ({
  page,
}) => {
  let chatRequests = 0;
  await page.route("**/api/showcase/chat", (route) => {
    chatRequests++;
    return route.fulfill({
      status: 503,
      json: { error: "Test provider unavailable" },
    });
  });
  await page
    .getByRole("button", { name: "Report a problem", exact: true })
    .click();
  await page.getByRole("tab", { name: "Conversation", exact: true }).click();
  const input = page.getByRole("textbox", {
    name: "Ask a question or type / for actions",
  });
  await input.fill("Explain @checkout");
  await input.press("ArrowDown");
  await input.press("Enter");
  expect(chatRequests).toBe(0);
  await expect(input).toHaveValue(/@checkout/);
  await expect(
    page.getByRole("button", { name: "Remove Complete order from context" }),
  ).toBeVisible();
});
