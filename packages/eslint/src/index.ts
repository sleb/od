import js from "@eslint/js";
import tslint from "typescript-eslint";

const config = [
  js.configs.recommended,
  tslint.configs.recommended
];

export default config;
