import { Text } from "ink";
import Spinner from "ink-spinner";

type Props = { message: string; };
const LoadingMessage = ({ message }: Props) => {
  return (
    <Text>
      <Text color="blue"><Spinner type="dots" /></Text>
      {message}
    </Text>
  );
};

export default LoadingMessage;