import { type Config } from "@overdrip/core";
import { debug, info, setLogLevel, warn } from "@overdrip/core/logger";
import { createHardwareFactory } from "./hardware/factory";
import {
  type HardwareFactory,
  type MoistureSensor,
  type Pump,
} from "./hardware/interfaces";
import {
  createWateringConfigManager,
  type PlantConfig,
  type WateringConfigManager,
} from "./watering-config-manager";

type HardwareSlot = {
  sensor: MoistureSensor;
  pump: Pump;
  lastWateredAt: number | null;
};

type PlantRuntime = PlantConfig & {
  slot: HardwareSlot;
};

export interface Overdrip {
  start(): Promise<void>;
  stop(): Promise<void>;
}

const DEFAULT_CHECK_INTERVAL_MS = 5_000;

class App implements Overdrip {
  private running = false;
  private stopRequested = false;
  private hardwareSlots: HardwareSlot[] = [];
  private checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS;

  constructor(
    private config: Config,
    private hardwareFactory: HardwareFactory = createHardwareFactory(config),
    private wateringConfigManager: WateringConfigManager = createWateringConfigManager(
      config,
    ),
  ) {
    setLogLevel(this.config.logLevel);
  }

  async start() {
    if (this.running) {
      warn("Start called while already running; ignoring");
      return;
    }

    this.stopRequested = false;
    this.running = true;

    const removeSignalHandlers = this.registerSignalHandlers();

    try {
      this.checkIntervalMs = this.resolveCheckInterval();
      this.hardwareSlots = this.initializeHardwareSlots();

      info(
        {
          checkIntervalMs: this.checkIntervalMs,
          hardwareSlots: this.hardwareSlots.length,
        },
        "Starting Overdrip application",
      );

      await this.mainLoop();
    } finally {
      removeSignalHandlers();
      await this.hardwareFactory.cleanup();
      info("Overdrip application stopped");
    }
  }

  async stop() {
    if (!this.running) {
      return;
    }

    this.stopRequested = true;
    info("Stop requested; shutting down...");
  }

  private async mainLoop() {
    while (this.running && !this.stopRequested) {
      const wateringConfig = await this.wateringConfigManager.load();
      const plants = this.mergeConfigWithSlots(wateringConfig.plants);

      await this.runCycle(plants);
      await sleep(this.checkIntervalMs);
    }

    this.running = false;
  }

  private resolveCheckInterval(): number {
    const configured = this.config.device.checkIntervalMs;
    if (!configured) return DEFAULT_CHECK_INTERVAL_MS;

    if (!Number.isFinite(configured) || configured <= 0) {
      warn(
        { provided: configured },
        "Invalid device.checkIntervalMs; using default",
      );
      return DEFAULT_CHECK_INTERVAL_MS;
    }

    return configured;
  }

  private initializeHardwareSlots(): HardwareSlot[] {
    // Internal pin mapping: fixed hardware slots
    const PIN_MAP = [
      { sensorChannel: 0, pumpPin: 17 }, // slot 0
      { sensorChannel: 1, pumpPin: 27 }, // slot 1
    ];

    return PIN_MAP.map((pins) => ({
      sensor: this.hardwareFactory.createSensor(pins.sensorChannel),
      pump: this.hardwareFactory.createPump({
        gpioPin: pins.pumpPin,
        sensorChannel: pins.sensorChannel,
      }),
      lastWateredAt: null,
    }));
  }

  private mergeConfigWithSlots(plantConfigs: PlantConfig[]): PlantRuntime[] {
    return plantConfigs.map((config, index) => {
      const slot = this.hardwareSlots[index];
      if (!slot) {
        throw new Error(
          `No hardware slot available for plant at index ${index}`,
        );
      }

      return {
        ...config,
        slot,
      };
    });
  }

  private async runCycle(plants: PlantRuntime[]) {
    debug("Overdrip main loop tick");

    for (const plant of plants) {
      try {
        await this.checkPlant(plant);
      } catch (error) {
        warn({ plantId: plant.id, error }, "Plant cycle failed");
      }
    }
  }

  private async checkPlant(plant: PlantRuntime) {
    const reading = await plant.slot.sensor.read();
    info(
      {
        plantId: plant.id,
        plantName: plant.name,
        moisturePercent: reading.percent,
      },
      "Moisture reading",
    );

    const now = Date.now();
    const timeSinceLast = plant.slot.lastWateredAt
      ? now - plant.slot.lastWateredAt
      : Number.POSITIVE_INFINITY;

    if (reading.percent >= plant.thresholdPercent) {
      debug(
        {
          plantId: plant.id,
          moisturePercent: reading.percent,
          thresholdPercent: plant.thresholdPercent,
        },
        "Moisture above threshold; skipping watering",
      );
      return;
    }

    if (timeSinceLast < plant.minIntervalMs) {
      info(
        {
          plantId: plant.id,
          timeSinceLastMs: timeSinceLast,
          minIntervalMs: plant.minIntervalMs,
        },
        "Recently watered; skipping",
      );
      return;
    }

    await this.waterPlant(plant);
  }

  private async waterPlant(plant: PlantRuntime) {
    info(
      {
        plantId: plant.id,
        durationMs: plant.wateringDurationMs,
        thresholdPercent: plant.thresholdPercent,
      },
      "Moisture below threshold; watering",
    );

    await plant.slot.pump.activate(plant.wateringDurationMs);
    plant.slot.lastWateredAt = Date.now();

    const afterReading = await plant.slot.sensor.read();
    info(
      {
        plantId: plant.id,
        moisturePercent: afterReading.percent,
        thresholdPercent: plant.thresholdPercent,
      },
      "Post-watering moisture reading",
    );
  }

  private registerSignalHandlers() {
    const handler = () => {
      this.stop().catch((error) =>
        warn({ error }, "Failed to stop gracefully after signal"),
      );
    };

    process.on("SIGINT", handler);
    process.on("SIGTERM", handler);

    return () => {
      process.off("SIGINT", handler);
      process.off("SIGTERM", handler);
    };
  }
}

export const app = (config: Config): Overdrip => {
  return new App(config);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
