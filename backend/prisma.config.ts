import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

// The Prisma CLI does not read .env by itself. Node's built-in loader is used
// (the same file the backend loads with --env-file). Without a .env file,
// e.g. in CI, the variables are expected to already be set.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // env() throws a clear error if DATABASE_URL is missing
    url: env("DATABASE_URL"),
  },
});
