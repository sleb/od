import { useDevice } from "@/hooks/devices";
import {
  Alert,
  Badge,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconChartBar,
  IconSettings,
} from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import DeviceSettings from "./device-settings";
import DeviceStats from "./device-stats";

const DeviceDetailPage = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { device, loading, error } = useDevice(deviceId);

  if (loading) {
    return (
      <Container size="lg">
        <Stack align="center" py="xl">
          <Loader size="lg" />
          <Text c="dimmed">Loading device...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error loading device"
          color="red"
        >
          {error.message}
        </Alert>
      </Container>
    );
  }

  if (!device) {
    return (
      <Container size="lg">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Device not found"
          color="yellow"
        >
          The device you&apos;re looking for could not be found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Device Header */}
        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2}>{device.name}</Title>
                <Text size="sm" c="dimmed" style={{ fontFamily: "monospace" }}>
                  {device.id}
                </Text>
              </div>
              <Badge color="gray" variant="light">
                Offline
              </Badge>
            </Group>

            <Group gap="xl">
              <div>
                <Text size="xs" c="dimmed">
                  Registered
                </Text>
                <Text size="sm">
                  {new Date(device.registeredAt).toLocaleString()}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Last Seen
                </Text>
                <Text size="sm" c="dimmed">
                  Never
                </Text>
              </div>
            </Group>
          </Stack>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="settings">
          <Tabs.List>
            <Tabs.Tab
              value="settings"
              leftSection={<IconSettings size={16} />}
            >
              Settings
            </Tabs.Tab>
            <Tabs.Tab value="stats" leftSection={<IconChartBar size={16} />}>
              Stats
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="settings" pt="md">
            <DeviceSettings device={device} />
          </Tabs.Panel>

          <Tabs.Panel value="stats" pt="md">
            <DeviceStats device={device} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default DeviceDetailPage;
