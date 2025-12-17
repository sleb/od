import { HttpsError, onCall } from "firebase-functions/https";
import { error, info } from "firebase-functions/logger";
import z from "zod";
import { app } from "./firebase";
import type { DeviceRegistration } from "./model";

export const RegisterDeviceRequestSchema = z.object({
  name: z.string().min(1).max(100),
});

export const RegisterDeviceResponseSchema = z.object({
  id: z.string().min(1).max(100),
  authToken: z.string().min(1),
});

export type RegisterDeviceRequest = z.infer<typeof RegisterDeviceRequestSchema>;
export type RegisterDeviceResponse = z.infer<
  typeof RegisterDeviceResponseSchema
>;

export const registerDevice = onCall<
  RegisterDeviceRequest,
  Promise<RegisterDeviceResponse>
>(async (req) => {
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
    const deviceRef = app
      .firestore()
      .collection(`users/${uid}/devices`)
      .doc();

    const device: DeviceRegistration = {
      id: deviceRef.id,
      name,
      authToken: crypto.randomUUID(),
      registeredAt: new Date().toISOString(),
    };

    await deviceRef.set(device);
    info(`Device registered with ID: ${device.id} for user: ${uid}`);

    return device;
  } catch (err) {
    error({ message: "Failed to register device", err });
    throw new HttpsError("internal", "Failed to register device.");
  }
});
