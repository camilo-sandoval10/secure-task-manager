import { z } from "zod";

// Validamos las variables de entorno al arrancar:
// si falta algo o tiene un formato incorrecto, la app no arranca.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_ORIGIN: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:", z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
