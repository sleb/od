import { Box, Loader } from "@mantine/core";

const Loading = () => {
  return (
    <Box
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Loader size="lg" />
    </Box>
  );
};

export default Loading;
