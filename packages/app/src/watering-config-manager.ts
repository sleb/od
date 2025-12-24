import { type Config } from "@overdrip/core";

export type PlantConfig = {
  id: string;
  name: string;
  thresholdPercent: number;
  wateringDurationMs: number;
  minIntervalMs: number;
};

export type WateringConfig = {
  plants: PlantConfig[];
};

export interface WateringConfigManager {
  load(): Promise<WateringConfig>;
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
): WateringConfigManager => new MockWateringConfigManager(config);

const DEFAULT_PLANTS: PlantConfig[] = [
  {
    id: "plant-1",
    name: "Plant 1",
    thresholdPercent: 35,
    wateringDurationMs: 1_500,
    minIntervalMs: 30_000,
  },
  {
    id: "plant-2",
    name: "Plant 2",
    thresholdPercent: 35,
    wateringDurationMs: 1_500,
    minIntervalMs: 30_000,
  },
];
