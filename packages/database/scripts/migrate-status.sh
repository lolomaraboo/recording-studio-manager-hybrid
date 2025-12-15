#!/bin/bash
# Check Migration Status for All Databases
# Usage: ./migrate-status.sh [base_url]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_BASE_URL="postgresql://postgres:password@localhost:5432"
BASE_URL="${1:-$DEFAULT_BASE_URL}"

echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}  Database Migration Status${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Master DB Status
echo -e "${CYAN}━━ MASTER DATABASE ━━━━━━━━━━━━━━━━━━━━━${NC}"
MASTER_URL="$BASE_URL/rsm_master"

if psql "$MASTER_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ rsm_master: Connected${NC}"

    # Count tables
    TABLE_COUNT=$(psql "$MASTER_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    echo -e "${BLUE}  Tables: $TABLE_COUNT${NC}"

    # List tables
    echo -e "${YELLOW}  Table list:${NC}"
    psql "$MASTER_URL" -t -c "SELECT '    - ' || tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

    # Count foreign keys
    FK_COUNT=$(psql "$MASTER_URL" -t -c "SELECT COUNT(*) FROM pg_constraint WHERE contype = 'f';" | tr -d ' ')
    echo -e "${BLUE}  Foreign Keys: $FK_COUNT${NC}"

    # Expected: 6 tables, 6 FKs
    if [ "$TABLE_COUNT" -eq 6 ] && [ "$FK_COUNT" -eq 6 ]; then
        echo -e "${GREEN}  Status: ✓ Migrations applied${NC}"
    else
        echo -e "${YELLOW}  Status: ⚠ Partial or pending migrations${NC}"
    fi
else
    echo -e "${RED}✗ rsm_master: Connection failed${NC}"
fi

echo ""

# Tenant DBs Status
echo -e "${CYAN}━━ TENANT DATABASES ━━━━━━━━━━━━━━━━━━━${NC}"

for tenant in tenant_1 tenant_2 tenant_3; do
    TENANT_URL="$BASE_URL/$tenant"

    if psql "$TENANT_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $tenant: Connected${NC}"

        # Count tables
        TABLE_COUNT=$(psql "$TENANT_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
        echo -e "${BLUE}  Tables: $TABLE_COUNT${NC}"

        # Count foreign keys
        FK_COUNT=$(psql "$TENANT_URL" -t -c "SELECT COUNT(*) FROM pg_constraint WHERE contype = 'f';" | tr -d ' ')
        echo -e "${BLUE}  Foreign Keys: $FK_COUNT${NC}"

        # Expected: 15 tables, 21 FKs
        if [ "$TABLE_COUNT" -eq 15 ] && [ "$FK_COUNT" -eq 21 ]; then
            echo -e "${GREEN}  Status: ✓ Migrations applied${NC}"
        elif [ "$TABLE_COUNT" -eq 0 ]; then
            echo -e "${YELLOW}  Status: ⚠ Empty database${NC}"
        else
            echo -e "${YELLOW}  Status: ⚠ Partial migrations (expected 15 tables, 21 FKs)${NC}"
        fi
    else
        echo -e "${RED}✗ $tenant: Connection failed${NC}"
    fi

    echo ""
done

# Summary
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}  Summary${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Expected Master DB:${NC} 6 tables, 6 foreign keys"
echo -e "${BLUE}Expected Tenant DB:${NC} 15 tables, 21 foreign keys"
echo ""
