# Quick Reference - Recording Studio Manager

## Essential Commands

```bash
# Start development
./start.sh

# Type check (0 errors required)
pnpm check

# Format code
pnpm format

# Run tests
pnpm test

# Database migrations
pnpm db:generate
pnpm db:migrate

# E2E tests
npx playwright test
```

## URLs

**Development:**
- Frontend: http://localhost:5174
- Backend: http://localhost:3001
- tRPC: http://localhost:3001/api/trpc
- Health: http://localhost:3001/health

**Production:**
- https://recording-studio-manager.com

## Test Credentials

**E2E Tests:**
- Email: `e2e-test-user@example.com`
- Password: `E2ETestPass123!`

**Test Studio UI (localhost):**
- Email: `admin@test-studio-ui.com`
- Password: `password`
- Organization ID: 16

## Critical Architecture

### Database-per-Tenant
- **Master DB:** `rsm_master` (users, organizations, tenant mapping)
- **Tenant DBs:** `tenant_1`, `tenant_2`, ... (organization data)

### Key Function
```typescript
const tenantDb = await ctx.getTenantDb();
// ALWAYS use this in tRPC routers for tenant data
```

### File Location
`packages/database/src/connection.ts:70-128`

## Package Structure

```
packages/
├── shared/      # Shared types
├── database/    # Drizzle ORM + schemas
├── server/      # Express + tRPC backend
└── client/      # React 19 frontend
```

## Environment Variables

**Required for server:**
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/rsm_master
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Common Issues

### 1. "DATABASE_URL not configured"
```bash
./start.sh  # Use this instead of pnpm dev
```

### 2. Docker UI not updating
```bash
docker builder prune -af
docker-compose build --no-cache client
docker-compose restart client
```

### 3. TypeScript errors
```bash
pnpm check  # Fix all errors, don't disable strict mode
```

## Tech Stack

- **Frontend:** React 19, TypeScript 5.9 (strict), Vite 7, TailwindCSS 4, shadcn/ui
- **Backend:** Express 4, tRPC 11, Drizzle ORM 0.44, PostgreSQL
- **Testing:** Vitest 2.1, Playwright 1.57
- **Monorepo:** pnpm workspaces

## Workflow

1. Make changes
2. `pnpm check` (must pass)
3. `pnpm format`
4. `pnpm test`
5. Commit & push

## Help

- Main docs: `README.md`, `CLAUDE.md`
- Memories: `.serena/memories/`
- Phase plans: `.planning/phases/`
