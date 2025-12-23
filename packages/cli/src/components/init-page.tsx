import { type Config } from "@overdrip/core";
import { Text } from "ink";
import { useEffect, useState } from "react";
import { useConfig } from "../hooks/config-hook";
import { useQuit } from "../hooks/quit-hook";
import ConfigOverwriteForm from "./config-overwrite-form";
import DeviceRegistrationForm from "./device-registration-form";
import LoadingMessage from "./loading-message";

type OverwriteSelection = { value: boolean };

const InitPage = () => {
  const [loading, setLoading] = useState(true);
  const [oldConfig, setOldConfig] = useState<Config | null>(null);
  const [overwrite, setOverwrite] = useState<OverwriteSelection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quit = useQuit();
  const configManager = useConfig();

  useEffect(() => {
    const loadExistingConfig = async () => {
      try {
        if (await configManager.configExists()) {
          setOldConfig(await configManager.loadConfig());
        }
      } catch (err) {
        setError(`Failed to load existing config: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      loadExistingConfig();
      return;
    }

    if (oldConfig && overwrite && !overwrite.value) {
      quit();
    }
  }, [configManager, loading, oldConfig, overwrite, quit]);

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

  return <DeviceRegistrationForm defaultValues={oldConfig?.device} />;
};

export default InitPage;
