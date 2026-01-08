import { useUser } from "@/hooks/user";
import { logOut } from "@overdrip/core/auth";
import {
  AppShell as MantineAppShell,
  Burger,
  Group,
  Menu,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconLogout, IconUser } from "@tabler/icons-react";
import { Outlet } from "react-router-dom";

const AppShell = () => {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const user = useUser();

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <Text size="xl" fw={700}>
              💧 Overdrip
            </Text>
          </Group>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs">
                  <IconUser size={20} />
                  <Text size="sm" fw={500}>
                    Profile
                  </Text>
                  <IconChevronDown size={16} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item disabled>
                <Text size="xs" c="dimmed" truncate>
                  {user.email || user.uid}
                </Text>
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={16} />}
                onClick={logOut}
              >
                Log out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <Text size="sm" fw={500} mb="md">
          Navigation
        </Text>
        {/* Add navigation links here as needed */}
        <Text size="sm" c="dimmed">
          Dashboard and controls coming soon...
        </Text>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
};

export default AppShell;
