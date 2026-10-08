# Secure Task Manager

Full-stack task manager built with security best practices.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Fastify + TypeScript + Zod |
| Database | PostgreSQL (Docker) |

## Structure

```
secure-task-manager/
├── frontend/          → React + Vite + TypeScript
├── backend/           → Fastify API
└── docker-compose.yml → PostgreSQL
```

## Getting started

Requirements: Node.js 22+ and Docker.

```bash
# 1. Environment variables
cp .env.example .env
cp backend/.env.example backend/.env

# 2. Database
docker compose up -d

# 3. Backend (http://localhost:3000)
cd backend
npm install
npm run dev

# 4. Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

## Security

- [x] Secrets in environment variables, validated at startup
- [x] Security headers (Helmet) and CORS restricted to the frontend
- [x] PostgreSQL exposed on localhost only
- [ ] Passwords hashed with argon2
- [ ] Sessions in `httpOnly` / `Secure` / `SameSite` cookies
- [ ] Input validation with Zod on every endpoint
- [ ] Per-user authorization on every resource
- [ ] Rate limiting on login
