import { HttpsError, onCall } from "firebase-functions/https";
import { info } from "firebase-functions/logger";
import z from "zod";

export const RegisterDeviceRequestSchema = z.object({
  name: z.string().min(1).max(100),
});

export const RegisterDeviceResponseSchema = z.object({
  id: z.uuid(),
  authToken: z.string().min(1),
});

export type RegisterDeviceRequest = z.infer<typeof RegisterDeviceRequestSchema>;
export type RegisterDeviceResponse = z.infer<typeof RegisterDeviceResponseSchema>;

export const registerDevice = onCall<RegisterDeviceRequest, Promise<RegisterDeviceResponse>>(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const { name } = RegisterDeviceRequestSchema.parse(req.data);
  info(`Registering device with name: ${name} for user: ${uid}`);

  return {
    id: crypto.randomUUID(),
    authToken: crypto.randomUUID(),
  };
});
