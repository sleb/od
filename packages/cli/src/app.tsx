import { render, useApp } from "ink";
import { useState } from "react";
import InitPage from "./components/init-page";
import Layout from "./components/layout";
import { ConfigPathContext } from "./config-path-context";
import { QuitContext } from "./context/quit-context";

type Page = "init";

type Props = { page: Page; configPath: string; };
const App = ({ page, configPath }: Props) => {
  const [shouldQuit, setShouldQuit] = useState(false);
  const app = useApp();

  const quit = () => {
    setShouldQuit(true);
    setTimeout(() => {
      app.exit();
    }, 500);
  };


  return (
    <ConfigPathContext value={configPath}>
      <QuitContext value={{ shouldQuit, quit }}>
        <Layout>
          {page === "init" && <InitPage />}
        </Layout>
      </QuitContext>
    </ConfigPathContext>
  );
};

export const app = (page: Page, configPath: string) => render(<App page={page} configPath={configPath} />);
