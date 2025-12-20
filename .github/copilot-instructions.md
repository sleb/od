# Copilot Instructions

Overdrip is a Raspberry Pi plant watering system with a Bun monorepo, Firebase backend, and Ink-based CLI. This guide covers essential patterns and workflows for AI coding agents.

## Architecture

**Monorepo structure (Bun workspaces):**

- `packages/cli` — Interactive TUI using Ink (React-based terminal UI)
- `packages/app` — Device runtime (GPIO control, logging, watering control)
- `packages/core` — Shared Firebase SDK, config/auth/device schemas (Zod)
- `packages/functions` — Firebase Cloud Functions (device registration, custom tokens)
- `packages/eslint` — Shared ESLint config

**Data flow:**

1. CLI authenticates user via Firebase Auth (email/password → `packages/core/user.ts`)
2. User registers device → Cloud Function creates device record + auth token in Firestore
3. Device exchanges auth token for custom token → signs in as device
4. Config stored locally at `~/.overdrip/config.json` (includes device registration data)

**Key files:**

- [packages/cli/src/index.ts](packages/cli/src/index.ts) — yargs CLI entry (commands: `init`, `config show`, `start`)
- [packages/cli/src/app.tsx](packages/cli/src/app.tsx) — Ink app root, routing, context providers
- [packages/core/src/firebase.ts](packages/core/src/firebase.ts) — Firebase SDK init, auto-connects emulators when `NODE_ENV !== "production"`
- [packages/core/src/config.ts](packages/core/src/config.ts) — Config schema + `LocalConfigManager` (Bun file I/O)

## Critical workflows

**Development setup:**

```bash
bun install                           # Root install (workspaces)
cd packages/cli && bun run src/index.ts init  # Run CLI directly
cd packages/functions && bun run serve        # Start Firebase emulators
```

**Building & deploying:**

- CLI: `bun run build` → bundles to `dist/` with Bun.build (target: bun, minified)
- Functions: `bun run build` → bundles all code (target: node, cjs) + copies `dummy-package.json` to `lib/` (enables monorepo code sharing without workspace dependencies)
- Deploy functions: `firebase deploy --only functions`

**Testing:**

- Use Bun's built-in test runner: `bun test` (no Jest/Vitest needed)
- Test files: `*.test.ts` co-located with source files
- Run tests before pushing changes

**Environment variables:**

- Firebase config via `OVERDRIP_FIREBASE_*` env vars (see [packages/cli/.env](packages/cli/.env) for local, `.env.production` for prod)
- Emulators auto-enabled when `NODE_ENV !== "production"` (Auth: 9099, Firestore: 8080, Functions: 5001)

## Project-specific patterns

**Contexts for state sharing (Ink/React):**

- `ConfigContext` — Provides `LocalConfigManager` instance (from `app.tsx`, consumed via `useConfig()` hook)
- `QuitContext` — Shared `{ shouldQuit, quit }` for graceful exit (global `q`/`Esc` handling in `Layout`)
- `UserContext` — Current Firebase user (`User | null`, set via `onAuthChange`)

**Example usage in components:**

```tsx
const MyPage = () => {
  const configManager = useConfig(); // Access config
  const { quit } = useContext(QuitContext); // Trigger exit
  const user = useContext(UserContext); // Check auth state
  // ...
};
```

**Bun I/O pattern (NOT Node.js `fs`):**

```typescript
import { file, write } from "bun";

// Read
const exists = await file(path).exists();
const data = await file(path).text();

// Write
await write(path, JSON.stringify(config, null, 2));
```

**Firebase callable functions (core → functions):**

- Client: `httpsCallable<Request, Response>(functions, "functionName")` (see [packages/core/src/device.ts](packages/core/src/device.ts))
- Server: `onCall<Request, Promise<Response>>((req) => { ... })` (see [packages/functions/src/register-device.ts](packages/functions/src/register-device.ts))
- Authentication enforced via `req.auth?.uid` check

**Schema-first design:**

- All data validated with Zod (e.g., `ConfigSchema`, `DeviceRegistrationSchema`)
- Schemas shared between core + functions via workspace dependencies
- Type inference via `z.infer<typeof Schema>`

## CLI component architecture

**Page routing ([app.tsx](packages/cli/src/app.tsx)):**

```typescript
type Page =
  | { name: "init" }
  | { name: "config-show" }
  | { name: "start"; options: StartPageOptions };
// Pages rendered based on yargs command → app(page, configPath)
```

**Component organization:**

- `Layout` — Global wrapper (logo, user display, quit message, global key bindings)
- `*Page` — Top-level pages (InitPage, StartPage, ConfigShowPage)
- `*Form` — Interactive input components (LoginForm, DeviceRegistrationForm)
- `*Required` — Auth guards (AuthRequired, DeviceAuthRequired) — wrap children, show prompts if auth/device missing

**Exit flow:**

1. User presses `q`/`Esc` → `Layout` calls `quit()` from `QuitContext`
2. `shouldQuit` set to `true` → `QuitMessage` displays "Exiting..."
3. 100ms delay → `useApp().exit()` terminates Ink app

## Conventions

- **No Node.js tooling** — Use Bun exclusively (`bun run`, `bun install`); avoid npm/yarn/pnpm
- **Arrow functions** — Prefer `const MyComponent = () => {}` over `function MyComponent() {}`
- **Workspace dependencies** — Reference packages via `@overdrip/package-name` with `workspace:*` protocol
- **New CLI commands** — Add to yargs in [packages/cli/src/index.ts](packages/cli/src/index.ts), create page component, add route in `app.tsx`
- **Shared code** — Place in `packages/core` (Firebase logic, schemas), not in `cli`/`app` directly

## Common pitfalls

- **Don't use `fs` module** — Bun's `file()`/`write()` differ (async-first, no `readFileSync`)
- **Context access** — Always use purpose-built hooks (`useConfig()`, `useQuit()`, `useUser()`) instead of `useContext()` directly; only use `useContext()` when handling nullable values (e.g., auth guards where `useUser()` would throw on null)
- **Firebase emulators** — Must run locally for development; automatic detection via `NODE_ENV`
- **Build outputs** — Functions build to `lib/` (Node runtime), CLI to `dist/` (Bun runtime) — don't mix targets
- **Functions monorepo sharing** — [packages/functions/build.ts](packages/functions/build.ts) bundles all dependencies + copies [dummy-package.json](packages/functions/dummy-package.json) → enables sharing types/libs from workspace without `workspace:*` references in deployed code

## Firestore security rules

- Rules defined in [firestore.rules](firestore.rules) control client access
- Device access pattern: devices authenticate as themselves (custom tokens), users own `/users/{uid}/devices/{deviceId}`
- Update rules when adding new collections or changing access patterns
- Test rules with Firebase emulator before deploying

## GPIO/Hardware (app package)

- Device control logic lives in `packages/app` (planned)
- Hardware interactions (GPIO pins, sensors) should be abstracted behind interfaces for testability
- Config schema in `core` should define pin mappings, watering schedules

## Unit Testing

**Approach:** Lean, critical-logic-only testing using Bun's built-in test runner. No external frameworks needed.

**Test coverage completed:**

- ✅ `packages/core/src/config.test.ts` — 19 tests (LocalConfigManager I/O and ConfigSchema validation)
- ✅ `packages/core/src/user.test.ts` — 9 tests (UserSchema validation)
- ✅ `packages/core/src/device.test.ts` — 42 tests (Device schemas: primitives, request/response, registration)
- ✅ `packages/functions/src/register-device.test.ts` — 10 tests (RegisterDevice request/response schema validation)
- ✅ `packages/functions/src/create-custom-token.test.ts` — 16 tests (CreateCustomToken schemas + extracted `isAuthTokenValid()` pure function)

**Total: 96 tests passing** across core and functions packages.

**Key patterns:**

- **Schema testing:** Use Zod's `.safeParse()` directly; schemas consolidated in `packages/core/src/schemas.ts` (pure module, no Firebase init)
- **LocalConfigManager:** Use temp files via Bun's `file()` API
- **Pure functions:** Extract business logic (e.g., `isAuthTokenValid()`) for direct unit testing
- **What to skip:** Don't test Firebase SDK methods, Bun internals, Ink components, or external libraries

**Run tests:** `bun test` from workspace root or per-package.

## Validation checklist

When making changes:

- [ ] Uses Bun APIs (`file`, `write`) not Node.js `fs`
- [ ] Respects `configPath` from context (don't hardcode `~/.overdrip/config.json`)
- [ ] Exit flows call shared `quit()` (not `process.exit()` or `useApp().exit()` directly)
- [ ] Schemas kept in sync between `core` and `functions` when changing data models
- [ ] Environment variables prefixed with `OVERDRIP_` (Firebase config, custom token URL)
- [ ] **Keep README.md and copilot-instructions.md in sync** when updating architecture/roadmap
