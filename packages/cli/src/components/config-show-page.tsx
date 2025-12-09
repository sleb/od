import { Box, Text } from "ink";
import SyntaxHighlight from "ink-syntax-highlight";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "../context/config-context";
import { QuitContext } from "../context/quit-context";
import type { Config } from "../models/config";
import LoadingMessage from "./loading-message";

const ConfigShowPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const configManager = useContext(ConfigContext);
  const { quit } = useContext(QuitContext);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadConfig = async () => {
      try {
        if (signal.aborted) return;

        if (await configManager.configExists()) {
          const loadedConfig = await configManager.loadConfig();
          if (!signal.aborted) {
            setConfig(loadedConfig);
          }
        }
      } catch (e) {
        if (!signal.aborted) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          quit();
        }
      }
    };

    loadConfig();
    return () => controller.abort();
  }, [configManager, quit]);

  if (loading) {
    return (
      <LoadingMessage message="Loading configuration..." />
    );
  }

  if (error) {
    return (
      <Text color="red">Error loading configuration: {error}</Text>
    );
  };

  if (!config) {
    return (
      <Text color="yellow">No configuration file found. Please run the `init` command to create one.</Text>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Configuration ({configManager.path()}):</Text>
      <SyntaxHighlight language="json" code={JSON.stringify(config, null, 2)} />
    </Box>
  );
};

export default ConfigShowPage;