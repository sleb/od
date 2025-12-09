import z from "zod";

export const ConfigSchema = z.object({
  deviceId: z.string().min(1),
  name: z.string().min(1),
});

export type Config = z.infer<typeof ConfigSchema>;