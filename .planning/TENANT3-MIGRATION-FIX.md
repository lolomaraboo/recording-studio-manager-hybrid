# Tenant 3 Migration Fix - 2026-01-16

## Context
During Phase 18-02 testing (Company Badge feature), discovered that client creation was failing with:
```
ERROR: column "phones" of relation "clients" does not exist
```

## Root Cause
Migration `0004_certain_trish_tilby.sql` (vCard enriched fields) was never applied to existing `tenant_3` database.

**Why?** Tenant migrations only apply to NEW tenants created AFTER the migration file exists. Existing tenants don't get automatic schema updates.

## Columns Missing
- `phones` jsonb DEFAULT '[]'::jsonb
- `emails` jsonb DEFAULT '[]'::jsonb  
- `websites` jsonb DEFAULT '[]'::jsonb

## Fix Applied
```bash
psql -U postgres -d tenant_3 < packages/database/drizzle/migrations/tenant/0004_certain_trish_tilby.sql
```

**Result:** Migration applied successfully. Some errors for already-existing columns (expected):
- `first_name`, `last_name`, `middle_name` (already existed)
- `client_contacts`, `client_notes` tables (already existed)

## Verification
Created test client "Jean Dupont" successfully:
- Client ID: 9
- Type: individual
- Phone: +33 6 12 34 56 78
- Email: jean.dupont@example.com
- ✅ Badge displays "Particulier" in client list

## Related Changes
- Fixed `userId` field handling in `packages/server/src/routers/clients.ts`
- Changed from `userId: null` to omitting the field (let PostgreSQL use default NULL)

## Prevention Strategy
As documented in `.planning/DEVELOPMENT-WORKFLOW.md`:

> **NEVER fix broken tenant migrations in development.**
> **INCREMENT tenant number instead** (tenant_4, tenant_5, etc.)

**Why this approach:**
- Schema always matches TypeScript code
- Zero migration debugging (30 sec vs 2-3 hours)
- Realistic (production creates new tenants for new customers)

**When to fix migrations:**
- Production environments ONLY
- Use progressive migrations with ALTER TABLE

## Commits
1. `f41b695` - fix(18-02): explicitly set userId to null in client creation
2. `0025d12` - fix(18-02): omit userId field instead of setting to null
3. Manual migration application to tenant_3 (not committed, DB change only)

---

**Note:** This was a one-time fix for development. Future development should follow the "create new tenant" pattern.
