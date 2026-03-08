import { expect, test, type Locator, type Page } from "@playwright/test";
import { openFeedbackMenu } from "./helpers";

async function expectWorkflowMenu(
  page: Page,
  sectionLocator: Locator,
  targetLocator: Locator,
  expectedItems: string[],
) {
  await sectionLocator.scrollIntoViewIfNeeded();
  await openFeedbackMenu(page, targetLocator);
  const menu = page.getByRole("menu", { name: "Feedback options" });

  for (const label of expectedItems) {
    await expect(menu.getByRole("button", { name: label })).toBeVisible();
  }

  await page.keyboard.press("Escape");
}

async function expectWorkflowDrawerFromMenuAction(
  page: Page,
  sectionLocator: Locator,
  targetLocator: Locator,
  actionLabel: string,
  firstStepTitle: string,
) {
  await sectionLocator.scrollIntoViewIfNeeded();
  await openFeedbackMenu(page, targetLocator);
  await page.getByRole("menu", { name: "Feedback options" }).getByRole("button", { name: actionLabel }).click();

  await expect(page.getByRole("heading", { name: actionLabel })).toBeVisible();
  await expect(page.getByText("Step 1 of")).toBeVisible();
  await expect(page.getByRole("heading", { name: firstStepTitle })).toBeVisible();

  await page.locator('button[aria-label="Close workflow drawer"]').nth(1).click();
  await expect(page.getByRole("heading", { name: actionLabel })).toBeHidden();
}

test.describe("homepage immersive workflow menus", () => {
  test("shows custom workflow menus per workstream", async ({ page }) => {
    await page.goto("/");

    const softwareSection = page.locator("#software");
    await expect(softwareSection.getByRole("heading", { name: "Software Development" })).toBeVisible();
    await expectWorkflowMenu(
      page,
      softwareSection,
      softwareSection.getByText("Workflow actions fixed for this demo"),
      ["Report this bug", "Send to Cursor", "Copy selector"],
    );
    await expectWorkflowDrawerFromMenuAction(
      page,
      softwareSection,
      softwareSection.getByText("Workflow actions fixed for this demo"),
      "Report this bug",
      "Ticket System",
    );

    const ecommerceSection = page.locator("#ecommerce");
    await expect(
      ecommerceSection.getByRole("heading", { name: "E-commerce & Logistics" }),
    ).toBeVisible();
    await expectWorkflowMenu(
      page,
      ecommerceSection,
      ecommerceSection.locator('[data-workflow-zone="stock"]').first(),
      ["View stock details", "Adjust stock", "Set restock alert"],
    );
    await expectWorkflowDrawerFromMenuAction(
      page,
      ecommerceSection,
      ecommerceSection.locator('[data-workflow-zone="stock"]').first(),
      "View stock details",
      "Inventory Snapshot",
    );

    const healthcareSection = page.locator("#healthcare");
    await expect(healthcareSection.getByRole("heading", { name: "Healthcare" })).toBeVisible();
    await expectWorkflowMenu(
      page,
      healthcareSection,
      healthcareSection.locator('[data-workflow-zone="summary"]').first(),
      ["Check-in issue", "Verify identity token", "Coverage exception"],
    );
    await expectWorkflowDrawerFromMenuAction(
      page,
      healthcareSection,
      healthcareSection.locator('[data-workflow-zone="summary"]').first(),
      "Check-in issue",
      "Issue Type",
    );

    const socialSection = page.locator("#social");
    await expect(socialSection.getByRole("heading", { name: "Social Media" })).toBeVisible();
    await expectWorkflowMenu(
      page,
      socialSection,
      socialSection.getByText("2.4k"),
      ["Save asset", "Flag content", "Quick reply"],
    );
    await expectWorkflowDrawerFromMenuAction(
      page,
      socialSection,
      socialSection.getByText("2.4k"),
      "Save asset",
      "Destination",
    );
  });
});
