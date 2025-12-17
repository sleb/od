import type { Config } from "@overdrip/core";

export interface Overdrip {
  start(): Promise<void>;
}

export const app = (config: Config): Overdrip => {
  return {
    async start() {
      console.log("Starting Overdrip app with config:", config);
    },
  };
};
