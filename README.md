# Secure Task Manager

Gestor de tareas full-stack construido con buenas prácticas de seguridad.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Fastify + TypeScript + Zod |
| Base de datos | PostgreSQL (Docker) |

## Estructura

```
secure-task-manager/
├── frontend/          → React + Vite + TypeScript
├── backend/           → API con Fastify
└── docker-compose.yml → PostgreSQL
```

## Puesta en marcha

Requisitos: Node.js 22+ y Docker.

```bash
# 1. Variables de entorno
cp .env.example .env
cp backend/.env.example backend/.env

# 2. Base de datos
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

## Seguridad

- [x] Secretos en variables de entorno, validadas al arrancar
- [x] Cabeceras de seguridad (Helmet) y CORS restringido al frontend
- [x] PostgreSQL expuesto solo en localhost
- [ ] Contraseñas con argon2
- [ ] Sesiones en cookies `httpOnly` / `Secure` / `SameSite`
- [ ] Validación de entrada con Zod en todos los endpoints
- [ ] Autorización por usuario en cada recurso
- [ ] Rate limiting en login
