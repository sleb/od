# Copilot Instructions

## Project snapshot
- Workspace (Overdrip) is a Bun-based application (no Node/npm) using Ink for interactive TUI under `packages/cli/src`.
- Main entry `packages/cli/src/index.ts` defines the `init` command via yargs; defaults config path to `~/.overdrip/config.json`.
- Rendering pipeline: `app.tsx` mounts Ink, provides `ConfigPathContext` and `QuitContext`, and renders pages (currently only `InitPage`).
- Config handling: `ConfigManager` wraps Bun `file/write` plus zod validation (`models/config.ts`).

## Run/install/test
- Install: `bun install` (root). Bun runtime v1.3+ expected.
- Run CLI directly: `cd packages/cli && bun run src/index.ts init` (optionally `-p /custom/path`).
- No test suite present; if adding tests, prefer `bun test`.

## Architecture & patterns
- Contexts
  - `ConfigPathContext` supplies the target config path to nested components.
  - `QuitContext` shares `{ shouldQuit, quit }`; call `quit()` from any component to update the shared state and exit after a short delay.
- UI composition
  - `Layout` handles global key input (`q`/`Esc` -> `quit`) and renders shared status via `StatusMessage` (shows "Exiting…" when `shouldQuit` is true).
  - Pages are simple functional components; `InitPage` checks for existing config, prompts overwrite via `ink-select-input`, writes default config, and sets exit state.
- I/O with Bun
  - Use `bun` primitives: `file(path).exists()/text()` and `write(path, data)` instead of `fs`.
  - JSON config is pretty-printed in `saveConfig`; validation via `ConfigSchema` when loading.
- Tech stack: Bun v1.3+, Ink (React TUI), yargs (CLI), Zod (validation).

## Future packages
- **App** (`packages/app`) — Raspberry Pi runtime logic for device control and backend communication.
- **Backend** — Firebase for authentication, device management, configuration, and stats.

## Conventions & tips
- Stick to Bun commands (`bun run`, `bun install`); do not introduce Node/npm/yarn tooling.
- Keep interactions via provided contexts; avoid per-component quit state.
- When adding new commands, route through `yargs` in `src/index.ts`, then render pages via `app(page, configPath)`.
- Follow current component style: concise functional components, minimal state, use Ink primitives and context hooks.
- If adding new shared UI, place under `components/`; shared state under `context/`; schemas under `models/`.

## Validation checklist for changes
- Confirm new I/O paths use Bun APIs and respect `configPath` from context.
- Ensure any exit flows call shared `quit()` so `StatusMessage` stays accurate.
- Keep default config shape in sync with `ConfigSchema` when writing/reading.
- **Keep README.md and copilot-instructions.md in sync:** When updating architecture, roadmap, or tech stack in either file, update both to maintain consistency for future developers and AI agents.
