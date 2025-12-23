import {
  CreateCustomTokenRequestSchema,
  DeviceRegistrationSchema,
  type CreateCustomTokenResponse,
} from "@overdrip/core/schemas";
import { addYears, isAfter, parseISO } from "date-fns";
import { onRequest } from "firebase-functions/https";
import { error } from "firebase-functions/logger";
import { app } from "./firebase";

/**
 * Validates whether an auth token is still valid for a device.
 * Token is valid if it matches the device token AND has not expired (1 year).
 */
export const isAuthTokenValid = (
  requestToken: string,
  deviceToken: string,
  registeredAtISO: string,
): boolean => {
  const tokensMatch = requestToken === deviceToken;
  const expiration = addYears(parseISO(registeredAtISO), 1);
  const tokenExpired = isAfter(new Date(), expiration);

  return tokensMatch && !tokenExpired;
};

export const createCustomToken = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const result = CreateCustomTokenRequestSchema.safeParse(req.body);
  if (!result.success) {
    error({ message: "Invalid request", error: result.error });
    res.status(400).send("Invalid request");
    return;
  }

  const { id, authToken } = result.data;
  const devices = await app
    .firestore()
    .collectionGroup("devices")
    .where("id", "==", id)
    .get();

  const deviceRef = devices.docs[0];
  if (!deviceRef?.exists) {
    error({ message: "Device not found", id });
    res.status(404).send("Device not found");
    return;
  }

  const { authToken: deviceAuthToken, registeredAt } =
    DeviceRegistrationSchema.parse(deviceRef.data());

  if (!isAuthTokenValid(authToken, deviceAuthToken, registeredAt)) {
    error({ message: "Invalid auth token" });
    res.status(401).send("Invalid auth token");
    return;
  }

  try {
    const customToken = await app.auth().createCustomToken(id);
    const response: CreateCustomTokenResponse = { customToken };
    res.send(response);
  } catch (e) {
    error({ message: "Failed to create custom token", error: e });
    res.status(500).send("Failed to create custom token");
  }
});
