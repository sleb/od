import { app, type Overdrip } from "@overdrip/app";
import { Text } from "ink";
import { useEffect, useState } from "react";
import type { StartPageOptions } from "../app";
import { useConfig } from "../hooks/config-hook";
import DeviceAuthRequired from "./device-auth-required";
import LoadingMessage from "./loading-message";

type Props = { options: StartPageOptions };
const StartPage = ({ options: { detach } }: Props) => {
  const configManager = useConfig();
  const [message, setMessage] = useState("Starting up...");
  const [overdrip, setOverdrip] = useState<Overdrip | null>(null);

  useEffect(() => {
    const startOverdrip = async () => {
      setMessage("Initializing Overdrip...");
      try {
        const odApp = app(await configManager.loadConfig());
        await odApp.start();
        setMessage("Overdrip started successfully.");
        setOverdrip(odApp);
      } catch (error) {
        setMessage(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };
    startOverdrip();
  }, [configManager, detach]);

  if (!overdrip) {
    return <LoadingMessage message={message} />;
  }

  return (
    <DeviceAuthRequired>
      <Text color="blue">{message}</Text>
    </DeviceAuthRequired>
  );
};

export default StartPage;
