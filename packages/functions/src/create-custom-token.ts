import { addYears, isAfter, parseISO } from "date-fns";
import { onRequest } from "firebase-functions/https";
import { error } from "firebase-functions/logger";
import { app } from "./firebase";
import {
  CreateCustomTokenRequestSchema,
  DeviceRegistrationSchema,
  type CreateCustomTokenResponse,
} from "./model";

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

  console.log(devices);
  const deviceRef = devices.docs[0];
  if (!deviceRef?.exists) {
    error({ message: "Device not found", id });
    res.status(404).send("Device not found");
    return;
  }

  const { authToken: deviceAuthToken, registeredAt } =
    DeviceRegistrationSchema.parse(deviceRef.data());
  const tokensMatch = deviceAuthToken === authToken;

  const expiration = addYears(parseISO(registeredAt), 1);
  const now = new Date();
  const tokenExpired = isAfter(now, expiration);

  if (!tokensMatch || tokenExpired) {
    error({ message: "Invalid auth token", tokensMatch, tokenExpired });
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
