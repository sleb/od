import { logIn } from "@overdrip/core";
import { Box, Text } from "ink";
import { Form, type FormStructure } from "ink-form";
import { useState } from "react";
import { z } from "zod";

const FormSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (form: object) => {
    const { email, password } = FormSchema.parse(form);
    logIn(email, password).catch((e) => {
      setError(e instanceof Error ? e.message : "Unknown error");
    });
  };

  const form: FormStructure = {
    sections: [
      {
        title: "Please log in to continue",
        fields: [
          {
            name: "email",
            label: "Email",
            placeholder: "foo@bar.com",
            type: "string",
            required: true,
          },
          {
            name: "password",
            label: "Password",
            placeholder: "password",
            type: "string",
            mask: "*",
            required: true,
          },
        ],
      },
    ],
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Form form={form} onSubmit={handleLogin} />
      {error && <Text color="red">{error}</Text>}
    </Box>
  );
};

export default LoginForm;
