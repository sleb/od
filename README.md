# Overdrip

Automate plant watering on your Raspberry Pi. Configure devices, manage watering schedules, and monitor plant health from the command line.

## Quick Start

### Prerequisites

- Bun v1.3+ ([install](https://bun.sh))
- A Raspberry Pi (3B+ or newer recommended)

### Installation

Once distributed:

```bash
curl -sSL https://get.overdrip.app | bash
```

For development, use from source:

```bash
bun install
cd packages/cli
bun run src/index.ts --help
```

### Get Started

```bash
# Interactive setup
drip init

# Specify custom config path
drip init -p /custom/path/config.json

# Show configuration
drip config show

# Start watering system
drip start
drip start --detach  # Run in background
```

Configuration is stored at `~/.overdrip/config.json` by default.

## Features

- 🌱 **Web-first setup** — Authenticate with email/password, register devices
- 🔐 **Secure device auth** — Devices authenticate with custom Firebase tokens
- 📱 **Stateful config** — Local configuration persists across reboots
- 📊 **Future: Backend stats** — Monitor watering history and plant health

## What's Next

- Device runtime with GPIO control
- Watering schedule management
- Cloud dashboard (Firebase Firestore)
- Mobile companion app (planned)

## Development

To contribute:

```bash
bun install                                     # Install all packages
bun test                                        # Run tests
cd packages/cli && bun run lint                 # Lint
cd packages/cli && NODE_ENV=production bun run build  # Build for production
```

See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for architecture details and development patterns.

## License

TBD
