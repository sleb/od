import type { ConfigManager } from "@overdrip/core";
import { createContext } from "react";

const notInitialized = () => {
  throw new Error("ConfigManager method not initialized ");
};

export const ConfigContext = createContext<ConfigManager>({
  path: notInitialized,
  configExists: notInitialized,
  loadConfig: notInitialized,
  saveConfig: notInitialized,
});
