#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/lifelinex"
cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "ERROR: .env not found on server. Create /var/www/lifelinex/.env before deploying."
  exit 1
fi

# Non-secret destinations for automated assessment delivery.
if grep -q '^GOOGLE_ASSESSMENT_SHEET_ID=' .env; then
  sed -i 's/^GOOGLE_ASSESSMENT_SHEET_ID=.*/GOOGLE_ASSESSMENT_SHEET_ID="1eSQaJ4qQZ0VRie-tsblqZcdF1ZDD90rZpf6KDXZ2ikM"/' .env
else
  printf '\nGOOGLE_ASSESSMENT_SHEET_ID="1eSQaJ4qQZ0VRie-tsblqZcdF1ZDD90rZpf6KDXZ2ikM"\n' >> .env
fi
if grep -q '^ASSESSMENT_NOTIFY_EMAIL=' .env; then
  sed -i 's/^ASSESSMENT_NOTIFY_EMAIL=.*/ASSESSMENT_NOTIFY_EMAIL="lifelinex.doctor@gmail.com"/' .env
else
  printf 'ASSESSMENT_NOTIFY_EMAIL="lifelinex.doctor@gmail.com"\n' >> .env
fi

# The account address is safe to log and is needed once to share the private Sheet.
grep '^GOOGLE_SERVICE_ACCOUNT_EMAIL=' .env || true

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
