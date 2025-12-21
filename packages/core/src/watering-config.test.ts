import { describe, expect, it } from "bun:test";
import { WateringConfigSchema } from "./watering-config";

describe("WateringConfigSchema", () => {
  it("should parse valid configuration", () => {
    const config = {
      moistureThreshold: 50,
      wateringDurationMs: 10000,
      checkIntervalMs: 30000,
      autoWateringEnabled: true,
    };

    const result = WateringConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it("should apply defaults for missing fields", () => {
    const config = {};
    const result = WateringConfigSchema.parse(config);

    expect(result.moistureThreshold).toBe(30);
    expect(result.wateringDurationMs).toBe(5000);
    expect(result.checkIntervalMs).toBe(60000);
    expect(result.autoWateringEnabled).toBe(true);
  });

  it("should validate moisture threshold range", () => {
    expect(() =>
      WateringConfigSchema.parse({ moistureThreshold: -1 }),
    ).toThrow();
    expect(() =>
      WateringConfigSchema.parse({ moistureThreshold: 101 }),
    ).toThrow();
    expect(() =>
      WateringConfigSchema.parse({ moistureThreshold: 50 }),
    ).not.toThrow();
  });

  it("should validate check interval minimum", () => {
    expect(() => WateringConfigSchema.parse({ checkIntervalMs: 500 })).toThrow();
    expect(() =>
      WateringConfigSchema.parse({ checkIntervalMs: 1000 }),
    ).not.toThrow();
  });

  it("should validate watering duration minimum", () => {
    expect(() =>
      WateringConfigSchema.parse({ wateringDurationMs: -1 }),
    ).toThrow();
    expect(() =>
      WateringConfigSchema.parse({ wateringDurationMs: 0 }),
    ).not.toThrow();
  });
});
