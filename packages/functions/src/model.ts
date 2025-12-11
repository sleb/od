import z from "zod";

const DeviceId = z.string().min(1).max(100);
const AuthToken = z.string().min(1);
const DeviceName = z.string().min(1).max(100);

export const RegisterDeviceRequestSchema = z.object({
  name: DeviceName,
});

export const RegisterDeviceResponseSchema = z.object({
  id: DeviceId,
  authToken: AuthToken,
});

export type RegisterDeviceRequest = z.infer<typeof RegisterDeviceRequestSchema>;
export type RegisterDeviceResponse = z.infer<
  typeof RegisterDeviceResponseSchema
>;

export const DeviceRegistrationSchema = z.object({
  name: DeviceName,
  authToken: AuthToken,
  registeredAt: z.iso.datetime(),
});

export type DeviceRegistration = z.infer<typeof DeviceRegistrationSchema>;

export const CreateCustomTokenRequestSchema = z.object({
  id: DeviceId,
  authToken: AuthToken,
});

export type CreateCustomTokenRequest = z.infer<
  typeof CreateCustomTokenRequestSchema
>;

export const CreateCustomTokenResponseSchema = z.object({
  customToken: z.string().min(1),
});

export type CreateCustomTokenResponse = z.infer<
  typeof CreateCustomTokenResponseSchema
>;
