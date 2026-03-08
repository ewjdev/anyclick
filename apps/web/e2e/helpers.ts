import { expect, type Locator, type Page } from "@playwright/test";

export function feedbackMenu(page: Page): Locator {
  return page.getByRole("menu", { name: "Feedback options" });
}

export async function openFeedbackMenu(page: Page, target: Locator) {
  await target.click({ button: "right" });
  await expect(feedbackMenu(page)).toBeVisible();
}
