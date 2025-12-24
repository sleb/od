import { type Logger } from "pino";

export interface MoistureReading {
  percent: number;
  raw: number;
}

export interface MoistureSensor {
  read(): Promise<MoistureReading>;
}

export interface Pump {
  activate(durationMs: number): Promise<void>;
  deactivate(): Promise<void>;
  isActive(): boolean;
}

export interface HardwareFactory {
  createSensor(channel: number): MoistureSensor;
  createPump(options: { gpioPin: number; sensorChannel?: number }): Pump;
  cleanup(): Promise<void>;
}

export interface HardwareLogger {
  debug: Logger["debug"];
  info: Logger["info"];
  warn: Logger["warn"];
}
