import { logInDevice } from "@overdrip/core";
import { Text } from "ink";
import { useContext, useEffect, useState, type ReactNode } from "react";
import { ConfigContext } from "../context/config-context";
import { UserContext } from "../context/user-context";
import { useQuit } from "../hooks/quit-hook";
import LoadingMessage from "./loading-message";

type Props = { children: ReactNode };
const DeviceAuthRequired = ({ children }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const configManager = useContext(ConfigContext);
  const user = useContext(UserContext);
  const quit = useQuit();

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const authenticateDevice = async () => {
      try {
        const {
          device: { id, authToken },
        } = await configManager.loadConfig();
        await logInDevice(id, authToken);
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err.message : String(err));
          quit();
        }
      }
    };

    authenticateDevice();
    return () => controller.abort();
  }, [configManager, quit]);

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (!user) {
    return <LoadingMessage message="Waiting for device authentication" />;
  }

  return children;
};

export default DeviceAuthRequired;
