import {
  Anchor,
  Box,
  Button,
  Code,
  Container,
  Group,
  List,
  Paper,
  Stack,
  Text,
  Title,
  Alert,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBrandGithub,
  IconDashboard,
  IconLogin,
  IconUserPlus,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "@/hooks/auth-state";

const LandingPage = () => {
  const navigate = useNavigate();
  const [user] = useAuthState();

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem 1rem",
      }}
    >
      <Container size="md">
        <Stack gap="xl">
          {/* Header */}
          <Box ta="center" pt="xl">
            <Title
              order={1}
              size="4rem"
              c="white"
              style={{
                textShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              💧 Overdrip
            </Title>
            <Text size="xl" c="white" mt="sm" fw={500}>
              Automate plant watering on your Raspberry Pi
            </Text>
          </Box>

          {/* Auth Buttons */}
          <Paper shadow="xl" p="lg" radius="md">
            <Group justify="center" gap="md">
              {user ? (
                <Button
                  size="lg"
                  leftSection={<IconDashboard size={20} />}
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    leftSection={<IconLogin size={20} />}
                    onClick={() => navigate("/login")}
                    variant="light"
                  >
                    Log In
                  </Button>
                  <Button
                    size="lg"
                    leftSection={<IconUserPlus size={20} />}
                    onClick={() => navigate("/signup")}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </Group>
          </Paper>

          {/* Install Section */}
          <Paper shadow="xl" p="xl" radius="md">
            <Stack gap="md">
              <Title order={2} size="1.5rem">
                Quick Install
              </Title>
              <Code
                block
                style={{
                  fontSize: "0.95rem",
                  padding: "1rem",
                }}
              >
                curl -sSL https://get.overdrip.app/install.sh | bash
              </Code>
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="orange"
                title="Linux Only"
              >
                This installer currently supports systemd-based Linux systems
                only (Raspberry Pi OS, Ubuntu, etc.).
              </Alert>
            </Stack>
          </Paper>

          {/* Features */}
          <Paper shadow="xl" p="xl" radius="md">
            <Stack gap="md">
              <Title order={2} size="1.5rem">
                Features
              </Title>
              <List spacing="sm">
                <List.Item>
                  Web-first setup with Firebase authentication
                </List.Item>
                <List.Item>
                  Secure device authentication with custom tokens
                </List.Item>
                <List.Item>Automatic systemd service configuration</List.Item>
                <List.Item>
                  Two-plant watering system with moisture sensing
                </List.Item>
                <List.Item>Hardware auto-detection (Raspberry Pi)</List.Item>
              </List>
            </Stack>
          </Paper>

          {/* Prerequisites */}
          <Paper shadow="xl" p="xl" radius="md">
            <Stack gap="md">
              <Title order={2} size="1.5rem">
                Prerequisites
              </Title>
              <List spacing="sm">
                <List.Item>Raspberry Pi (3B+ or newer recommended)</List.Item>
                <List.Item>systemd-based Linux OS</List.Item>
                <List.Item>Internet connection</List.Item>
                <List.Item>ADS1115 ADC + soil moisture sensors</List.Item>
                <List.Item>Water pumps + driver circuit (MOSFET)</List.Item>
              </List>
            </Stack>
          </Paper>

          {/* Footer */}
          <Paper shadow="xl" p="lg" radius="md">
            <Stack gap="sm" align="center">
              <Group gap="md">
                <Anchor
                  href="https://github.com/sleb/od"
                  target="_blank"
                  rel="noopener noreferrer"
                  c="blue"
                >
                  <Group gap={4}>
                    <IconBrandGithub size={16} />
                    <Text size="sm">View on GitHub</Text>
                  </Group>
                </Anchor>
                <Text size="sm" c="dimmed">
                  |
                </Text>
                <Anchor
                  href="https://github.com/sleb/od/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  c="blue"
                >
                  <Text size="sm">Documentation</Text>
                </Anchor>
              </Group>
              <Text size="xs" c="dimmed">
                MIT License
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default LandingPage;
