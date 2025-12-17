import { Text } from "ink";
import DeviceAuthRequired from "./device-auth-required";

const StartPage = () => {
  return (
    <DeviceAuthRequired>
      <Text>Starting up...</Text>
    </DeviceAuthRequired>
  );
};

export default StartPage;
