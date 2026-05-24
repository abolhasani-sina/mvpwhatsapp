#!/bin/bash
set -e

echo " Starting deployment..."

cd /var/www/nabzchat/v2

echo " Pulling latest code..."
git reset --hard HEAD
git pull origin phase10/owner-panel

echo " Installing server dependencies..."
cd /var/www/nabzchat/v2/server
NODE_ENV=production npm install --omit=dev

echo " Building frontend..."
cd /var/www/nabzchat/v2/client
npm install
npm run build

echo " Restarting staging..."
pm2 restart nabzchat-staging --update-env 2>/dev/null || echo "staging not running"

echo " Restarting production..."
pm2 restart nabzchat --update-env

echo " Deployment complete!"

# Send Telegram notification
source /var/www/nabzchat/v2/server/.env
curl -s -X POST "https://api.telegram.org/bot${DEPLOY_BOT_TOKEN}/sendMessage" \
    -d chat_id="${DEPLOY_CHANNEL_ID}" \
    -d parse_mode="HTML" \
    -d text=" <b>Deploy started</b> branch: phase10/owner-panel" > /dev/null
