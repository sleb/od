import type { Config } from "@overdrip/core";
import pino from "pino";

export interface Overdrip {
  start(): Promise<void>;
}

class App implements Overdrip {
  logger: pino.Logger;

  constructor(private config: Config) {
    // Simple logging for production - no transports needed
    // systemd/journalctl will handle formatting
    this.logger = pino({
      level: config.logging[0]?.level || "info",
    });
  }

  async start() {
    this.logger.info("Starting Overdrip application...");
  }
}

export const app = (config: Config): Overdrip => {
  return new App(config);
};
