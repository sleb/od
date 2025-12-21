# Overdrip App Package Design

## Overview

The `app` package is the device runtime that runs on a Raspberry Pi Zero 2 W. It controls two moisture sensors and two mini water pumps, periodically checking soil moisture and watering plants as needed based on configuration from Firebase.

## Hardware Specification

**Target Platform:** Raspberry Pi Zero 2 W (Quad-core 64-bit ARM Cortex-A53 @ 1GHz, 512MB RAM)

**Peripherals:**

- 2× Capacitive soil moisture sensors (analog output, 3.3V/5V compatible)
- 2× Mini water pumps ([Amazon link](https://www.amazon.com/dp/B0BWQ6RD95))
- 1× ADS1115 16-bit ADC module (I2C, for reading analog moisture sensors)
- 2× Relay module or MOSFET driver boards (for pump control)

**Internal GPIO Pin Mapping (BCM numbering):**

Pin configuration is an internal implementation detail managed by the app. The device has two fixed plant slots; hardware pin assignments are determined at build time and not exposed to users.

## Architecture

### Component Structure

```
packages/app/
├── src/
│   ├── index.ts                 # Entry point, CLI arg parsing
│   ├── app.ts                   # Main application class
│   ├── hardware/
│   │   ├── interfaces.ts        # Hardware abstraction interfaces
│   │   ├── moisture-sensor.ts   # MoistureSensor implementation (ADS1115)
│   │   ├── pump.ts              # Pump implementation (GPIO)
│   │   └── mock/                # Mock implementations for testing
│   │       ├── mock-sensor.ts
│   │       └── mock-pump.ts
│   ├── services/
│   │   ├── config-service.ts    # Firebase config sync
│   │   └── watering-service.ts  # Watering control logic
│   ├── scheduler/
│   │   ├── task-scheduler.ts    # Periodic task execution
│   │   └── tasks.ts             # Individual task definitions
│   ├── models/
│   │   ├── plant.ts             # Plant configuration schemas
│   │   └── telemetry.ts         # Sensor reading & event schemas
│   └── utils/
│       ├── error-handler.ts     # Global error handling
│       └── retry.ts             # Retry logic with exponential backoff
```

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Raspberry Pi Zero 2 W                │
│                                                         │
│  ┌─────────────┐         ┌──────────────────┐           │
│  │ App Entry   │────────▶│ TaskScheduler    │           │
│  │ (index.ts)  │         │                  │           │
│  └─────────────┘         │ • Moisture check │           │
│         │                │ • Watering cycle │           │
│         │                │ • Metrics pub    │           │
│         │                │ • Config updates │           │
│         │                └────────┬─────────┘           │
│         │                         │                     │
│         │     ┌───────────────────┼────────────┐        │
│         │     │                   │            │        │
│         ▼     ▼                   ▼            ▼        │
│  ┌─────────────────┐      ┌──────────────┐ ┌────────┐   │
│  │  Firebase SDK   │      │   Config     │ │Watering│   │
│  │  (@core apis)   │      │   Service    │ │Service │   │
│  │                 │      └──────┬───────┘ └────┬───┘   │
│  │ • createToken() │             │              │       │
│  │ • onAuthChange()│             │              │       │
│  │ • Firestore ops │             │              │       │
│  └─────────────────┘             │              │       │
│                                  │              │       │
│                                  │              ▼       │
│                          ┌──────────────────────────┐   │
│                          │   Hardware               │   │
│                          │   (Sensors, Pumps)       │   │
│                          └──────────────┬───────────┘   │
│                                        │                │
│                                        ▼                │
└────────────────────────────────────────┼────────────────┘
                                         │
                            ┌────────────┼──────────────┐
                            │   GPIO     │      I2C     │
                            │  (Pumps)   │  (Sensors)   │
                            └────────────┴──────────────┘
```

## Data Models

### Configuration Schema (extends core Config)

```typescript
// New schemas to add to packages/core/src/schemas.ts

export const PlantConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  moistureThreshold: z.number().min(0).max(100), // Percentage
  wateringDurationMs: z.number().int().positive().max(60000), // Max 60s
  minWateringIntervalMs: z.number().int().positive(), // Prevent over-watering
  enabled: z.boolean().default(true),
});

export const AppConfigSchema = z.object({
  plants: z.array(PlantConfigSchema).min(1).max(4),
  checkIntervalMs: z.number().int().positive().default(300000), // 5 min
});

// Extends existing Config from core
export const DeviceRuntimeConfigSchema = ConfigSchema.extend({
  app: AppConfigSchema,
});
```

### Telemetry & Monitoring

Telemetry is published to **Google Cloud Monitoring** (Stackdriver) via the Cloud Logging agent. Metrics include:

**Metrics:**

- Moisture readings (per plant) → `custom.googleapis.com/overdrip/moisture_percent`
- Watering events → `custom.googleapis.com/overdrip/watering_duration_ms`
- System events (auth, config sync, errors) → Cloud Logs

**Advantages of Cloud Monitoring:**

- Automatic retention and archival policies
- Built-in dashboards and alerting
- No extra Firestore quota usage
- Integrates with GCP monitoring/alerting infrastructure

Local logging to file continues for debugging (`~/.overdrip/logs/app-{date}.log`).

## Authentication

**Approach:** Authenticate once at startup using device credentials. Firebase SDK handles session refresh automatically.

**Flow:**

1. Load device config (id + authToken) from local config file
2. Exchange authToken for customToken via `createCustomToken()` from `@overdrip/core`
3. Sign in with customToken via Firebase SDK
4. Firebase SDK automatically refreshes session before expiration (~24 hour validity)
5. If auth fails at startup, exit immediately (fail-fast)
6. Once authenticated, Firebase SDK manages session; no further auth code needed

**No AuthService needed** — authentication is a one-time startup operation, not an ongoing service.

## Service Implementations

### ConfigService

**Responsibilities:**

- Load app configuration from Firestore at startup
- Validate configuration with Zod schemas
- Set up real-time listener for config changes
- Apply configuration changes in-memory without restart

**Key Methods:**

```typescript
interface ConfigService {
  initialize(deviceAuth: DeviceAuth): Promise<AppConfig>;
  getCurrentConfig(): AppConfig;
  onConfigChange(callback: (config: AppConfig) => void): () => void;
}
```

**Firestore Structure:**

```
/users/{uid}/devices/{deviceId}
  └─ config (document)
      ├─ plants: PlantConfig[]
      ├─ checkIntervalMs: number
      ├─ updatedAt: timestamp
```

**Flow:**

1. At startup, fetch `/users/{uid}/devices/{deviceId}/config` from Firestore
2. Validate with `AppConfigSchema.parse()` — if invalid, fail startup with error
3. Store config in memory
4. Set up Firestore real-time snapshot listener on config document
5. On config update, validate and apply to in-memory state immediately
6. If listener disconnects, continue running with in-memory config (app is resilient to network drops)

### WateringService

**Responsibilities:**

- Read moisture sensor values
- Execute watering cycles based on thresholds
- Enforce safety constraints (max duration, min interval)
- Record telemetry events

**Key Methods:**

```typescript
interface WateringService {
  checkAndWater(plant: PlantConfig): Promise<void>;
  readMoisture(plant: PlantConfig): Promise<MoistureReading>;
  executePump(plant: PlantConfig, durationMs: number): Promise<void>;
  getLastWatering(plantId: string): Date | null;
}
```

**Safety Logic:**

- **Max duration enforcement:** Hardware timeout in pump control (failsafe)
- **Min interval check:** Prevent consecutive waterings within threshold
- **Moisture validation:** Reject readings outside 0-100% range
- **Emergency stop:** Global kill switch via config (all plants disabled)

**Flow:**

1. Read current moisture level via sensor
2. Check if moisture < threshold AND min interval elapsed
3. If yes, activate pump for configured duration
4. Wait 30s, read post-watering moisture
5. Log WateringEvent and MoistureReading to telemetry buffer
6. If post-moisture still low, log warning (possible pump failure)

## Hardware Abstraction

### Interface Design

```typescript
// hardware/interfaces.ts
export interface MoistureSensor {
  read(): Promise<MoistureReading>;
  calibrate(dryValue: number, wetValue: number): void;
  getCalibration(): { dry: number; wet: number };
}

export interface Pump {
  activate(durationMs: number): Promise<void>;
  deactivate(): Promise<void>;
  isActive(): boolean;
}

export interface HardwareFactory {
  createSensor(channel: number): MoistureSensor;
  createPump(gpioPin: number): Pump;
  cleanup(): Promise<void>;
}
```

### Production Implementation

**MoistureSensor (ADS1115):**

- Library: `raspi-i2c` + `ads1x15` or custom implementation
- Read 16-bit value from specified channel (0-3)
- Convert raw ADC value (0-32767) to moisture % using calibration
- Calibration stored per-sensor in config (dryValue = 0%, wetValue = 100%)
- Default calibration: dry=25000, wet=10000 (typical capacitive sensor range)

**Pump (GPIO):**

- Library: `onoff` or `rpio` for GPIO control
- Activate: Set GPIO pin HIGH (3.3V) via relay/MOSFET
- Deactivate: Set GPIO pin LOW (0V)
- Safety timeout: Use `setTimeout()` with guaranteed cleanup in `finally` block
- Track state to prevent concurrent activations

### Mock Implementation (for development/testing)

**MockSensor:**

- Simulate moisture readings (random walk between 20-80%)
- Configurable drift rate to test watering triggers
- Instant read (no I2C latency)

**MockPump:**

- Track activation count and total duration
- Simulate pump effect on sensor (moisture increases after activation)
- Log to console for debugging

## Task Scheduler

### Architecture

Uses `setInterval()` for periodic tasks and event listeners for reactive tasks:

```typescript
interface Task {
  name: string;
  intervalMs?: number; // Optional if event-driven
  handler: () => Promise<void>;
  onError?: (error: Error) => void;
}

class TaskScheduler {
  private tasks: Map<string, NodeJS.Timeout> = new Map();

  schedule(task: Task): void;
  on(
    event: "config-change" | "auth-change",
    handler: () => Promise<void>,
  ): void;
  unschedule(taskName: string): void;
  shutdown(): Promise<void>;
}
```

### Task Definitions

**ConfigWatcher:**

- Trigger: Real-time Firestore listener on config document
- Action: On config change, validate and apply new configuration immediately
- Fallback: Config loaded at startup; if connection drops, continues with in-memory config
- Error handling: Log config change errors, skip invalid changes, continue with previous config

**MoistureCheckTask:**

- Interval: configurable (default 5 min)
- Action: For each enabled plant, call `wateringService.checkAndWater()`
- Error handling: Continue to next plant, log error with plant ID

**MetricsPublishTask:**

- Interval: configurable (default 1 min)
- Action: Publish moisture readings and watering events to Cloud Logging
- Error handling: Local log buffer, silently drop if Cloud Logging unavailable

## Error Handling Strategy

### Levels of Recovery

**Level 1 - Retry with backoff:**

- Network failures (auth, config sync)
- Transient hardware errors (I2C bus busy)
- Retry: 3 attempts with exponential backoff (1s, 2s, 4s)

**Level 2 - Graceful degradation:**

- Config listener disconnected → continue with in-memory config
- Single plant hardware error → skip plant, continue others
- Cloud Logging unavailable → buffer metrics locally, continue watering

**Level 3 - Emergency shutdown:**

- Critical hardware failure (GPIO initialization fails)
- Invalid device credentials (auth token permanently revoked)
- Cannot connect to Firebase at startup (fail-fast)
- Actions: Log to file, exit with code 1

### Error Logging

**Local file logging:**

- Path: `~/.overdrip/logs/app-{date}.log` (rotated daily)
- Format: NDJSON (newline-delimited JSON) via pino
- Retention: 7 days
- Includes: All errors, warnings, and system events with full context

**Remote logging:**

- Published to Cloud Logging via structured logs
- Severity levels: DEBUG, INFO, WARNING, ERROR
- Retention and alerting handled by Cloud Logging policies

## Startup Sequence

```
1. Load local config (~/.overdrip/config.json)
   ├─ Validate with ConfigSchema
   └─ If missing/invalid, exit with error code 2

2. Initialize logger (pino with file + console transports)
   └─ Log startup event

3. Authenticate with Firebase
   ├─ Load device credentials from config (id + authToken)
   ├─ Create custom token via `core/device.ts`
   ├─ Sign in with Firebase Auth (Firebase SDK handles session refresh after this)
   └─ If auth fails, exit immediately (fail-fast)

4. Load configuration from Firestore
   ├─ Fetch `/users/{uid}/devices/{deviceId}/config`
   ├─ Validate with `AppConfigSchema`
   ├─ If validation fails, exit immediately (fail-fast)
   └─ Set up real-time listener for config updates

5. Initialize hardware
   ├─ Create HardwareFactory (production or mock based on env)
   ├─ Initialize I2C bus for sensors
   ├─ Initialize GPIO pins for pumps
   └─ Run hardware self-test (read all sensors, pulse pumps for 100ms)

6. Initialize WateringService
   └─ Load last watering timestamps

7. Start task scheduler
   ├─ Schedule moisture check task (every 5 min)
   └─ Schedule metrics publish task (every 1 min)

8. Register shutdown handlers
   ├─ SIGINT/SIGTERM → graceful shutdown
   ├─ uncaughtException → log error, emergency shutdown
   └─ unhandledRejection → log error, continue

9. Log "Application ready" event
```

## Shutdown Sequence

```
1. Log shutdown event

2. Stop task scheduler
   └─ Clear all intervals, await in-flight tasks (max 30s timeout)

3. Deactivate all pumps
   └─ Emergency stop, ensure GPIO pins LOW

4. Close hardware resources
   ├─ Close I2C bus
   └─ Unexport GPIO pins

5. Close Firebase connection
   └─ Sign out, close real-time listeners

6. Flush logs
   └─ Ensure pino transports finish writing

7. Exit with code 0
```

## Configuration Management

### Local Config Path

- Default: `~/.overdrip/config.json`
- Override via CLI flag: `--config /path/to/config.json`
- Environment variable: `OVERDRIP_CONFIG_PATH`

### Config Hierarchy

1. **Local file** (`~/.overdrip/config.json`) — Device credentials and initial defaults
2. **Firestore remote** (real-time listener) — Plant configuration and watering settings

All configuration loaded at startup from Firestore. Device continues with in-memory config if network drops; restart required to reload from Firebase.

### Config Validation

- All config loaded at startup validated via Zod schemas
- Invalid config causes startup failure (fail-fast)
- Remote config updates validated before applying to in-memory state
- Rejected updates logged; previous config remains in effect

## Testing Strategy

### Unit Tests

**Target:** Business logic, schemas, utilities

- `models/*.test.ts` — Schema validation tests
- `services/*.test.ts` — Service logic with mocked dependencies
- `utils/*.test.ts` — Retry logic, error handling

**Mocking:**

- Firebase SDK → Mock Firestore, Auth
- Hardware → Use MockSensor, MockPump from `hardware/mock/`
- Time → `bun:test` mocking for intervals/timeouts

### Integration Tests

**Target:** Service interactions, hardware abstraction

- `services/integration.test.ts` — ConfigService + Firestore emulator
- `hardware/integration.test.ts` — Real GPIO interaction (requires Pi, optional CI skip)

### End-to-End Testing

**Manual testing checklist:**

1. Deploy to test Pi, configure with mock sensors/pumps
2. Verify startup auth succeeds
3. Verify config sync (update Firestore, observe real-time changes)
4. Verify watering cycle (manually trigger via low moisture simulation)
5. Verify metrics publishing (check Cloud Logs)
6. Verify error recovery (disconnect network, observe graceful degradation)
7. Verify graceful shutdown (SIGINT, check GPIO cleanup)

## Deployment

### Prerequisites

- Raspberry Pi OS Lite (64-bit, Debian 12 based)
- Bun runtime installed (`curl -fsSL https://bun.sh/install | bash`)
- I2C enabled (`sudo raspi-config` → Interface Options → I2C)
- GPIO permissions (add user to `gpio` group)

### Installation Steps

```bash
# 1. Clone repo
git clone <repo-url> /opt/overdrip
cd /opt/overdrip

# 2. Install dependencies
bun install

# 3. Build app package
cd packages/app
bun run build

# 4. Create config directory
mkdir -p ~/.overdrip/logs

# 5. Run CLI to register device
cd ../cli
bun run src/index.ts init

# 6. Test app (dry-run mode)
cd ../app
bun run dist/index.js --dry-run

# 7. Install as systemd service
sudo cp overdrip.service /etc/systemd/system/
sudo systemctl enable overdrip
sudo systemctl start overdrip
```

### Systemd Service

**File:** `/etc/systemd/system/overdrip.service`

```ini
[Unit]
Description=Overdrip Plant Watering System
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/overdrip/packages/app
ExecStart=/home/pi/.bun/bin/bun run dist/index.js
Restart=on-failure
RestartSec=10s
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Monitoring

- Logs: `journalctl -u overdrip -f`
- Remote monitoring: Google Cloud Logs → `overdrip` logs
- Health check: HTTP endpoint (future enhancement)

## Future Enhancements

### Phase 2

- Web dashboard in CLI for real-time monitoring (Ink-based TUI)
- Manual watering trigger via Firebase (write to `/devices/{id}/commands`)
- Pump flow rate calibration (measure actual volume per second)
- Low water reservoir detection (additional sensor)

### Phase 3

- Light sensor integration (track sunlight hours)
- Temperature/humidity sensor (DHT22)
- Camera integration (timelapse plant growth)
- Machine learning for optimal watering schedule

### Phase 4

- Multi-device coordination (share water reservoir)
- Remote firmware updates (OTA via Firebase Storage)
- Voice control integration (Google Assistant/Alexa)
- Community plant care recommendations

## Design Decisions

1. **Calibration workflow:** ✅ **CLI wizard** — Users will run `overdrip init` to configure device, enter plant names and moisture thresholds interactively. Sensor calibration can be added to the `init` flow later (dry/wet cycle test).

2. **Water reservoir monitoring:** ⏸️ **Future enhancement** — Leave for Phase 2. Not critical for MVP. Will require additional hardware sensor.

3. **Network resilience:** ✅ **Fail-fast at startup, resilient after** — If device can't reach Firebase at startup, exit immediately (fail-fast prevents silent failures). Once successfully authenticated and config loaded, app continues running with in-memory config even if network drops. On restart, must reconnect to Firebase. If long-term offline operation needed, can add local fallback schedule in future.

4. **Telemetry:** ✅ **Google Cloud Monitoring** — All metrics published to Cloud Logging/Monitoring, not Firestore. Handles retention automatically. Provides dashboards and alerting.

5. **Multi-device scaling:** ✅ **Independent devices** — Each device is independent with separate credentials and config document. Users can have multiple devices (future: dashboard to manage all). No shared state between devices.

6. **Sensor failure detection:** ⏸️ **TODO** — Determine criteria for sensor failures (e.g., consecutive failed reads, stuck values). Implement in Phase 2 with hardware diagnostics endpoint.

## Security Considerations

- **Device authentication:** One-time auth at startup with custom token; Firebase SDK auto-refreshes session (~24 hours)
- **Firestore rules:** Device can only read/write to its own document path
- **GPIO access:** Requires privileged user (gpio group) — document security implications
- **Config injection:** All remote config validated via Zod before use
- **Log sanitization:** Ensure auth tokens never logged (redact in pino serializers)

## Performance Targets

- **Startup time:** < 10 seconds (including hardware init)
- **Auth refresh:** < 2 seconds
- **Config sync:** < 1 second
- **Moisture reading:** < 500ms per sensor
- **Watering cycle:** Configurable (typically 5-30 seconds)
- **Memory footprint:** < 100MB RSS (Pi Zero has 512MB total)
- **CPU usage:** < 5% average (spikes during I2C reads acceptable)

---

**Design Status:** ✅ Ready for review
**Next Steps:** Review with team → Create implementation tasks → Begin development
