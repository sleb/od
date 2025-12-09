import { Box, Text } from "ink";
import { useContext } from "react";
import { QuitContext } from "../context/quit-context";

const StatusMessage = () => {
  const { shouldQuit } = useContext(QuitContext);
  const message = shouldQuit ? "Exiting..." : "Press `Q` or `Esc` to quit.";

  return (
    <Box flexDirection="column" marginY={1}>
      <Text dimColor>{message}</Text>
    </Box>
  );
};

export default StatusMessage;