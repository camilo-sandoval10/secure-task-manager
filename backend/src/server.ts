import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { env } from "./env.js";

const app = Fastify({
  logger: true,
  // Cap the request body size to prevent abuse (100 KB)
  bodyLimit: 100 * 1024,
});

// HTTP security headers
await app.register(helmet);

// Only the frontend may call the API from the browser
await app.register(cors, {
  origin: env.FRONTEND_ORIGIN,
  credentials: true,
});

app.get("/health", async () => ({ status: "ok" }));

try {
  await app.listen({ port: env.PORT, host: "127.0.0.1" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
