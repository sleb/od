import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { info, warn } from "./logger";
import { WateringConfigSchema, type WateringConfig } from "./schemas";

/**
 * Fetch watering configuration from Firestore for a device.
 * Device must be authenticated first. Returns null if config doesn't exist or is invalid.
 */
export const fetchWateringConfig = async (
  userId: string,
  deviceId: string,
): Promise<WateringConfig | null> => {
  try {
    const db = getFirestore();
    const configDocRef = doc(
      db,
      `users/${userId}/devices/${deviceId}/config/watering`,
    );
    const configDoc = await getDoc(configDocRef);

    if (!configDoc.exists()) {
      return null;
    }

    const data = configDoc.data();
    const parsed = WateringConfigSchema.safeParse(data);

    if (!parsed.success) {
      warn(
        {
          userId,
          deviceId,
          error: parsed.error,
        },
        "Invalid watering config in Firestore",
      );
      return null;
    }

    return parsed.data;
  } catch (error) {
    warn(
      {
        userId,
        deviceId,
        error,
      },
      "Failed to fetch watering config from Firestore",
    );
    return null;
  }
};

/**
 * Save watering configuration to Firestore for a device.
 * User must be authenticated and own the device.
 */
export const saveWateringConfig = async (
  userId: string,
  deviceId: string,
  config: WateringConfig,
): Promise<void> => {
  try {
    // Validate config
    const parsed = WateringConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new Error(`Invalid watering config: ${parsed.error.message}`);
    }

    const db = getFirestore();
    const configDocRef = doc(
      db,
      `users/${userId}/devices/${deviceId}/config/watering`,
    );

    await setDoc(configDocRef, parsed.data);
    info(
      {
        userId,
        deviceId,
        plants: parsed.data.plants.length,
      },
      "Watering config saved successfully",
    );
  } catch (error) {
    warn(
      {
        userId,
        deviceId,
        error,
      },
      "Failed to save watering config to Firestore",
    );
    throw error;
  }
};
