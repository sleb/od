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

## Hardware

- **Overview:** Overdrip targets Raspberry Pi with two plant slots wired to an ADS1115 ADC (soil moisture sensors) and two GPIO-driven pumps.
- **Auto-detection:** The runtime selects hardware based on `config.hardwareMode?: "mock" | "detect"` (default: `detect`). Detection checks platform/`/proc/device-tree/model` for Raspberry Pi. Real interfaces are TBD; mocks are used until implemented.
- **Slots & mapping:** Hardware interfaces are initialized once and reused. Plant configs are merged with slots by order.
  - Slot 0: ADS1115 channel A0 (sensor) + GPIO 17 (pump)
  - Slot 1: ADS1115 channel A1 (sensor) + GPIO 27 (pump)
- **Wiring guide:**
  - Connect ADS1115 to Pi via I2C (SDA to GPIO 2, SCL to GPIO 3, 3V3 and GND as appropriate).
  - Soil moisture sensors output analog voltage → wire to ADS1115 inputs A0 and A1, share GND/3V3 per sensor specs.
  - Pumps should be driven via a MOSFET/transistor driver with flyback diode; control lines from Pi GPIO 17 and 27, separate power supply for pumps recommended.
- **Runtime behavior:** Watering config is reloaded each loop; hardware slots are not recreated. The loop interval comes from `device.checkIntervalMs` (optional; defaults to 5000ms).

```
          Raspberry Pi (3V3 logic)                      ADS1115 (ADC)
          ┌──────────────────────────┐                  ┌──────────────┐
I2C SDA ──┤ GPIO 2 (SDA)        ─────┼──────────────────┤ SDA          │
I2C SCL ──┤ GPIO 3 (SCL)        ─────┼──────────────────┤ SCL          │
3V3     ──┤ 3V3                  ─────┼──────────────────┤ VDD          │
GND     ──┤ GND                  ─────┼──────────────────┤ GND          │
                                                     A0 ├───── Sensor 1 + (analog)
                                                     A1 ├───── Sensor 2 + (analog)
                                              Sensors share GND/3V3
          └──────────────────────────┘                  └──────────────┘

          Pump Drivers (per pump)                      Pumps (external power)
          ┌──────────────────────────┐                 ┌──────────────────┐
GPIO 17 ──┤ Gate (Driver 1)          │                 │ Pump 1 (+)  ─────┤── +V (external)
GND     ──┤ Source to GND            │                 │ Pump 1 (−)  ──┬──┘
          │ Drain to Pump −          │                 │              │
Diode    ─┤ Flyback across pump      │                 │ (flyback)   └─▶ Diode to +V
          └──────────────────────────┘                 └──────────────────┘

GPIO 27 drives Driver 2 (same wiring) for Pump 2.

Notes:
- Always use proper driver (MOSFET/transistor) for pumps; never drive pumps directly from Pi GPIO.
- Use an external power supply for pumps; share GND between Pi and driver circuit.
```

### Safety & Power

- Recommended driver: logic-level N-MOSFET (e.g., IRLZ44N, IRLZ34N) with gate resistor (100–220Ω) and pull-down (100k) to prevent floating gates.
- Flyback diode across pump leads (e.g., 1N4007 or Schottky like 1N5819) oriented to clamp inductive kick.
- Separate pump power supply sized for pump current; fuse the supply line appropriately.
- Common ground between Raspberry Pi, driver circuits, and pump supply; keep high-current returns away from Pi signal ground routing.
- If any peripherals are 5V, ensure level shifting and never apply 5V to Pi GPIO directly.
- ADS1115 breakout boards typically include I2C pull-ups; if using bare ADC IC, add ~4.7k–10k pull-ups on SDA/SCL.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
