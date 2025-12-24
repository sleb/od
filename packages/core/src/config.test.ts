import { file, write } from "bun";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Config } from "./config";
import { ConfigSchema, LocalConfigManager } from "./config";

describe("LocalConfigManager", () => {
  let tempDir: string;
  let configPath: string;
  let manager: LocalConfigManager;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = await mkdtemp(join(tmpdir(), "overdrip-test-"));
    configPath = join(tempDir, "config.json");
    manager = new LocalConfigManager(configPath);
  });

  afterEach(async () => {
    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("path()", () => {
    test("returns the config path", () => {
      expect(manager.path()).toBe(configPath);
    });
  });

  describe("configExists()", () => {
    test("returns false when config file does not exist", async () => {
      const exists = await manager.configExists();
      expect(exists).toBe(false);
    });

    test("returns true when config file exists", async () => {
      await write(configPath, "{}");
      const exists = await manager.configExists();
      expect(exists).toBe(true);
    });
  });

  describe("saveConfig()", () => {
    test("writes valid config to disk", async () => {
      const config: Config = {
        device: {
          id: "device-123",
          name: "Test Device",
          authToken: "auth-token-456",
        },
        logLevel: "info",
      };

      await manager.saveConfig(config);

      // Verify file exists
      const exists = await file(configPath).exists();
      expect(exists).toBe(true);

      // Verify content is valid JSON
      const content = await file(configPath).text();
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(config);
    });

    test("formats JSON with proper indentation", async () => {
      const config: Config = {
        device: {
          id: "device-123",
          name: "Test Device",
          authToken: "auth-token-456",
        },
        logLevel: "info",
      };

      await manager.saveConfig(config);

      const content = await file(configPath).text();
      // Should be formatted with 2-space indentation
      expect(content).toContain("  ");
      expect(content).toContain("\n");
    });

    test("overwrites existing config", async () => {
      const config1: Config = {
        device: {
          id: "old-device",
          name: "Old Device",
          authToken: "old-token",
        },
        logLevel: "debug",
      };

      const config2: Config = {
        device: {
          id: "new-device",
          name: "New Device",
          authToken: "new-token",
        },
        logLevel: "error",
      };

      await manager.saveConfig(config1);
      await manager.saveConfig(config2);

      const loaded = await manager.loadConfig();
      expect(loaded).toEqual(config2);
    });
  });

  describe("loadConfig()", () => {
    test("loads and parses valid config", async () => {
      const config: Config = {
        device: {
          id: "device-123",
          name: "Test Device",
          authToken: "auth-token-456",
        },
        logLevel: "warn",
      };

      await write(configPath, JSON.stringify(config, null, 2));

      const loaded = await manager.loadConfig();
      expect(loaded).toEqual(config);
    });

    // No multiple destinations or default logging in simple schema

    test("throws error when config file does not exist", async () => {
      await expect(manager.loadConfig()).rejects.toThrow(
        "Failed to load or parse config",
      );
    });

    test("throws error for malformed JSON", async () => {
      await write(configPath, "{ invalid json");

      await expect(manager.loadConfig()).rejects.toThrow(
        "Failed to load or parse config",
      );
    });

    test("throws error for invalid config schema (missing device)", async () => {
      await write(
        configPath,
        JSON.stringify({
          logLevel: "info",
        }),
      );

      await expect(manager.loadConfig()).rejects.toThrow(
        "Failed to load or parse config",
      );
    });

    test("throws error for invalid device schema (missing id)", async () => {
      await write(
        configPath,
        JSON.stringify({
          device: {
            name: "Test Device",
            authToken: "auth-token-456",
          },
          logLevel: "info",
        }),
      );

      await expect(manager.loadConfig()).rejects.toThrow(
        "Failed to load or parse config",
      );
    });

    test("throws error for invalid log level", async () => {
      await write(
        configPath,
        JSON.stringify({
          device: {
            id: "device-123",
            name: "Test Device",
            authToken: "auth-token-456",
          },
          logLevel: "invalid",
        }),
      );

      await expect(manager.loadConfig()).rejects.toThrow(
        "Failed to load or parse config",
      );
    });

    // No file logging schema in simple config
  });

  describe("ConfigSchema", () => {
    test("validates valid config", () => {
      const config = {
        device: {
          id: "device-123",
          name: "Test Device",
          authToken: "auth-token-456",
        },
        logLevel: "info",
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test("rejects config with empty device id", () => {
      const config = {
        device: {
          id: "",
          name: "Test Device",
          authToken: "auth-token-456",
        },
        logLevel: "info",
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    test("rejects config with empty device name", () => {
      const config = {
        device: {
          id: "device-123",
          name: "",
          authToken: "auth-token-456",
        },
        logLevel: "info",
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    test("rejects config with empty auth token", () => {
      const config = {
        device: {
          id: "device-123",
          name: "Test Device",
          authToken: "",
        },
        logLevel: "info",
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});
