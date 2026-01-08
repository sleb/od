import { logInUser } from "@overdrip/core/user";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type LoginForm = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<LoginForm>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => {
        if (!value) return "Email is required";
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
          return "Invalid email address";
        }
        return null;
      },
      password: (value) => (value ? null : "Password is required"),
    },
  });

  const handleSubmit = async (values: LoginForm) => {
    setAuthError(null);
    setAuthSuccess(false);
    setIsSubmitting(true);

    try {
      await logInUser(values.email, values.password);
      setAuthSuccess(true);
      navigate("/");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to log in. Please try again.";
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--mantine-color-gray-0)",
        padding: "1rem",
      }}
    >
      <Container size="xs" w="100%">
        <Stack gap="xl" mb="xl">
          <Box ta="center">
            <Title order={1} size="3.5rem" mb="sm">
              💧 Overdrip
            </Title>
            <Text c="dimmed">Plant watering made simple</Text>
          </Box>

          <Paper shadow="md" p="xl" radius="md">
            <Stack gap="md">
              <Box>
                <Title order={2} size="1.75rem" mb={4}>
                  Welcome back
                </Title>
                <Text c="dimmed" size="sm" mb="lg">
                  Sign in to manage your devices
                </Text>
              </Box>

              {authError && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  title="Error"
                >
                  {authError}
                </Alert>
              )}

              {authSuccess && (
                <Alert
                  icon={<IconCheck size={16} />}
                  color="green"
                  title="Success"
                >
                  Signed in successfully!
                </Alert>
              )}

              <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
                <Stack gap="md">
                  <TextInput
                    label="Email address"
                    placeholder="your@email.com"
                    type="email"
                    autoComplete="email"
                    {...form.getInputProps("email")}
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    {...form.getInputProps("password")}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    loading={isSubmitting}
                    mt="sm"
                  >
                    Sign in
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default LoginPage;
