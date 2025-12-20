import { describe, expect, it } from "bun:test";
import {
  HardwareFactory,
  MockMoistureSensor,
  MockWaterPump,
} from "./hardware";

describe("MockMoistureSensor", () => {
  it("should return a moisture level between 20 and 80", async () => {
    const sensor = new MockMoistureSensor();
    const reading = await sensor.readMoisture();
    expect(reading).toBeGreaterThanOrEqual(20);
    expect(reading).toBeLessThanOrEqual(80);
  });
});

describe("MockWaterPump", () => {
  it("should turn on and off correctly", async () => {
    const pump = new MockWaterPump();
    expect(pump.isRunning()).toBe(false);

    await pump.turnOn();
    expect(pump.isRunning()).toBe(true);

    await pump.turnOff();
    expect(pump.isRunning()).toBe(false);
  });
});

describe("HardwareFactory", () => {
  it("should create a moisture sensor", () => {
    const sensor = HardwareFactory.createMoistureSensor();
    expect(sensor).toBeInstanceOf(MockMoistureSensor);
  });

  it("should create a moisture sensor with pin", () => {
    const sensor = HardwareFactory.createMoistureSensor(17);
    expect(sensor).toBeInstanceOf(MockMoistureSensor);
  });

  it("should create a water pump", () => {
    const pump = HardwareFactory.createWaterPump();
    expect(pump).toBeInstanceOf(MockWaterPump);
  });

  it("should create a water pump with pin", () => {
    const pump = HardwareFactory.createWaterPump(27);
    expect(pump).toBeInstanceOf(MockWaterPump);
  });
});
