# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Full-stack task manager whose explicit goal is to be built with good security practices. The project is at the initial-scaffold stage: the backend only exposes `GET /health`, the frontend is still the Vite template, and nothing connects to PostgreSQL yet. The security checklist in `README.md` is the roadmap (the open items are argon2 passwords, `httpOnly`/`Secure`/`SameSite` session cookies, Zod validation on every endpoint, per-user authorization on every resource, and login rate limiting). Tick items off there as they are implemented.

Code comments, README, and user-facing messages are in Spanish. Keep that convention.

## Layout

Two independent npm packages, with no root `package.json` or workspaces. Run commands from inside `backend/` or `frontend/`.

- `backend/`: Fastify 5 + TypeScript + Zod 4, ESM (`"type": "module"`, `module: NodeNext`)
- `frontend/`: React 19 + Vite 8 + TypeScript, linted with oxlint
- `docker-compose.yml`: PostgreSQL 17 only (the apps are not containerized)

## Commands

Requirements: Node.js 22+ and Docker.

```bash
# Setup (once)
cp .env.example .env                  # Postgres credentials, read by docker compose
cp backend/.env.example backend/.env  # backend runtime config

docker compose up -d                  # PostgreSQL on 127.0.0.1:${POSTGRES_PORT:-5432}

# backend/
npm run dev        # tsx watch, loads .env via --env-file (http://127.0.0.1:3000)
npm run typecheck  # tsc --noEmit
npm run build      # tsc -> dist/
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
- **Strict TS:** `strict` and `noUncheckedIndexedAccess` are on.
- **Security baseline in `server.ts`:** Helmet headers, CORS restricted to `FRONTEND_ORIGIN` with `credentials: true` (cookie-based sessions are planned), a 100 KB `bodyLimit`, and listening on `127.0.0.1` only. Keep these when adding routes or plugins.
- Postgres is likewise bound to `127.0.0.1` in `docker-compose.yml`, and the compose file fails fast (`${VAR:?}`) if the root `.env` is missing values.

## Rules

- **No `any`** and **No `unknown`** and validate it with Zod before using it.
- Explain me each important function or change, mainly in the backend because im not familiar with Fastify and Zod. I want to understand the code, not just have it written for me.
