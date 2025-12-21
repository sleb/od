# Overdrip

A Raspberry Pi-based office plant watering system powered by [Bun](https://bun.com).

## Overview

Overdrip automates plant watering with a distributed architecture:

- **CLI** (`packages/cli`) — Start/stop and configure the application on your Raspberry Pi
- **App** (`packages/app`) — Runtime logic for device control and backend communication
- **Backend** — Firebase-based authentication, device management, configuration, and stats

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

### Start the Device Runtime

After initializing configuration, start the device runtime:

```bash
cd packages/cli
bun run src/index.ts start
```

The device will:
1. Authenticate with Firebase using the registered device credentials
2. Load configuration from Firestore (or create default configuration)
3. Start the main monitoring loop:
   - Read moisture sensor every `checkIntervalMs` (default: 60s)
   - Trigger watering when moisture drops below `moistureThreshold` (default: 30%)
   - Run pump for `wateringDurationMs` (default: 5s)
   - Log all readings and actions to Firestore

### Watering Configuration

Watering configuration is stored in Firestore at `/users/{userId}/devices/{deviceId}`. Available settings:

- `moistureThreshold` (0-100): Moisture level that triggers watering (default: 30)
- `wateringDurationMs`: How long to run the pump in milliseconds (default: 5000)
- `checkIntervalMs`: Time between moisture checks in milliseconds (default: 60000)
- `autoWateringEnabled`: Enable/disable automatic watering (default: true)

GPIO pins are configured in the application code:
- Moisture sensor: GPIO 17 (BCM numbering)
- Pump relay: GPIO 27 (BCM numbering)

## Architecture

### Packages

- **`packages/cli`** — Bun-based CLI using Ink for interactive terminal UI
  - Command entry: `src/index.ts` (yargs)
  - Config location: `~/.overdrip/config.json` (default)
  - Components: `InitPage` for setup, `Layout` for global UI, `StatusMessage` for user feedback

- **`packages/app`** — Device runtime for watering automation
  - Firebase authentication with custom tokens
  - Firestore-based device configuration
  - Main control loop: moisture sensing, watering logic, logging
  - Hardware abstraction layer (mock implementations + future GPIO support)
  
- **`packages/core`** — Shared libraries and schemas
  - Firebase SDK initialization
  - Zod schemas for configuration and device data
  - Device registration and authentication utilities

- **`packages/functions`** — Cloud Functions (Firebase)
  - Device registration endpoint
  - Custom token generation for device authentication

## Development

### Tech Stack

- **Runtime:** Bun v1.3+
- **UI:** Ink (React TUI framework)
- **CLI Framework:** yargs
- **Validation:** Zod

### Commands

- Install deps: `bun install`
- Run CLI: `cd packages/cli && bun run src/index.ts init`
- Start device: `cd packages/cli && bun run src/index.ts start`
- Run tests: `bun test`
- Lint: `cd packages/cli && bun run lint`

## Future Roadmap

- [x] App package with device control runtime
- [x] Firebase authentication with custom tokens
- [x] Firestore-based device configuration
- [x] Main application loop (moisture sensing, watering logic)
- [ ] Real GPIO hardware support (currently using mock implementations)
- [ ] Additional CLI commands (stop, status)
- [ ] Cloud monitoring integration
- [ ] Web dashboard for device management

## License

TBD
