import z from "zod";

// User schemas
export const UserSchema = z.object({
  uid: z.string().min(1),
});

export type User = z.infer<typeof UserSchema>;

// Device schemas
export const DeviceId = z.string().min(1).max(100);
export const AuthToken = z.string().min(1);
export const DeviceName = z.string().min(1).max(100);

export const RegisterDeviceRequestSchema = z.object({
  name: DeviceName,
});

export type RegisterDeviceRequest = z.infer<typeof RegisterDeviceRequestSchema>;

export const RegisterDeviceResponseSchema = z.object({
  id: DeviceId,
  authToken: AuthToken,
});

export type RegisterDeviceResponse = z.infer<
  typeof RegisterDeviceResponseSchema
>;

export const DeviceConfigSchema = RegisterDeviceResponseSchema.extend({
  name: DeviceName,
});

export type DeviceConfig = z.infer<typeof DeviceConfigSchema>;

// Full registration record stored in Firestore
export const DeviceRegistrationSchema = RegisterDeviceResponseSchema.extend({
  name: DeviceName,
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
