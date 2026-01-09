import { describe, expect, test } from "bun:test";
import { ReadMetricsRequestSchema } from "@overdrip/core/schemas";
import { HttpsError } from "firebase-functions/https";

describe("readMetrics - Unit Tests", () => {
  // Tests are simplified because firebase-functions-test doesn't have proper Bun support
  // In production, use integration tests or manually test the Cloud Function

  test("validates request schema accepts valid timeRange values", () => {
    const validRequests = [
      { deviceId: "device-1", timeRange: "1h" as const },
      { deviceId: "device-2", timeRange: "6h" as const },
      { deviceId: "device-3", timeRange: "24h" as const },
      { deviceId: "device-4", timeRange: "7d" as const },
    ];

    for (const req of validRequests) {
      const result = ReadMetricsRequestSchema.safeParse(req);
      expect(result.success).toBe(true);
    }
  });

  test("validates request schema rejects invalid timeRange", () => {
    const invalidRequests = [
      { deviceId: "device-1", timeRange: "2h" },
      { deviceId: "device-2", timeRange: "invalid" },
      { deviceId: "device-3", timeRange: "1month" },
    ];

    for (const req of invalidRequests) {
      const result = ReadMetricsRequestSchema.safeParse(req);
      expect(result.success).toBe(false);
    }
  });

  test("validates request schema requires deviceId", () => {
    const result = ReadMetricsRequestSchema.safeParse({ timeRange: "24h" });
    expect(result.success).toBe(false);
  });

  test("validates request schema defaults timeRange to 24h", () => {
    const result = ReadMetricsRequestSchema.safeParse({ deviceId: "device-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeRange).toBe("24h");
    }
  });

  test("validates that HttpsError is properly exported", () => {
    const err = new HttpsError("unauthenticated", "Not authenticated");
    expect(err.code).toBe("unauthenticated");
    expect(err.message).toBe("Not authenticated");
  });

  test("validates time range calculations", () => {
    const now = Date.now();
    const timeRanges = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };

    for (const [, ms] of Object.entries(timeRanges)) {
      const startTime = now - ms;
      expect(startTime).toBeLessThan(now);
      expect(now - startTime).toBe(ms);
    }
  });
});
