# E2E Tests for @overdrip/web

End-to-end tests for the Overdrip web application using Playwright.

## Prerequisites

- Bun installed
- Firebase CLI installed (for `emulators:exec`)
- Web dev server will be started automatically by Playwright

## Installation

Install Playwright and browsers:

```bash
cd packages/web
bun install
bunx playwright install
```

## Running Tests

### Run all tests (auto-starts emulators)

```bash
bun run test:e2e
```

The `test:e2e` script uses `firebase emulators:exec` to automatically start emulators, run tests, and stop emulators.

### Run tests with UI (interactive mode)

```bash
bun run test:e2e:ui
```

### Run tests in debug mode

```bash
bun run test:e2e:debug
```

### Manual emulator management

If you prefer to run emulators separately:

```bash
# Terminal 1: Start emulators
cd ../functions && bun run serve

# Terminal 2: Run tests directly
playwright test
playwright test tests/auth.spec.ts  # Specific file
playwright test --headed            # With visible browser
```

## Test Structure

```
tests/
├── README.md              # This file
├── helpers.ts             # Shared test utilities (signUp, logIn, logOut, etc.)
├── auth.spec.ts           # 1 test: signup → logout → login
├── protected-routes.spec.ts # 2 tests: unauthenticated & authenticated access
└── devices.spec.ts        # 2 tests: page load, empty state, navigation
```

## Test Suites

### Authentication (`auth.spec.ts`)

Single comprehensive test covering the full auth cycle:

1. **Sign up** a new user
2. **Log out** the user
3. **Log in** with the same credentials

Uses the `isAuthenticated()` helper to verify auth state.

### Protected Routes (`protected-routes.spec.ts`)

Two essential tests:

1. **Unauthenticated access** - Protected routes redirect to /login
2. **Authenticated access** - Protected routes accessible after login

Both use `isAuthenticated()` helper to verify auth state.

### Devices Page (`devices.spec.ts`)

Simple e2e tests (not unit tests):

- Page loads and shows title
- Empty state displays when no devices
- Device list displays when devices are seeded
- Navigation to device detail works
- Navigation from menu works

**Note:** Device list tests require pre-seeded test data in Firestore (see "Seeding Test Data" below).

## Test Helpers

The `helpers.ts` file provides utilities for common test actions:

- `signUp(page, email, password)` - Sign up a new user
- `logIn(page, email, password)` - Log in an existing user
- `logOut(page)` - Log out the current user
- `isAuthenticated(page)` - Check if user is authenticated (returns boolean)
- `generateTestEmail()` - Generate unique test email addresses
- `waitForPageLoad(page)` - Wait for page to finish loading
- `TEST_DEVICES` - Array of test devices for seeding

## Seeding Test Data

Some tests (e.g., device list tests) require pre-seeded data in Firestore. Since devices can only be registered from the device itself (via CLI), you have two options:

### Option 1: Use the CLI to register test devices

```bash
# Start emulators
cd packages/functions && bun run serve

# In another terminal, register a device
cd packages/cli
bun run src/index.ts init
```

### Option 2: Manually seed Firestore emulator

Add documents to the emulator at:

```
users/{userId}/devices/{deviceId}
```

With fields:

```json
{
  "id": "test-device-1",
  "name": "Living Room Plant",
  "authToken": "test-token-123",
  "registeredAt": "2024-01-01T00:00:00Z"
}
```

The `TEST_DEVICES` constant in `helpers.ts` defines expected test devices:

- `test-device-1`: Living Room Plant
- `test-device-2`: Kitchen Herbs

Tests will skip device-list-specific assertions if no devices are found.

## Writing New Tests

When adding new tests:

1. Create a new `.spec.ts` file in the `tests/` directory
2. Import test utilities from `@playwright/test` and `./helpers`
3. Use `test.describe()` to group related tests
4. Use `test.beforeEach()` for common setup (e.g., authentication)
5. Use descriptive test names that explain the expected behavior

Example:

```typescript
import { test, expect } from "@playwright/test";
import { signUp, generateTestEmail } from "./helpers";

test.describe("My Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login user
    const email = generateTestEmail();
    await signUp(page, email, "testpass123");
  });

  test("should do something specific", async ({ page }) => {
    await page.goto("/my-feature");

    await expect(page.locator("h1")).toHaveText("My Feature");
  });
});
```

## Firebase Emulators

The test scripts automatically start and stop Firebase emulators using `firebase emulators:exec`.

Emulator ports:

- **Auth**: http://localhost:9099
- **Firestore**: http://localhost:8080
- **Functions**: http://localhost:5001

The web app automatically connects to emulators when `NODE_ENV !== "production"`.

## Debugging Tests

### Visual Debugging

Use Playwright's UI mode to see tests run in real-time:

```bash
bun run test:e2e:ui
```

### Step-through Debugging

Use debug mode to pause and step through tests:

```bash
bun run test:e2e:debug
```

### Screenshots and Traces

Failed tests automatically capture:

- Screenshots (in `test-results/`)
- Traces (viewable with `bunx playwright show-trace <trace-file>`)

### View Last Test Report

```bash
bunx playwright show-report
```

## CI/CD Integration

In CI environments:

- Tests run in headless mode
- Retry failed tests 2 times
- Run tests serially (not parallel) for consistency
- Generate HTML report for artifacts

The `playwright.config.ts` automatically detects CI via `process.env.CI`.

## Best Practices

1. **Use unique emails**: Always use `generateTestEmail()` to avoid conflicts
2. **Keep tests simple**: These are e2e tests, not unit tests - focus on user flows
3. **Wait for navigation**: Use `page.waitForURL()` after actions that trigger navigation
4. **Use helpers**: Leverage `isAuthenticated()`, `signUp()`, etc. for cleaner tests
5. **Skip when appropriate**: Use `test.skip()` for tests that require specific data
6. **Test isolation**: Use `test.beforeEach()` to set up fresh state for each test

## Troubleshooting

### Tests fail with "Target closed" or "Navigation timeout"

- Check that Firebase CLI is installed: `firebase --version`
- Ensure `firebase.json` is configured correctly (in project root)
- Check that the dev server starts successfully
- Increase timeout in `playwright.config.ts`

### Tests can't find elements

- Check that selectors match the actual rendered HTML
- Use Playwright Inspector to debug selectors: `bun run test:e2e:debug`
- Verify the element is visible (not hidden by CSS or loading states)

### Authentication tests fail

- Tests use `firebase emulators:exec` which should handle emulator startup
- Check that `@overdrip/core` is configured for emulator mode
- Verify environment variables are set correctly
- Try running emulators manually to see detailed logs

### Device tests show unexpected results

- Remember that device data comes from Firestore emulator
- Emulator data is ephemeral and resets between emulator restarts
- Tests are designed to handle both empty and populated states

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
