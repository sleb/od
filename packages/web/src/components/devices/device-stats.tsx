import type { DeviceRegistration } from "@overdrip/core/device";
import { Card, Grid, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import {
  IconActivity,
  IconClock,
  IconDroplet,
  IconTemperature,
} from "@tabler/icons-react";

interface DeviceStatsProps {
  device: DeviceRegistration;
}

const DeviceStats = ({ device: _device }: DeviceStatsProps) => {
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Real-time stats and monitoring coming soon. This device has not yet sent
        any telemetry data.
      </Text>

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Group>
              <ThemeIcon size="xl" variant="light" color="blue">
                <IconClock size={24} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Uptime
                </Text>
                <Text size="lg" fw={600}>
                  --
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Group>
              <ThemeIcon size="xl" variant="light" color="green">
                <IconActivity size={24} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Status
                </Text>
                <Text size="lg" fw={600}>
                  Offline
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Group>
              <ThemeIcon size="xl" variant="light" color="cyan">
                <IconDroplet size={24} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Moisture Level
                </Text>
                <Text size="lg" fw={600}>
                  --
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Group>
              <ThemeIcon size="xl" variant="light" color="orange">
                <IconTemperature size={24} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Temperature
                </Text>
                <Text size="lg" fw={600}>
                  --
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder padding="lg" radius="md">
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Recent Activity
          </Text>
          <Text size="sm" c="dimmed">
            No activity recorded yet. Start the device to see watering events,
            sensor readings, and system logs.
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
};

export default DeviceStats;
