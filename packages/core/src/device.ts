import { httpsCallable } from "firebase/functions";
import { CREATE_CUSTOM_TOKEN_URL, functions } from "./firebase";
import {
  CreateCustomTokenResponseSchema,
  RegisterDeviceRequestSchema,
  RegisterDeviceResponseSchema,
  type DeviceConfig,
  type RegisterDeviceRequest,
  type RegisterDeviceResponse,
} from "./schemas";

export { DeviceConfigSchema, DeviceRegistrationSchema } from "./schemas";

const registerDeviceCallable = httpsCallable<
  RegisterDeviceRequest,
  RegisterDeviceResponse
>(functions, "registerDevice");

export const registerDevice = async (name: string): Promise<DeviceConfig> => {
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
