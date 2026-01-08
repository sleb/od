import { test, expect } from "@playwright/test";
import {
  signUp,
  logIn,
  logOut,
  isAuthenticated,
  generateTestEmail,
} from "./helpers";

test.describe("Authentication Flow", () => {
  test("should complete full auth cycle: signup -> logout -> login", async ({
    page,
  }) => {
    const email = generateTestEmail();
    const password = "testpass123";

    // 1. Sign up
    await signUp(page, email, password);
    await expect(page).toHaveURL("/");
    expect(await isAuthenticated(page)).toBe(true);

    // 2. Log out
    await logOut(page);
    await expect(page).toHaveURL("/login");
    expect(await isAuthenticated(page)).toBe(false);

    // 3. Log in
    await logIn(page, email, password);
    await expect(page).toHaveURL("/");
    expect(await isAuthenticated(page)).toBe(true);
  });
});
