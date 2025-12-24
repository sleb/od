import { logInDevice } from "@overdrip/core";
import { Text } from "ink";
import { useContext, useEffect, useState, type ReactNode } from "react";
import { UserContext } from "../context/user-context";
import { useConfig } from "../hooks/config-hook";
import { useQuit } from "../hooks/quit-hook";
import LoadingMessage from "./loading-message";

type Props = { children: ReactNode };
const DeviceAuthRequired = ({ children }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const configManager = useConfig();
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

    if (!user) {
      authenticateDevice();
    }
    return () => controller.abort();
  }, [configManager, quit, user]);

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (!user) {
    return <LoadingMessage message="Waiting for device authentication" />;
  }

  return children;
};

export default DeviceAuthRequired;
