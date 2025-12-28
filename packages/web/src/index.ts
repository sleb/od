import { serve } from "bun";
import index from "./index.html";

const server = serve({
  port: 3000,
  routes: {
    "/*": index,
  },
  development: true,
});

console.log(`🚀 Server running at ${server.url}`);
