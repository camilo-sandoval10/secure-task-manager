import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { env } from "./env.js";

const app = Fastify({
  logger: true,
  // Limita el tamaño del body para evitar abusos (100 KB)
  bodyLimit: 100 * 1024,
});

// Cabeceras de seguridad HTTP
await app.register(helmet);

// Solo el frontend puede llamar a la API desde el navegador
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
