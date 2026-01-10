# Suggested Commands - Recording Studio Manager

## Development Commands

### Starting the Application

```bash
# Recommended: Use start script (sets DATABASE_URL automatically)
./start.sh

# Alternative: Manual start with DATABASE_URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" pnpm dev

# Run packages separately (for debugging)
# Terminal 1 - Backend
DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" pnpm --filter server dev

# Terminal 2 - Frontend
pnpm --filter client dev
```

### Building

```bash
# Build all packages for production
pnpm build

# Build specific package
pnpm --filter client build
pnpm --filter server build
```

### Type Checking

```bash
# Check all packages (MUST have 0 errors)
pnpm check

# Check specific package
pnpm --filter database check
```

### Testing

```bash
# Run all unit tests
pnpm test

# Run unit tests for specific package
pnpm --filter database test

# Run unit tests with coverage
pnpm --filter database test:coverage

# Run unit tests in watch mode
pnpm --filter database test:watch

# Run E2E tests (Playwright)
npx playwright test

# Run E2E tests with UI
npx playwright test --ui

# Run specific E2E test file
npx playwright test e2e/crud/clients-enriched.spec.ts

# Run E2E tests in headed mode (visible browser)
npx playwright test --headed

# Run E2E tests in debug mode
npx playwright test --debug

# View Playwright HTML report
npx playwright show-report
```

### Code Formatting

```bash
# Format all files with Prettier
pnpm format
```

## Database Commands

### Migrations

```bash
# Generate new migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Seeding

```bash
# Initialize database with first organization
pnpm --filter database db:init

# Seed subscription plans
pnpm --filter database seed:plans

# Seed tenant data
pnpm --filter database seed:tenant
```

### Database Setup (Initial)

```bash
# Create master database
createdb rsm_master

# Apply migrations
pnpm db:migrate

# Seed initial data
pnpm --filter database db:init
```

## Docker Commands

### Development

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres
docker-compose up -d client
docker-compose up -d server

# View logs
docker-compose logs -f
docker-compose logs -f client
docker-compose logs -f server

# Stop all services
docker-compose down
```

### Production

```bash
# Build and start production environment
docker-compose -f docker-compose.production.yml up -d

# Stop production environment
docker-compose -f docker-compose.production.yml down
```

### Cache Management

```bash
# Clear Docker build cache (fixes stale UI issues)
docker builder prune -af
rm -rf packages/client/dist
docker-compose build --no-cache client
docker-compose restart client
```

## Package Management

```bash
# Install all dependencies
pnpm install

# Add dependency to specific package
pnpm --filter client add react-query
pnpm --filter server add express-rate-limit

# Add dev dependency
pnpm --filter client add -D @types/node

# Update all dependencies
pnpm update

# Remove dependency
pnpm --filter client remove package-name
```

## Utility Commands

### PostgreSQL (macOS/Darwin)

```bash
# Create database
createdb database_name

# Drop database
dropdb database_name

# Connect to database
psql -U postgres -d database_name

# List databases
psql -U postgres -l

# Execute SQL file
psql -U postgres -d database_name < file.sql

# Docker exec into PostgreSQL
docker exec -it rsm-postgres psql -U postgres -d rsm_master
```

### Git

```bash
# Standard commands work as expected
git status
git add .
git commit -m "message"
git push
```

### File Operations (Darwin)

```bash
# List files
ls -la

# Find files
find . -name "*.ts"

# Search in files
grep -r "pattern" packages/

# Change directory
cd packages/client
```

## Running Database Scripts

```bash
# Execute TypeScript scripts with tsx
pnpm --filter database tsx src/scripts/script-name.ts
```

## Health Checks

```bash
# Backend health check
curl http://localhost:3001/health

# Frontend (check if running)
curl http://localhost:5174
```

## shadcn/ui Component Installation

```bash
# Navigate to client package
cd packages/client

# Add shadcn/ui component
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog

# Return to root
cd ../..
```

## Stripe Webhook Testing (Local)

```bash
# Login to Stripe CLI
stripe login

# Forward webhooks to localhost
stripe listen --forward-to http://localhost:3001/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```
