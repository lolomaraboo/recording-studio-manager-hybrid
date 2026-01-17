# Phase 21: Audit et Correction Scripts Base de Données - Research

**Researched:** 2026-01-17
**Domain:** PostgreSQL database migration management, multi-tenant schema synchronization
**Confidence:** HIGH

## Summary

Researched current state of database scripts versus actual schema to understand obsolescence and identify required fixes. Findings reveal systematic drift between schema evolution (Phases 10-17) and supporting scripts, with migration-based issues consuming 80+ minutes across Phases 18.1-18.3.

**Current state:**
- Master DB: 7 tables (users, organizations, tenant_databases, organization_members, invitations, subscription_plans, ai_credits)
- Tenant DB: 31 tables (clients, sessions, invoices, projects, tracks, etc.)
- Migration history: 12 migrations (0000-0011) adding features incrementally
- Scripts: 12 files in `packages/database/scripts/`, most created before Phase 10

**Key findings:**
- Critical development pattern documented: INCREMENT tenant number vs fix migrations (30 sec vs 2-3 hours)
- Test data scripts reference old schema (missing vCard fields, company_members table, invoice deposit fields)
- Init scripts use migration-based approach that fails when migrations are skipped
- Fix scripts created reactively during Phases 18-20 now obsolete with fresh tenant strategy

**Primary recommendation:** Audit all scripts against current schema (master + tenant), update critical init/seed scripts to use current schema directly, archive obsolete fix scripts, document correct usage patterns.

## Standard Stack

### Core Tools
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | 0.44.x | Schema definition + migrations | Type-safe PostgreSQL operations, generates SQL migrations |
| drizzle-kit | Latest | Migration generation | CLI for `drizzle-kit generate`, `drizzle-kit migrate` |
| postgres.js | Latest | PostgreSQL driver | Lightweight, fast, used throughout codebase |
| tsx | Latest | TypeScript execution | Runs TS scripts directly without build step |
| psql | 17.x | PostgreSQL CLI | Native PostgreSQL operations, script execution |

### Supporting Tools
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @faker-js/faker | Latest | Test data generation | Seed scripts requiring realistic data |
| pg_dump | 17.x | Database backup | Manual backups before major migrations |

### Script Patterns Found
| Pattern | File Example | When Created |
|---------|-------------|---------------|
| Migration-based init | `init-tenant.ts` | Phase 1-9 (before schema stabilized) |
| Manual SQL fixes | `fix-tenant3-sessions-schema.sql` | Phase 18+ (reactive fixes) |
| TypeScript seeds | `seed-tenant-3.ts` | Phase 20 (current pattern) |
| Test data SQL | `setup-test-studio-ui.sql` | Phase 3.14 (UI validation) |
| Deployment scripts | `deploy-master.sh`, `deploy-tenants.sh` | Phase 1 (production) |

**Installation:**
```bash
# Already installed in packages/database
pnpm --filter database install
```

## Architecture Patterns

### Current Schema Structure (Phase 21)

**Master Database (7 tables):**
```
users (27 columns)
organizations (57 columns) - Added: stripeCustomerId, stripeSubscriptionId, subscriptionStatus, currentPeriodEnd
tenant_databases (4 columns)
organization_members (5 columns)
invitations (9 columns)
subscription_plans (12 columns)
ai_credits (9 columns) - Added: Phase 11
```

**Tenant Database (31 tables):**
```
Core:
- clients (53+ columns) - Added: vCard fields (firstName, lastName, phones, emails, websites, avatarUrl, etc.)
- client_notes (5 columns)
- client_contacts (8 columns) - DEPRECATED in Phase 20
- company_members (6 columns) - NEW in Phase 20.1 (many-to-many)
- rooms (19 columns)
- sessions (17 columns) - Added: deposit_amount, deposit_paid, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, project_id
- equipment (23 columns)

Projects:
- projects (26 columns)
- tracks (39 columns) - Added 17 fields in Phase 5 (versioning, copyright, technical)
- track_comments (16 columns)
- musicians (14 columns)
- track_credits (8 columns)

Financial:
- invoices (19 columns) - Added: deposit_amount, deposit_paid_at, stripe_deposit_payment_intent_id, remaining_balance, pdf_s3_key, sent_at
- invoice_items (7 columns)
- quotes (19 columns)
- quote_items (9 columns)
- service_catalog (9 columns)
- contracts (20 columns)
- expenses (19 columns)
- payments (17 columns)
- payment_transactions (27 columns)

Time Tracking:
- task_types (9 columns)
- time_entries (13 columns)

System:
- notifications (14 columns)
- ai_conversations (9 columns)
- ai_action_logs (9 columns)
- client_portal_accounts (14 columns)
- client_portal_magic_links (9 columns)
- client_portal_sessions (12 columns)
- client_portal_activity_logs (11 columns)
- stripe_webhook_events (5 columns)
```

### Migration History Timeline

| Migration | Phase | What Changed |
|-----------|-------|--------------|
| 0000_outgoing_mastermind | 1-9 | Initial tenant schema (15 tables) |
| 0001_curvy_spyke | 10 | AI tables (ai_conversations, ai_action_logs) |
| 0002_glossy_shotgun | 11 | Quotes + service_catalog |
| 0003_luxuriant_black_cat | 12 | payment_transactions, sessions payment fields |
| 0004_cuddly_vermin | 13 | track_comments, tracks enrichment (17 fields) |
| 0005_silly_may_parker | 14 | Client Portal tables (4 new tables) |
| 0006_clear_young_avengers | 15 | task_types, time_entries |
| 0007_calm_songbird | 16 | client_notes table |
| 0008_update_quotes_state_machine | 17 | Quotes state machine update |
| 0009_add_invoice_link_to_time_entries | 17 | time_entries.invoice_id |
| 0010_add_deposit_fields_to_invoices | 17 | Invoices deposit fields (4 columns) |
| 0011_add_pdf_s3_key_to_invoices | 17 | Invoices PDF storage |

**Master database migrations:** Separate directory at `drizzle/migrations/master/`

### Script Compatibility Matrix

| Script | Created | Last Updated | Schema Version | Status |
|--------|---------|-------------|----------------|--------|
| `init-tenant.ts` | Phase 1 | Phase 1 | Migration 0000 | ⚠️ OBSOLETE (uses migrations) |
| `seed-tenant-3.ts` | Phase 20 | Phase 20 | Missing vCard, company_members | ⚠️ PARTIAL |
| `setup-test-studio-ui.sql` | Phase 3.14 | Phase 3.14 | Migration 0000-0002 | ⚠️ OUTDATED |
| `create-test-studio-user.sql` | Phase 3.14 | Phase 3.14 | Master schema OK | ✅ CURRENT |
| `add-new-tenant-tables.sql` | Phase 10 | Phase 10 | Migration 0001-0002 | ❌ OBSOLETE |
| `fix-tenant3-sessions-schema.sql` | Phase 18.2 | Phase 18.2 | Migration 0003 | ❌ OBSOLETE (fix-only) |
| `fix-sessions-add-project-id.sql` | Phase 18.2 | Phase 18.2 | Migration 0008 | ❌ OBSOLETE (fix-only) |
| `create-tenant-3.ts` | Phase 18 | Phase 18 | Manual SQL | ✅ PATTERN OK (needs update) |
| `deploy-master.sh` | Phase 1 | Phase 1 | Migration-based | ✅ CURRENT |
| `deploy-tenants.sh` | Phase 1 | Phase 1 | Migration-based | ✅ CURRENT |
| `migrate-status.sh` | Phase 1 | Phase 1 | Monitoring | ✅ CURRENT |

### Recommended Script Organization

```
packages/database/scripts/
├── README.md                    # Updated usage documentation
├── init/
│   ├── create-tenant.ts         # Unified tenant creation (replaces create-tenant-3.ts)
│   ├── seed-base-data.ts        # Base seed data (current schema)
│   └── seed-realistic-data.ts   # Comprehensive test data (current schema)
├── deployment/
│   ├── deploy-master.sh         # Production master deployment (KEEP)
│   ├── deploy-tenants.sh        # Production tenant deployment (KEEP)
│   └── migrate-status.sh        # Status monitoring (KEEP)
├── archived/
│   ├── init-tenant.ts           # Old migration-based init
│   ├── add-new-tenant-tables.sql
│   ├── fix-tenant3-sessions-schema.sql
│   └── fix-sessions-add-project-id.sql
└── test-data/
    ├── create-test-studio-user.sql  # (KEEP - update if needed)
    └── setup-test-studio-ui.sql     # (UPDATE to current schema)
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema synchronization | Manual ALTER TABLE tracking | Drizzle migrations | Automatic schema diff detection, version control |
| Test data generation | Manual SQL INSERT | TypeScript seed scripts with postgres.js | Type safety, reusability, faker.js integration |
| Tenant creation | Copy-paste SQL scripts | Reusable TypeScript function | Consistency, error handling, logging |
| Migration validation | Manual table counting | migrate-status.sh script | Automated verification across all databases |
| Schema diffing | Visual comparison | `drizzle-kit generate` | Detects ALL changes (columns, constraints, indexes) |

**Key insight:** Migration-based approaches fail when development workflow uses "increment tenant number" pattern. Fresh tenant creation requires direct schema application, not sequential migrations.

## Common Pitfalls

### Pitfall 1: Migration Desynchronization in Development
**What goes wrong:** Schema changes without running `pnpm db:generate`, then trying to apply old migrations to new tenants
**Why it happens:** Fast iteration on schema.ts without migration discipline
**How to avoid:** Use "increment tenant number" pattern (documented in DEVELOPMENT-WORKFLOW.md), apply fresh schema to new tenants
**Warning signs:**
- `column "X" does not exist` errors when using tRPC routers
- Table counts don't match expected values (31 vs 15)
- Migration 0003-0011 missing from tenant database

### Pitfall 2: Test Data Scripts Referencing Obsolete Schema
**What goes wrong:** SQL INSERT scripts fail because columns don't exist (e.g., `first_name`, `company_client_id`)
**Why it happens:** Test data created before schema evolution (Phases 10-20)
**How to avoid:** Update test data scripts alongside schema changes, use TypeScript seeds for type safety
**Warning signs:**
- `ERROR: column "first_name" of relation "clients" does not exist`
- Missing vCard fields in test clients
- No company_members data in test databases

### Pitfall 3: Assuming All Tenants Have Same Schema
**What goes wrong:** Scripts work on tenant_1 but fail on tenant_3 due to different migration history
**Why it happens:** Incremental development creates tenants at different schema versions
**How to avoid:** Document which tenant has which schema version, use fresh tenant for testing
**Warning signs:**
- tenant_1 has 15 tables, tenant_3 has 31 tables
- Queries work in one tenant, fail in another
- Test data imports succeed on some tenants, fail on others

### Pitfall 4: Using Migration-Based Init for Fresh Tenants
**What goes wrong:** `init-tenant.ts` applies migrations sequentially, fails if migrations were created out of order or manually edited
**Why it happens:** Migration files designed for incremental updates, not fresh database creation
**How to avoid:** Use direct schema application for fresh tenants (Drizzle `db.push` or manual schema dump)
**Warning signs:**
- Migration 0003 fails because it expects columns from migration 0008
- Circular dependencies in migrations
- Failed migrations leave partial schema

### Pitfall 5: Forgetting Master Database Schema Evolution
**What goes wrong:** Focus on tenant schema, miss master database changes (ai_credits table, Stripe columns)
**Why it happens:** 90% of development activity is tenant-facing features
**How to avoid:** Audit BOTH master and tenant schemas, update both init scripts
**Warning signs:**
- `relation "ai_credits" does not exist` in production
- Master schema has 6 tables instead of 7
- Stripe columns missing from organizations table

## Code Examples

Verified patterns from current codebase:

### Create Fresh Tenant (Current Pattern - TypeScript)
```typescript
// Source: packages/database/scripts/create-tenant-3.ts (lines 1-91)
#!/usr/bin/env tsx
import postgres from 'postgres';

const masterSql = postgres('postgresql://postgres@localhost:5432/rsm_master', { max: 1 });
const tenantNumber = 3;

async function createTenant() {
  console.log(`🏗️  Creating tenant_${tenantNumber}...\n`);

  try {
    // Step 1: Create organization in master DB
    const [org] = await masterSql`
      INSERT INTO organizations (name, slug, subdomain, owner_id, subscription_tier)
      VALUES (
        ${`Test Org ${tenantNumber}`},
        ${`test-org-${tenantNumber}`},
        ${`org${tenantNumber}`},
        1,
        'enterprise'
      )
      RETURNING id, name
    `;
    console.log(`✅ Organization created: ${org.name} (ID: ${org.id})`);

    // Step 2: Create PostgreSQL database
    await masterSql.unsafe(`CREATE DATABASE tenant_${tenantNumber};`);
    console.log(`✅ Database created: tenant_${tenantNumber}`);

    // Step 3: Register in tenant_databases
    await masterSql`
      INSERT INTO tenant_databases (organization_id, database_name)
      VALUES (${org.id}, ${`tenant_${tenantNumber}`})
    `;
    console.log(`✅ Registered in tenant_databases`);

    await masterSql.end();
    console.log(`\n✨ Tenant ${tenantNumber} ready! Organization ID: ${org.id}`);
  } catch (error) {
    console.error('❌ Error creating tenant:', error);
    await masterSql.end();
    process.exit(1);
  }
}

createTenant();
```

### Seed Tenant with Current Schema (Needs Update)
```typescript
// Source: packages/database/scripts/seed-tenant-3.ts (lines 1-50)
// NOTE: Missing vCard fields, company_members table
import postgres from 'postgres';

const tenantSql = postgres('postgresql://postgres@localhost:5432/tenant_3', { max: 1 });

async function seedTenant3() {
  console.log('🌱 Seeding tenant_3 with test data...\n');

  // Step 1: Create individual clients (MISSING vCard fields)
  const [emma] = await tenantSql`
    INSERT INTO clients (name, first_name, last_name, email, phone, type, city)
    VALUES ('Emma Dubois', 'Emma', 'Dubois', 'emma.dubois@example.com', '+33 6 12 34 56 78', 'individual', 'Paris')
    RETURNING id, name
  `;

  // Step 2: Create company clients
  const [soundProd] = await tenantSql`
    INSERT INTO clients (name, type, email, phone, city, address)
    VALUES ('Sound Production SARL', 'company', 'contact@soundproduction.fr', '+33 1 23 45 67 89', 'Paris', '42 Rue de la Musique')
    RETURNING id, name
  `;

  // Step 3: Link members to companies (SHOULD use company_members table)
  await tenantSql`
    INSERT INTO company_members (company_client_id, member_client_id, role, is_primary)
    VALUES (${soundProd.id}, ${emma.id}, 'Directrice Générale', true)
  `;
}
```

### Apply Fresh Schema to Tenant (Recommended)
```bash
# Source: DEVELOPMENT-WORKFLOW.md (lines 32-56)
# Alternative to migration-based init

# 1. Create tenant database
psql -U postgres -c "CREATE DATABASE tenant_5;"

# 2. Apply current schema directly (not migrations)
cd packages/database
DATABASE_URL="postgresql://postgres@localhost:5432/tenant_5" \
  pnpm exec drizzle-kit push --config=drizzle.tenant.config.ts

# 3. Seed data
DATABASE_URL="postgresql://postgres@localhost:5432/tenant_5" \
  pnpm exec tsx src/scripts/seed-tenant-data.ts
```

### Migration Status Check (Production)
```bash
# Source: packages/database/scripts/migrate-status.sh (lines 1-40)
#!/bin/bash
BASE_URL="${1:-postgresql://postgres:password@localhost:5432}"

check_database() {
  local db_name=$1
  local db_url="${BASE_URL}/${db_name}"

  echo "📊 Checking ${db_name}..."

  # Count tables
  table_count=$(psql "$db_url" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)

  # Count foreign keys
  fk_count=$(psql "$db_url" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';" 2>/dev/null)

  echo "  Tables: ${table_count}"
  echo "  Foreign Keys: ${fk_count}"
}

check_database "rsm_master"
check_database "tenant_1"
check_database "tenant_2"
check_database "tenant_3"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Migration-based init | Direct schema application | Phase 20.1 (2026-01-17) | 30 seconds vs 2-3 hours for fresh tenants |
| Manual ALTER TABLE fixes | Increment tenant number | Phase 20.1 (2026-01-17) | Zero debugging, schema always fresh |
| SQL test data scripts | TypeScript seed scripts | Phase 20+ | Type safety, reusability |
| Single init-tenant.ts | Separate scripts per use case | Phase 21 (proposed) | Clear separation: init vs seed vs test data |
| Reactive fix scripts | Proactive schema audit | Phase 21 (proposed) | Prevention over firefighting |

**Deprecated/outdated:**
- `init-tenant.ts`: Uses migration-based approach, fails when migrations skipped
- `add-new-tenant-tables.sql`: Created for migration 0001-0002, now in base schema
- All `fix-*` scripts: Reactive patches for specific migration issues, not general-purpose
- Test data without vCard fields: Missing firstName, lastName, phones, emails, websites, avatarUrl, logoUrl

## Open Questions

### 1. Master Database Initialization Strategy
**What we know:** Production master DB needs initial setup (users, subscription_plans, etc.)
**What's unclear:** Should `deploy-master.sh` include seed data or remain migration-only?
**Recommendation:** Create separate `seed-master-base.ts` for production essentials (subscription plans), keep deploy-master.sh migration-only

### 2. Migration History Cleanup
**What we know:** Migrations 0000-0011 are sequential history, some contain now-obsolete fixes
**What's unclear:** Should we squash migrations into single "current schema" migration for fresh installs?
**Recommendation:** Keep existing migrations for production tenants (progressive updates), create alternative "fresh tenant schema" SQL dump for new tenants

### 3. Test Data Maintenance Pattern
**What we know:** Test data scripts drift from schema quickly
**What's unclear:** How often should test data be regenerated? Automated or manual process?
**Recommendation:** Create test data generation script that reads from current schema.ts (self-updating), run before major releases

### 4. Tenant Cleanup Strategy
**What we know:** Development creates tenant_1, tenant_2, tenant_3... indefinitely
**What's unclear:** When/how to clean up old development tenants? Automated or manual?
**Recommendation:** Manual cleanup script `cleanup-dev-tenants.sh` that lists tenants, confirms deletion, preserves production tenants

### 5. Schema Documentation Generation
**What we know:** Schema has 38 tables (7 master + 31 tenant), manually documented in README.md
**What's unclear:** Can we auto-generate schema documentation from Drizzle schema.ts?
**Recommendation:** Research Drizzle introspection tools, possibly generate Markdown table listing from schema files

## Sources

### Primary (HIGH confidence)
- Drizzle ORM documentation - Schema definition, migration generation
- Current codebase schema files:
  - `packages/database/src/master/schema.ts` (7 tables, 160 lines)
  - `packages/database/src/tenant/schema.ts` (31 tables, 1208 lines)
- Migration history:
  - `packages/database/drizzle/migrations/meta/_journal.json` (12 entries)
  - Individual migration files 0000-0011
- Development workflow documentation:
  - `.planning/DEVELOPMENT-WORKFLOW.md` (increment tenant pattern)
  - `.planning/STATE.md` (performance metrics, decisions)

### Secondary (MEDIUM confidence)
- Existing database scripts:
  - `packages/database/scripts/README.md` (deployment docs)
  - `packages/database/scripts/*.ts` and `*.sql` files (12 scripts analyzed)
- Git history:
  - Commits from Phases 18.1, 18.2, 18.3 (migration debugging sessions)
  - Commits from Phase 20.1 (company_members architecture change)

### Tertiary (LOW confidence - observations)
- User-reported issues: "tous les scripts sont devenus obsolètes depuis Phase 10"
- Performance data: 80+ minutes wasted on migration fixes (Phases 18.1-18.3)
- Development patterns observed: Reactive fix scripts vs proactive schema management

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Drizzle ORM usage verified throughout codebase, postgres.js driver confirmed
- Architecture: HIGH - Schema files read directly, migration history analyzed, table counts verified
- Pitfalls: HIGH - Documented from actual Phase 18-20 debugging sessions, time wasted measured
- Migration strategy: HIGH - DEVELOPMENT-WORKFLOW.md explicitly documents increment tenant pattern

**Research date:** 2026-01-17
**Valid until:** 14 days (schema evolution active, new migrations expected in Phases 22+)

**Critical findings:**
1. **31 tenant tables** vs script expectations of 15-25 tables (depending on script age)
2. **Migration 0000-0011** history creates dependency chain, breaks fresh tenant creation
3. **Increment tenant pattern** (DEVELOPMENT-WORKFLOW.md) makes migration-based scripts obsolete
4. **vCard fields** (Phase 20) and **company_members** (Phase 20.1) missing from test data
5. **80+ minutes** wasted on migration debugging (Phases 18.1-18.3) proves old approach broken

**Ready for planning:** All script files audited, schema state documented, compatibility matrix complete, archival strategy proposed.
