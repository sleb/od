# Copilot Instructions

Overdrip is a Raspberry Pi plant watering system with a Bun monorepo, Firebase backend, and a yargs-based CLI. This guide covers essential patterns and workflows for AI coding agents.

## Quick Guide (AI Agents)

- **Architecture:** Bun monorepo with workspaces: CLI (yargs), App (device runtime), Core (schemas + Firebase), Functions (Cloud Functions).
- **Key Files:**
  - [packages/cli/src/index.ts](packages/cli/src/index.ts) — CLI commands (`init`, `config show`, `start`).
  - [packages/app/src/index.ts](packages/app/src/index.ts) — Main loop; hardware slots merged with plant config each iteration.
  - [packages/app/src/hardware/factory.ts](packages/app/src/hardware/factory.ts) — Creates hardware based on `config.hardwareMode` (`detect` default).
  - [packages/core/src/config.ts](packages/core/src/config.ts) — `ConfigSchema`, `LocalConfigManager`; config at `~/.overdrip/config.json`.
  - [packages/core/src/firebase.ts](packages/core/src/firebase.ts) — Firebase init; auto-emulators when `NODE_ENV !== "production"`.
  - [packages/functions/src/register-device.ts](packages/functions/src/register-device.ts) — Device registration callable.

- **Runtime Pattern:**
  - Two fixed hardware slots: slot 0 → ADS1115 ch 0 + GPIO 17; slot 1 → ADS1115 ch 1 + GPIO 27.
  - Hardware slots are initialized once; plant config is reloaded every loop and merged by index.
  - Loop interval comes from `device.checkIntervalMs` (optional, >0; default 5000ms).

- **Hardware Mode:**
  - `hardwareMode?: "mock" | "detect"` (default: `detect`).
  - Detect checks Raspberry Pi via platform/`/proc/device-tree/model`; real interfaces TBD, mock used otherwise.

- **Build & Run:**
  - Dev: `bun install` → `cd packages/functions && bun run serve` → `cd packages/cli && bun run src/index.ts init`.
  - CLI build: `cd packages/cli && NODE_ENV=production bun run build` (outputs to `dist/`).
  - Functions build: `cd packages/functions && bun run build` (bundles to `lib/` with `dummy-package.json`).

- **Testing:** `bun test` from repo root; tests are co-located `*.test.ts` (schemas, config, functions).

- **Conventions:**
  - Use Bun I/O (`file`, `write`) — avoid Node `fs`.
  - Prefer arrow functions; workspace deps via `@overdrip/*` with `workspace:*`.
  - No hardware pins in user config; mapping is internal.

- **Gotchas:**
  - Do not recreate hardware on config changes — merge configs with existing slots.
  - Emulators auto-enable when not production; ensure env vars `OVERDRIP_FIREBASE_*` are set for local.
  - Keep README and this doc in sync when altering architecture.

## Architecture

**Monorepo structure (Bun workspaces):**

- `packages/cli` — Yargs-based CLI (prompts + terminal output)
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
- [packages/cli/src/commands](packages/cli/src/commands) — CLI command handlers (`init.ts`, `config-show.ts`, `start.ts`)
- [packages/core/src/firebase.ts](packages/core/src/firebase.ts) — Firebase SDK init, auto-connects emulators when `NODE_ENV !== "production"`
- [packages/core/src/config.ts](packages/core/src/config.ts) — Config schema + `LocalConfigManager` (Bun file I/O)
- [packages/app/src/hardware/factory.ts](packages/app/src/hardware/factory.ts) — Hardware factory with auto-detection via `config.hardwareMode`

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
- Set `NODE_ENV=production` when building CLI for release (e.g., `NODE_ENV=production bun run build`)
- Emulators auto-enabled when `NODE_ENV !== "production"` (Auth: 9099, Firestore: 8080, Functions: 5001)
- **CI/CD:** GitHub Actions use `NODE_ENV=production` + production Firebase config for production builds
- Hardware selection via config: `hardwareMode?: "mock" | "detect"` (default: `detect`). When `detect`, the app attempts Raspberry Pi detection and selects real interfaces (TBD) or mocks.

## Project-specific patterns

**CLI Patterns (Yargs + Prompts):**

- Commands live under [packages/cli/src/commands](packages/cli/src/commands) (e.g., `init.ts`, `config-show.ts`, `start.ts`) and export `handle*` functions.
- Entry point [packages/cli/src/index.ts](packages/cli/src/index.ts) wires commands via `yargs`, with global `--path`/`-p` for config location (default `~/.overdrip/config.json`).
- Interactive flows use [packages/cli/src/ui.ts](packages/cli/src/ui.ts): `promptEmail()`, `promptPassword()`, `promptDeviceName()`, `confirmAction()`, plus `printBanner()/printSuccess()/printWarning()/printError()` and `printJSON()`.
- Config access uses `LocalConfigManager` from `@overdrip/core` (load/save via Bun `file`/`write`).
- Authentication and device registration use `@overdrip/core` helpers (`logInUser()`, `registerDevice()`), not raw SDK calls in CLI.
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

## CLI Architecture

- **Entry:** [packages/cli/src/index.ts](packages/cli/src/index.ts) wires commands via `yargs`.
- **Commands:** Implemented under [packages/cli/src/commands](packages/cli/src/commands):
  - `init.ts` — Auth user, register device, save config (`~/.overdrip/config.json`).
  - `config-show.ts` — Load and print current configuration.
  - `start.ts` — Load config, authenticate device, start runtime (`@overdrip/app`).
- **Options:** Global `--path` / `-p` to override config file location.
- **UI helpers:** [packages/cli/src/ui.ts](packages/cli/src/ui.ts) provides `promptEmail()`, `promptPassword()`, `promptDeviceName()`, `confirmAction()`, and `print*()` helpers.
- **Exit & errors:** Commands print status and exit with non-zero on failures. Runtime handles signals (SIGINT/SIGTERM) for graceful shutdown in [packages/app/src/index.ts](packages/app/src/index.ts).

## Conventions

- **No Node.js tooling** — Use Bun exclusively (`bun run`, `bun install`); avoid npm/yarn/pnpm
- **Arrow functions** — Prefer `const MyComponent = () => {}` over `function MyComponent() {}`
- **Workspace dependencies** — Reference packages via `@overdrip/package-name` with `workspace:*` protocol
- **New CLI commands** — Add files under [packages/cli/src/commands](packages/cli/src/commands) and wire them in [packages/cli/src/index.ts](packages/cli/src/index.ts)
- **Shared code** — Place in `packages/core` (Firebase logic, schemas), not in `cli`/`app` directly
- **Hardware mode in config** — Use `hardwareMode?: "mock" | "detect"` (default: `detect`). Avoid environment variables for hardware selection.

## Common pitfalls

- **Don't use `fs` module** — Bun's `file()`/`write()` differ (async-first, no `readFileSync`)
- **CLI prompts & output** — Use helpers in [packages/cli/src/ui.ts](packages/cli/src/ui.ts) for consistent prompts and printing; avoid Node sync I/O.
- **Firebase emulators** — Must run locally for development; automatic detection via `NODE_ENV`
- **Build outputs** — Functions build to `lib/` (Node runtime), CLI to `dist/` (Bun runtime) — don't mix targets
- **Functions monorepo sharing** — [packages/functions/build.ts](packages/functions/build.ts) bundles all dependencies + copies [dummy-package.json](packages/functions/dummy-package.json) → enables sharing types/libs from workspace without `workspace:*` references in deployed code
- **Hardware re-initialization** — Do not rebuild sensors/pumps when watering config changes. Initialize hardware slots once and merge updated `PlantConfig[]` by index each loop.

## Firestore security rules

- Rules defined in [firestore.rules](firestore.rules) control client access
- Device access pattern: devices authenticate as themselves (custom tokens), users own `/users/{uid}/devices/{deviceId}`
- Update rules when adding new collections or changing access patterns
- Test rules with Firebase emulator before deploying

## App Package (device runtime)

**Status:** Initialization layer implemented; hardware auto-detection added; hardware control logic pending.

- `packages/app` exports `Overdrip` interface with `start()` method (see [packages/app/src/index.ts](packages/app/src/index.ts))
- Logging level configured via `logLevel` in config (values: `debug`, `info`, `warn`, `error`)
- Device control logic (GPIO pins, sensors, watering) is abstracted behind interfaces for testability (see [packages/app/src/hardware/interfaces.ts](packages/app/src/hardware/interfaces.ts))
- Config schema in `core` exposes a simple `logLevel` — keep runtime logging minimal and consistent
- Hardware factory lives in [packages/app/src/hardware/factory.ts](packages/app/src/hardware/factory.ts) and respects `config.hardwareMode` (`mock` | `detect`). Real hardware factory is TBD; detection falls back to mocks for now.
- Hardware "slots" are fixed and initialized once at startup. The watering configuration is reloaded every loop and merged with these slots by array order (index 0 → slot 0, index 1 → slot 1). Do not re-create hardware per config change.
- Internal pin mapping (subject to change as hardware evolves): slot 0 → ADS1115 channel 0 + GPIO 17; slot 1 → ADS1115 channel 1 + GPIO 27.
- The main loop interval is resolved from `device.checkIntervalMs` in config (optional, positive integer). Defaults to 5000ms.
- The `WateringConfigManager` is queried on every loop iteration to pick up backend changes. Future optimization may add its own minimum refresh interval.

## Unit Testing

**Approach:** Lean, critical-logic-only testing using Bun's built-in test runner. No external frameworks needed.

**Test coverage completed:**


**Total: 96 tests passing** across core and functions packages.

**Key patterns:**


**Run tests:** `bun test` from workspace root or per-package.

## Validation checklist

When making changes:

- [ ] Uses Bun APIs (`file`, `write`) not Node.js `fs`
- [ ] Respects `configPath` from context (don't hardcode `~/.overdrip/config.json`)
- [ ] Exit flows call shared `quit()` (not `process.exit()` or `useApp().exit()` directly)
- [ ] Schemas kept in sync between `core` and `functions` when changing data models
- [ ] Environment variables prefixed with `OVERDRIP_` (Firebase config, custom token URL)
- [ ] **Keep README.md and copilot-instructions.md in sync** when updating architecture/roadmap
