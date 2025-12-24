import { debug, info, warn } from "@overdrip/core/logger";
import {
  type HardwareFactory,
  type MoistureReading,
  type MoistureSensor,
  type Pump,
} from "./interfaces";

interface PlantState {
  moisturePercent: number;
}

export class MockMoistureSensor implements MoistureSensor {
  constructor(
    private state: PlantState,
    private channel: number,
  ) {}

  async read(): Promise<MoistureReading> {
    const drift = (Math.random() - 0.55) * 1.5;
    this.state.moisturePercent = clamp(
      this.state.moisturePercent + drift,
      0,
      100,
    );

    const percent = Number(this.state.moisturePercent.toFixed(2));
    const raw = Math.round((percent / 100) * 32767);

    debug({ channel: this.channel, percent }, "Mock sensor reading");
    return { percent, raw };
  }
}

export class MockPump implements Pump {
  private active = false;

  constructor(
    private state: PlantState,
    private name: string,
  ) {}

  async activate(durationMs: number): Promise<void> {
    if (this.active) {
      warn({ pump: this.name }, "Pump already active; ignoring activate");
      return;
    }

    this.active = true;
    info({ pump: this.name, durationMs }, "Pump activating");

    await sleep(durationMs);

    const gain = clamp(durationMs / 600 + Math.random() * 2, 0, 30);
    this.state.moisturePercent = clamp(
      this.state.moisturePercent + gain,
      0,
      100,
    );

    this.active = false;
    info(
      { pump: this.name, moisturePercent: this.state.moisturePercent },
      "Pump finished",
    );
  }

  async deactivate(): Promise<void> {
    if (!this.active) {
      return;
    }

    this.active = false;
    warn({ pump: this.name }, "Pump deactivated early");
  }

  isActive(): boolean {
    return this.active;
  }
}

export class MockHardwareFactory implements HardwareFactory {
  private plantStates = new Map<string, PlantState>();

  createSensor(channel: number): MoistureSensor {
    const state = this.getState(`sensor-${channel}`);
    return new MockMoistureSensor(state, channel);
  }

  createPump({
    gpioPin,
    sensorChannel,
  }: {
    gpioPin: number;
    sensorChannel?: number;
  }): Pump {
    const key =
      sensorChannel !== undefined
        ? `sensor-${sensorChannel}`
        : `pump-${gpioPin}`;
    const state = this.getState(key);
    return new MockPump(state, `GPIO ${gpioPin}`);
  }

  async cleanup(): Promise<void> {
    info("Mock hardware cleanup complete");
  }

  private getState(key: string): PlantState {
    const existing = this.plantStates.get(key);
    if (existing) return existing;

    const state: PlantState = { moisturePercent: 45 + Math.random() * 10 };
    this.plantStates.set(key, state);
    return state;
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
