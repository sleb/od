import {
  CreateCustomTokenRequestSchema,
  CreateCustomTokenResponseSchema,
  DeviceRegistrationSchema,
} from "@overdrip/core/schemas";
import { describe, expect, test } from "bun:test";
import { isAuthTokenValid } from "./create-custom-token";

describe("createCustomToken - Schema Validation", () => {
  describe("Request validation (CreateCustomTokenRequestSchema)", () => {
    test("accepts valid request with id and authToken", () => {
      const request = {
        id: "device-123",
        authToken: "token-456",
      };

      const result = CreateCustomTokenRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("device-123");
        expect(result.data.authToken).toBe("token-456");
      }
    });

    test("rejects request with empty id", () => {
      const result = CreateCustomTokenRequestSchema.safeParse({
        id: "",
        authToken: "token-456",
      });
      expect(result.success).toBe(false);
    });

    test("rejects request with empty authToken", () => {
      const result = CreateCustomTokenRequestSchema.safeParse({
        id: "device-123",
        authToken: "",
      });
      expect(result.success).toBe(false);
    });

    test("rejects request with missing id", () => {
      const result = CreateCustomTokenRequestSchema.safeParse({
        authToken: "token-456",
      });
      expect(result.success).toBe(false);
    });

    test("rejects request with missing authToken", () => {
      const result = CreateCustomTokenRequestSchema.safeParse({
        id: "device-123",
      });
      expect(result.success).toBe(false);
    });

    test("rejects request with extra fields", () => {
      const result = CreateCustomTokenRequestSchema.safeParse({
        id: "device-123",
        authToken: "token-456",
        extra: "field",
      });
      expect(result.success).toBe(true); // Extra fields are stripped
    });
  });

  describe("Response validation (CreateCustomTokenResponseSchema)", () => {
    test("accepts valid response with customToken", () => {
      const response = {
        customToken: "firebase-token-xyz123",
      };

      const result = CreateCustomTokenResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customToken).toBe("firebase-token-xyz123");
      }
    });

    test("rejects response with empty customToken", () => {
      const result = CreateCustomTokenResponseSchema.safeParse({
        customToken: "",
      });
      expect(result.success).toBe(false);
    });

    test("rejects response with missing customToken", () => {
      const result = CreateCustomTokenResponseSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    test("rejects response with non-string customToken", () => {
      const result = CreateCustomTokenResponseSchema.safeParse({
        customToken: 123,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Device registration validation (DeviceRegistrationSchema)", () => {
    test("accepts valid device registration data", () => {
      const device = {
        id: "device-123",
        name: "Test Device",
        authToken: "auth-token-456",
        registeredAt: new Date().toISOString(),
      };

      const result = DeviceRegistrationSchema.safeParse(device);
      expect(result.success).toBe(true);
    });

    test("rejects device with missing registeredAt", () => {
      const device = {
        id: "device-123",
        name: "Test Device",
        authToken: "auth-token-456",
      };

      const result = DeviceRegistrationSchema.safeParse(device);
      expect(result.success).toBe(false);
    });
  });
});

describe("isAuthTokenValid - Core Logic", () => {
  test("returns true when token matches and not expired", () => {
    const now = new Date();
    const registeredAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const token = "auth-token-abc123";

    const result = isAuthTokenValid(token, token, registeredAt.toISOString());
    expect(result).toBe(true);
  });

  test("returns false when token does not match", () => {
    const now = new Date();
    const registeredAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const result = isAuthTokenValid(
      "auth-token-abc123",
      "auth-token-different",
      registeredAt.toISOString(),
    );
    expect(result).toBe(false);
  });

  test("returns false when token is expired", () => {
    const now = new Date();
    const registeredAt = new Date(
      now.getTime() - 365 * 24 * 60 * 60 * 1000 - 1000,
    ); // Over 1 year ago
    const token = "auth-token-abc123";

    const result = isAuthTokenValid(token, token, registeredAt.toISOString());
    expect(result).toBe(false);
  });

  test("returns false when both token mismatch and expired", () => {
    const now = new Date();
    const registeredAt = new Date(
      now.getTime() - 365 * 24 * 60 * 60 * 1000 - 1000,
    ); // Over 1 year ago

    const result = isAuthTokenValid(
      "auth-token-abc123",
      "auth-token-different",
      registeredAt.toISOString(),
    );
    expect(result).toBe(false);
  });
});
