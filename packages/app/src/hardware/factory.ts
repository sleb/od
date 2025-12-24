import { type Config } from "@overdrip/core";
import { info, warn } from "@overdrip/core/logger";
import { type HardwareFactory } from "./interfaces";
import { MockHardwareFactory } from "./mock";

export const createHardwareFactory = (config: Config): HardwareFactory => {
  const mode = config.hardwareMode ?? "detect";

  if (mode === "mock" || !isRaspberryPi()) {
    info({ mode: "mock" }, "Using mock hardware");
    return new MockHardwareFactory();
  }

  // mode === "detect"
  warn({ mode: "real" }, "Real hardware mode not implemented");
  // TODO: return new RealHardwareFactory();
  throw new Error("Real hardware factory not implemented");
};

const isRaspberryPi = (): boolean => {
  // Detection strategies:
  // 1. Check for /proc/device-tree/model (Raspberry Pi specific)
  // 2. Check platform architecture (linux + arm/arm64)

  if (process.platform !== "linux") {
    return false;
  }

  const arch = process.arch;
  if (arch !== "arm" && arch !== "arm64") {
    return false;
  }

  const modelPath = "/proc/device-tree/model";
  try {
    const fs = require("fs");

    if (fs.existsSync(modelPath)) {
      const model = fs.readFileSync(modelPath, "utf-8");
      return model.toLowerCase().includes("raspberry pi");
    }
  } catch (err) {
    warn({ err }, `Error detecting platform (couldn't read ${modelPath})`);
  }

  // If on Linux ARM, assume it's a Pi
  return true;
};
