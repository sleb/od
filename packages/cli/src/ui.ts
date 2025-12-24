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
    validate: (value: string) => {
      if (!value.includes("@")) return "Invalid email";
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
