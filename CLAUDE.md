# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Full-stack task manager whose explicit goal is to be built with good security practices. The project is at an early stage: the backend exposes `GET /health` and `POST /auth/register` (no login or sessions yet), and the frontend is still the Vite template. The security checklist in `README.md` is the roadmap (the open items are `httpOnly`/`Secure`/`SameSite` session cookies, Zod validation on every endpoint, per-user authorization on every resource, and login rate limiting). Tick items off there as they are implemented.

Everything in the repository is written in English: code, comments, README, commit messages, and user-facing messages. Keep that convention.

## Layout

Two independent npm packages, with no root `package.json` or workspaces. Run commands from inside `backend/` or `frontend/`.

- `backend/`: Fastify 5 + TypeScript + Zod 4 + Prisma 7 (PostgreSQL), ESM (`"type": "module"`, `module: NodeNext`)
- `frontend/`: React 19 + Vite 8 + TypeScript, linted with oxlint
- `docker-compose.yml`: PostgreSQL 17 only (the apps are not containerized)

## Commands

Requirements: Node.js 22+ and Docker.

```bash
# Setup (once)
cp .env.example .env                  # Postgres credentials, read by docker compose
cp backend/.env.example backend/.env  # backend runtime config; DATABASE_URL must match the root .env

docker compose up -d                  # PostgreSQL on 127.0.0.1:${POSTGRES_PORT:-5432}

# backend/
npm run db:migrate   # prisma migrate dev: create/apply migrations + regenerate the client
npm run db:generate  # regenerate the Prisma Client only (needed after a fresh clone)
npm run db:deploy    # prisma migrate deploy: apply existing migrations (production/CI)
npm run dev        # tsx watch, loads .env via --env-file (http://127.0.0.1:3000)
npm run lint       # oxlint --deny-warnings (type-aware)
npm run typecheck  # tsc --noEmit
npm run build      # tsc -p tsconfig.build.json -> dist/
npm start          # node --env-file=.env dist/server.js

# frontend/
npm run dev        # Vite dev server (http://localhost:5173)
npm run lint       # oxlint
npm run build      # tsc -b && vite build
```

No test framework is configured yet in either package.

## Backend conventions

- **Env validation:** `backend/src/env.ts` parses `process.env` with a Zod schema and calls `process.exit(1)` on invalid config. Every new env var must be added to that schema and to `backend/.env.example`. Import config from `env`, never read `process.env` directly. Env files are loaded by Node's `--env-file` flag, not dotenv.
- **ESM imports:** relative imports must use the `.js` extension (e.g. `import { env } from "./env.js"`), as NodeNext resolution requires.
- **Strict TS:** `strict` and `noUncheckedIndexedAccess` are on. `tsconfig.json` covers `src/` plus `prisma.config.ts` (used by typecheck and lint); `tsconfig.build.json` extends it and compiles only `src/` into `dist/`. A new root-level `.ts` file must be added to `tsconfig.json`'s `include`, otherwise type-aware lint rules see it as untyped.
- **Lint:** both packages use oxlint, not ESLint: the backend is on TypeScript 7 (native Go compiler), whose missing JS API `typescript-eslint` requires. The backend config (`backend/.oxlintrc.json`) is type-aware via `oxlint-tsgolint` and enforces `no-explicit-any`, the `no-unsafe-*` rules, `no-floating-promises`, and `require-await`.
- **Security baseline in `server.ts`:** Helmet headers, CORS restricted to `FRONTEND_ORIGIN` with `credentials: true` (cookie-based sessions are planned), a 100 KB `bodyLimit`, and listening on `127.0.0.1` only. Keep these when adding routes or plugins.
- **Routes:** each group of routes is a Fastify plugin in `src/routes/` (`FastifyPluginCallbackZod` calling `done()`, or `FastifyPluginAsyncZod` only if it awaits something, since SonarQube flags async functions without `await`), registered in `server.ts` with a prefix (`authRoutes` → `/auth`). `server.ts` sets the Zod validator/serializer compilers from `fastify-type-provider-zod`, so route `schema.body`/`params`/`query` are Zod schemas that type `request.*`, and `schema.response` schemas (per status code) restrict what is sent back. Always declare response schemas so internal fields such as `passwordHash` cannot leak.
- **Database:** `src/db.ts` exports the single `prisma` client (Prisma 7 with the `@prisma/adapter-pg` driver adapter); it is disconnected in the server's `onClose` hook. The schema is `backend/prisma/schema.prisma`; the client is generated into `backend/src/generated/prisma` (gitignored) and imported from `./generated/prisma/client.js`. `backend/prisma.config.ts` loads `.env` with `process.loadEnvFile` because the Prisma CLI doesn't read it. Migrations in `prisma/migrations/` are committed.
- **Errors:** handle unique-constraint conflicts by catching `Prisma.PrismaClientKnownRequestError` with code `P2002` (narrowed with `instanceof`), not by checking for existence before inserting.
- **Request bodies:** use `z.strictObject` so unknown keys are rejected with a 400.
- **Passwords:** hashed with `argon2` (argon2id) before any database access.
- Postgres is likewise bound to `127.0.0.1` in `docker-compose.yml`, and the compose file fails fast (`${VAR:?}`) if the root `.env` is missing values.

## Rules

- **No `any` and no `unknown`** anywhere in the code. External data (request body, params, query) gets its types from Zod schemas through a Fastify Zod type provider, never from hand-written types.
- **Zero warnings:** files must have no SonarQube warnings and no linter warnings (ESLint/oxlint). Run `npm run lint` and `npm run typecheck` in each package you touch, and fix SonarQube issues reported by the IDE, before considering a change done; don't silence a rule unless the user agrees.
- Explain every important function or change, especially in the backend: the user is not yet familiar with Fastify and Zod and wants to understand the code, not just have it written for them.
