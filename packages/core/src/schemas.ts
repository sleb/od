import z from "zod";

// User schemas
export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().nullable().optional(),
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
  checkIntervalMs: z.number().int().positive().optional(),
});

export type DeviceConfig = z.infer<typeof DeviceConfigSchema>;

// Full registration record stored in Firestore
export const DeviceRegistrationSchema = RegisterDeviceResponseSchema.extend({
  name: DeviceName,
  registeredAt: z.iso.datetime(),
});

export type DeviceRegistration = z.infer<typeof DeviceRegistrationSchema>;

export const ConfigSchema = z.object({
  device: DeviceConfigSchema,
  logLevel: z.enum(["debug", "info", "warn", "error"]),
  hardwareMode: z.enum(["mock", "detect"]).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

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

// Metrics schemas
export const MetricTypeSchema = z.enum(["moisture"]);

export type MetricType = z.infer<typeof MetricTypeSchema>;

export const MetricDataPointSchema = z.object({
  type: MetricTypeSchema,
  value: z.number(),
  plantId: z.string().min(1),
  timestamp: z.number().int().positive(),
});

export type MetricDataPoint = z.infer<typeof MetricDataPointSchema>;

export const WriteMetricsRequestSchema = z.object({
  deviceId: DeviceId,
  metrics: z.array(MetricDataPointSchema).min(1),
});

export type WriteMetricsRequest = z.infer<typeof WriteMetricsRequestSchema>;

export const WriteMetricsResponseSchema = z.object({
  success: z.boolean(),
  metricsWritten: z.number().int().nonnegative(),
});

export type WriteMetricsResponse = z.infer<typeof WriteMetricsResponseSchema>;

// Read metrics schemas
export const ReadMetricsRequestSchema = z.object({
  deviceId: DeviceId,
  timeRange: z.enum(["1h", "6h", "24h", "7d"]).default("24h"),
});

export type ReadMetricsRequest = z.infer<typeof ReadMetricsRequestSchema>;

export const MetricDataPointResponseSchema = z.object({
  timestamp: z.number().int().positive(),
  plantId: z.string(),
  value: z.number(),
});

export type MetricDataPointResponse = z.infer<
  typeof MetricDataPointResponseSchema
>;

export const ReadMetricsResponseSchema = z.object({
  dataPoints: z.array(MetricDataPointResponseSchema),
});

export type ReadMetricsResponse = z.infer<typeof ReadMetricsResponseSchema>;
