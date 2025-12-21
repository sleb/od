import z from "zod";
import { auth, db } from "./firebase";
import type { Firestore } from "firebase/firestore";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

/**
 * Schema for watering configuration stored in Firestore.
 * This configuration controls the watering behavior of the device.
 */
export const WateringConfigSchema = z.object({
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
   * Enable/disable automatic watering.
   */
  autoWateringEnabled: z.boolean().default(true),
});

export type WateringConfig = z.infer<typeof WateringConfigSchema>;

/**
 * Manager for watering configuration stored in Firestore.
 */
export interface WateringConfigManager {
  /**
   * Load watering configuration from Firestore.
   * Creates default configuration if it doesn't exist.
   */
  loadConfig(): Promise<WateringConfig>;

  /**
   * Save watering configuration to Firestore.
   */
  saveConfig(config: WateringConfig): Promise<void>;

  /**
   * Log a sensor reading to Firestore.
   */
  logSensorReading(moistureLevel: number): Promise<void>;

  /**
   * Log a watering action to Firestore.
   */
  logWateringAction(durationMs: number): Promise<void>;
}

/**
 * Firestore-based implementation of WateringConfigManager.
 * Requires Firebase to be initialized and user to be authenticated.
 */
export class FirestoreWateringConfigManager implements WateringConfigManager {
  constructor(
    private deviceId: string,
    private getUserId: () => string | undefined,
    private db: Firestore,
  ) {}

  private ensureAuthenticated(): string {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return userId;
  }

  async loadConfig(): Promise<WateringConfig> {
    const userId = this.ensureAuthenticated();
    const deviceDocRef = doc(this.db, "users", userId, "devices", this.deviceId);
    const deviceDoc = await getDoc(deviceDocRef);

    if (!deviceDoc.exists()) {
      // Create default configuration
      const defaultConfig = WateringConfigSchema.parse({});
      await setDoc(deviceDocRef, defaultConfig, { merge: true });
      return defaultConfig;
    }

    return WateringConfigSchema.parse(deviceDoc.data());
  }

  async saveConfig(config: WateringConfig): Promise<void> {
    const userId = this.ensureAuthenticated();
    const deviceDocRef = doc(this.db, "users", userId, "devices", this.deviceId);
    await setDoc(deviceDocRef, config, { merge: true });
  }

  async logSensorReading(moistureLevel: number): Promise<void> {
    try {
      const userId = this.ensureAuthenticated();
      const readingsCollectionRef = collection(
        this.db,
        "users",
        userId,
        "devices",
        this.deviceId,
        "readings",
      );

      await addDoc(readingsCollectionRef, {
        type: "moisture",
        value: moistureLevel,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      // Silently fail - logging is not critical
      console.warn("Failed to log sensor reading to Firestore:", error);
    }
  }

  async logWateringAction(durationMs: number): Promise<void> {
    try {
      const userId = this.ensureAuthenticated();
      const actionsCollectionRef = collection(
        this.db,
        "users",
        userId,
        "devices",
        this.deviceId,
        "actions",
      );

      await addDoc(actionsCollectionRef, {
        type: "watering",
        durationMs,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      // Silently fail - logging is not critical
      console.warn("Failed to log watering action to Firestore:", error);
    }
  }
}

/**
 * Create a WateringConfigManager for a device.
 * This factory function handles injecting Firebase dependencies.
 */
export const createWateringConfigManager = (
  deviceId: string,
  getUserId: () => string | undefined,
): WateringConfigManager => {
  return new FirestoreWateringConfigManager(deviceId, getUserId, db);
};
