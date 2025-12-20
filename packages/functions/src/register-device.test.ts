import {
  DeviceRegistrationSchema,
  RegisterDeviceRequestSchema,
} from "@overdrip/core/schemas";
import { describe, expect, test } from "bun:test";

describe("registerDevice - Schema Validation", () => {
  describe("Request validation (RegisterDeviceRequestSchema)", () => {
    test("accepts valid device name", () => {
      const result = RegisterDeviceRequestSchema.safeParse({
        name: "Living Room Plant",
      });
      expect(result.success).toBe(true);
    });

    test("rejects empty name", () => {
      const result = RegisterDeviceRequestSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    test("rejects missing name field", () => {
      const result = RegisterDeviceRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    test("rejects name exceeding 100 characters", () => {
      const result = RegisterDeviceRequestSchema.safeParse({
        name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    test("rejects non-string name", () => {
      const result = RegisterDeviceRequestSchema.safeParse({ name: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe("Device registration validation (DeviceRegistrationSchema)", () => {
    test("validates complete device registration", () => {
      const registration = {
        id: "device-abc123",
        name: "Test Device",
        authToken: crypto.randomUUID(),
        registeredAt: new Date().toISOString(),
      };

      const result = DeviceRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(true);
    });

    test("validates that generated UUID is valid auth token", () => {
      const uuid = crypto.randomUUID();
      const registration = {
        id: "device-123",
        name: "Test Device",
        authToken: uuid,
        registeredAt: new Date().toISOString(),
      };

      const result = DeviceRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authToken).toBe(uuid);
        // Verify UUID format
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
      }
    });

    test("validates ISO datetime format for registeredAt", () => {
      const now = new Date();
      const registration = {
        id: "device-123",
        name: "Test Device",
        authToken: crypto.randomUUID(),
        registeredAt: now.toISOString(),
      };

      const result = DeviceRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(true);
    });

    test("rejects registration with invalid datetime", () => {
      const registration = {
        id: "device-123",
        name: "Test Device",
        authToken: crypto.randomUUID(),
        registeredAt: "2025-12-20 10:30:00", // Not ISO format
      };

      const result = DeviceRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(false);
    });

    test("rejects registration with missing required fields", () => {
      const incomplete = {
        id: "device-123",
        name: "Test Device",
        // Missing authToken and registeredAt
      };

      const result = DeviceRegistrationSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });
});

// Note: Testing the actual Cloud Function requires Firebase emulators
// or integration tests. The tests cover:
// 1. Schema validation (request/response)
//
// Integration testing deferred for:
// - Authentication checks (req.auth?.uid)
// - Firestore operations (collection, doc, set)
// - Error handling for Firestore failures
