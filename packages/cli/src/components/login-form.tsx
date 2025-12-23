import { logInUser } from "@overdrip/core";
import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { useQuit } from "../hooks/quit-hook";
import LoadingMessage from "./loading-message";
import TextField from "./text-field";

const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const quit = useQuit();

  useEffect(() => {
    if (email && password) {
      logInUser(email, password).catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
        quit();
      });
    }
  }, [email, password, quit]);

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color="red">Error: {error}</Text>
        <Text>Please try logging in again.</Text>
      </Box>
    );
  }

  if (!email) {
    return <TextField key="email" label="Email:" onSubmit={setEmail} />;
  }

  if (!password) {
    return (
      <TextField key="password" label="Password:" onSubmit={setPassword} mask />
    );
  }

  return <LoadingMessage message="Logging in..." />;
};

export default LoginForm;
