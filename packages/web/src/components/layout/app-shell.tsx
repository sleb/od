import { useUser } from "@/hooks/user";
import { logOut } from "@overdrip/core/auth";
import {
  AppShell as MantineAppShell,
  Burger,
  Group,
  Menu,
  NavLink,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconChevronDown,
  IconDevices,
  IconHome,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import { NavLink as RouterNavLink, Outlet } from "react-router-dom";

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
        <NavLink
          component={RouterNavLink}
          to="/"
          end
          label="Home"
          leftSection={<IconHome size={20} />}
        />
        <NavLink
          component={RouterNavLink}
          to="/devices"
          label="Devices"
          leftSection={<IconDevices size={20} />}
        />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
};

export default AppShell;
