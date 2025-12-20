import { describe, expect, test } from "bun:test";
import {
  AuthToken,
  CreateCustomTokenRequestSchema,
  CreateCustomTokenResponseSchema,
  DeviceConfigSchema,
  DeviceId,
  DeviceName,
  DeviceRegistrationSchema,
  RegisterDeviceRequestSchema,
  RegisterDeviceResponseSchema,
} from "./schemas";

describe("Device Primitive Validators", () => {
  describe("DeviceId", () => {
    test("accepts valid device id", () => {
      const result = DeviceId.safeParse("device-123");
      expect(result.success).toBe(true);
    });

    test("accepts id at max length (100 chars)", () => {
      const longId = "a".repeat(100);
      const result = DeviceId.safeParse(longId);
      expect(result.success).toBe(true);
    });

    test("rejects empty string", () => {
      const result = DeviceId.safeParse("");
      expect(result.success).toBe(false);
    });

    test("rejects id exceeding 100 chars", () => {
      const tooLong = "a".repeat(101);
      const result = DeviceId.safeParse(tooLong);
      expect(result.success).toBe(false);
    });

    test("rejects non-string values", () => {
      expect(DeviceId.safeParse(123).success).toBe(false);
      expect(DeviceId.safeParse(null).success).toBe(false);
      expect(DeviceId.safeParse(undefined).success).toBe(false);
    });
  });

  describe("DeviceName", () => {
    test("accepts valid device name", () => {
      const result = DeviceName.safeParse("My Plant Monitor");
      expect(result.success).toBe(true);
    });

    test("accepts name at max length (100 chars)", () => {
      const longName = "a".repeat(100);
      const result = DeviceName.safeParse(longName);
      expect(result.success).toBe(true);
    });

    test("rejects empty string", () => {
      const result = DeviceName.safeParse("");
      expect(result.success).toBe(false);
    });

    test("rejects name exceeding 100 chars", () => {
      const tooLong = "a".repeat(101);
      const result = DeviceName.safeParse(tooLong);
      expect(result.success).toBe(false);
    });

    test("rejects non-string values", () => {
      expect(DeviceName.safeParse(123).success).toBe(false);
      expect(DeviceName.safeParse(null).success).toBe(false);
    });
  });

  describe("AuthToken", () => {
    test("accepts valid auth token", () => {
      const result = AuthToken.safeParse("auth-token-12345");
      expect(result.success).toBe(true);
    });

    test("accepts UUID-style token", () => {
      const result = AuthToken.safeParse(
        "550e8400-e29b-41d4-a716-446655440000",
      );
      expect(result.success).toBe(true);
    });

    test("rejects empty string", () => {
      const result = AuthToken.safeParse("");
      expect(result.success).toBe(false);
    });

    test("rejects non-string values", () => {
      expect(AuthToken.safeParse(123).success).toBe(false);
      expect(AuthToken.safeParse(null).success).toBe(false);
    });
  });
});

describe("RegisterDeviceRequestSchema", () => {
  test("validates valid request with name", () => {
    const request = { name: "Living Room Plant" };
    const result = RegisterDeviceRequestSchema.safeParse(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Living Room Plant");
    }
  });

  test("rejects request with empty name", () => {
    const request = { name: "" };
    const result = RegisterDeviceRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });

  test("rejects request with missing name", () => {
    const request = {};
    const result = RegisterDeviceRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });

  test("rejects request with name exceeding 100 chars", () => {
    const request = { name: "a".repeat(101) };
    const result = RegisterDeviceRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });
});

describe("RegisterDeviceResponseSchema", () => {
  test("validates valid response with id and authToken", () => {
    const response = {
      id: "device-123",
      authToken: "auth-token-456",
    };
    const result = RegisterDeviceResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("device-123");
      expect(result.data.authToken).toBe("auth-token-456");
    }
  });

  test("rejects response with empty id", () => {
    const response = { id: "", authToken: "auth-token-456" };
    const result = RegisterDeviceResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  test("rejects response with empty authToken", () => {
    const response = { id: "device-123", authToken: "" };
    const result = RegisterDeviceResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  test("rejects response with missing fields", () => {
    expect(
      RegisterDeviceResponseSchema.safeParse({ id: "device-123" }).success,
    ).toBe(false);
    expect(
      RegisterDeviceResponseSchema.safeParse({ authToken: "token" }).success,
    ).toBe(false);
  });

  test("rejects response with id exceeding 100 chars", () => {
    const response = { id: "a".repeat(101), authToken: "token" };
    const result = RegisterDeviceResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

describe("DeviceConfigSchema", () => {
  test("validates valid device config", () => {
    const config = {
      id: "device-123",
      name: "My Device",
      authToken: "auth-token-456",
    };
    const result = DeviceConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("device-123");
      expect(result.data.name).toBe("My Device");
      expect(result.data.authToken).toBe("auth-token-456");
    }
  });

  test("rejects config with empty name", () => {
    const config = {
      id: "device-123",
      name: "",
      authToken: "auth-token-456",
    };
    const result = DeviceConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  test("rejects config with missing required fields", () => {
    expect(
      DeviceConfigSchema.safeParse({
        id: "device-123",
        name: "My Device",
      }).success,
    ).toBe(false);
    expect(
      DeviceConfigSchema.safeParse({
        id: "device-123",
        authToken: "token",
      }).success,
    ).toBe(false);
    expect(
      DeviceConfigSchema.safeParse({
        name: "My Device",
        authToken: "token",
      }).success,
    ).toBe(false);
  });

  test("rejects config with name exceeding 100 chars", () => {
    const config = {
      id: "device-123",
      name: "a".repeat(101),
      authToken: "auth-token-456",
    };
    const result = DeviceConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});

describe("DeviceRegistrationSchema", () => {
  test("validates valid device registration", () => {
    const registration = {
      id: "device-123",
      name: "My Device",
      authToken: "auth-token-456",
      registeredAt: "2025-12-20T10:30:00.000Z",
    };
    const result = DeviceRegistrationSchema.safeParse(registration);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("device-123");
      expect(result.data.name).toBe("My Device");
      expect(result.data.authToken).toBe("auth-token-456");
      expect(result.data.registeredAt).toBe("2025-12-20T10:30:00.000Z");
    }
  });

  test("validates registration with ISO datetime without milliseconds", () => {
    const registration = {
      id: "device-123",
      name: "My Device",
      authToken: "auth-token-456",
      registeredAt: "2025-12-20T10:30:00Z",
    };
    const result = DeviceRegistrationSchema.safeParse(registration);
    expect(result.success).toBe(true);
  });

  test("rejects registration with invalid datetime format", () => {
    const registration = {
      id: "device-123",
      name: "My Device",
      authToken: "auth-token-456",
      registeredAt: "2025-12-20 10:30:00",
    };
    const result = DeviceRegistrationSchema.safeParse(registration);
    expect(result.success).toBe(false);
  });

  test("rejects registration with missing registeredAt", () => {
    const registration = {
      id: "device-123",
      name: "My Device",
      authToken: "auth-token-456",
    };
    const result = DeviceRegistrationSchema.safeParse(registration);
    expect(result.success).toBe(false);
  });

  test("rejects registration with non-string datetime", () => {
    const registration = {
      id: "device-123",
      name: "My Device",
      authToken: "auth-token-456",
      registeredAt: new Date("2025-12-20T10:30:00.000Z"),
    };
    const result = DeviceRegistrationSchema.safeParse(registration);
    expect(result.success).toBe(false);
  });

  test("rejects registration with invalid date string", () => {
    const registration = {
      id: "device-123",
      name: "My Device",
      authToken: "auth-token-456",
      registeredAt: "not-a-date",
    };
    const result = DeviceRegistrationSchema.safeParse(registration);
    expect(result.success).toBe(false);
  });

  test("rejects registration with empty fields", () => {
    const registration = {
      id: "",
      name: "My Device",
      authToken: "auth-token-456",
      registeredAt: "2025-12-20T10:30:00.000Z",
    };
    expect(DeviceRegistrationSchema.safeParse(registration).success).toBe(
      false,
    );
  });
});

describe("CreateCustomTokenRequestSchema", () => {
  test("validates valid request", () => {
    const request = {
      id: "device-123",
      authToken: "auth-token-456",
    };
    const result = CreateCustomTokenRequestSchema.safeParse(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("device-123");
      expect(result.data.authToken).toBe("auth-token-456");
    }
  });

  test("rejects request with empty id", () => {
    const request = { id: "", authToken: "auth-token-456" };
    const result = CreateCustomTokenRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });

  test("rejects request with empty authToken", () => {
    const request = { id: "device-123", authToken: "" };
    const result = CreateCustomTokenRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });

  test("rejects request with missing fields", () => {
    expect(
      CreateCustomTokenRequestSchema.safeParse({ id: "device-123" }).success,
    ).toBe(false);
    expect(
      CreateCustomTokenRequestSchema.safeParse({ authToken: "token" }).success,
    ).toBe(false);
  });
});

describe("CreateCustomTokenResponseSchema", () => {
  test("validates valid response with customToken", () => {
    const response = {
      customToken: "firebase-custom-token-xyz",
    };
    const result = CreateCustomTokenResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customToken).toBe("firebase-custom-token-xyz");
    }
  });

  test("rejects response with empty customToken", () => {
    const response = { customToken: "" };
    const result = CreateCustomTokenResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  test("rejects response with missing customToken", () => {
    const response = {};
    const result = CreateCustomTokenResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  test("rejects response with non-string customToken", () => {
    const response = { customToken: 123 };
    const result = CreateCustomTokenResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});
