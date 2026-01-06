#!/bin/bash
# Deploy Master DB Migrations
# Usage: ./deploy-master.sh [database_url]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_DB_URL="postgresql://postgres:password@localhost:5432/rsm_master"
DB_URL="${1:-$DATABASE_URL}"
DB_URL="${DB_URL:-$DEFAULT_DB_URL}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../drizzle/migrations/master"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Master DB Migration Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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

# Extract database name from URL
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
echo -e "${BLUE}🎯 Target database:${NC} $DB_NAME"
echo ""

# Test database connection
echo -e "${YELLOW}⏳ Testing database connection...${NC}"
if ! psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}✗ Cannot connect to database${NC}"
    echo -e "${RED}  URL: $DB_URL${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Show current tables
echo -e "${YELLOW}📋 Current tables in $DB_NAME:${NC}"
psql "$DB_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | head -20
echo ""

# Confirmation prompt
echo -e "${YELLOW}⚠ This will apply migrations to: $DB_NAME${NC}"
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}⏳ Applying migrations...${NC}"
echo ""

# Apply each migration file
SUCCESS_COUNT=0
FAIL_COUNT=0

for migration_file in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration_file" ]; then
        filename=$(basename "$migration_file")
        echo -e "${BLUE}  📄 Applying: $filename${NC}"

        if psql "$DB_URL" -f "$migration_file" > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ Success${NC}"
            ((SUCCESS_COUNT++))
        else
            echo -e "${RED}  ✗ Failed${NC}"
            ((FAIL_COUNT++))

            # Show error details
            psql "$DB_URL" -f "$migration_file" 2>&1 | tail -5
        fi
        echo ""
    fi
done

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Deployment Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Successful: $SUCCESS_COUNT${NC}"
if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "${RED}✗ Failed: $FAIL_COUNT${NC}"
fi
echo ""

# Show final tables
echo -e "${YELLOW}📋 Final tables in $DB_NAME:${NC}"
TABLE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo -e "${BLUE}  Total tables: $TABLE_COUNT${NC}"
psql "$DB_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}🎉 Master DB deployment completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}⚠ Deployment completed with errors${NC}"
    exit 1
fi
