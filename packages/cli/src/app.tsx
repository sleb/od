import { LocalConfigManager, onAuthChange, type User } from "@overdrip/core";
import { render, useApp } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";
import ConfigShowPage from "./components/config-show-page";
import InitPage from "./components/init-page";
import Layout from "./components/layout";
import LoadingMessage from "./components/loading-message";
import StartPage from "./components/start-page";
import { ConfigContext } from "./context/config-context";
import { QuitContext } from "./context/quit-context";
import { UserContext } from "./context/user-context";

export type Page = "init" | "config-show" | "start";

type Props = { page: Page; configPath: string };
const App = ({ page, configPath }: Props) => {
  const [shouldQuit, setShouldQuit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { exit } = useApp();

  const quit = useCallback(() => {
    setShouldQuit(true);
    setTimeout(() => {
      exit();
    }, 100);
  }, [exit]);

  const route = () => {
    switch (page) {
      case "init":
        return <InitPage />;
      case "config-show":
        return <ConfigShowPage />;
      case "start":
        return <StartPage />;
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    onAuthChange(setUser, console.error).finally(() => {
      if (!signal.aborted) {
        setLoading(false);
      }
    });

    return () => controller.abort();
  }, []);
  const configManager = useMemo(
    () => new LocalConfigManager(configPath),
    [configPath],
  );

  const quitContextValue = useMemo(
    () => ({ shouldQuit, quit }),
    [shouldQuit, quit],
  );

  if (loading) {
    return <LoadingMessage message="Loading..." />;
  }

  return (
    <ConfigContext value={configManager}>
      <QuitContext value={quitContextValue}>
        <UserContext value={user}>
          <Layout>{route()}</Layout>
        </UserContext>
      </QuitContext>
    </ConfigContext>
  );
};

export const app = (page: Page, configPath: string) =>
  render(<App page={page} configPath={configPath} />);
