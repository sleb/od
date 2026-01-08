import { FirebaseError } from "firebase/app";
import { signInWithCustomToken } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, CREATE_CUSTOM_TOKEN_URL, db, functions } from "./firebase";
import { info, warn } from "./logger";
import {
  CreateCustomTokenResponseSchema,
  RegisterDeviceRequestSchema,
  RegisterDeviceResponseSchema,
  type DeviceConfig,
  type DeviceRegistration,
  type RegisterDeviceRequest,
  type RegisterDeviceResponse,
} from "./schemas";

export {
  DeviceConfigSchema,
  DeviceRegistrationSchema,
  type DeviceRegistration,
} from "./schemas";

export const logInDevice = async (
  deviceId: string,
  authCode: string,
): Promise<void> => {
  try {
    const token = await createCustomToken(deviceId, authCode);
    await signInWithCustomToken(auth, token);
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(
        `Error logging in device: ${err.message}, code: ${err.code}`,
      );
    }

    throw new Error(`Error logging in device: ${err}`);
  }
};

export const registerDevice = async (name: string): Promise<DeviceConfig> => {
  const registerDeviceCallable = httpsCallable<
    RegisterDeviceRequest,
    RegisterDeviceResponse
  >(functions, "registerDevice");

  try {
    const request = RegisterDeviceRequestSchema.parse({ name });
    const result = await registerDeviceCallable(request);
    return { ...RegisterDeviceResponseSchema.parse(result.data), name };
  } catch (error) {
    throw new Error(`Failed to register device: ${error}`);
  }
};

export const createCustomToken = async (
  deviceId: string,
  authToken: string,
): Promise<string> => {
  const response = await fetch(CREATE_CUSTOM_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: deviceId, authToken }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create custom token: ${response.status} ${response.statusText}`,
    );
  }

  const result = CreateCustomTokenResponseSchema.safeParse(
    await response.json(),
  );

  if (!result.success) {
    throw new Error(
      `Failed to create custom token: ${JSON.stringify(result.error.issues)}`,
    );
  }

  return result.data.customToken;
};

export const ensureAuthenticated = async ({ authToken, id }: DeviceConfig) => {
  if (auth.currentUser) {
    info({ message: "User", uid: auth.currentUser.uid });
    return;
  }

  warn("No authenticated user found logging in...");
  await logInDevice(id, authToken);
};

/**
 * Subscribe to all devices for the current authenticated user.
 * Returns an unsubscribe function.
 */
export const subscribeToDevices = (
  userId: string,
  onDevices: (devices: DeviceRegistration[]) => void,
  onError: (error: Error) => void,
): (() => void) => {
  const devicesRef = collection(db, `users/${userId}/devices`);
  const q = query(devicesRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const devicesList: DeviceRegistration[] = [];
      snapshot.forEach((doc) => {
        devicesList.push({ ...doc.data(), id: doc.id } as DeviceRegistration);
      });
      onDevices(devicesList);
    },
    (err) => {
      onError(err as Error);
    },
  );
};

/**
 * Subscribe to a single device for the current authenticated user.
 * Returns an unsubscribe function.
 */
export const subscribeToDevice = (
  userId: string,
  deviceId: string,
  onDevice: (device: DeviceRegistration | null) => void,
  onError: (error: Error) => void,
): (() => void) => {
  const devicesRef = collection(db, `users/${userId}/devices`);
  const q = query(devicesRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const foundDevice = snapshot.docs.find((doc) => doc.id === deviceId);
      if (foundDevice) {
        onDevice({ ...foundDevice.data(), id: foundDevice.id } as DeviceRegistration);
      } else {
        onDevice(null);
      }
    },
    (err) => {
      onError(err as Error);
    },
  );
};
