import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import TextInput from "ink-text-input";
import { useState } from "react";

type Props = {
  label: string;
  defaultValue?: string;
  onSubmit: (value: string) => void | Promise<void>;
  mask?: boolean;
};

const TextField = ({ label, onSubmit, mask, defaultValue }: Props) => {
  const [value, setValue] = useState(defaultValue || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (input: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await Promise.resolve(onSubmit(input));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box gap={1}>
      <Text>{label}</Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        {...(mask && { mask: "*" })}
      />
      {submitting && (
        <Box gap={1}>
          <Text>
            <Text>Submitting</Text>
            <Spinner type="dots" />
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default TextField;
