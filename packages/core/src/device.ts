import {
  RegisterDeviceResponseSchema,
  type RegisterDeviceRequest,
  type RegisterDeviceResponse,
} from "@overdrip/functions";
import { httpsCallable } from "firebase/functions";
import z from "zod";
import { CreateCustomTokenResponseSchema } from "../../functions/src/model";
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

export const createCustomToken = async (
  deviceId: string,
  authToken: string,
): Promise<string> => {
  const response = await fetch(
    "http://127.0.0.1:5001/overdrip-daaac/us-central1/createCustomToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: deviceId, authToken }),
    },
  );

  const { customToken } = CreateCustomTokenResponseSchema.parse(
    await response.json(),
  );
  return customToken;
};
