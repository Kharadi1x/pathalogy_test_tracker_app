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

Authentication

- Register: POST `/api/auth/register` { email, name, password, role }
- Login: POST `/api/auth/login` { email, password } -> returns JWT
- Use `Authorization: Bearer <token>` header for protected endpoints (e.g., `/api/upload`, `/api/patients/:id/tests`)

AES Key

- Generate AES key: `./scripts/generate_aes_key.sh` and set `AES_KEY` in `.env` and `backend/.env` (base64)

Security

- Revoke any leaked tokens and use `gh auth login` for GitHub operations.

License: MIT
