#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/lifelinex"
cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "ERROR: .env not found on server. Create /var/www/lifelinex/.env before deploying."
  exit 1
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building app"
npm run build

echo "==> Syncing database schema"
npx prisma db push

echo "==> Restarting PM2"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

echo "==> Deploy complete"
