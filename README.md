# Pathalogy Test Tracker App

Minimal scaffold for Pathalogy Test Tracker App — full-stack TypeScript app with React (Vite), Node/Express (TypeScript), PostgreSQL (Prisma), and an OCR FastAPI service. 

See folders:
- `frontend/` — React + Vite app
- `backend/` — Node + Express + Prisma
- `ocr/` — Python FastAPI OCR microservice

Quick start

1. Copy env files: `cp .env.example .env` and fill secrets
2. Install dependencies: `pnpm install`
3. Start services: `docker compose up --build -d`
4. Run migrations: `cd backend && pnpm prisma migrate dev --name init`
5. Seed admin user (optional): `cd backend && ADMIN_EMAIL=admin@example.com ADMIN_PASS=admin123 pnpm prisma db seed`
6. Start dev servers (if desired): `pnpm -w dev`

Background worker

- Requires Redis: set `REDIS_URL` (e.g., `redis://localhost:6379`) and optionally `OCR_URL` for OCR service host.
- To run worker locally: `cd backend && node dist/queue/index.js` (or run via ts-node in dev)
- The upload endpoint enqueues jobs and you can check status at `/api/jobs/:id`

Authentication

- Register: POST `/api/auth/register` { email, name, password, role }
- Login: POST `/api/auth/login` { email, password } -> returns JWT
- Use `Authorization: Bearer <token>` header for protected endpoints (e.g., `/api/upload`, `/api/patients/:id/tests`)

AES Key

- Generate AES key: `./scripts/generate_aes_key.sh` and set `AES_KEY` in `.env` and `backend/.env` (base64)

Security

- Revoke any leaked tokens and use `gh auth login` for GitHub operations.

License: MIT
