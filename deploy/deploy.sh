#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/lifelinex"
cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "ERROR: .env not found on server. Create /var/www/lifelinex/.env before deploying."
  exit 1
fi

# Non-secret endpoint for automated assessment delivery. The matching secret is
# configured directly on the server and is never committed to the repository.
if grep -q '^ASSESSMENT_WEBHOOK_URL=' .env; then
  sed -i 's|^ASSESSMENT_WEBHOOK_URL=.*|ASSESSMENT_WEBHOOK_URL="https://script.google.com/macros/s/AKfycbz0TtNT7HUma9xCrDAdZX-A4ePxvF0DVfIQHpsD3dUmLGaWxa2TFV5uRyq5-LrFsJSVqA/exec"|' .env
else
  printf '\nASSESSMENT_WEBHOOK_URL="https://script.google.com/macros/s/AKfycbz0TtNT7HUma9xCrDAdZX-A4ePxvF0DVfIQHpsD3dUmLGaWxa2TFV5uRyq5-LrFsJSVqA/exec"\n' >> .env
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
