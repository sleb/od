import { Box, Text } from "ink";
import { useQuit } from "../hooks/quit-hook";

const QuitMessage = () => {
  const { shouldQuit } = useQuit();
  const message = shouldQuit ? "" : "Press `Q` or `Esc` to quit.";

  return (
    <Box flexDirection="column" marginY={1}>
      <Text dimColor>{message}</Text>
    </Box>
  );
};

export default QuitMessage;
