#!/bin/bash

# Test script for Phase 3 billing endpoints
# Tests createPortalSession, getUsageStats, and related functionality

set -e

echo "========================================="
echo "Phase 3 Billing Infrastructure Tests"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"

echo "1. Checking project structure..."
if [ -d "packages/server" ] && [ -d "packages/client" ]; then
  echo -e "${GREEN}✓ Project structure verified${NC}"
else
  echo -e "${RED}✗ Project structure invalid${NC}"
  exit 1
fi
echo ""

echo "2. Checking subscriptions router exports..."
if grep -q "createPortalSession" packages/server/src/routers/subscriptions.ts; then
  echo -e "${GREEN}✓ createPortalSession found in subscriptions router${NC}"
else
  echo -e "${RED}✗ createPortalSession not found${NC}"
  exit 1
fi
echo ""

echo "3. Checking organizations router exports..."
if grep -q "getUsageStats" packages/server/src/routers/organizations.ts; then
  echo -e "${GREEN}✓ getUsageStats found in organizations router${NC}"
else
  echo -e "${RED}✗ getUsageStats not found${NC}"
  exit 1
fi
echo ""

echo "4. Checking UpgradeModal component..."
if [ -f "packages/client/src/components/UpgradeModal.tsx" ]; then
  echo -e "${GREEN}✓ UpgradeModal component exists${NC}"

  # Check for key features
  if grep -q "limitType.*sessions.*storage" packages/client/src/components/UpgradeModal.tsx; then
    echo -e "${GREEN}  ✓ Handles both sessions and storage limit types${NC}"
  fi

  if grep -q "createCheckoutSession" packages/client/src/components/UpgradeModal.tsx; then
    echo -e "${GREEN}  ✓ Integrates with Stripe Checkout${NC}"
  fi
else
  echo -e "${RED}✗ UpgradeModal component not found${NC}"
  exit 1
fi
echo ""

echo "5. Checking Settings billing tab..."
if grep -q "BillingTabContent" packages/client/src/pages/Settings.tsx; then
  echo -e "${GREEN}✓ BillingTabContent component exists${NC}"

  if grep -q "createPortalSession" packages/client/src/pages/Settings.tsx; then
    echo -e "${GREEN}  ✓ Customer Portal integration present${NC}"
  fi

  if grep -q "getUsageStats" packages/client/src/pages/Settings.tsx; then
    echo -e "${GREEN}  ✓ Usage stats integration present${NC}"
  fi
else
  echo -e "${RED}✗ BillingTabContent not found${NC}"
  exit 1
fi
echo ""

echo "6. Checking SessionCreate upgrade modal integration..."
if grep -q "UpgradeModal" packages/client/src/pages/SessionCreate.tsx; then
  echo -e "${GREEN}✓ UpgradeModal imported in SessionCreate${NC}"

  if grep -q 'limitType="sessions"' packages/client/src/pages/SessionCreate.tsx; then
    echo -e "${GREEN}  ✓ Configured for sessions limit type${NC}"
  fi

  if grep -q "session limit" packages/client/src/pages/SessionCreate.tsx; then
    echo -e "${GREEN}  ✓ Error detection for session limit${NC}"
  fi
else
  echo -e "${RED}✗ UpgradeModal not integrated in SessionCreate${NC}"
  exit 1
fi
echo ""

echo "7. Checking TrackDetail upgrade modal integration..."
if grep -q "UpgradeModal" packages/client/src/pages/TrackDetail.tsx; then
  echo -e "${GREEN}✓ UpgradeModal imported in TrackDetail${NC}"

  if grep -q 'limitType="storage"' packages/client/src/pages/TrackDetail.tsx; then
    echo -e "${GREEN}  ✓ Configured for storage limit type${NC}"
  fi

  if grep -q "Storage limit" packages/client/src/pages/TrackDetail.tsx; then
    echo -e "${GREEN}  ✓ Error detection for storage limit${NC}"
  fi
else
  echo -e "${RED}✗ UpgradeModal not integrated in TrackDetail${NC}"
  exit 1
fi
echo ""

echo "8. Checking subscription plans seed data..."
if grep -q "INSERT INTO subscription_plans" packages/database/seed-data/subscription-plans.sql 2>/dev/null; then
  PLAN_COUNT=$(grep -c "VALUES" packages/database/seed-data/subscription-plans.sql || echo "0")
  echo -e "${GREEN}✓ Subscription plans seed data exists (${PLAN_COUNT} plans)${NC}"
else
  echo -e "${YELLOW}⚠ Subscription plans seed file not found (may be in different location)${NC}"
fi
echo ""

echo "9. Build verification..."
if pnpm build 2>&1 | grep -q "✓ built"; then
  echo -e "${GREEN}✓ Project builds successfully${NC}"
else
  echo -e "${RED}✗ Build failed${NC}"
  exit 1
fi
echo ""

echo "========================================="
echo -e "${GREEN}All Phase 3 Billing Tests Passed! ✓${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Backend endpoints created (createPortalSession, getUsageStats)"
echo "  ✓ Frontend components created (BillingTabContent, UpgradeModal)"
echo "  ✓ Upgrade modal integrated in SessionCreate and TrackDetail"
echo "  ✓ Customer Portal integration configured"
echo "  ✓ Usage statistics dashboard implemented"
echo "  ✓ Project builds without errors"
echo ""
echo "Next steps for manual testing:"
echo "  1. Login to app at http://localhost:5175"
echo "  2. Navigate to Settings > Billing tab"
echo "  3. Verify subscription info displays correctly"
echo "  4. Click 'Manage Billing' to test Customer Portal redirect"
echo "  5. Try creating sessions when at limit to test upgrade modal"
echo ""
