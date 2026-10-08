import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { env } from "./env.js";
import { prisma } from "./db.js";
import { authRoutes } from "./routes/auth.js";

const app = Fastify({
  logger: true,
  // Cap the request body size to prevent abuse (100 KB)
  bodyLimit: 100 * 1024,
});

// Route schemas are written with Zod: these compilers make Fastify use Zod
// to validate requests and to check responses before sending them
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// HTTP security headers
await app.register(helmet);

// Only the frontend may call the API from the browser
await app.register(cors, {
  origin: env.FRONTEND_ORIGIN,
  credentials: true,
});

// A handler doesn't need to be async: Fastify also sends a plain return value
app.get("/health", () => ({ status: "ok" }));

await app.register(authRoutes, { prefix: "/auth" });

// Close the database connections when the server shuts down
app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

// Ctrl+C (SIGINT) or a stop from the host (SIGTERM): finish in-flight
// requests and close everything before exiting
async function shutdown() {
  try {
    await app.close();
    process.exit(0);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    // Signal listeners can't await; `void` marks that the promise is
    // intentionally not awaited (shutdown handles its own errors)
    void shutdown();
  });
}

try {
  await app.listen({ port: env.PORT, host: "127.0.0.1" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
