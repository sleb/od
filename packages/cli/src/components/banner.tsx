import { Newline, Text } from "ink";
import Gradient from "ink-gradient";

const Banner = () => {
  return (
    <Gradient name="atlas">
      <Text>
        <Text>█▀█ █ █ █▀▀ █▀█ █▀▄ █▀█ █ █▀█</Text>
        <Newline />
        <Text>█▄█ ▀▄▀ ██▄ █▀▄ █▄▀ █▀▄ █ █▀▀</Text>
      </Text>
    </Gradient>
  );
};

export default Banner;
