#!/bin/bash

# Deploy authentication fix to production VPS
# Usage: ./scripts/deploy-auth-fix.sh

set -e

VPS_IP="31.220.104.244"
VPS_USER="root"
APP_DIR="/root/recording-studio-manager-hybrid"

echo "🚀 Deploying authentication fix to production..."

# 1. Push latest changes to GitHub
echo ""
echo "1️⃣ Pushing changes to GitHub..."
git push origin main

# 2. SSH into VPS and pull latest changes
echo ""
echo "2️⃣ Pulling latest changes on VPS..."
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
cd /root/recording-studio-manager-hybrid
git pull origin main

echo ""
echo "3️⃣ Rebuilding server container..."
docker-compose -f docker-compose.production.yml build --no-cache server

echo ""
echo "4️⃣ Restarting server..."
docker-compose -f docker-compose.production.yml up -d server

echo ""
echo "5️⃣ Checking server health..."
sleep 5
docker logs rsm-server --tail 20

echo ""
echo "6️⃣ Testing health endpoint..."
curl http://localhost:3000/health
ENDSSH

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Test authentication at: https://recording-studio-manager.com/login"
