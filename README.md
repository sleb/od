# Overdrip

A Raspberry Pi-based office plant watering system powered by [Bun](https://bun.com).

## Overview

Overdrip automates plant watering with a distributed architecture:

- **CLI** (`packages/cli`) — Start/stop and configure the application on your Raspberry Pi
- **App** (`packages/app`) — Runtime logic for device control and backend communication (planned)
- **Backend** — Firebase-based authentication, device management, configuration, and stats (planned)

## Quick Start

### Installation

```bash
bun install
```

### Run the CLI

Initialize configuration:

```bash
cd packages/cli
bun run src/index.ts init
```

Specify a custom config path:

```bash
bun run src/index.ts init -p /custom/path/config.json
```

## Architecture

### Packages

- **`packages/cli`** — Bun-based CLI using Ink for interactive terminal UI
  - Command entry: `src/index.ts` (yargs)
  - Config location: `~/.overdrip/config.json` (default)
  - Components: `InitPage` for setup, `Layout` for global UI, `StatusMessage` for user feedback

## Development

### Tech Stack

- **Runtime:** Bun v1.3+
- **UI:** Ink (React TUI framework)
- **CLI Framework:** yargs
- **Validation:** Zod

### Commands

- Install deps: `bun install`
- Run CLI: `cd packages/cli && bun run src/index.ts init`
- Lint: `cd packages/cli && bun run lint`

## Future Roadmap

- [ ] App package with device control runtime
- [ ] Firebase backend (auth, device management, stats)
- [ ] Additional CLI commands (start, stop, status)
- [ ] Unit tests with `bun test`

## License

TBD
