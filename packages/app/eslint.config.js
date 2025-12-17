import sharedEslintConfig from "@overdrip/eslint";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
  ...sharedEslintConfig,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.node },
  },
]);
