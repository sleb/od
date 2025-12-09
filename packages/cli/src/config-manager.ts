import { file, write } from "bun";
import { ConfigSchema, type Config } from "./models/config";

export class ConfigManager {
  constructor(private configPath: string) { }

  async loadConfig() {
    try {
      const data = await file(this.configPath).text();
      const parsed = JSON.parse(data);
      return ConfigSchema.parse(parsed);
    } catch (e) {
      throw new Error("Failed to load or parse config", { cause: e });
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