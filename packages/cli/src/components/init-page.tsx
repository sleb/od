import { file } from "bun";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import { useContext, useEffect, useState } from "react";
import { ConfigManager } from "../config-manager";
import { ConfigPathContext } from "../config-path-context";
import { QuitContext } from "../context/quit-context";

type OverwriteSelection = { value: boolean; };

const InitPage = () => {
  const configPath = useContext(ConfigPathContext);
  const [configExists, setConfigExists] = useState(false);
  const [overwrite, setOverwrite] = useState<OverwriteSelection | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [loading, setLoading] = useState(true);
  const { quit } = useContext(QuitContext);

  const handleOverwriteSelect = (item: OverwriteSelection) => {
    setOverwrite(item);
    quit();
  };

  useEffect(() => {
    file(configPath).exists().then((exists) => {
      setConfigExists(exists);
    }).finally(() => {
      setLoading(false);
    });
  }, [configPath]);

  useEffect(() => {
    if (!loading && (!configExists || overwrite)) {
      new ConfigManager(configPath).saveConfig({ deviceId: "default-device", name: "My Overdrip Device" }).catch((err) => {
        setError(err);
      }).finally(() => {
        quit();
      });
    }
  }, [configExists, configPath, loading, overwrite, quit]);

  if (loading) {
    return (
      <Text>
        <Text color="blue"><Spinner type="dots" /></Text>
        Checking configuration...
      </Text>
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
      <Text color="red">Error initializing configuration: {error.message}</Text>
    );
  }

  return (
    <Text color="green">Configuration initialized successfully!</Text>
  );
};

export default InitPage;
