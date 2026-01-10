# Project Overview - Recording Studio Manager Hybrid

## Purpose

**Recording Studio Manager - Hybrid Version** is a multi-tenant SaaS application for managing recording studios with a **Database-per-Tenant architecture**.

**Key Differentiator:** Unlike traditional shared-database multi-tenancy, each organization gets a physically separate PostgreSQL database for complete data isolation.

## Architecture Type

**Monorepo** using pnpm workspaces with 4 packages:
- `packages/shared` - Shared types and utilities
- `packages/database` - Drizzle ORM + PostgreSQL schemas
- `packages/server` - Express + tRPC backend
- `packages/client` - React 19 + Vite frontend

## Database-per-Tenant Architecture

**CRITICAL CONCEPT:** This is the core architectural principle of the entire application.

### Master Database (`rsm_master`)
Contains global data:
- users
- organizations
- tenant_databases (mapping: organization ID → database name)
- organization_members
- invitations
- subscription_plans

### Tenant Databases (`tenant_1`, `tenant_2`, etc.)
Each organization has its own database containing:
- clients
- sessions
- invoices
- equipment
- rooms
- projects
- tracks
- musicians
- etc.

### Key Implementation

The `getTenantDb()` function in `packages/database/src/connection.ts` (lines 70-128) is **ACTIVE** and used throughout the application. All tRPC routers use `ctx.getTenantDb()` to access tenant-specific data.

**Pattern:**
```typescript
const tenantDb = await ctx.getTenantDb();
const clients = await tenantDb.query.clients.findMany();
```

## Features

- Multi-tenant studio management
- Client management with vCard 4.0 support
- Session scheduling and tracking
- Project and track management
- Invoice generation with Stripe integration
- Equipment and room management
- Real-time updates via Socket.IO
- AI chatbot assistance
- Import/export (vCard, CSV, Excel)

## Development Environment

- **System:** macOS (Darwin)
- **Node.js:** ≥ 20.0.0
- **Package Manager:** pnpm ≥ 9.0.0
- **Database:** PostgreSQL ≥ 16

## URLs in Development

- Frontend: http://localhost:5174
- Backend: http://localhost:3001
- tRPC endpoint: http://localhost:3001/api/trpc
- Health check: http://localhost:3001/health
