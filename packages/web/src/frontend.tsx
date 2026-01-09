import Loading from "@/components/loading";
import { router } from "@/router";
import { MantineProvider } from "@mantine/core";
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

const start = async () => {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <MantineProvider>
        <Suspense fallback={<Loading />}>
          <RouterProvider router={router} />
        </Suspense>
      </MantineProvider>
    </StrictMode>,
  );
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
