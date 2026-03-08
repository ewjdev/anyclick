import { expect, test } from "@playwright/test";
import { feedbackMenu, openFeedbackMenu } from "./helpers";

test.describe("website smoke", () => {
  test("homepage renders and global context menu opens", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Get Started" }).first()).toBeVisible();
    await expect(page.getByText("UX done right")).toBeVisible();

    await openFeedbackMenu(
      page,
      page.getByRole("heading", { name: "Built to extend browser workflows" }),
    );
    const menu = page.getByRole("menu", { name: "Feedback options" });
    await expect(menu.getByRole("button", { name: "Reload page" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Inspect" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(feedbackMenu(page)).toBeHidden();
  });

  test("docs getting-started renders and code blocks are usable", async ({ page }) => {
    await page.goto("/docs/getting-started");

    await expect(page.getByRole("heading", { name: "Getting Started" })).toBeVisible();
    await expect(page.getByText("Step 1: Install Packages")).toBeVisible();

    const copyButton = page.getByRole("button", { name: "Copy code" }).first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    await expect(page.getByRole("button", { name: "Copied!" }).first()).toBeVisible();

    await openFeedbackMenu(page, page.getByRole("heading", { name: "Step 1: Install Packages" }));
    await expect(
      page.getByRole("menu", { name: "Feedback options" }).getByRole("button", { name: "Ask t3.chat" }),
    ).toBeVisible();
  });

  test("examples index renders and routes are reachable", async ({ page }) => {
    await page.goto("/examples");

    await expect(page.getByRole("heading", { name: "Examples" })).toBeVisible();
    const quickChatCard = page.getByRole("link", { name: /Quick Chat/i }).first();
    await expect(quickChatCard).toBeVisible();

    await openFeedbackMenu(page, page.getByRole("heading", { name: "Try it on this page!" }));
    await expect(
      page.getByRole("menu", { name: "Feedback options" }).getByRole("button", { name: 'Search "Google"' }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    await quickChatCard.click();
    await expect(page).toHaveURL(/\/examples\/quick-chat$/);
    await expect(page.getByRole("heading", { name: "Quick Chat" })).toBeVisible();
  });
});
