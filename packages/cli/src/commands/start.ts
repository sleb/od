import { app as appFactory, type Overdrip } from "@overdrip/app";
import { LocalConfigManager, logInDevice } from "@overdrip/core";
import { printBanner, printError, printInfo, printSuccess } from "../ui";

export const handleStart = async (configPath: string) => {
  printBanner();

  const configManager = new LocalConfigManager(configPath);

  try {
    printInfo("Loading configuration...");
    if (!(await configManager.configExists())) {
      printError("No configuration found. Please run `init` first.");
      process.exit(1);
    }

    const config = await configManager.loadConfig();

    printInfo("Authenticating device...");
    const { device } = config;
    try {
      await logInDevice(device.id, device.authToken);
      printSuccess("Device authenticated!");
    } catch (err) {
      printError(
        `Device authentication failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }

    printInfo("Starting Overdrip...");
    const overdrip: Overdrip = appFactory(config);
    await overdrip.start();

    printSuccess("Overdrip started successfully!");
  } catch (err) {
    printError(
      `Failed to start Overdrip: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
};
