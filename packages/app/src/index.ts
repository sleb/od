import {
  auth,
  createCustomToken,
  db,
  type Config,
  type DeviceConfig,
  DeviceConfigSchema,
} from "@overdrip/core";
import { signInWithCustomToken } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
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

class App implements Overdrip {
  logger: pino.Logger;
  private running = false;
  private moistureSensor: MoistureSensor;
  private waterPump: WaterPump;
  private deviceConfig: DeviceConfig | null = null;

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

    // Initialize hardware (will use mock implementations for now)
    this.moistureSensor = HardwareFactory.createMoistureSensor();
    this.waterPump = HardwareFactory.createWaterPump();
  }

  async start() {
    this.logger.info("Starting Overdrip application...");

    try {
      // Step 1: Authenticate with custom token
      await this.authenticate();

      // Step 2: Read configuration from Firestore
      await this.loadDeviceConfig();

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

    // Exchange auth token for custom token
    const customToken = await createCustomToken(id, authToken);

    // Sign in with custom token
    await signInWithCustomToken(auth, customToken);

    this.logger.info({ deviceId: id }, "Successfully authenticated");
  }

  private async loadDeviceConfig() {
    this.logger.info("Loading device configuration from Firestore...");

    const deviceId = this.config.device.id;
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Read from /users/{userId}/devices/{deviceId}
    const deviceDocRef = doc(db, "users", userId, "devices", deviceId);
    const deviceDoc = await getDoc(deviceDocRef);

    if (!deviceDoc.exists()) {
      // Create default configuration if it doesn't exist
      this.logger.info("No configuration found, creating default...");
      this.deviceConfig = DeviceConfigSchema.parse({});
      await setDoc(deviceDocRef, this.deviceConfig, { merge: true });
    } else {
      this.deviceConfig = DeviceConfigSchema.parse(deviceDoc.data());
    }

    this.logger.info(
      { config: this.deviceConfig },
      "Device configuration loaded",
    );

    // Update hardware with pin configuration if provided
    if (this.deviceConfig.moistureSensorPin !== undefined) {
      this.moistureSensor = HardwareFactory.createMoistureSensor(
        this.deviceConfig.moistureSensorPin,
      );
    }
    if (this.deviceConfig.pumpRelayPin !== undefined) {
      this.waterPump = HardwareFactory.createWaterPump(
        this.deviceConfig.pumpRelayPin,
      );
    }
  }

  private async runMainLoop() {
    this.logger.info("Starting main application loop...");

    while (this.running) {
      try {
        await this.checkAndWater();

        // Sleep until next interval
        const checkInterval = this.deviceConfig?.checkIntervalMs || 60000;
        this.logger.debug(
          { intervalMs: checkInterval },
          "Sleeping until next check",
        );
        await this.sleep(checkInterval);
      } catch (error) {
        this.logger.error({ error }, "Error in main loop");
        // Continue running even if there's an error
        await this.sleep(5000); // Short delay before retry
      }
    }

    this.logger.info("Main application loop stopped");
  }

  private async checkAndWater() {
    if (!this.deviceConfig) {
      this.logger.warn("Device configuration not loaded, skipping check");
      return;
    }

    // Read moisture sensor
    const moistureLevel = await this.moistureSensor.readMoisture();
    this.logger.info({ moistureLevel }, "Moisture level reading");

    // Log to Firestore
    await this.logSensorReading(moistureLevel);

    // Check if watering is needed
    if (
      this.deviceConfig.autoWateringEnabled &&
      moistureLevel < this.deviceConfig.moistureThreshold
    ) {
      this.logger.info(
        {
          moistureLevel,
          threshold: this.deviceConfig.moistureThreshold,
        },
        "Moisture below threshold, starting watering",
      );
      await this.water();
    } else {
      this.logger.debug("Moisture level adequate, no watering needed");
    }
  }

  private async water() {
    if (!this.deviceConfig) {
      throw new Error("Device configuration not loaded");
    }

    const duration = this.deviceConfig.wateringDurationMs;

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
      await this.logWateringAction(duration);
    } catch (error) {
      // Ensure pump is turned off even if there's an error
      if (this.waterPump.isRunning()) {
        await this.waterPump.turnOff();
      }
      throw error;
    }
  }

  private async logSensorReading(moistureLevel: number) {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      this.logger.warn("Cannot log sensor reading: user not authenticated");
      return;
    }

    const deviceId = this.config.device.id;
    const readingRef = doc(
      db,
      "users",
      userId,
      "devices",
      deviceId,
      "readings",
      `${Date.now()}`,
    );

    await setDoc(readingRef, {
      type: "moisture",
      value: moistureLevel,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug({ moistureLevel }, "Sensor reading logged to Firestore");
  }

  private async logWateringAction(durationMs: number) {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      this.logger.warn("Cannot log watering action: user not authenticated");
      return;
    }

    const deviceId = this.config.device.id;
    const actionRef = doc(
      db,
      "users",
      userId,
      "devices",
      deviceId,
      "actions",
      `${Date.now()}`,
    );

    await setDoc(actionRef, {
      type: "watering",
      durationMs,
      timestamp: new Date().toISOString(),
    });

    this.logger.info({ durationMs }, "Watering action logged to Firestore");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const app = (config: Config): Overdrip => {
  return new App(config);
};

export * from "./hardware";
