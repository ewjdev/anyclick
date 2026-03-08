import { expect, test } from "@playwright/test";
import { feedbackMenu, openFeedbackMenu } from "./helpers";

test.describe("anyclick core runtime", () => {
  test("global provider menu can open and close on examples", async ({ page }) => {
    await page.goto("/examples/basic");

    await openFeedbackMenu(page, page.getByRole("heading", { name: "Basic Setup" }));
    await expect(page.getByText("Reload page")).toBeVisible();
    await expect(page.getByText("Inspect")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(feedbackMenu(page)).toBeHidden();
  });

  test("quick chat shell opens, focuses input, and closes cleanly", async ({ page }) => {
    await page.route("**/api/anyclick/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          suggestions: [
            "What is this element?",
            "How can I improve accessibility?",
            "How can I style this better?",
          ],
        }),
      });
    });
    await page.route("**/api/anyclick/chat/history", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/examples/quick-chat");

    await openFeedbackMenu(page, page.getByTestId("quick-chat-target"));
    await page.locator('[title="Quick Ask AI"]').click();

    const input = page.getByPlaceholder("Ask about this element...");
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    await expect(page.getByText("What is this element?")).toBeVisible();

    await page.locator('[title="Close"]').click();
    await expect(input).toBeHidden();
    await expect(feedbackMenu(page)).toBeVisible();
  });

  test("scoped providers use section-specific menu config", async ({ page }) => {
    await page.goto("/examples/scoped-providers");

    await openFeedbackMenu(page, page.getByTestId("scoped-rose-section"));
    await expect(page.getByText("Report Issue (Scoped)")).toBeVisible();
    await page.keyboard.press("Escape");

    await openFeedbackMenu(page, page.getByTestId("scoped-emerald-section"));
    await expect(page.getByText("Suggest Feature")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByTestId("scoped-disabled-section").click({ button: "right" });
    await expect(feedbackMenu(page)).toBeHidden();
  });

  test("sensitive masking fixtures render and remain interactive", async ({ page }) => {
    await page.goto("/examples/sensitive-masking");

    await page.getByTestId("sensitive-password-input").fill("super-secret");
    await page.getByTestId("sensitive-card-input").fill("4242424242424242");
    await page.getByTestId("sensitive-custom-input").fill("123-45-6789");

    await expect(page.getByText("Sensitive Selector Masking")).toBeVisible();
    await expect(page.getByText("Custom Sensitive Elements")).toBeVisible();

    await openFeedbackMenu(page, page.getByTestId("sensitive-password-input"));
    await expect(
      page.getByRole("menu", { name: "Feedback options" }).getByRole("button", { name: "Inspect" }),
    ).toBeVisible();
  });
});
