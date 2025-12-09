import { createContext } from "react";
import type { ConfigManager } from "./config-manager";

const notInitialized = () => {
  throw new Error("ConfigManager method not initialized ");
};

export const ConfigContext = createContext<ConfigManager>({
  configExists: notInitialized,
  loadConfig: notInitialized,
  saveConfig: notInitialized,
});
