import { render, useApp } from "ink";
import { useState } from "react";
import ConfigShowPage from "./components/config-show-page";
import InitPage from "./components/init-page";
import Layout from "./components/layout";
import { LocalConfigManager } from "./config-manager";
import { ConfigContext } from "./context/config-context";
import { QuitContext } from "./context/quit-context";

export const Pages = ["init", "config-show"] as const;
export type Page = (typeof Pages)[number];

type Props = { page: Page; configPath: string; };
const App = ({ page, configPath }: Props) => {
  const [shouldQuit, setShouldQuit] = useState(false);
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
      default:
        throw new Error(`Unknown page: ${page}`);
    }
  };

  return (
    <ConfigContext value={new LocalConfigManager(configPath)}>
      <QuitContext value={{ shouldQuit, quit }}>
        <Layout>
          {route()}
        </Layout>
      </QuitContext>
    </ConfigContext>
  );
};

export const app = (page: Page, configPath: string) => render(<App page={page} configPath={configPath} />);
