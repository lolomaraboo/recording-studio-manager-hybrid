# CLAUDE.md - Recording Studio Manager Hybrid

## Project Overview

**Recording Studio Manager Hybride** is a multi-tenant SaaS application for managing recording studios. Built with a **Database-per-Tenant** architecture where each organization has a physically separate PostgreSQL database for complete data isolation.

**Status**: Foundation infrastructure complete. Client and server packages pending implementation.

## Architecture

### Database-per-Tenant Model

```
┌─────────────────────────────────────────────────────────────┐
│                      Master Database                         │
│  (rsm_master - central registry)                            │
│  ┌─────────┐ ┌──────────────┐ ┌──────────────────┐          │
│  │  users  │ │ organizations │ │ tenant_databases │          │
│  └─────────┘ └──────────────┘ └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │  tenant_org1  │ │  tenant_org2  │ │  tenant_org3  │
    │   (clients,   │ │   (clients,   │ │   (clients,   │
    │   sessions,   │ │   sessions,   │ │   sessions,   │
    │   invoices)   │ │   invoices)   │ │   invoices)   │
    └───────────────┘ └───────────────┘ └───────────────┘
```

- **Master DB**: Users, organizations, tenant registry, subscriptions
- **Tenant DBs**: Clients, sessions, rooms, invoices, equipment, projects

## Directory Structure

```
recording-studio-manager-hybrid/
├── packages/
│   ├── shared/           # @rsm/shared - Types, constants, utilities
│   │   └── src/
│   │       ├── types.ts       # TypeScript types (UserRole, SessionStatus, etc.)
│   │       ├── constants.ts   # Shared constants (currencies, timezones)
│   │       └── utils.ts       # Utilities (createSlug, formatCurrency)
│   │
│   ├── database/         # @rsm/database - PostgreSQL + Drizzle ORM
│   │   └── src/
│   │       ├── connection.ts  # DB connection management (CRITICAL)
│   │       ├── master/
│   │       │   └── schema.ts  # Master DB tables
│   │       └── tenant/
│   │           └── schema.ts  # Tenant DB tables
│   │
│   ├── server/           # [PLANNED] Express + tRPC backend
│   └── client/           # [PLANNED] React 19 + Vite frontend
│
├── .env.example          # Environment template
├── package.json          # Root workspace config
└── tsconfig.json         # TypeScript strict config
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js >= 20, pnpm >= 9 |
| Language | TypeScript 5.9 (strict mode) |
| Database | PostgreSQL >= 16 |
| ORM | Drizzle ORM 0.44 + Drizzle Kit |
| Validation | Zod 4.1 |
| Frontend (planned) | React 19, Vite 7, TailwindCSS 4, shadcn/ui |
| Backend (planned) | Express 4, tRPC 11, Socket.IO |
| Testing | Vitest 2.1 |

## Quick Commands

```bash
# Development
pnpm install              # Install all dependencies
pnpm dev                  # Start dev servers (client + server)
pnpm build                # Build all packages
pnpm check                # TypeScript type check (must have 0 errors)
pnpm test                 # Run tests
pnpm format               # Format with Prettier

# Database
pnpm db:generate          # Generate migrations from schema changes
pnpm db:migrate           # Apply pending migrations
pnpm db:studio            # Open Drizzle Studio GUI
pnpm db:push              # Push schema directly (dev only)
```

## Database Operations

### Connection Management (`packages/database/src/connection.ts`)

```typescript
import { getMasterDb, getTenantDb, createTenantDatabase } from "@rsm/database";

// Master DB - singleton connection
const masterDb = await getMasterDb();

// Tenant DB - cached per organization
const tenantDb = await getTenantDb(organizationId);

// Provision new tenant
await createTenantDatabase(organizationId, "tenant_neworg");
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `getMasterDb()` | Get master database connection (singleton) |
| `getTenantDb(orgId)` | Get tenant database (cached by orgId) |
| `createTenantDatabase(orgId, dbName?)` | Create new tenant database |
| `closeAllConnections()` | Graceful shutdown |
| `isMasterDbAvailable()` | Health check |

### Schema Locations

- **Master schema**: `packages/database/src/master/schema.ts`
  - users, organizations, tenant_databases, organization_members, invitations, subscription_plans

- **Tenant schema**: `packages/database/src/tenant/schema.ts`
  - clients, rooms, sessions, invoices, invoice_items, equipment, projects

## Code Conventions

### TypeScript Strict Mode

The project enforces strict TypeScript with zero tolerance for errors:
- `strict: true` with all strict checks enabled
- `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`
- `noUnusedLocals`, `noUnusedParameters`

**Always run `pnpm check` before committing.**

### Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| Database tables | snake_case | `organization_members` |
| Database columns | snake_case | `created_at`, `password_hash` |
| TypeScript types | PascalCase | `User`, `SessionStatus` |
| Constants | SCREAMING_SNAKE_CASE | `COOKIE_NAME`, `USER_ROLES` |
| Functions | camelCase | `getMasterDb`, `createSlug` |
| Files | lowercase descriptive | `connection.ts`, `schema.ts` |

### Type Inference Pattern (Drizzle)

```typescript
// Always export inferred types from schemas
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

### Error Handling Pattern

```typescript
try {
  // Operation
  console.log("[Database] Successfully connected to tenant:", organizationId);
} catch (error) {
  console.error("[Database] Failed to connect to tenant:", error);
  throw new Error("Could not connect to tenant database");
}
```

### Logging Convention

- Always prefix with component: `[Database]`, `[Auth]`, `[API]`
- Include context (organizationId, operation name)
- Use `console.log` for info, `console.error` for failures

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://postgres:password@localhost:5432/rsm_master

# Server (for @rsm/server)
NODE_ENV=development
PORT=3000

# Security (min 32 characters each)
JWT_SECRET=change-me-in-production-min-32-chars
SESSION_SECRET=change-me-in-production-min-32-chars

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Debug
ENABLE_DEBUG_LOGS=true
```

## Package Dependencies

### Workspace References

Packages reference each other via `workspace:*`:

```json
{
  "dependencies": {
    "@rsm/shared": "workspace:*"
  }
}
```

### Build Order (Critical)

1. `@rsm/shared` (no dependencies)
2. `@rsm/database` (depends on @rsm/shared)
3. `@rsm/client` (depends on @rsm/shared)
4. `@rsm/server` (depends on @rsm/shared, @rsm/database)

## Key Files Reference

| File | Purpose |
|------|---------|
| `packages/database/src/connection.ts` | **CRITICAL** - All DB connection logic |
| `packages/database/src/master/schema.ts` | Master database schema |
| `packages/database/src/tenant/schema.ts` | Tenant database schema |
| `packages/shared/src/types.ts` | Shared TypeScript types |
| `packages/shared/src/constants.ts` | Application constants |
| `packages/shared/src/utils.ts` | Utility functions |
| `packages/database/drizzle.config.ts` | Drizzle Kit configuration |

## First-Time Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Create master database
createdb rsm_master

# 4. Run migrations
pnpm db:migrate

# 5. Start development
pnpm dev
```

## Important Notes for AI Assistants

1. **Database-per-Tenant is ACTIVE** - Unlike single-DB approaches, `getTenantDb()` creates/retrieves separate PostgreSQL databases per organization

2. **Zero TypeScript errors required** - Always run `pnpm check` before considering work complete

3. **Connection caching** - Tenant connections are cached in memory; don't create new connections unnecessarily

4. **Schema changes require migrations** - After modifying schema files, run `pnpm db:generate` then `pnpm db:migrate`

5. **Package build order matters** - shared → database → client/server

6. **ES Modules** - Project uses `"type": "module"` throughout

7. **French defaults** - Currency (EUR), timezone (Europe/Paris), language (fr), number formatting (fr-FR)

## Planned Features (Not Yet Implemented)

- `@rsm/server`: Express + tRPC API server with JWT auth
- `@rsm/client`: React 19 frontend with shadcn/ui components
- Real-time features via Socket.IO
- Client portal with session booking
- Multi-language support (i18n)
