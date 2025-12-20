import type { Config } from "@overdrip/core";
import pino from "pino";

export interface Overdrip {
  start(): Promise<void>;
}

class App implements Overdrip {
  logger: pino.Logger;

  constructor(private config: Config) {
    this.logger = pino({
      transport: {
        targets: config.logging.map((log) => {
          switch (log.dest) {
            case "console":
              return {
                target: "pino-pretty",
                level: log.level,
                options: { colorize: true },
              };
            case "file":
              return {
                target: "pino/file",
                level: log.level,
                options: { destination: log.path },
              };
          }
        }),
      },
    });
  }

  async start() {
    // TODO: design and implement application Overdrip device runtime
    // - authenticate with custom token
    // - read configuration from Firestore
    // - start main application loop
    //   - check moisture sensor readings
    //   - trigger watering actions via attached pumps/relays
    //   - log actions and sensor readings to the Google Cloud monitoring API
    //   - sleep until next interval
    this.logger.info("Starting Overdrip application...");
  }
}

export const app = (config: Config): Overdrip => {
  return new App(config);
};
