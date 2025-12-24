import { type Config } from "@overdrip/core";
import { debug, info, setLogLevel, warn } from "@overdrip/core/logger";

const DEFAULT_SLEEP_SECONDS = 5;

export interface Overdrip {
  start(): Promise<void>;
}

class App implements Overdrip {
  private running = false;

  constructor(private config: Config) {
    setLogLevel(this.config.logLevel);
  }

  async start() {
    info("Starting Overdrip application...");

    console.log("hello");

    if (this.running) {
      warn("Start called while already running; ignoring.");
      return;
    }
    this.running = true;

    await this.mainLoop();
  }

  stop = async () => {
    this.running = false;
  };

  private mainLoop = async () => {
    while (this.running) {
      debug("Overdrip main loop tick...");
      //await ensureAuthenticated(this.config.device);

      info("Checking for new WateringConfig...");
      await sleep(500);

      info("Checking moisture sensors...");
      await sleep(500);

      info("Watering plants...");
      await sleep(500);

      info("Writing logs to cloud...");
      await sleep(500);

      // TODO: make sleep configurable
      info(`Sleeping for ${DEFAULT_SLEEP_SECONDS} seconds...`);
      await sleep(DEFAULT_SLEEP_SECONDS * 1000);
    }

    info("Overdrip application stopped.");
  };
}

export const app = (config: Config): Overdrip => {
  return new App(config);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
