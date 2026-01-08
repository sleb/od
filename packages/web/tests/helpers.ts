import type { Page } from "@playwright/test";

/**
 * Test user credentials for e2e tests
 * Note: These should be used with Firebase emulators only
 */
export const TEST_USERS = {
  existing: {
    email: "existing@overdrip.test",
    password: "testpass123",
  },
  new: {
    email: `new-${Date.now()}@overdrip.test`,
    password: "testpass123",
  },
} as const;

/**
 * Test devices that can be seeded in Firestore for testing
 *
 * To seed these devices in the emulator:
 * 1. Register a device using the CLI (`drip init`)
 * 2. Or manually add documents to Firestore at:
 *    users/{userId}/devices/{deviceId}
 *    with fields: { id, name, authToken, registeredAt }
 *
 * Note: Devices can only be registered from the device itself (via CLI),
 * not from the web UI.
 */
export const TEST_DEVICES = [
  {
    id: "test-device-1",
    name: "Living Room Plant",
  },
  {
    id: "test-device-2",
    name: "Kitchen Herbs",
  },
] as const;

/**
 * Signs up a new user via the signup page
 */
export async function signUp(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/signup");

  await page.fill('input[type="email"]', email);
  await page.fill('input[placeholder="Create a password"]', password);
  await page.fill('input[placeholder="Confirm your password"]', password);

  await page.click('button[type="submit"]');

  // Wait for navigation to home page
  await page.waitForURL("/", { timeout: 10000 });
}

/**
 * Logs in an existing user via the login page
 */
export async function logIn(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");

  await page.fill('input[type="email"]', email);
  await page.fill('input[placeholder="Enter your password"]', password);

  await page.click('button:has-text("Sign in")');

  // Wait for navigation to home page
  await page.waitForURL("/", { timeout: 10000 });
}

/**
 * Logs out the current user via the user menu
 */
export async function logOut(page: Page): Promise<void> {
  // Click the user menu button
  await page.click('[data-testid="user-menu-button"]');

  // Click the logout menu item
  await page.click("text=Log out");

  // Wait for redirect to login page
  await page.waitForURL("/login", { timeout: 5000 });
}

/**
 * Checks if the user is currently authenticated (on a protected page)
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // If we can see the user menu (which requires auth), user is authenticated
    await page.waitForSelector('[data-testid="user-menu-button"]', {
      timeout: 10000,
      state: "visible",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Waits for the page to finish loading (no loaders visible)
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  // Wait for any loading spinners to disappear
  await page
    .waitForSelector('[data-loading="true"]', {
      state: "hidden",
      timeout: 10000,
    })
    .catch(() => {
      // Ignore if no loader was present
    });
}

/**
 * Creates a unique email for testing
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@overdrip.test`;
}
