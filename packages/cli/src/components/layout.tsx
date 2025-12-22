import { Box, Text, useInput } from "ink";
import { useContext, type ReactNode } from "react";
import { UserContext } from "../context/user-context";
import { useQuit } from "../hooks/quit-hook";
import Banner from "./banner";
import QuitMessage from "./quit-message";

type Props = { children: ReactNode };
const Layout = ({ children }: Props) => {
  const quit = useQuit();
  const user = useContext(UserContext);

  useInput((input, key) => {
    if (input.toLowerCase() === "q" || key.escape) {
      quit();
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Banner />
      {user && <Text dimColor>Logged in as {user.uid}</Text>}
      {children}
      <QuitMessage />
    </Box>
  );
};

export default Layout;
