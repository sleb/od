import { Box, Text } from "ink";
import Spinner from "ink-spinner";

type Props = { message: string };
const LoadingMessage = ({ message }: Props) => {
  return (
    <Box gap={1}>
      <Text>{message}</Text>
      <Text color="blue">
        <Spinner type="dots" />
      </Text>
    </Box>
  );
};

export default LoadingMessage;
