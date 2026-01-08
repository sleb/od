import {
  Alert,
  Box,
  Container,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import type { ReactNode } from "react";

type AuthFormLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  error?: string | null;
  success?: string | null;
};

const AuthFormLayout = ({
  title,
  subtitle,
  children,
  error,
  success,
}: AuthFormLayoutProps) => {
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
                  {title}
                </Title>
                <Text c="dimmed" size="sm" mb="lg">
                  {subtitle}
                </Text>
              </Box>

              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  title="Error"
                >
                  {error}
                </Alert>
              )}

              {success && (
                <Alert
                  icon={<IconCheck size={16} />}
                  color="green"
                  title="Success"
                >
                  {success}
                </Alert>
              )}

              {children}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default AuthFormLayout;
