import { bold, cyan, green, red, yellow } from "colorette";
import prompts from "prompts";

/**
 * Print banner
 */
export const printBanner = () => {
  const banner = `
${cyan(bold("█▀█ █ █ █▀▀ █▀█ █▀▄ █▀█ █ █▀█"))}
${cyan(bold("█▄█ ▀▄▀ ██▄ █▀▄ █▄▀ █▀▄ █ █▀▀"))}
  `;
  console.log(banner);
};

/**
 * Print success message
 */
export const printSuccess = (message: string) => {
  console.log(green(`✓ ${message}`));
};

/**
 * Print error message
 */
export const printError = (message: string) => {
  console.error(red(`✗ ${message}`));
};

/**
 * Print warning message
 */
export const printWarning = (message: string) => {
  console.log(yellow(`⚠ ${message}`));
};

/**
 * Print info message
 */
export const printInfo = (message: string) => {
  console.log(cyan(`ℹ ${message}`));
};

/**
 * Print a section header
 */
export const printHeader = (title: string) => {
  console.log(bold(title));
};

/**
 * Print JSON config (formatted)
 */
export const printJSON = (data: unknown) => {
  console.log(JSON.stringify(data, null, 2));
};

/**
 * Prompt for email
 */
export const promptEmail = async (
  message = "Enter your email:",
): Promise<string> => {
  const response = await prompts({
    type: "text",
    name: "email",
    message,
    validate: (value: unknown) => {
      const email = typeof value === "string" ? value : "";
      if (!email.includes("@")) return "Invalid email";
      return true;
    },
  });
  return response.email as string;
};

/**
 * Prompt for password
 */
export const promptPassword = async (
  message = "Enter your password:",
): Promise<string> => {
  const response = await prompts({
    type: "password",
    name: "password",
    message,
  });
  return response.password as string;
};

/**
 * Prompt for device name
 */
export const promptDeviceName = async (
  defaultValue?: string,
): Promise<string> => {
  const finalDefault = defaultValue || "My Overdrip Device";
  const response = await prompts({
    type: "text",
    name: "name",
    message: `Enter device name (default: ${finalDefault}):`,
  });
  return (response.name as string) || finalDefault;
};

/**
 * Confirm action (yes/no)
 */
export const confirmAction = async (message: string): Promise<boolean> => {
  const response = await prompts({
    type: "confirm",
    name: "value",
    message,
    initial: false,
  });
  return response.value as boolean;
};

/**
 * Display current user
 */
export const displayUserInfo = (uid: string | null) => {
  if (uid) {
    console.log(cyan(`Logged in as: ${uid}`));
  }
};

/**
 * Prompt for watering config approach (default vs custom)
 */
export const promptWateringApproach = async (): Promise<
  "default" | "custom"
> => {
  const response = await prompts({
    type: "select",
    name: "approach",
    message:
      "Configure watering settings (default: 30% threshold, 5s duration, 5min cooldown)?",
    choices: [
      { title: "Use defaults", value: "default" },
      { title: "Customize", value: "custom" },
    ],
  });
  return response.approach as "default" | "custom";
};

/**
 * Prompt for plant watering configuration
 */
export const promptPlantConfig = async (
  plantIndex: number,
): Promise<{
  thresholdPercent: number;
  wateringDurationSeconds: number;
  minIntervalMinutes: number;
}> => {
  printHeader(`\nPlant ${plantIndex + 1} Configuration`);

  const parseNumber = (
    value: unknown,
    fallback: number,
    min: number,
    max: number,
  ): number => {
    const num = typeof value === "number" ? value : Number(value ?? fallback);
    if (!Number.isFinite(num)) return fallback;
    if (num < min) return min;
    if (num > max) return max;
    return num;
  };

  const thresholdResp = await prompts({
    type: "text",
    name: "value",
    message: "Moisture threshold % (0-100, enter for default 30):",
    initial: "30",
    validate: (v: unknown) => {
      const num = Number(v);
      if (Number.isNaN(num)) return "Enter a number";
      if (num < 0 || num > 100) return "Must be 0-100";
      return true;
    },
  });

  const durationResp = await prompts({
    type: "text",
    name: "value",
    message: "Watering duration in seconds (1-30, enter for default 5):",
    initial: "5",
    validate: (v: unknown) => {
      const num = Number(v);
      if (Number.isNaN(num)) return "Enter a number";
      if (num < 1 || num > 30) return "Must be 1-30 seconds";
      return true;
    },
  });

  const intervalResp = await prompts({
    type: "text",
    name: "value",
    message:
      "Minimum interval between waterings in minutes (1-1440, enter for default 5):",
    initial: "5",
    validate: (v: unknown) => {
      const num = Number(v);
      if (Number.isNaN(num)) return "Enter a number";
      if (num < 1 || num > 1440) return "Must be 1-1440 minutes";
      return true;
    },
  });

  return {
    thresholdPercent: parseNumber(thresholdResp.value, 30, 0, 100),
    wateringDurationSeconds: parseNumber(durationResp.value, 5, 1, 30),
    minIntervalMinutes: parseNumber(intervalResp.value, 5, 1, 1440),
  };
};
