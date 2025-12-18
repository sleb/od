import { app, type Overdrip } from "@overdrip/app";
import { Text } from "ink";
import { useEffect, useState } from "react";
import { useConfig } from "../hooks/config-hook";
import DeviceAuthRequired from "./device-auth-required";
import LoadingMessage from "./loading-message";

const StartPage = () => {
  const configManager = useConfig();
  const [message, setMessage] = useState("Starting up...");
  const [overdrip, setOverdrip] = useState<Overdrip | null>(null);

  useEffect(() => {
    const startOverdrip = async () => {
      setMessage("Initializing Overdrip...");
      try {
        const config = await configManager.loadConfig();
        const odApp = app(config);
        await odApp.start();
        setOverdrip(odApp);
      } catch (error) {
        setMessage(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };
    startOverdrip();
  }, [configManager]);

  if (!overdrip) {
    return <LoadingMessage message={message} />;
  }

  return (
    <DeviceAuthRequired>
      <Text>{String(overdrip)}</Text>
    </DeviceAuthRequired>
  );
};

export default StartPage;
