import { LocalConfigManager, logInUser, registerDevice } from "@overdrip/core";
import {
  confirmAction,
  printBanner,
  printError,
  printSuccess,
  printWarning,
  promptDeviceName,
  promptEmail,
  promptPassword,
} from "../ui";

const DEFAULT_LOG_LEVEL = "info" as const;

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

    try {
      await logInUser(email, password);
      printSuccess("User authentication successful!");
    } catch (err) {
      printError(
        `Authentication failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }

    // Register device
    printWarning("Registering device...");
    let existingDeviceName: string | undefined;
    if (configExists) {
      try {
        const oldConfig = await configManager.loadConfig();
        existingDeviceName = oldConfig.device?.name;
      } catch {
        // Ignore error, will use default
      }
    }

    const deviceName = await promptDeviceName(existingDeviceName);

    try {
      const device = await registerDevice(deviceName);
      await configManager.saveConfig({ device, logLevel: DEFAULT_LOG_LEVEL });
      printSuccess("Device registered successfully!");
      printSuccess(`Configuration saved to: ${configManager.path()}`);
    } catch (err) {
      printError(
        `Device registration failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  } catch (err) {
    printError(
      `Initialization failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
};
