# Archived Database Scripts

**Archive Date:** 2026-01-17 (Phase 21)
**Reason:** Scripts obsoleted by Phases 10-17 schema evolution
**Migration Context:** 9 new migrations added 16+ tables, 30+ columns

---

## Why These Scripts Were Archived

Between Phases 10-17, the database schema evolved significantly:
- **Master DB:** 5 tables → 7 tables (added `subscription_plans`, `ai_credits`)
- **Tenant DB:** ~15 tables → 31 tables (added quotes, time_entries, service_catalog, company_members, etc.)
- **Column additions:** 30+ new columns (vCard fields, Stripe billing, project_id, etc.)

These scripts were created before this evolution and became incompatible with the current schema (migrations 0000-0011 for tenants, 0000-0003 for master).

**Historical Context:**
Phases 18.1-18.3 documented 80+ minutes wasted debugging migration-based initialization failures, leading to the "increment tenant number" pattern documented in `.planning/DEVELOPMENT-WORKFLOW.md`.

---

## Archived Scripts

### 1. init-tenant.ts

**Archived:** 2026-01-17
**Original Purpose:** Initialize tenant database using Drizzle migrator
**Why Obsolete:** Migration-based approach breaks when migrations skipped or applied out of order

**Schema Incompatibility:**
- Depends on sequential migration application (0000-0011)
- Fails when tenant created with partial migrations
- Incompatible with DEVELOPMENT-WORKFLOW.md pattern: "INCREMENT tenant number vs fix migrations"

**Evidence of Obsolescence:**
```bash
# Phase 18.1-18.3: Migration dependency errors
ERROR: Migration 0008 expects column from 0003 but migrations were skipped
ERROR: Schema drift - TypeScript schema doesn't match applied migrations
```

**Replaced By:** `scripts/init/create-tenant.ts` (uses drizzle-kit push for direct schema application)

**Migration Path:**
```bash
# OLD (init-tenant.ts) - DON'T USE
DATABASE_URL="..." pnpm tsx scripts/init-tenant.ts

# NEW (create-tenant.ts) - USE THIS
pnpm --filter database tsx scripts/init/create-tenant.ts
```

---

### 2. seed-tenant-3.ts

**Archived:** 2026-01-17
**Original Purpose:** Seed tenant_3 with test data
**Why Obsolete:** Missing vCard fields, company_members, recent schema additions

**Schema Incompatibility:**
- ❌ Missing vCard array fields: `phones`, `emails`, `websites`
- ❌ Missing `avatar_url`, `logo_url` columns
- ❌ Missing `custom_fields` jsonb column
- ❌ Uses `client_contacts` pattern instead of `company_members` (Phase 20.1 architecture change)
- ❌ Missing structured address fields (street, postalCode, region)

**Evidence of Obsolescence:**
```sql
-- seed-tenant-3.ts inserts
INSERT INTO clients (name, first_name, last_name, email, phone, type, city)
-- Missing: phones jsonb[], emails jsonb[], websites jsonb[], avatarUrl, logoUrl, customFields
```

**Replaced By:** `scripts/init/seed-realistic-data.ts` (complete vCard support, 60-78 records with faker.js)

**Migration Path:**
```bash
# OLD (seed-tenant-3.ts) - DON'T USE
DATABASE_URL="..." pnpm tsx scripts/seed-tenant-3.ts

# NEW (seed-realistic-data.ts) - USE THIS
DATABASE_URL="..." pnpm --filter database tsx scripts/init/seed-realistic-data.ts
```

---

### 3. add-new-tenant-tables.sql

**Archived:** 2026-01-17
**Original Purpose:** Add tables from migrations 0001-0002 to existing tenants
**Why Obsolete:** Tables now in base schema (migration 0000), not separate additions

**Schema Incompatibility:**
- Script adds `equipment`, `rooms` tables separately
- Current schema (migration 0000) includes these tables from the start
- Running this script would duplicate table creation → ERROR: relation already exists

**Evidence of Obsolescence:**
```sql
-- Script tries to CREATE TABLE equipment, rooms
-- But migration 0000_early_charles_xavier.sql already creates them
ERROR: relation "equipment" already exists
```

**Replaced By:** Fresh tenant creation with `scripts/init/create-tenant.ts` includes all tables

**Migration Path:**
```bash
# OLD (add-new-tenant-tables.sql) - DON'T USE
psql -f scripts/add-new-tenant-tables.sql

# NEW - Fresh tenant creation includes all tables
pnpm --filter database tsx scripts/init/create-tenant.ts
```

---

### 4. fix-sessions-add-project-id.sql

**Archived:** 2026-01-17
**Original Purpose:** Reactive patch to add `project_id` column to sessions table
**Why Obsolete:** Column now in base schema (migration 0008), not a fix

**Schema Incompatibility:**
- Script manually adds `project_id` column
- Migration 0008 (add_project_id_to_sessions.sql) handles this properly
- Running this script on current tenant → ERROR: column already exists

**Evidence of Obsolescence:**
```sql
-- Script: ALTER TABLE sessions ADD COLUMN project_id
-- Migration 0008 already applied this
ERROR: column "project_id" of relation "sessions" already exists
```

**Replaced By:** Migration 0008 included in `scripts/init/create-tenant.ts`

**Migration Path:**
```bash
# OLD (fix-sessions-add-project-id.sql) - DON'T USE
psql -f scripts/fix-sessions-add-project-id.sql

# NEW - Migration 0008 auto-applied during tenant creation
pnpm --filter database tsx scripts/init/create-tenant.ts
```

---

### 5. fix-tenant3-sessions-schema.sql

**Archived:** 2026-01-17
**Original Purpose:** Reactive patch for tenant_3 missing payment fields in sessions
**Why Obsolete:** Fields now in base schema (migration 0003), not a fix

**Schema Incompatibility:**
- Script manually adds `amount`, `payment_status`, `payment_method` columns
- Migration 0003 (fair_ultragirl.sql) handles this properly
- Running this script on current tenant → ERROR: columns already exist

**Evidence of Obsolescence:**
```sql
-- Script: ALTER TABLE sessions ADD COLUMN amount, payment_status, payment_method
-- Migration 0003 already applied these
ERROR: column "amount" of relation "sessions" already exists
```

**Replaced By:** Migration 0003 included in `scripts/init/create-tenant.ts`

**Migration Path:**
```bash
# OLD (fix-tenant3-sessions-schema.sql) - DON'T USE
psql -f scripts/fix-tenant3-sessions-schema.sql

# NEW - Migration 0003 auto-applied during tenant creation
pnpm --filter database tsx scripts/init/create-tenant.ts
```

---

### 6. test-data/add-company-with-contacts.sql

**Archived:** 2026-01-17
**Original Purpose:** Add test company with multiple contacts
**Why Obsolete:** Uses deprecated `client_contacts` table instead of `company_members`

**Schema Incompatibility:**
- Script uses `client_contacts` one-to-many pattern (client → contacts)
- Phase 20.1 introduced `company_members` many-to-many pattern (companies ↔ contacts)
- Architecture change: Contacts are now full `clients` records, not sub-entities

**Evidence of Obsolescence:**
```sql
-- Script: INSERT INTO client_contacts (client_id, contact_name, contact_email)
-- Current schema: company_members (company_id, member_id) with both referencing clients table
ERROR: relation "client_contacts" does not exist
```

**Replaced By:** `scripts/init/seed-realistic-data.ts` (uses company_members, creates contacts as clients)

**Migration Path:**
```bash
# OLD (add-company-with-contacts.sql) - DON'T USE
psql -f scripts/test-data/add-company-with-contacts.sql

# NEW (seed-realistic-data.ts) - Creates companies with members
DATABASE_URL="..." pnpm --filter database tsx scripts/init/seed-realistic-data.ts
```

---

### 7. test-data/setup-test-studio-ui.sql

**Archived:** 2026-01-17
**Original Purpose:** Create comprehensive test data for Organization 16 UI validation
**Why Obsolete:** Missing 29+ columns added in Phases 10-20, uses old schema

**Schema Incompatibility:**
- ❌ Missing invoices columns: `quote_id`, `project_id`, `session_id`, `subtotal_cents`, `tax_amount_cents`, `currency` (Phase 16-17)
- ❌ Missing sessions columns: `project_id` (Phase 14), payment fields (Phase 18.2)
- ❌ Missing clients columns: vCard fields (Phase 3.9.4), `company_members` architecture (Phase 20.1)
- ❌ Missing tracks columns: copyright metadata, technical details (Phase 5)
- ❌ Missing time_entries table entirely (Phase 13)
- ❌ Missing service_catalog table (Phase 12)
- ❌ Missing quotes table (Phase 10-11)

**Evidence of Obsolescence:**
```sql
-- Script inserts into old schema
INSERT INTO invoices (id, client_id, total, status, issue_date)
-- Missing 6 required columns: quote_id, subtotal_cents, tax_amount_cents, currency, etc.
ERROR: null value in column "subtotal_cents" violates not-null constraint
```

**Replaced By:** `scripts/init/seed-realistic-data.ts` (compatible with all 31 tenant tables, all columns)

**Migration Path:**
```bash
# OLD (setup-test-studio-ui.sql) - DON'T USE
psql -d tenant_16 -f scripts/test-data/setup-test-studio-ui.sql

# NEW (seed-realistic-data.ts) - Full schema support
DATABASE_URL="postgresql://postgres@localhost:5432/tenant_16" \
  pnpm --filter database tsx scripts/init/seed-realistic-data.ts
```

---

## Current Scripts (Use These Instead)

All archived scripts have modern replacements in `scripts/init/`:

| Old Script | Status | Replacement |
|------------|--------|-------------|
| init-tenant.ts | ❌ OBSOLETE | `init/create-tenant.ts` (auto-increment, drizzle-kit push) |
| seed-tenant-3.ts | ❌ OBSOLETE | `init/seed-realistic-data.ts` (60-78 records, faker.js) |
| add-new-tenant-tables.sql | ❌ OBSOLETE | `init/create-tenant.ts` (all tables included) |
| fix-sessions-add-project-id.sql | ❌ OBSOLETE | Migration 0008 (auto-applied) |
| fix-tenant3-sessions-schema.sql | ❌ OBSOLETE | Migration 0003 (auto-applied) |
| test-data/add-company-with-contacts.sql | ❌ OBSOLETE | `init/seed-realistic-data.ts` (company_members) |
| test-data/setup-test-studio-ui.sql | ❌ OBSOLETE | `init/seed-realistic-data.ts` (all columns) |

**Quick Start (Development):**
```bash
# Create fresh tenant (auto-increments to tenant_N)
pnpm --filter database tsx scripts/init/create-tenant.ts

# Seed minimal data (20 records)
DATABASE_URL="postgresql://postgres@localhost:5432/tenant_N" \
  pnpm --filter database tsx scripts/init/seed-base-data.ts

# OR seed realistic data (60-78 records, faker.js)
DATABASE_URL="postgresql://postgres@localhost:5432/tenant_N" \
  pnpm --filter database tsx scripts/init/seed-realistic-data.ts
```

**Production Deployment (Use These):**
- `deploy-master.sh` - Deploy master migrations (7 tables) ✅ Phase 21 tested
- `deploy-tenants.sh` - Deploy tenant migrations (31 tables) ✅ Phase 21 tested

---

## Related Documentation

- **Development Workflow:** `.planning/DEVELOPMENT-WORKFLOW.md` (explains increment tenant pattern)
- **Audit Report:** `scripts/audit-report.md` (full compatibility matrix)
- **Main README:** `scripts/README.md` (Phase 21 quick start guide)
- **Phase 21 Summary:** `.planning/phases/21-audit-et-correction-scripts-base-de-donnees/21-01-SUMMARY.md`

---

## Historical Timeline

| Date | Event | Impact |
|------|-------|--------|
| Pre-Phase 10 | Scripts created (init-tenant, seed-tenant-3, etc.) | Compatible with ~15 tenant tables |
| Phase 10-17 | Schema evolution (9 migrations, 16+ tables added) | Scripts became obsolete |
| Phase 18.1-18.3 | 80+ minutes wasted debugging migration issues | Documented "increment tenant" pattern |
| Phase 21-01 | Audit revealed 7/13 scripts obsolete | Evidence-based compatibility matrix |
| Phase 21-02 | New init scripts created | create-tenant, seed-base-data, seed-realistic-data |
| Phase 21-03 | Obsolete scripts archived | This directory created |

---

**Last Updated:** 2026-01-17 (Phase 21-03)
**Archive Rationale:** Prevent accidental use of outdated patterns, guide developers to current best practices
