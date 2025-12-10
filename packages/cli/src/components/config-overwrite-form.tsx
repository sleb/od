import { Box, Text } from "ink";
import SelectInput from "ink-select-input";

type Props = { onSelect: (value: boolean) => void };
const ConfigOverwriteForm = ({ onSelect }: Props) => {
  return (
    <Box flexDirection="column">
      <Text bold>Configuration file already exists. Overwrite?</Text>
      <SelectInput
        items={[
          { label: "Yes", value: true },
          { label: "No", value: false },
        ]}
        onSelect={({ value }) => onSelect(value)}
      />
    </Box>
  );
};

export default ConfigOverwriteForm;
