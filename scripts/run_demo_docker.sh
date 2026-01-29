#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.docker"

echo "== Pathalogy demo helper =="

echo "Checking Docker..."
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed or not on PATH. Install Docker Desktop and retry." >&2
  exit 2
fi

if ! docker version >/dev/null 2>&1; then
  echo "ERROR: docker daemon not reachable. Make sure Docker Desktop is running." >&2
  exit 2
fi

if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose not found. Modern Docker Desktop provides 'docker compose'." >&2
  exit 2
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Create it with AES_KEY and JWT_SECRET. See .env.docker.example or run the generator below:" >&2
  echo
  echo "  python3 - <<'PY'"
  echo "  import base64, os"
  echo "  print(base64.b64encode(os.urandom(32)).decode())"
  echo "  PY"
  exit 2
fi

# quick check AES_KEY looks like base64 32-bytes
AES_KEY=$(grep -E '^AES_KEY=' "$ENV_FILE" | cut -d'=' -f2- || true)
if [ -z "$AES_KEY" ]; then
  echo "WARNING: AES_KEY is empty in $ENV_FILE" >&2
fi

echo "Bringing up Docker Compose stack (Postgres, Redis, Backend, Frontend, OCR)"
# prefer `docker compose` if available
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
else
  DOCKER_COMPOSE_CMD="docker-compose"
fi

$DOCKER_COMPOSE_CMD --env-file "$ENV_FILE" up -d --build

# Wait for backend /health to respond
echo "Waiting for backend to become healthy (http://localhost:4000/health)..."
for i in {1..40}; do
  if curl -sS http://localhost:4000/health >/dev/null 2>&1; then
    echo "Backend is up"
    break
  fi
  echo -n '.'
  sleep 2
done

if ! curl -sS http://localhost:4000/health >/dev/null 2>&1; then
  echo
  echo "WARNING: backend did not become healthy within timeout. Check logs with:"
  echo "  $DOCKER_COMPOSE_CMD logs -f backend"
  exit 1
fi

# Run migrations (non-fatal if they need manual attention)
echo "Running backend migrations (may be interactive)"
set +e
$DOCKER_COMPOSE_CMD exec backend pnpm run migrate || echo "Note: migrations may need manual intervention or you can run prisma db push inside the container."
set -e

# Post a demo upload
echo "Posting demo upload to /api/upload"
CURL_OUT=$(curl -sS -w "%{http_code}" -o /tmp/_upload_response.json -F "patientName=Demo User" -F "file=@$ROOT_DIR/backend/tests/fixtures/sample_report_6.txt" http://localhost:4000/api/upload)
HTTP_CODE=${CURL_OUT:(-3)}

if [ "$HTTP_CODE" = "200" ]; then
  echo "Upload accepted, response:" && cat /tmp/_upload_response.json
else
  echo "Upload failed with HTTP $HTTP_CODE; response:" && cat /tmp/_upload_response.json
  echo "Check backend logs: $DOCKER_COMPOSE_CMD logs -f backend"
  exit 1
fi

# Tail backend logs so the user can watch worker processing
echo "Tailing backend logs (press Ctrl+C to stop)"
$DOCKER_COMPOSE_CMD logs -f backend
