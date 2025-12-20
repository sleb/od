import z from "zod";

/**
 * Schema for device-specific configuration stored in Firestore.
 * This configuration controls the watering behavior of the device.
 */
export const DeviceConfigSchema = z.object({
  /**
   * Moisture threshold percentage (0-100).
   * When sensor reads below this value, watering is triggered.
   */
  moistureThreshold: z.number().min(0).max(100).default(30),

  /**
   * Duration to run the water pump in milliseconds.
   */
  wateringDurationMs: z.number().min(0).default(5000),

  /**
   * Interval between moisture checks in milliseconds.
   */
  checkIntervalMs: z.number().min(1000).default(60000),

  /**
   * GPIO pin number for moisture sensor (BCM numbering).
   */
  moistureSensorPin: z.number().int().min(0).optional(),

  /**
   * GPIO pin number for water pump relay (BCM numbering).
   */
  pumpRelayPin: z.number().int().min(0).optional(),

  /**
   * Enable/disable automatic watering.
   */
  autoWateringEnabled: z.boolean().default(true),
});

export type DeviceConfig = z.infer<typeof DeviceConfigSchema>;
