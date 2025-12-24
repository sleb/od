import { LocalConfigManager } from "@overdrip/core";
import { printError, printHeader, printJSON, printWarning } from "../ui";

export const handleConfigShow = async (configPath: string) => {
  const configManager = new LocalConfigManager(configPath);

  try {
    if (!(await configManager.configExists())) {
      printWarning(
        "No configuration file found. Please run the `init` command to create one.",
      );
      return;
    }

    const config = await configManager.loadConfig();
    printHeader(`Configuration (${configManager.path()}):`);
    printJSON(config);
  } catch (err) {
    printError(
      `Error loading configuration: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
};
