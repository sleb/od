import { test, expect } from "@playwright/test";
import { signUp, generateTestEmail, isAuthenticated } from "./helpers";

test.describe("Protected Routes", () => {
  test("should redirect to login when accessing protected routes without auth", async ({
    page,
  }) => {
    // Try to access root (protected)
    await page.goto("/");
    await expect(page).toHaveURL("/login");
    expect(await isAuthenticated(page)).toBe(false);

    // Try to access devices (protected)
    await page.goto("/devices");
    await expect(page).toHaveURL("/login");
    expect(await isAuthenticated(page)).toBe(false);
  });

  test("should allow access to protected routes when authenticated", async ({
    page,
  }) => {
    const email = generateTestEmail();
    const password = "testpass123";
    await signUp(page, email, password);

    // Should access root
    await page.goto("/");
    await expect(page).toHaveURL("/");
    expect(await isAuthenticated(page)).toBe(true);

    // Should access devices
    await page.goto("/devices");
    await expect(page).toHaveURL("/devices");
    expect(await isAuthenticated(page)).toBe(true);
  });
});
