#!/bin/bash
# Deploy Tenant DB Migrations to Multiple Tenants
# Usage: ./deploy-tenants.sh [base_url] [tenant_list]
#
# Examples:
#   ./deploy-tenants.sh postgresql://postgres:password@localhost:5432 "tenant_1 tenant_2 tenant_3"
#   ./deploy-tenants.sh  # Uses defaults

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_BASE_URL="postgresql://postgres:password@localhost:5432"
BASE_URL="${1:-$DEFAULT_BASE_URL}"

# Default tenant list (can be overridden)
DEFAULT_TENANTS="tenant_1 tenant_2 tenant_3"
TENANTS="${2:-$DEFAULT_TENANTS}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../drizzle/migrations/tenant"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Tenant DB Migration Deployment${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verify migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}✗ Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Count migration files
MIGRATION_COUNT=$(find "$MIGRATIONS_DIR" -name "*.sql" | wc -l | tr -d ' ')
echo -e "${BLUE}📁 Migrations directory:${NC} $MIGRATIONS_DIR"
echo -e "${BLUE}📊 Migration files found:${NC} $MIGRATION_COUNT"
echo ""

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠ No migration files found${NC}"
    exit 0
fi

# Convert tenant string to array
TENANT_ARRAY=($TENANTS)
TENANT_COUNT=${#TENANT_ARRAY[@]}

echo -e "${BLUE}🎯 Target tenants ($TENANT_COUNT):${NC}"
for tenant in "${TENANT_ARRAY[@]}"; do
    echo -e "  - $tenant"
done
echo ""

# Test connection to first tenant
FIRST_TENANT="${TENANT_ARRAY[0]}"
TEST_URL="$BASE_URL/$FIRST_TENANT"
echo -e "${YELLOW}⏳ Testing database connection ($FIRST_TENANT)...${NC}"
if ! psql "$TEST_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}✗ Cannot connect to database${NC}"
    echo -e "${RED}  URL: $TEST_URL${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Show migration preview
echo -e "${YELLOW}📋 Migrations to apply:${NC}"
for migration_file in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration_file" ]; then
        filename=$(basename "$migration_file")
        echo -e "  - $filename"
    fi
done
echo ""

# Confirmation prompt
echo -e "${YELLOW}⚠ This will apply migrations to $TENANT_COUNT tenant database(s)${NC}"
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

echo ""

# Track overall statistics
TOTAL_SUCCESS=0
TOTAL_FAIL=0
FAILED_TENANTS=()

# Apply migrations to each tenant
for tenant in "${TENANT_ARRAY[@]}"; do
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Processing: $tenant${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    TENANT_URL="$BASE_URL/$tenant"

    # Show current tables
    echo -e "${YELLOW}📋 Current tables in $tenant:${NC}"
    CURRENT_COUNT=$(psql "$TENANT_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    echo -e "  Tables: $CURRENT_COUNT"
    echo ""

    # Apply each migration file
    SUCCESS_COUNT=0
    FAIL_COUNT=0

    for migration_file in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$migration_file" ]; then
            filename=$(basename "$migration_file")
            echo -e "${BLUE}  📄 Applying: $filename${NC}"

            if psql "$TENANT_URL" -f "$migration_file" > /dev/null 2>&1; then
                echo -e "${GREEN}  ✓ Success${NC}"
                ((SUCCESS_COUNT++))
            else
                echo -e "${RED}  ✗ Failed${NC}"
                ((FAIL_COUNT++))

                # Show error details
                echo -e "${RED}  Error details:${NC}"
                psql "$TENANT_URL" -f "$migration_file" 2>&1 | tail -3 | sed 's/^/    /'
            fi
            echo ""
        fi
    done

    # Show final tables for this tenant
    FINAL_COUNT=$(psql "$TENANT_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    echo -e "${BLUE}📊 $tenant Summary:${NC}"
    echo -e "  ${GREEN}✓ Successful: $SUCCESS_COUNT${NC}"
    if [ "$FAIL_COUNT" -gt 0 ]; then
        echo -e "  ${RED}✗ Failed: $FAIL_COUNT${NC}"
        FAILED_TENANTS+=("$tenant")
    fi
    echo -e "  ${BLUE}Tables: $CURRENT_COUNT → $FINAL_COUNT${NC}"
    echo ""

    # Update totals
    TOTAL_SUCCESS=$((TOTAL_SUCCESS + SUCCESS_COUNT))
    TOTAL_FAIL=$((TOTAL_FAIL + FAIL_COUNT))
done

# Final Summary
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Overall Deployment Summary${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Tenants processed: $TENANT_COUNT${NC}"
echo -e "${GREEN}✓ Total successful migrations: $TOTAL_SUCCESS${NC}"
if [ "$TOTAL_FAIL" -gt 0 ]; then
    echo -e "${RED}✗ Total failed migrations: $TOTAL_FAIL${NC}"
    echo -e "${RED}Failed tenants: ${FAILED_TENANTS[*]}${NC}"
fi
echo ""

if [ "$TOTAL_FAIL" -eq 0 ]; then
    echo -e "${GREEN}🎉 All tenant deployments completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}⚠ Some deployments failed. Check logs above.${NC}"
    exit 1
fi
