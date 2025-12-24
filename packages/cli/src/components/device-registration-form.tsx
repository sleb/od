import { registerDevice, type DeviceRegistration } from "@overdrip/core";
import { Text } from "ink";
import { useState } from "react";
import { useConfig } from "../hooks/config-hook";
import { useQuit } from "../hooks/quit-hook";
import AuthRequired from "./auth-required";
import TextField from "./text-field";

type Props = {
  defaultValues?: Partial<DeviceRegistration>;
};

const DEFAULT_LOG_LEVEL = "info";

const DeviceRegistrationForm = ({ defaultValues }: Props) => {
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configManager = useConfig();
  const quit = useQuit();

  const handleSubmit = async (name: string) => {
    try {
      const device = await registerDevice(name);
      await configManager.saveConfig({ device, logLevel: DEFAULT_LOG_LEVEL });
      setCompleted(true);
    } catch (err) {
      setError(`Device registration failed: ${err}`);
    } finally {
      quit();
    }
  };

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (completed) {
    return <Text color="green">Device registered successfully!</Text>;
  }

  return (
    <AuthRequired>
      <TextField
        label="Device Name:"
        onSubmit={handleSubmit}
        defaultValue={defaultValues?.name}
      />
    </AuthRequired>
  );
};

export default DeviceRegistrationForm;
