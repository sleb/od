import {
  MetricDataPointSchema,
  WriteMetricsRequestSchema,
  WriteMetricsResponseSchema,
} from "@overdrip/core/schemas";
import { describe, expect, test } from "bun:test";

describe("writeMetrics - Schema Validation", () => {
  describe("Request validation (WriteMetricsRequestSchema)", () => {
    test("accepts valid metrics request", () => {
      const result = WriteMetricsRequestSchema.safeParse({
        deviceId: "device-123",
        metrics: [
          {
            type: "moisture",
            value: 45.5,
            plantId: "plant-1",
            timestamp: Date.now(),
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    test("accepts multiple metrics in single request", () => {
      const result = WriteMetricsRequestSchema.safeParse({
        deviceId: "device-456",
        metrics: [
          {
            type: "moisture",
            value: 30.0,
            plantId: "plant-1",
            timestamp: Date.now(),
          },
          {
            type: "moisture",
            value: 75.5,
            plantId: "plant-2",
            timestamp: Date.now(),
          },
          {
            type: "moisture",
            value: 50.0,
            plantId: "plant-3",
            timestamp: Date.now(),
          },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metrics).toHaveLength(3);
      }
    });

    test("rejects empty device ID", () => {
      const result = WriteMetricsRequestSchema.safeParse({
        deviceId: "",
        metrics: [
          {
            type: "moisture",
            value: 45.5,
            plantId: "plant-1",
            timestamp: Date.now(),
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    test("rejects empty metrics array", () => {
      const result = WriteMetricsRequestSchema.safeParse({
        deviceId: "device-123",
        metrics: [],
      });
      expect(result.success).toBe(false);
    });

    test("rejects missing deviceId", () => {
      const result = WriteMetricsRequestSchema.safeParse({
        metrics: [
          {
            type: "moisture",
            value: 45.5,
            plantId: "plant-1",
            timestamp: Date.now(),
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    test("rejects missing metrics", () => {
      const result = WriteMetricsRequestSchema.safeParse({
        deviceId: "device-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Metric data point validation (MetricDataPointSchema)", () => {
    test("accepts valid moisture metric", () => {
      const result = MetricDataPointSchema.safeParse({
        type: "moisture",
        value: 45.5,
        plantId: "plant-1",
        timestamp: Date.now(),
      });
      expect(result.success).toBe(true);
    });

    test("accepts zero moisture value", () => {
      const result = MetricDataPointSchema.safeParse({
        type: "moisture",
        value: 0,
        plantId: "plant-1",
        timestamp: Date.now(),
      });
      expect(result.success).toBe(true);
    });

    test("accepts 100 percent moisture value", () => {
      const result = MetricDataPointSchema.safeParse({
        type: "moisture",
        value: 100,
        plantId: "plant-1",
        timestamp: Date.now(),
      });
      expect(result.success).toBe(true);
    });

    test("accepts negative values (for future sensor types)", () => {
      const result = MetricDataPointSchema.safeParse({
        type: "moisture",
        value: -5.0,
        plantId: "plant-1",
        timestamp: Date.now(),
      });
      expect(result.success).toBe(true);
    });

    test("rejects invalid metric type", () => {
      const result = MetricDataPointSchema.safeParse({
        type: "temperature", // Not in enum
        value: 45.5,
        plantId: "plant-1",
        timestamp: Date.now(),
      });
      expect(result.success).toBe(false);
    });

    test("rejects empty plant ID", () => {
      const result = MetricDataPointSchema.safeParse({
        type: "moisture",
        value: 45.5,
        plantId: "",
        timestamp: Date.now(),
      });
      expect(result.success).toBe(false);
    });

    test("rejects non-numeric value", () => {
      const result = MetricDataPointSchema.safeParse({
        type: "moisture",
        value: "45.5",
        plantId: "plant-1",
        timestamp: Date.now(),
      });
      expect(result.success).toBe(false);
    });

    test("rejects non-positive timestamp", () => {
      const result = MetricDataPointSchema.safeParse({
        type: "moisture",
        value: 45.5,
        plantId: "plant-1",
        timestamp: 0,
      });
      expect(result.success).toBe(false);
    });

    test("rejects negative timestamp", () => {
      const result = MetricDataPointSchema.safeParse({
        type: "moisture",
        value: 45.5,
        plantId: "plant-1",
        timestamp: -1000,
      });
      expect(result.success).toBe(false);
    });

    test("rejects missing required fields", () => {
      const result = MetricDataPointSchema.safeParse({
        type: "moisture",
        value: 45.5,
        // Missing plantId and timestamp
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Response validation (WriteMetricsResponseSchema)", () => {
    test("accepts valid success response", () => {
      const result = WriteMetricsResponseSchema.safeParse({
        success: true,
        metricsWritten: 3,
      });
      expect(result.success).toBe(true);
    });

    test("accepts zero metrics written", () => {
      const result = WriteMetricsResponseSchema.safeParse({
        success: true,
        metricsWritten: 0,
      });
      expect(result.success).toBe(true);
    });

    test("accepts failure response", () => {
      const result = WriteMetricsResponseSchema.safeParse({
        success: false,
        metricsWritten: 0,
      });
      expect(result.success).toBe(true);
    });

    test("rejects negative metrics count", () => {
      const result = WriteMetricsResponseSchema.safeParse({
        success: true,
        metricsWritten: -1,
      });
      expect(result.success).toBe(false);
    });

    test("rejects missing success field", () => {
      const result = WriteMetricsResponseSchema.safeParse({
        metricsWritten: 3,
      });
      expect(result.success).toBe(false);
    });

    test("rejects missing metricsWritten field", () => {
      const result = WriteMetricsResponseSchema.safeParse({
        success: true,
      });
      expect(result.success).toBe(false);
    });
  });
});

// Note: Testing the actual Cloud Function requires Firebase emulators
// or integration tests. These tests cover:
// 1. Schema validation (request/response/data points)
//
// Integration testing deferred for:
// - Authentication checks (req.auth?.uid)
// - Cloud Monitoring API calls (MetricServiceClient)
// - Error handling for API failures
// - Time series data formatting
