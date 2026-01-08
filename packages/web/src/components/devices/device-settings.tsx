import type { DeviceRegistration } from "@overdrip/core/device";
import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

interface DeviceSettingsProps {
  device: DeviceRegistration;
}

const DeviceSettings = ({ device }: DeviceSettingsProps) => {
  return (
    <Stack gap="md">
      <Card withBorder padding="lg" radius="md">
        <Stack gap="md">
          <Text size="sm" fw={500}>
            Device Information
          </Text>

          <TextInput
            label="Device Name"
            value={device.name}
            readOnly
            description="Device name cannot be changed after registration"
          />

          <TextInput
            label="Device ID"
            value={device.id}
            readOnly
            style={{ fontFamily: "monospace" }}
            description="Unique identifier for this device"
          />

          <TextInput
            label="Registration Date"
            value={new Date(device.registeredAt).toLocaleString()}
            readOnly
            description="When this device was first registered"
          />
        </Stack>
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} c="red">
              Danger Zone
            </Text>
            <Text size="xs" c="dimmed">
              Irreversible actions
            </Text>
          </div>

          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>
                Delete Device
              </Text>
              <Text size="xs" c="dimmed">
                Permanently remove this device from your account
              </Text>
            </div>
            <Button
              color="red"
              variant="outline"
              leftSection={<IconTrash size={16} />}
              disabled
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};

export default DeviceSettings;
