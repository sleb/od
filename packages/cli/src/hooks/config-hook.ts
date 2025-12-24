import type { ConfigManager } from "@overdrip/core";
import { useContext } from "react";
import { ConfigContext } from "../context/config-context";

export const useConfig = (): ConfigManager => {
  const configManager = useContext(ConfigContext);
  if (!configManager) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return configManager;
};
