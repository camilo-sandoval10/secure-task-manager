import argon2 from "argon2";
import { z } from "zod";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { prisma } from "../db.js";
import { Prisma } from "../generated/prisma/client.js";

// strictObject rejects unknown keys with a 400 instead of silently dropping them
const registerBodySchema = z.strictObject({
  // Normalize first (trim + lowercase), then check the format, so that
  // " Ana@X.com" and "ana@x.com" end up as the same account
  email: z.string().trim().toLowerCase().pipe(z.email()),
  // Not trimmed: spaces are valid password characters.
  // The max length stops huge inputs from making argon2 do extra work.
  password: z.string().min(12).max(128),
});

const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  createdAt: z.date(),
});

const errorSchema = z.object({
  error: z.string(),
});

// A Fastify plugin groups related routes. It's registered in server.ts with
// the "/auth" prefix, so "/register" here becomes POST /auth/register.
// Callback style: the plugin awaits nothing, so it calls done() when its
// routes are declared instead of being an async function.
export const authRoutes: FastifyPluginCallbackZod = (app, _options, done) => {
  app.post(
    "/register",
    {
      // Fastify validates the body against this schema BEFORE the handler
      // runs (an invalid body gets an automatic 400), and the response is
      // checked against the schema of its status code before being sent.
      schema: {
        body: registerBodySchema,
        response: {
          201: publicUserSchema,
          409: errorSchema,
        },
      },
    },
    async (request, reply) => {
      // Already validated and typed as { email: string; password: string }
      const { email, password } = request.body;

      // argon2id with a random salt; the salt and parameters are stored
      // inside the resulting string, so a single column is enough.
      // Hashing before touching the database also makes new and duplicate
      // emails take similar time, so response time doesn't reveal which is which.
      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

      try {
        const user = await prisma.user.create({
          data: { email, passwordHash },
          // Only read back public fields: passwordHash never leaves this function
          select: { id: true, email: true, createdAt: true },
        });
        return reply.code(201).send(user);
      } catch (err) {
        // P2002 = unique constraint violated: the email is already registered.
        // Relying on the database constraint (instead of checking first and
        // then inserting) also covers two simultaneous requests for one email.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return reply.code(409).send({ error: "Email already registered" });
        }
        throw err;
      }
    },
  );

  done();
};
