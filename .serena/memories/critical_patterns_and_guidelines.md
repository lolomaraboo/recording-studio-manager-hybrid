# Critical Patterns and Guidelines

## 1. Database-per-Tenant Pattern (MOST IMPORTANT)

### Architecture Overview

**CRITICAL:** This is NOT a shared-database multi-tenant system. Each organization has a physically separate PostgreSQL database.

### Master Database
- **Name:** `rsm_master`
- **Purpose:** Global data (users, organizations, tenant mapping)
- **Schema:** `packages/database/src/master/schema.ts`

### Tenant Databases
- **Names:** `tenant_1`, `tenant_2`, `tenant_N`
- **Purpose:** Organization-specific data (clients, sessions, invoices, etc.)
- **Schema:** `packages/database/src/tenant/schema.ts`

### Connection Management

**Key File:** `packages/database/src/connection.ts`

**Functions:**
- `getMasterDb()` - Get master database connection
- `getTenantDb(organizationId)` - Get tenant database connection
- `createTenantDatabase(organizationId)` - Create new tenant database

**Usage in tRPC Routers:**
```typescript
export const clientsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();
    return tenantDb.query.clients.findMany();
  }),
});
```

**NEVER:**
- Query tenant data from master database
- Mix data from different tenant databases
- Skip `getTenantDb()` when accessing tenant data

### Creating New Organizations

When an organization is created:
1. Insert into `master.organizations`
2. Create new PostgreSQL database (`tenant_N`)
3. Apply full tenant schema to new database
4. Insert mapping in `master.tenant_databases`

## 2. tRPC Context Pattern

### Context Structure

All tRPC procedures receive a context object:
```typescript
{
  userId: number;           // Current authenticated user
  organizationId: number;   // Current organization
  getTenantDb: () => Promise<TenantDb>;  // Function to get tenant DB
}
```

### Procedure Types

- **publicProcedure:** No authentication required
- **protectedProcedure:** Requires authentication (userId + organizationId available)

### Router Pattern

```typescript
export const myRouter = router({
  // Protected query
  getData: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      return tenantDb.query.myTable.findFirst({
        where: eq(myTable.id, input.id),
      });
    }),

  // Protected mutation
  createData: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      return tenantDb.insert(myTable).values({
        name: input.name,
        createdAt: new Date(),
      });
    }),
});
```

## 3. Development Authentication

### Test Headers (Development Only)

In development mode, authentication bypasses JWT and uses headers:
- `x-test-user-id: 1`
- `x-test-org-id: 1`

**Setup:** `packages/client/src/main.tsx` automatically adds these headers to tRPC client.

### Production Authentication

Uses JWT tokens with proper authentication flow.

## 4. Type Safety End-to-End

### Shared Types

**Location:** `packages/shared/src/`

Types are shared across client and server for end-to-end type safety.

### tRPC Auto-generated Types

Client automatically infers types from server:
```typescript
// Server defines
export const clientsRouter = router({
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => { ... }),
});

// Client gets full type inference
const client = trpc.clients.getById.useQuery({ id: 1 });
// client.data is fully typed!
```

## 5. vCard 4.0 Support (RFC 6350)

### Structured Name Fields

Clients support enriched vCard fields:
- `prefix` (e.g., "Mr.", "Dr.")
- `firstName`, `middleName`, `lastName`, `suffix`
- `artistName` (for performers)

### Array Fields (JSON in PostgreSQL)

```typescript
phones: { type: string; number: string }[]
emails: { type: string; email: string }[]
websites: { type: string; url: string }[]
addresses: { type: string; street: string; city: string; ... }[]
customFields: { label: string; value: string }[]
```

### Service Files

- `packages/server/src/utils/vcard-service.ts` - vCard import/export
- `packages/server/src/utils/excel-service.ts` - Excel import/export
- `packages/server/src/utils/csv-service.ts` - CSV import/export

## 6. Client Type System

### Client Types

- `individual` - Artists, performers, session musicians
- `company` - Record labels, management companies

### Conditional Fields

Different UI fields shown based on type:
- Individual: `artistName`, structured name fields
- Company: `companyName`, `industry`, `registrationNumber`

## 7. Docker Build Cache Issues

### Known Issue

UI changes not appearing in Docker containers = stale build cache.

### Solution

```bash
docker builder prune -af
rm -rf packages/client/dist
docker-compose build --no-cache client
docker-compose restart client
```

## 8. Migration Patterns

### Adding Tenant Tables

1. Define in `packages/database/src/tenant/schema.ts`
2. Generate migration: `pnpm db:generate`
3. **IMPORTANT:** Migrations only apply to NEW tenant databases
4. Existing databases require manual migration script

### Migration Script Template

```typescript
// packages/database/src/scripts/migrate-existing-tenants.ts
import { getMasterDb, getTenantDb } from '../connection';

async function migrateAllTenants() {
  const masterDb = await getMasterDb();
  const tenants = await masterDb.query.tenant_databases.findMany();
  
  for (const tenant of tenants) {
    const tenantDb = await getTenantDb(tenant.organization_id);
    // Apply migration manually
    await tenantDb.execute(sql`...`);
  }
}
```

## 9. Real-time Features (Socket.IO)

### Server Setup

Socket.IO server runs alongside Express in `packages/server/src/index.ts`

### Client Connection

Frontend connects via Socket.IO client for real-time updates.

### Use Cases

- Live session updates
- Real-time notifications
- Multi-user collaboration

## 10. Testing Philosophy

### Unit Tests (Vitest)

- Test business logic in isolation
- Database package requires >80% coverage
- Located in `__tests__/` directories

### E2E Tests (Playwright)

- Test complete user workflows
- Run against production/staging
- Categories: auth, crud, features, workflows, infrastructure

### Test Data

Use test organization (ID: 16) with complete data set.

**Setup Script:** `packages/database/scripts/test-data/setup-test-studio-ui.sql`

## 11. Phase Planning System

### Structure

```
.planning/phases/
└── [phase-number]-[phase-name]/
    ├── [phase-number]-[subtask]-PLAN.md
    └── [phase-number]-[subtask]-SUMMARY.md
```

### Workflow

1. Read PLAN.md to understand objectives
2. Execute tasks
3. Document deviations and decisions
4. Update SUMMARY.md with completion status

## 12. Environment Variables

### Required Variables

**Server (`packages/server/.env`):**
- `DATABASE_URL` - PostgreSQL master DB connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

**Client (`packages/client/.env`):**
- `VITE_API_URL` - Backend API URL
