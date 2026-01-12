import { terminateDb } from "@overdrip/core";
import { LocalConfigManager } from "@overdrip/core/config";
import { registerDevice } from "@overdrip/core/device";
import type { Config } from "@overdrip/core/schemas";
import { logInUser } from "@overdrip/core/user";
import { saveWateringConfig } from "@overdrip/core/watering";
import {
  confirmAction,
  printBanner,
  printError,
  printSuccess,
  printWarning,
  promptDeviceName,
  promptEmail,
  promptPassword,
  promptPlantConfig,
  promptWateringApproach,
} from "../ui";

const DEFAULT_LOG_LEVEL = "info" as const;

const DEFAULT_WATERING_CONFIG = {
  plants: [
    {
      id: "plant-0",
      name: "Plant 1",
      thresholdPercent: 30,
      wateringDurationMs: 5_000,
      minIntervalMs: 300_000, // 5 minutes
    },
    {
      id: "plant-1",
      name: "Plant 2",
      thresholdPercent: 30,
      wateringDurationMs: 5_000,
      minIntervalMs: 300_000, // 5 minutes
    },
  ],
};

export const handleInit = async (configPath: string) => {
  printBanner();

  const configManager = new LocalConfigManager(configPath);

  try {
    // Check if config already exists
    printWarning("Checking for existing configuration...");
    const configExists = await configManager.configExists();

    if (configExists) {
      const shouldOverwrite = await confirmAction(
        "Configuration file already exists. Overwrite?",
      );
      if (!shouldOverwrite) {
        printWarning(
          "Initialization cancelled. Existing configuration preserved.",
        );
        return;
      }
    }

    // Authenticate user
    printWarning("User authentication required...");
    const email = await promptEmail();
    const password = await promptPassword();

    let userId = await logInUser(email, password);
    printSuccess("User authentication successful!");

    // Register device
    printWarning("Registering device...");
    const previousConfig = await getPreviousConfig(configPath);
    const deviceName = await promptDeviceName(previousConfig?.device?.name);

    let device = await registerDevice(deviceName);
    await configManager.saveConfig({
      device: { ...device, userId, name: deviceName },
      logLevel: DEFAULT_LOG_LEVEL,
    });
    printSuccess("Device registered successfully!");
    printSuccess(`Configuration saved to: ${configManager.path()}`);

    // Configure watering settings
    printWarning("\nConfiguring watering settings...");
    const wateringApproach = await promptWateringApproach();

    let wateringConfig = DEFAULT_WATERING_CONFIG;

    if (wateringApproach === "custom") {
      const customPlants = [];
      for (let i = 0; i < 2; i++) {
        const plantConfig = await promptPlantConfig(i);
        customPlants.push({
          id: `plant-${i}`,
          name: `Plant ${i + 1}`,
          thresholdPercent: plantConfig.thresholdPercent,
          wateringDurationMs: plantConfig.wateringDurationSeconds * 1000,
          minIntervalMs: plantConfig.minIntervalMinutes * 60 * 1000,
        });
      }
      wateringConfig = { plants: customPlants };
    }

    await saveWateringConfig(userId, device.id, wateringConfig);
    printSuccess("Watering configuration saved!");
  } catch (err) {
    printError(
      `Initialization failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    terminateDb();
  }
};

const getPreviousConfig = async (path: string): Promise<Config | null> => {
  const configManager = new LocalConfigManager(path);
  const configExists = await configManager.configExists();
  if (!configExists) {
    return null;
  }

  try {
    return await configManager.loadConfig();
  } catch (err) {
    throw new Error(
      `Failed to load existing config: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
};
