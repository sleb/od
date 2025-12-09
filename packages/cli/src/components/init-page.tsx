import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "../context/config-context";
import { QuitContext } from "../context/quit-context";
import LoadingMessage from "./loading-message";

type OverwriteSelection = { value: boolean; };

const InitPage = () => {
  const [configExists, setConfigExists] = useState(false);
  const [overwrite, setOverwrite] = useState<OverwriteSelection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const { quit } = useContext(QuitContext);
  const configManager = useContext(ConfigContext);

  const handleOverwriteSelect = (item: OverwriteSelection) => {
    setOverwrite(item);
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    configManager.configExists().then((exists) => {
      if (!signal.aborted) {
        setConfigExists(exists);
      }
    }).finally(() => {
      if (!signal.aborted) {
        setLoading(false);
      }
    });

    return () => controller.abort();
  }, [configManager]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const persist = async () => {
      if (loading) return;
      if (configExists && !overwrite) return;

      try {
        const nextConfig = { deviceId: "default-device", name: "My Overdrip Device" };
        await configManager.saveConfig(nextConfig);
        if (!signal.aborted) {
          setError(null);
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!signal.aborted) {
          quit();
        }
      }
    };

    persist();

    return () => controller.abort();
  }, [configExists, configManager, loading, overwrite, quit]);

  if (loading) {
    return (
      <LoadingMessage message="Checking configuration..." />
    );
  }

  if (configExists && !overwrite) {
    return (
      <Box flexDirection="column">
        <Text bold>Configuration file already exists. Overwrite?</Text>
        <SelectInput items={[{ label: "Yes", value: true }, { label: "No", value: false }]} onSelect={handleOverwriteSelect} />
      </Box>
    );
  }

  if (configExists && overwrite?.value === false) {
    return (
      <Text color="yellow">Initialization cancelled. Existing configuration preserved.</Text>
    );
  }

  if (error) {
    return (
      <Text color="red">Error initializing configuration: {error}</Text>
    );
  }

  return (
    <Text color="green">Configuration initialized successfully!</Text>
  );
};

export default InitPage;
