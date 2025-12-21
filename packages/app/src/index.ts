import {
  type Config,
  createWateringConfigManager,
  getCurrentUserId,
  logInDevice,
  type WateringConfig,
  type WateringConfigManager,
} from "@overdrip/core";
import pino from "pino";
import {
  HardwareFactory,
  type MoistureSensor,
  type WaterPump,
} from "./hardware";

export interface Overdrip {
  start(): Promise<void>;
  stop(): Promise<void>;
}

// GPIO pin configuration (application-level constants)
const MOISTURE_SENSOR_PIN = 17; // BCM pin for moisture sensor
const PUMP_RELAY_PIN = 27; // BCM pin for pump relay

class App implements Overdrip {
  logger: pino.Logger;
  private running = false;
  private moistureSensor: MoistureSensor;
  private waterPump: WaterPump;
  private wateringConfig: WateringConfig | null = null;
  private wateringConfigManager: WateringConfigManager;
  private static readonly ERROR_RETRY_DELAY_MS = 5000;

  constructor(private config: Config) {
    this.logger = pino({
      transport: {
        targets: config.logging.map((log) => {
          switch (log.dest) {
            case "console":
              return {
                target: "pino-pretty",
                level: log.level,
                options: { colorize: true },
              };
            case "file":
              return {
                target: "pino/file",
                level: log.level,
                options: { destination: log.path },
              };
          }
        }),
      },
    });

    // Initialize hardware with configured pins
    this.moistureSensor = HardwareFactory.createMoistureSensor(
      MOISTURE_SENSOR_PIN,
    );
    this.waterPump = HardwareFactory.createWaterPump(PUMP_RELAY_PIN);

    // Initialize watering config manager
    this.wateringConfigManager = createWateringConfigManager(
      config.device.id,
      getCurrentUserId,
    );
  }

  async start() {
    this.logger.info("Starting Overdrip application...");

    try {
      // Step 1: Authenticate with custom token
      await this.authenticate();

      // Step 2: Read configuration from Firestore
      await this.loadWateringConfig();

      // Step 3: Start main application loop
      this.running = true;
      await this.runMainLoop();
    } catch (error) {
      this.logger.error({ error }, "Failed to start Overdrip application");
      throw error;
    }
  }

  async stop() {
    this.logger.info("Stopping Overdrip application...");
    this.running = false;

    // Ensure pump is turned off
    if (this.waterPump.isRunning()) {
      await this.waterPump.turnOff();
      this.logger.info("Water pump turned off during shutdown");
    }
  }

  private async authenticate() {
    this.logger.info("Authenticating with Firebase...");

    const { id, authToken } = this.config.device;

    // Use core's logInDevice function
    await logInDevice(id, authToken);

    this.logger.info({ deviceId: id }, "Successfully authenticated");
  }

  private async loadWateringConfig() {
    this.logger.info("Loading watering configuration from Firestore...");

    this.wateringConfig = await this.wateringConfigManager.loadConfig();

    this.logger.info(
      { config: this.wateringConfig },
      "Watering configuration loaded",
    );
  }

  private async runMainLoop() {
    this.logger.info("Starting main application loop...");

    while (this.running) {
      try {
        await this.checkAndWater();

        // Sleep until next interval
        const checkInterval = this.wateringConfig?.checkIntervalMs || 60000;
        this.logger.debug(
          { intervalMs: checkInterval },
          "Sleeping until next check",
        );
        await this.sleep(checkInterval);
      } catch (error) {
        this.logger.error({ error }, "Error in main loop");
        // Continue running even if there's an error
        await this.sleep(App.ERROR_RETRY_DELAY_MS);
      }
    }

    this.logger.info("Main application loop stopped");
  }

  private async checkAndWater() {
    if (!this.wateringConfig) {
      this.logger.warn("Watering configuration not loaded, skipping check");
      return;
    }

    // Read moisture sensor
    const moistureLevel = await this.moistureSensor.readMoisture();
    this.logger.info({ moistureLevel }, "Moisture level reading");

    // Log to Firestore
    await this.wateringConfigManager.logSensorReading(moistureLevel);

    // Check if watering is needed
    if (
      this.wateringConfig.autoWateringEnabled &&
      moistureLevel < this.wateringConfig.moistureThreshold
    ) {
      this.logger.info(
        {
          moistureLevel,
          threshold: this.wateringConfig.moistureThreshold,
        },
        "Moisture below threshold, starting watering",
      );
      await this.water();
    } else {
      this.logger.debug("Moisture level adequate, no watering needed");
    }
  }

  private async water() {
    if (!this.wateringConfig) {
      throw new Error("Watering configuration not loaded");
    }

    const duration = this.wateringConfig.wateringDurationMs;

    try {
      // Turn pump on
      await this.waterPump.turnOn();
      this.logger.info({ durationMs: duration }, "Water pump turned on");

      // Wait for specified duration
      await this.sleep(duration);

      // Turn pump off
      await this.waterPump.turnOff();
      this.logger.info("Water pump turned off");

      // Log watering action
      await this.wateringConfigManager.logWateringAction(duration);
    } catch (error) {
      // Ensure pump is turned off even if there's an error
      if (this.waterPump.isRunning()) {
        await this.waterPump.turnOff();
      }
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const app = (config: Config): Overdrip => {
  return new App(config);
};

export * from "./hardware";
