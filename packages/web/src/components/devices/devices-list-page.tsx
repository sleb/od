import { useDevices } from "@/hooks/devices";
import type { DeviceRegistration } from "@overdrip/core/device";
import {
  Alert,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconDevices, IconPlus } from "@tabler/icons-react";
import { Link } from "react-router-dom";

const DevicesListPage = () => {
  const { devices, loading, error } = useDevices();

  if (loading) {
    return (
      <Container size="lg">
        <Stack align="center" py="xl">
          <Loader size="lg" />
          <Text c="dimmed">Loading devices...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error loading devices"
          color="red"
        >
          {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={1}>Devices</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            variant="filled"
            disabled
          >
            Register New Device
          </Button>
        </Group>

        {devices.length === 0 ? (
          <Card withBorder padding="xl" radius="md">
            <Stack align="center" gap="md" py="xl">
              <IconDevices size={48} stroke={1.5} opacity={0.5} />
              <Title order={3} c="dimmed">
                No devices registered
              </Title>
              <Text c="dimmed" ta="center">
                You haven&apos;t registered any devices yet. Use the CLI to
                register your first device.
              </Text>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                disabled
              >
                Register New Device
              </Button>
            </Stack>
          </Card>
        ) : (
          <Grid>
            {devices.map((device: DeviceRegistration) => (
              <Grid.Col key={device.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card
                  withBorder
                  padding="lg"
                  radius="md"
                  component={Link}
                  to={`/devices/${device.id}`}
                  style={{ textDecoration: "none", cursor: "pointer" }}
                >
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start">
                      <Text fw={600} size="lg" lineClamp={1}>
                        {device.name}
                      </Text>
                      <IconDevices size={20} opacity={0.5} />
                    </Group>

                    <Stack gap="xs">
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">
                          ID:
                        </Text>
                        <Text
                          size="xs"
                          c="dimmed"
                          style={{ fontFamily: "monospace" }}
                        >
                          {device.id.substring(0, 8)}...
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">
                          Registered:
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(device.registeredAt).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Stack>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
};

export default DevicesListPage;
