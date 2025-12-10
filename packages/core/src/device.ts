import {
  RegisterDeviceResponseSchema,
  type RegisterDeviceRequest,
  type RegisterDeviceResponse,
} from "@overdrip/functions";
import { httpsCallable } from "firebase/functions";
import z from "zod";
import { functions } from "./firebase";

const registerDeviceCallable = httpsCallable<
  RegisterDeviceRequest,
  RegisterDeviceResponse
>(functions, "registerDevice");

export const DeviceRegistrationSchema = RegisterDeviceResponseSchema.extend({
  name: z.string(),
});

export type DeviceRegistration = z.infer<typeof DeviceRegistrationSchema>;

export const registerDevice = async (
  name: string,
): Promise<DeviceRegistration> => {
  try {
    const result = await registerDeviceCallable({ name });
    return { ...result.data, name };
  } catch (error) {
    throw new Error(`Failed to register device: ${error}`);
  }
};
