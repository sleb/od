import { describe, expect, it } from "bun:test";
import { DeviceConfigSchema } from "./device-config";

describe("DeviceConfigSchema", () => {
  it("should parse valid configuration", () => {
    const config = {
      moistureThreshold: 50,
      wateringDurationMs: 10000,
      checkIntervalMs: 30000,
      moistureSensorPin: 17,
      pumpRelayPin: 27,
      autoWateringEnabled: true,
    };

    const result = DeviceConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it("should apply defaults for missing fields", () => {
    const config = {};
    const result = DeviceConfigSchema.parse(config);

    expect(result.moistureThreshold).toBe(30);
    expect(result.wateringDurationMs).toBe(5000);
    expect(result.checkIntervalMs).toBe(60000);
    expect(result.autoWateringEnabled).toBe(true);
    expect(result.moistureSensorPin).toBeUndefined();
    expect(result.pumpRelayPin).toBeUndefined();
  });

  it("should validate moisture threshold range", () => {
    expect(() =>
      DeviceConfigSchema.parse({ moistureThreshold: -1 }),
    ).toThrow();
    expect(() =>
      DeviceConfigSchema.parse({ moistureThreshold: 101 }),
    ).toThrow();
    expect(() =>
      DeviceConfigSchema.parse({ moistureThreshold: 50 }),
    ).not.toThrow();
  });

  it("should validate check interval minimum", () => {
    expect(() => DeviceConfigSchema.parse({ checkIntervalMs: 500 })).toThrow();
    expect(() =>
      DeviceConfigSchema.parse({ checkIntervalMs: 1000 }),
    ).not.toThrow();
  });

  it("should validate watering duration minimum", () => {
    expect(() =>
      DeviceConfigSchema.parse({ wateringDurationMs: -1 }),
    ).toThrow();
    expect(() =>
      DeviceConfigSchema.parse({ wateringDurationMs: 0 }),
    ).not.toThrow();
  });

  it("should accept optional pin numbers", () => {
    const config = {
      moistureSensorPin: 17,
      pumpRelayPin: 27,
    };

    const result = DeviceConfigSchema.parse(config);
    expect(result.moistureSensorPin).toBe(17);
    expect(result.pumpRelayPin).toBe(27);
  });

  it("should validate pin numbers are integers", () => {
    expect(() =>
      DeviceConfigSchema.parse({ moistureSensorPin: 17.5 }),
    ).toThrow();
    expect(() => DeviceConfigSchema.parse({ pumpRelayPin: 27.5 })).toThrow();
  });

  it("should validate pin numbers are non-negative", () => {
    expect(() =>
      DeviceConfigSchema.parse({ moistureSensorPin: -1 }),
    ).toThrow();
    expect(() => DeviceConfigSchema.parse({ pumpRelayPin: -1 })).toThrow();
  });
});
