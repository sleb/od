import {
  DeviceRegistrationSchema,
  RegisterDeviceRequestSchema,
  type DeviceRegistration,
  type RegisterDeviceRequest,
  type RegisterDeviceResponse,
} from "@overdrip/core/schemas";
import { HttpsError, onCall } from "firebase-functions/https";
import { error, info } from "firebase-functions/logger";
import { app } from "./firebase";

export const registerDevice = onCall<
  RegisterDeviceRequest,
  Promise<RegisterDeviceResponse>
>({ cors: true }, async (req) => {
  info({ message: "received auth", auth: req.auth });
  const uid = req.auth?.uid;
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }

  const { name } = RegisterDeviceRequestSchema.parse(req.data);
  info(`Registering device with name: ${name} for user: ${uid}`);

  try {
    const deviceRef = app.firestore().collection(`users/${uid}/devices`).doc();

    const device: DeviceRegistration = DeviceRegistrationSchema.parse({
      id: deviceRef.id,
      name,
      authToken: crypto.randomUUID(),
      registeredAt: new Date().toISOString(),
    });

    await deviceRef.set(device);
    info(`Device registered with ID: ${device.id} for user: ${uid}`);

    return device;
  } catch (err) {
    error({ message: "Failed to register device", err });
    throw new HttpsError("internal", "Failed to register device.");
  }
});
