import { Box, useInput } from "ink";
import BigText from "ink-big-text";
import Gradient from "ink-gradient";
import { useContext, type ReactNode } from "react";
import { QuitContext } from "../context/quit-context";
import QuitMessage from "./quit-message";

type Props = { children: ReactNode; };
const Layout = ({ children }: Props) => {
  const { quit } = useContext(QuitContext);

  useInput((input, key) => {
    if (input.toLowerCase() === "q" || key.escape) {
      quit();
    }
  });

  return (
    <Box flexDirection="column">
      <Gradient name="atlas">
        <BigText text="Overdrip" font="tiny" />
      </Gradient>
      {children}
      <QuitMessage />
    </Box>
  );
};

export default Layout;
