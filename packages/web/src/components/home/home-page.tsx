import { useUser } from "@/hooks/user";
import { logOut } from "@overdrip/core/auth";
import { Button, Container, Stack, Text, Title } from "@mantine/core";

const HomePage = () => {
  const user = useUser();

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>💧 Overdrip</Title>
        <Text>Welcome, {user.uid}</Text>
        <Button onClick={logOut} variant="outline">
          Log out
        </Button>
      </Stack>
    </Container>
  );
};

export default HomePage;
