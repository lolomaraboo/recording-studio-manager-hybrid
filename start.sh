#!/bin/bash

# Recording Studio Manager - Hybrid Version
# Startup script with DATABASE_URL configuration

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Add PostgreSQL to PATH if not already there
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

echo -e "${BLUE}🎵 Recording Studio Manager - Starting...${NC}"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 &>/dev/null; then
  echo -e "${YELLOW}⚠️  PostgreSQL not running on port 5432${NC}"
  echo -e "${YELLOW}   Starting PostgreSQL...${NC}"
  brew services start postgresql@17 &>/dev/null || brew services start postgresql &>/dev/null
  sleep 2
fi

# Check if rsm_master database exists
if ! psql -h localhost -p 5432 -U postgres -lqt | cut -d \| -f 1 | grep -qw rsm_master; then
  echo -e "${YELLOW}⚠️  Database rsm_master not found${NC}"
  echo -e "${YELLOW}   Please run: createdb rsm_master${NC}"
  echo -e "${YELLOW}   Then run: pnpm db:migrate${NC}"
  exit 1
fi

echo -e "${GREEN}✅ PostgreSQL ready${NC}"
echo -e "${GREEN}✅ Database rsm_master found${NC}"
echo ""

# Clean up any existing processes on ports 3001 and 5173
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
lsof -ti :3001 -ti :5173 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

echo -e "${BLUE}🚀 Starting development servers...${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}Backend:${NC}  http://localhost:3001"
echo -e "${BLUE}tRPC:${NC}     http://localhost:3001/api/trpc"
echo ""

# Export DATABASE_URL and start both client and server
export DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master"
pnpm dev
