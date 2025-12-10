import { Box, Text, useInput } from "ink";
import BigText from "ink-big-text";
import Gradient from "ink-gradient";
import { useContext, type ReactNode } from "react";
import { QuitContext } from "../context/quit-context";
import { UserContext } from "../context/user-context";
import QuitMessage from "./quit-message";

type Props = { children: ReactNode };
const Layout = ({ children }: Props) => {
  const { quit } = useContext(QuitContext);
  const user = useContext(UserContext);

  useInput((input, key) => {
    if (input.toLowerCase() === "q" || key.escape) {
      quit();
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Gradient name="atlas">
        <BigText text="Overdrip" font="tiny" />
      </Gradient>
      {user && <Text dimColor>Logged in as {user.uid}</Text>}
      {children}
      <QuitMessage />
    </Box>
  );
};

export default Layout;
