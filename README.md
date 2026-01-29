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
5. Start dev servers (if desired): `pnpm -w dev`

Security

- Revoke any leaked tokens and use `gh auth login` for GitHub operations.

License: MIT
