#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

echo "==> Setting up barbers dev environment"

# ─── .env ─────────────────────────────────────────────────────────────────────
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "    .env created from .env.example — review and adjust secrets before continuing"
else
  echo "    .env already exists, skipping"
fi

# ─── Dependencies ─────────────────────────────────────────────────────────────
echo "==> Installing npm dependencies"
npm install

# ─── Docker ───────────────────────────────────────────────────────────────────
echo "==> Starting Docker services (postgres, redis, minio)"
docker compose up -d postgres redis minio

echo "    Waiting for postgres to be healthy..."
until docker compose exec postgres pg_isready -U barbers -q; do
  sleep 1
done

# ─── Database ─────────────────────────────────────────────────────────────────
echo "==> Running Prisma migrations"
npx prisma migrate dev --name init --skip-seed

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Seeding database"
npx prisma db seed

echo ""
echo "==> Done! Start the full stack with:"
echo "    docker compose up"
echo ""
echo "    Or run services individually:"
echo "    npm run dev -w apps/api   (port 4000)"
echo "    npm run dev -w apps/web   (port 3000)"
echo ""
echo "    Seed credentials:"
echo "    Admin:  admin@barbers.dev / admin123"
echo "    Staff:  carlos@barbers.dev / staff123"
echo "    Client: cliente@barbers.dev / client123"
