#!/bin/bash

# UptimeRobot Monitor Setup Script
# This script creates UptimeRobot monitors for the Recording Studio Manager health endpoints

set -e

# Configuration
DOMAIN="https://recording-studio-manager.com"
UPTIMEROBOT_API_KEY="${UPTIMEROBOT_API_KEY:-}"

if [ -z "$UPTIMEROBOT_API_KEY" ]; then
    echo "❌ Error: UPTIMEROBOT_API_KEY environment variable not set"
    echo ""
    echo "To get your API key:"
    echo "1. Go to https://uptimerobot.com/dashboard"
    echo "2. Click 'My Settings' -> 'API Settings'"
    echo "3. Generate a Main API Key"
    echo ""
    echo "Then run:"
    echo "export UPTIMEROBOT_API_KEY='your-api-key-here'"
    echo "./scripts/setup-uptimerobot.sh"
    exit 1
fi

echo "🚀 Setting up UptimeRobot monitors for Recording Studio Manager..."
echo ""

# Monitor 1: Basic Health Check
echo "📊 Creating monitor: Basic Health Check..."
RESPONSE=$(curl -s -X POST https://api.uptimerobot.com/v2/newMonitor \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=${UPTIMEROBOT_API_KEY}" \
  -d "format=json" \
  -d "type=1" \
  -d "url=${DOMAIN}/api/health" \
  -d "friendly_name=RSM - Basic Health" \
  -d "interval=300" \
  -d "keyword_type=2" \
  -d "keyword_value=\"status\":\"ok\"")

if echo "$RESPONSE" | grep -q '"stat":"ok"'; then
    echo "✅ Basic Health monitor created"
else
    echo "⚠️  Basic Health monitor may already exist or error occurred"
    echo "$RESPONSE" | jq .
fi

# Monitor 2: Database Health Check
echo ""
echo "📊 Creating monitor: Database Health Check..."
RESPONSE=$(curl -s -X POST https://api.uptimerobot.com/v2/newMonitor \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=${UPTIMEROBOT_API_KEY}" \
  -d "format=json" \
  -d "type=1" \
  -d "url=${DOMAIN}/api/health/db" \
  -d "friendly_name=RSM - Database Health" \
  -d "interval=300" \
  -d "keyword_type=2" \
  -d "keyword_value=\"service\":\"postgresql\"")

if echo "$RESPONSE" | grep -q '"stat":"ok"'; then
    echo "✅ Database Health monitor created"
else
    echo "⚠️  Database Health monitor may already exist or error occurred"
    echo "$RESPONSE" | jq .
fi

# Monitor 3: Redis Health Check
echo ""
echo "📊 Creating monitor: Redis Health Check..."
RESPONSE=$(curl -s -X POST https://api.uptimerobot.com/v2/newMonitor \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=${UPTIMEROBOT_API_KEY}" \
  -d "format=json" \
  -d "type=1" \
  -d "url=${DOMAIN}/api/health/redis" \
  -d "friendly_name=RSM - Redis Health" \
  -d "interval=300" \
  -d "keyword_type=2" \
  -d "keyword_value=\"service\":\"redis\"")

if echo "$RESPONSE" | grep -q '"stat":"ok"'; then
    echo "✅ Redis Health monitor created"
else
    echo "⚠️  Redis Health monitor may already exist or error occurred"
    echo "$RESPONSE" | jq .
fi

# Monitor 4: Full System Health Check
echo ""
echo "📊 Creating monitor: Full System Health..."
RESPONSE=$(curl -s -X POST https://api.uptimerobot.com/v2/newMonitor \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=${UPTIMEROBOT_API_KEY}" \
  -d "format=json" \
  -d "type=1" \
  -d "url=${DOMAIN}/api/health/full" \
  -d "friendly_name=RSM - Full System Health" \
  -d "interval=300" \
  -d "keyword_type=2" \
  -d "keyword_value=\"status\":\"ok\"")

if echo "$RESPONSE" | grep -q '"stat":"ok"'; then
    echo "✅ Full System Health monitor created"
else
    echo "⚠️  Full System Health monitor may already exist or error occurred"
    echo "$RESPONSE" | jq .
fi

echo ""
echo "🎉 UptimeRobot setup complete!"
echo ""
echo "📋 Monitors created:"
echo "  • RSM - Basic Health (${DOMAIN}/api/health)"
echo "  • RSM - Database Health (${DOMAIN}/api/health/db)"
echo "  • RSM - Redis Health (${DOMAIN}/api/health/redis)"
echo "  • RSM - Full System Health (${DOMAIN}/api/health/full)"
echo ""
echo "📊 View your monitors at: https://uptimerobot.com/dashboard"
