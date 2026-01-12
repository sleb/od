import { warn } from "@overdrip/core/logger";
import {
  type Config,
  type PlantConfig,
  type WateringConfig,
} from "@overdrip/core/schemas";
import { fetchWateringConfig } from "@overdrip/core/watering";

export { type PlantConfig, type WateringConfig } from "@overdrip/core/schemas";

export interface WateringConfigManager {
  load(): Promise<WateringConfig>;
}

export class FirestoreWateringConfigManager implements WateringConfigManager {
  constructor(private config: Config) {}

  async load(): Promise<WateringConfig> {
    const userId = this.config.device.userId;
    const deviceId = this.config.device.id;

    const config = await fetchWateringConfig(userId, deviceId);

    if (!config) {
      warn(
        { userId, deviceId },
        "Watering config not found or invalid; using defaults",
      );
      return { plants: DEFAULT_PLANTS };
    }

    return config;
  }
}

export class MockWateringConfigManager implements WateringConfigManager {
  constructor(private config: Config) {}

  async load(): Promise<WateringConfig> {
    return {
      plants: DEFAULT_PLANTS,
    };
  }
}

export const createWateringConfigManager = (
  config: Config,
): WateringConfigManager => {
  // Use Firestore manager in production, mock for development
  const isProduction = process.env.NODE_ENV === "production";
  return isProduction
    ? new FirestoreWateringConfigManager(config)
    : new MockWateringConfigManager(config);
};

const DEFAULT_PLANTS: PlantConfig[] = [
  {
    id: "plant-0",
    name: "Plant 1",
    thresholdPercent: 30,
    wateringDurationMs: 5_000,
    minIntervalMs: 300_000, // 5 minutes
  },
  {
    id: "plant-1",
    name: "Plant 2",
    thresholdPercent: 30,
    wateringDurationMs: 5_000,
    minIntervalMs: 300_000, // 5 minutes
  },
];
