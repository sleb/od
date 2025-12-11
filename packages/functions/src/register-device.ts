import { HttpsError, onCall } from "firebase-functions/https";
import { error, info } from "firebase-functions/logger";
import z from "zod";
import { app } from "./firebase";

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
type DeviceRegistration = { name: string; authToken: string };

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

  const device: DeviceRegistration = {
    name,
    authToken: crypto.randomUUID(),
  };

  try {
    const { id } = await app
      .firestore()
      .collection(`users/${uid}/devices`)
      .add(device);

    return { id, ...device };
  } catch (err) {
    error({ message: "Failed to register device", err });
    throw new HttpsError("internal", "Failed to register device.");
  }
});
