import {
  RegisterDeviceResponseSchema,
  type RegisterDeviceRequest,
  type RegisterDeviceResponse,
} from "@overdrip/functions";
import { httpsCallable } from "firebase/functions";
import z from "zod";
import { CreateCustomTokenResponseSchema } from "../../functions/src/model";
import { CREATE_CUSTOM_TOKEN_URL, functions } from "./firebase";

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
