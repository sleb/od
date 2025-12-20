import {
  type Config,
  type DeviceRegistration,
  registerDevice,
} from "@overdrip/core";
import { Text } from "ink";
import { useEffect, useState } from "react";
import z from "zod";
import { useConfig } from "../hooks/config-hook";
import { useQuit } from "../hooks/quit-hook";
import ConfigOverwriteForm from "./config-overwrite-form";
import DeviceRegistrationForm from "./device-registration-form";
import LoadingMessage from "./loading-message";

const DeviceRegistrationFormSchema = z.object({
  name: z.string().min(1, "Device name is required"),
});

type OverwriteSelection = { value: boolean };

const InitPage = () => {
  const [device, setDevice] = useState<DeviceRegistration | null>(null);

  const [loading, setLoading] = useState(true);
  const [oldConfig, setOldConfig] = useState<Config | null>(null);
  const [overwrite, setOverwrite] = useState<OverwriteSelection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quit = useQuit();
  const configManager = useConfig();

  const handleDeviceRegistrationSubmit = async (values: object) => {
    const { name } = DeviceRegistrationFormSchema.parse(values);
    const device = await registerDevice(name);
    setDevice(device);
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadExistingConfig = async () => {
      try {
        if (await configManager.configExists()) {
          setOldConfig(await configManager.loadConfig());
        }
      } catch (err) {
        console.error(`Failed to load existing config: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    const writeConfig = async (device: DeviceRegistration) => {
      try {
        await configManager.saveConfig({ device });
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    if (loading) {
      loadExistingConfig();
    } else {
      if (oldConfig && overwrite && !overwrite.value) {
        quit();
      }

      if (device) {
        writeConfig(device).finally(() => quit());
      }
    }

    return () => controller.abort();
  }, [configManager, loading, oldConfig, overwrite, device, quit]);

  if (error) {
    return <Text color="red">Init error: {error}</Text>;
  }

  if (loading) {
    return <LoadingMessage message="Checking configuration..." />;
  }

  if (oldConfig) {
    if (!overwrite) {
      return (
        <ConfigOverwriteForm onSelect={(value) => setOverwrite({ value })} />
      );
    }

    if (!overwrite.value) {
      return (
        <Text color="yellow">
          Initialization cancelled. Existing configuration preserved.
        </Text>
      );
    }
  }

  if (!device) {
    return (
      <DeviceRegistrationForm
        onSubmit={handleDeviceRegistrationSubmit}
        defaultValues={oldConfig?.device}
      />
    );
  }

  return <Text color="green">Configuration initialized successfully!</Text>;
};

export default InitPage;
