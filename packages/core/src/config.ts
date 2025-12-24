import { file, write } from "bun";
import z from "zod";
import { DeviceConfigSchema } from "./schemas";

export const ConfigSchema = z.object({
  device: DeviceConfigSchema,
  logLevel: z.enum(["debug", "info", "warn", "error"]),
});

export type Config = z.infer<typeof ConfigSchema>;
export interface ConfigManager {
  path(): string;
  loadConfig(): Promise<Config>;
  saveConfig(config: Config): Promise<void>;
  configExists(): Promise<boolean>;
}

export class LocalConfigManager implements ConfigManager {
  constructor(private configPath: string) {}

  path() {
    return this.configPath;
  }

  async loadConfig() {
    try {
      const data = await file(this.configPath).text();
      const parsed = JSON.parse(data);
      return ConfigSchema.parse(parsed);
    } catch (e) {
      throw new Error(`Failed to load or parse config: ${e}`, { cause: e });
    }
  }

  async saveConfig(config: Config) {
    const data = JSON.stringify(config, null, 2);
    await write(this.configPath, data);
  }

  async configExists() {
    return await file(this.configPath).exists();
  }
}
