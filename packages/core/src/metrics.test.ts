import { describe, expect, it, beforeEach, mock } from "bun:test";
import { writeMetrics } from "./metrics";
import type { MetricDataPoint } from "./schemas";

// Mock Firebase functions
const mockHttpsCallable = mock(() => ({
  data: {
    success: true,
    metricsWritten: 2,
  },
}));

mock.module("firebase/functions", () => ({
  httpsCallable: () => mockHttpsCallable,
}));

describe("writeMetrics", () => {
  beforeEach(() => {
    mockHttpsCallable.mockClear();
  });

  it("should call writeMetrics Cloud Function with correct data", async () => {
    const deviceId = "device-123";
    const metrics: MetricDataPoint[] = [
      {
        type: "moisture",
        value: 45.5,
        plantId: "plant-1",
        timestamp: Date.now(),
      },
      {
        type: "moisture",
        value: 62.3,
        plantId: "plant-2",
        timestamp: Date.now(),
      },
    ];

    const result = await writeMetrics(deviceId, metrics);

    expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.metricsWritten).toBe(2);
  });

  it("should validate metrics data with schema", async () => {
    const deviceId = "device-456";
    const metrics: MetricDataPoint[] = [
      {
        type: "moisture",
        value: 30.0,
        plantId: "plant-1",
        timestamp: Date.now(),
      },
    ];

    await expect(writeMetrics(deviceId, metrics)).resolves.toBeDefined();
  });

  it("should throw error for invalid device ID", async () => {
    const invalidDeviceId = ""; // Empty string - invalid
    const metrics: MetricDataPoint[] = [
      {
        type: "moisture",
        value: 45.5,
        plantId: "plant-1",
        timestamp: Date.now(),
      },
    ];

    await expect(writeMetrics(invalidDeviceId, metrics)).rejects.toThrow();
  });

  it("should throw error for empty metrics array", async () => {
    const deviceId = "device-123";
    const metrics: MetricDataPoint[] = [];

    await expect(writeMetrics(deviceId, metrics)).rejects.toThrow();
  });

  it("should handle single metric", async () => {
    const deviceId = "device-789";
    const metrics: MetricDataPoint[] = [
      {
        type: "moisture",
        value: 55.0,
        plantId: "plant-1",
        timestamp: Date.now(),
      },
    ];

    const result = await writeMetrics(deviceId, metrics);

    expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });
});
