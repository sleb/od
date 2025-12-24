import { app, type Overdrip } from "@overdrip/app";
import { Text } from "ink";
import { useEffect, useState } from "react";
import { useConfig } from "../hooks/config-hook";
import { useQuit } from "../hooks/quit-hook";
import DeviceAuthRequired from "./device-auth-required";
import LoadingMessage from "./loading-message";

const StartPage = () => {
  const [message, setMessage] = useState("Starting up...");
  const [overdrip, setOverdrip] = useState<Overdrip | null>(null);
  const configManager = useConfig();
  const quit = useQuit();

  useEffect(() => {
    const startOverdrip = async () => {
      setMessage("Initializing Overdrip...");
      try {
        const odApp = app(await configManager.loadConfig());
        await odApp.start();
        setMessage("Overdrip started successfully.");
        setOverdrip(odApp);
      } catch (err) {
        setMessage(
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        );
      } finally {
        quit();
      }
    };
    startOverdrip();
  }, [configManager, quit]);

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
