/**
 * Hardware abstraction layer for sensors and actuators.
 * This allows for easy mocking and testing without actual GPIO hardware.
 */

/**
 * Interface for moisture sensor readings.
 */
export interface MoistureSensor {
  /**
   * Read current moisture level as a percentage (0-100).
   * 0 = completely dry, 100 = completely wet.
   */
  readMoisture(): Promise<number>;
}

/**
 * Interface for controlling water pump via relay.
 */
export interface WaterPump {
  /**
   * Turn the pump on.
   */
  turnOn(): Promise<void>;

  /**
   * Turn the pump off.
   */
  turnOff(): Promise<void>;

  /**
   * Check if pump is currently running.
   */
  isRunning(): boolean;
}

/**
 * Mock implementation of moisture sensor for testing/development.
 * Returns random values between 20-80%.
 */
export class MockMoistureSensor implements MoistureSensor {
  async readMoisture(): Promise<number> {
    // Simulate sensor reading with random value
    return Math.floor(Math.random() * 60) + 20;
  }
}

/**
 * Mock implementation of water pump for testing/development.
 * Logs actions instead of controlling actual GPIO.
 */
export class MockWaterPump implements WaterPump {
  private running = false;

  async turnOn(): Promise<void> {
    this.running = true;
  }

  async turnOff(): Promise<void> {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }
}

/**
 * Factory for creating hardware instances.
 * Returns mock implementations for now; can be extended to support real GPIO.
 */
export class HardwareFactory {
  static createMoistureSensor(pin?: number): MoistureSensor {
    // TODO: Implement GPIO-based sensor when pin is provided
    // For now, always return mock implementation
    return new MockMoistureSensor();
  }

  static createWaterPump(pin?: number): WaterPump {
    // TODO: Implement GPIO-based pump control when pin is provided
    // For now, always return mock implementation
    return new MockWaterPump();
  }
}
