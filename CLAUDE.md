# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Recording Studio Manager - Hybrid Version: A multi-tenant SaaS application for managing recording studios with **Database-per-Tenant architecture** using React 19, TypeScript, tRPC 11, and PostgreSQL.

**Key Architectural Principle:** Each organization has a physically separate PostgreSQL database for complete data isolation (unlike shared-database multi-tenancy).

## Architecture

### Monorepo Structure (pnpm workspaces)

```
packages/
├── shared/      # Shared types and utilities
├── database/    # Drizzle ORM + PostgreSQL schemas
├── server/      # Express + tRPC backend
└── client/      # React 19 + Vite frontend
```

### Database-per-Tenant Architecture

**CRITICAL:** This is NOT commented out code - it's active from day 1.

- **Master DB** (`rsm_master`): Contains users, organizations, tenant_databases mapping, organization_members, invitations, subscription_plans
- **Tenant DBs** (`tenant_1`, `tenant_2`, etc.): Each organization gets its own database containing clients, sessions, invoices, equipment, rooms, projects

**Key Files:**
- `packages/database/src/connection.ts`: Contains `getTenantDb(organizationId)` function (lines 70-128) - This is ACTIVE, not commented
- `packages/server/src/routers/*.ts`: All routers use `ctx.getTenantDb()` to access tenant-specific data

### tRPC Context Pattern

All server-side procedures receive a context with:
- `ctx.userId`: Current authenticated user ID
- `ctx.organizationId`: Current organization ID
- `ctx.getTenantDb()`: Function to get the tenant-specific database connection

Example from routers:
```typescript
const tenantDb = await ctx.getTenantDb();
const clients = await tenantDb.query.clients.findMany();
```

## Development Commands

### Initial Setup

```bash
# Install dependencies
pnpm install

# Create master database
createdb rsm_master

# Apply migrations
pnpm db:migrate

# Seed initial data (creates first org + tenant DB)
pnpm --filter database db:init
```

### Development

```bash
# Start both frontend and backend (recommended)
./start.sh

# OR manually with DATABASE_URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" pnpm dev

# OR run packages separately
DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" pnpm --filter server dev
pnpm --filter client dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- tRPC endpoint: http://localhost:3001/api/trpc
- Health check: http://localhost:3001/health

### Development Authentication

In development mode, authentication uses test headers (automatically added by client):
- `x-test-user-id: 1`
- `x-test-org-id: 1`

See `packages/client/src/main.tsx` for the tRPC client setup.

### Type Checking & Testing

```bash
# Type check all packages (must have 0 errors)
pnpm check

# Build production bundles
pnpm build

# Run all unit tests
pnpm test

# Run tests for specific package
pnpm --filter database test

# Run tests with coverage
pnpm --filter database test:coverage

# Run tests in watch mode
pnpm --filter database test:watch
```

### Database Commands

```bash
# Generate new migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Seed subscription plans
pnpm --filter database seed:plans

# Seed tenant data
pnpm --filter database seed:tenant
```

### E2E Testing (Playwright)

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/crud/clients-enriched.spec.ts

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# View HTML report
npx playwright show-report
```

**E2E Test Configuration:**
- Config: `playwright.config.ts`
- Test directory: `e2e/`
- Global setup: `e2e/global-setup.ts` (creates test user before all tests)
- Default browser: Chromium (headless: false for visibility)
- Base URL: `https://recording-studio-manager.com` (production) or override with `BASE_URL` env var

**Test Credentials (created by global-setup):**
- Email: `e2e-test-user@example.com`
- Password: `E2ETestPass123!`
- Studio: `E2E Test Studio`

## Critical Development Patterns

### 1. Docker Build Cache Issues

**Known Issue:** When UI changes don't appear in Docker containers, it's likely stale build cache.

**Solution (from Phase 3.10-01):**
```bash
# Full cache clear
docker builder prune -af
rm -rf packages/client/dist
docker-compose build --no-cache client
docker-compose restart client
```

### 2. Adding New Tenant Tables

When adding tables to tenant databases:

1. Define schema in `packages/database/src/tenant/schema.ts`
2. Generate migration: `pnpm db:generate`
3. **IMPORTANT:** Migrations only apply to NEW tenant databases
4. Existing tenant databases require manual migration or script

### 3. Creating New Organizations

Creating an organization automatically:
1. Inserts record in `master.organizations`
2. Creates new PostgreSQL database (`tenant_N`)
3. Registers mapping in `master.tenant_databases`
4. Applies full tenant schema to new database

### 4. tRPC Router Pattern

All routers follow this pattern:
```typescript
export const myRouter = router({
  myQuery: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      // Query tenant-specific data
      return tenantDb.query.myTable.findFirst(...);
    }),
});
```

### 5. vCard 4.0 Support (RFC 6350)

Clients support enriched vCard fields for import/export:

**Structured Name Fields:**
- `prefix` (e.g., "Mr.", "Dr.")
- `firstName`, `middleName`, `lastName`, `suffix`
- `artistName` (for performers/artists)

**Array Fields (JSON in PostgreSQL):**
- `phones: { type, number }[]`
- `emails: { type, email }[]`
- `websites: { type, url }[]`
- `addresses: { type, street, city, state, postalCode, country }[]`
- `customFields: { label, value }[]`

**Service Files:**
- `packages/server/src/utils/vcard-service.ts`: vCard import/export
- `packages/server/src/utils/excel-service.ts`: Excel import/export
- `packages/server/src/utils/csv-service.ts`: CSV import/export

### 6. Client Type System

Clients can be either:
- `individual`: Artists, performers, session musicians
- `company`: Record labels, management companies, production houses

Different UI fields are shown based on type:
- Individual: artistName, structured name fields
- Company: companyName, industry, registrationNumber

## Package-Specific Notes

### @rsm/database

- Uses Drizzle ORM with postgres driver
- Two schema files: `master/schema.ts` and `tenant/schema.ts`
- Connection manager maintains singleton Master DB and cached Tenant DB connections
- All scripts in `src/scripts/` use tsx for TypeScript execution

**Running database scripts:**
```bash
pnpm --filter database tsx src/scripts/[script-name].ts
```

### @rsm/server

- Express server with tRPC middleware
- Uses `tsx` for both dev and production (no build step)
- All routers in `src/routers/` automatically use tenant context
- Health check endpoint: `/health`

**Environment Variables Required:**
- `DATABASE_URL`: PostgreSQL connection string for master DB
- Other vars in `packages/server/.env.example`

### @rsm/client

- React 19 with TypeScript strict mode
- Vite 7 for bundling
- TailwindCSS 4 + shadcn/ui components
- Wouter for client-side routing
- tRPC client with automatic type inference

**Adding shadcn/ui components:**
```bash
# From project root
cd packages/client
npx shadcn@latest add [component-name]
```

## Common Issues & Solutions

### Issue: "DATABASE_URL not configured"

**Solution:** Always set DATABASE_URL when running server:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" pnpm --filter server dev
```

Or use `./start.sh` which sets it automatically.

### Issue: TypeScript errors in strict mode

This project uses strict TypeScript (`strict: true`). All packages must type-check with 0 errors.

**Validate before committing:**
```bash
pnpm check
```

### Issue: Tenant database not found for organization X

**Solution:** The organization needs a tenant database created:
```typescript
import { createTenantDatabase } from '@rsm/database/connection';
await createTenantDatabase(organizationId);
```

This is automatically done during organization creation in production code.

### Issue: Changes not appearing in Docker

See "Docker Build Cache Issues" section above.

## Testing Philosophy

### Unit Tests (Vitest)

- Located in `__tests__/` directories within packages
- Database package has >80% coverage requirement
- Focus on database connection logic and schema validation

### E2E Tests (Playwright)

- Test complete user workflows against production or staging
- Located in `e2e/` directory at root
- Categories:
  - `auth/`: Login, signup, organization creation
  - `crud/`: Create, read, update, delete operations
  - `features/`: AI chatbot, command palette, global search
  - `workflows/`: Complete user journeys
  - `infrastructure/`: Production health checks

**Writing new E2E tests:**
1. Add `.spec.ts` file to appropriate `e2e/` subdirectory
2. Use test credentials from `global-setup.ts`
3. Target production URL or override with `BASE_URL` env var
4. Use Playwright's auto-waiting features (avoid manual `waitForTimeout` when possible)

## Phase Planning System

This project uses a structured phase planning system in `.planning/phases/`:

```
.planning/phases/
└── [phase-number]-[phase-name]/
    ├── [phase-number]-[subtask]-PLAN.md
    └── [phase-number]-[subtask]-SUMMARY.md
```

**When working on planned phases:**
1. Read the PLAN.md to understand objectives
2. Execute tasks as specified
3. Document deviations, issues, and decisions
4. Update or create SUMMARY.md with completion status

## Stack Reference

**Frontend:**
- React 19.1, TypeScript 5.9 (strict)
- Vite 7, TailwindCSS 4, shadcn/ui
- tRPC 11 client, Wouter routing

**Backend:**
- Express 4, tRPC 11 server
- Drizzle ORM 0.44, PostgreSQL (postgres driver)
- Socket.IO for real-time features

**Testing:**
- Vitest 2.1 (unit tests)
- Playwright 1.57 (E2E tests)

**Requirements:**
- Node.js ≥ 20.0.0
- pnpm ≥ 9.0.0
- PostgreSQL ≥ 16
