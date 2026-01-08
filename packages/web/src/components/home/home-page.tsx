import { Container, Stack, Text, Title } from "@mantine/core";

const HomePage = () => {
  return (
    <Container size="lg">
      <Stack gap="lg">
        <Title order={1}>Dashboard</Title>
        <Text size="lg">
          Welcome to Overdrip! Your plant watering system is ready to go.
        </Text>
        <Text c="dimmed">
          Use the navigation to configure your devices and monitor your plants.
        </Text>
      </Stack>
    </Container>
  );
};

export default HomePage;
