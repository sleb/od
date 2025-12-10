import { LocalConfigManager, onAuthChange, type User } from "@overdrip/core";
import { render, useApp } from "ink";
import { useEffect, useState } from "react";
import ConfigShowPage from "./components/config-show-page";
import InitPage from "./components/init-page";
import Layout from "./components/layout";
import LoadingMessage from "./components/loading-message";
import { ConfigContext } from "./context/config-context";
import { QuitContext } from "./context/quit-context";
import { UserContext } from "./context/user-context";

export const Pages = ["init", "config-show"] as const;
export type Page = (typeof Pages)[number];

type Props = { page: Page; configPath: string };
const App = ({ page, configPath }: Props) => {
  const [shouldQuit, setShouldQuit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { exit } = useApp();

  const quit = () => {
    setShouldQuit(true);
    setTimeout(() => {
      exit();
    }, 100);
  };

  const route = () => {
    switch (page) {
      case "init":
        return <InitPage />;
      case "config-show":
        return <ConfigShowPage />;
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

  if (loading) {
    return <LoadingMessage message="Loading..." />;
  }

  return (
    <ConfigContext value={new LocalConfigManager(configPath)}>
      <QuitContext value={{ shouldQuit, quit }}>
        <UserContext value={user}>
          <Layout>{route()}</Layout>
        </UserContext>
      </QuitContext>
    </ConfigContext>
  );
};

export const app = (page: Page, configPath: string) =>
  render(<App page={page} configPath={configPath} />);
