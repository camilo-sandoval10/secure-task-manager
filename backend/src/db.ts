import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { env } from "./env.js";

// A single Prisma client shared by the whole app. It keeps a pool of
// connections open, so creating one per request would exhaust Postgres.
// The adapter is the driver Prisma uses to talk to PostgreSQL (node-postgres).
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
