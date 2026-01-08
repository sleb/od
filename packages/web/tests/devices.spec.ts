import { test, expect } from "@playwright/test";
import { signUp, generateTestEmail } from "./helpers";

test.describe("Devices List Page", () => {
  test.beforeEach(async ({ page }) => {
    // Create and login a user before each test
    const email = generateTestEmail();
    const password = "testpass123";
    await signUp(page, email, password);
  });

  test("should load devices page and show title", async ({ page }) => {
    await page.goto("/devices");

    await expect(page).toHaveURL("/devices");
    await expect(page.locator("h1:has-text('Devices')")).toBeVisible();
  });

  test("should show empty state when no devices registered", async ({
    page,
  }) => {
    await page.goto("/devices");

    // Should show empty state message
    await expect(page.locator("text=No devices registered")).toBeVisible();

    // Should show CLI instruction
    await expect(page.locator("text=/use the cli to register/i")).toBeVisible();
  });

  test("should navigate to devices page from nav menu", async ({ page }) => {
    await page.goto("/");

    // Click on Devices link in navigation
    const devicesLink = page.locator('a:has-text("Devices")');
    await devicesLink.click();

    await expect(page).toHaveURL("/devices");
    await expect(page.locator("h1:has-text('Devices')")).toBeVisible();
  });
});
