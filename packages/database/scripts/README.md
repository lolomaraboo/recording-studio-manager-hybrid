# Database Scripts - Phase 21

**Last Updated:** 2026-01-17 (Phase 21-03 Complete)
**Current Schema:** 7 master tables, 31 tenant tables
**Migration Files:** 0000-0003 (master), 0000-0011 (tenant)

---

## ⚡ Quick Start (Development)

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

**⚠️ IMPORTANT:** Read `.planning/DEVELOPMENT-WORKFLOW.md` before working with database scripts.

---

## 📋 Phase 21 Audit Summary

**Audit Complete:** 2026-01-17

**Results:**
- ✅ **7 scripts ARCHIVED** - Moved to `archived/` directory (obsolete)
- ✅ **3 scripts CREATED** - New init scripts compatible with current schema
- ✅ **2 scripts TESTED** - Production deployment scripts verified working
- ✅ **Documentation UPDATED** - This README, audit-report.md, archived/README.md

**Key Changes:**
1. Obsolete scripts moved to `archived/` with detailed migration guide
2. New `init/` directory with current scripts (create-tenant, seed-base-data, seed-realistic-data)
3. Production scripts tested: deploy-master.sh (7 tables ✅), deploy-tenants.sh (31 tables ✅)

📊 **Full Audit Report:** [audit-report.md](./audit-report.md)
📚 **Archive Guide:** [archived/README.md](./archived/README.md)

---

## 🎯 Current Scripts (Phase 21)

### Initialization Scripts (Use These)

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `init/create-tenant.ts` | Create fresh tenant DB | Every time you need clean database |
| `init/seed-base-data.ts` | Minimal test data (20 records) | Quick testing, unit tests |
| `init/seed-realistic-data.ts` | Comprehensive data (60-78 records) | UI validation, manual testing |

### Production Deployment Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `deploy-master.sh` | Deploy master migrations | ✅ Phase 21 tested (7 tables) |
| `deploy-tenants.sh` | Deploy tenant migrations | ✅ Phase 21 tested (31 tables) |

### Monitoring & Utilities

| Script | Purpose | Notes |
|--------|---------|-------|
| `migrate-status.sh` | Check migration status | Expects 6/15 tables (outdated counts) |
| `test-data/create-test-studio-user.sql` | Create master DB test user | ✅ Working |
| `test-data/validate-ui-complete.sh` | Validate UI patterns | ✅ Working |

### Legacy Scripts

| Script | Status | Notes |
|--------|--------|-------|
| `create-tenant-3.ts` | ✅ WORKING | Example pattern, keep until init/ fully tested |

---

## 📂 Directory Structure

```
scripts/
├── README.md                           # This file
├── audit-report.md                     # Detailed audit (13 scripts analyzed)
├── archived/                           # ❌ Obsolete scripts (7 archived)
│   ├── README.md                       # Why archived + migration guide
│   ├── init-tenant.ts                  # Migration-based (deprecated)
│   ├── seed-tenant-3.ts                # Missing vCard fields
│   ├── add-new-tenant-tables.sql       # Tables in base schema now
│   ├── fix-sessions-add-project-id.sql # Migration 0008 handles this
│   ├── fix-tenant3-sessions-schema.sql # Migration 0003 handles this
│   ├── add-company-with-contacts.sql   # client_contacts deprecated
│   └── setup-test-studio-ui.sql        # Missing 29+ columns
├── init/                               # ✅ Current initialization scripts
│   ├── create-tenant.ts                # Universal tenant creation (auto-increment)
│   ├── seed-base-data.ts               # Minimal test data (current schema)
│   └── seed-realistic-data.ts          # Comprehensive test data (faker.js)
├── deploy-master.sh                    # ✅ Production master deployment
├── deploy-tenants.sh                   # ✅ Production tenant deployment
├── migrate-status.sh                   # ⚠️ Monitoring (outdated counts)
├── create-tenant-3.ts                  # ✅ Example pattern (legacy)
└── test-data/
    ├── create-test-studio-user.sql     # ✅ Master DB user creation
    └── validate-ui-complete.sh         # ✅ UI validation
```

---

## 💡 Development Workflow

**IMPORTANT:** When schema changes or tenant breaks:

1. ❌ **DON'T** try to fix migrations
2. ❌ **DON'T** debug schema desync
3. ✅ **DO** increment tenant number: `pnpm --filter database tsx scripts/init/create-tenant.ts`
4. ✅ **DO** apply fresh schema with current migrations

**Why:** Saves 2-3 hours of debugging per incident (documented in Phases 18.1-18.3).

**Pattern:**
```bash
# Schema changed? Create new tenant (auto-increments)
pnpm --filter database tsx scripts/init/create-tenant.ts
# Creates tenant_N with current schema (31 tables)

# Seed data
DATABASE_URL="postgresql://postgres@localhost:5432/tenant_N" \
  pnpm --filter database tsx scripts/init/seed-realistic-data.ts

# Continue building (30 seconds vs 2-3 hours debugging)
```

**Reference:** `.planning/DEVELOPMENT-WORKFLOW.md` for complete pattern explanation.

---

## 🚀 Production Deployment

### Deployment Scripts Tested (Phase 21-03)

Both production deployment scripts verified working with current schema:

**deploy-master.sh:**
```bash
# Tested: 2026-01-17
✅ All 4 migration files applied (0000-0003)
✅ Final table count: 7
✅ Tables: users, organizations, organization_members, invitations,
   tenant_databases, subscription_plans, ai_credits
✅ Zero errors during deployment
```

**deploy-tenants.sh:**
```bash
# Tested: 2026-01-17
✅ All 12 migration files applied (0000-0011)
✅ Final table count: 31
✅ Tables: clients, sessions, invoices, projects, tracks, rooms,
   equipment, service_catalog, time_entries, quotes, company_members, etc.
✅ Zero errors during deployment
```

### Deployment Workflow

#### Initial Deployment (Fresh Databases)

```bash
# 1. Check current status
./scripts/migrate-status.sh

# 2. Deploy master database
./scripts/deploy-master.sh

# 3. Deploy to all tenants
./scripts/deploy-tenants.sh

# 4. Verify deployment
./scripts/migrate-status.sh
```

#### Production Deployment

```bash
# 1. Backup databases
pg_dump rsm_master > backup_master_$(date +%Y%m%d).sql
pg_dump tenant_1 > backup_tenant_1_$(date +%Y%m%d).sql

# 2. Run on staging first
./scripts/deploy-master.sh postgresql://user:pass@staging:5432/rsm_master
./scripts/deploy-tenants.sh postgresql://user:pass@staging:5432 "tenant_staging"

# 3. Verify staging
./scripts/migrate-status.sh postgresql://user:pass@staging:5432

# 4. Deploy to production (with confirmation)
./scripts/deploy-master.sh postgresql://user:pass@prod:5432/rsm_master
./scripts/deploy-tenants.sh postgresql://user:pass@prod:5432 "tenant_prod_1 tenant_prod_2"

# 5. Verify production
./scripts/migrate-status.sh postgresql://user:pass@prod:5432
```

#### Adding New Tenant in Production

```bash
# 1. Create tenant database
psql postgresql://postgres:password@localhost:5432/postgres -c "CREATE DATABASE tenant_4;"

# 2. Deploy migrations to new tenant only
./scripts/deploy-tenants.sh postgresql://postgres:password@localhost:5432 "tenant_4"

# 3. Verify
./scripts/migrate-status.sh | grep tenant_4
```

---

## 📊 Current Schema (Phase 21)

### Master Database (7 tables)

```
users (27 columns)
organizations (57 columns) - Added: Stripe billing fields (Phase 10)
tenant_databases (4 columns)
organization_members (5 columns)
invitations (9 columns)
subscription_plans (12 columns) - Added: Phase 11
ai_credits (9 columns) - Added: Phase 11

Foreign Keys: ~8
- invitations → organizations, users
- organization_members → users, organizations
- organizations → users
- tenant_databases → organizations
- ai_credits → organizations
- subscription_plans (standalone)
```

**Migrations:** 0000-0003 (master)

### Tenant Database (31 tables - Phases 1-20)

```
Core Business (12 tables):
- clients (53+ columns) - Added: vCard fields (Phase 20)
- client_notes (5 columns) - Added: Phase 15
- company_members (6 columns) - Added: Phase 20.1 (many-to-many)
- rooms (19 columns)
- sessions (17 columns) - Added: payment tracking (Phase 12), project_id (Phase 14)
- equipment (23 columns)
- projects (26 columns)
- tracks (39 columns) - Added: 17 Phase 5 fields (versioning, copyright, technical)
- track_comments (16 columns) - Added: Phase 13
- musicians (14 columns)
- track_credits (8 columns)

Financial (9 tables):
- invoices (19 columns) - Added: deposit fields (Phase 17)
- invoice_items (7 columns)
- quotes (19 columns) - Added: Phase 11
- quote_items (9 columns) - Added: Phase 11
- service_catalog (9 columns) - Added: Phase 11
- contracts (20 columns)
- expenses (19 columns)
- payments (17 columns)
- payment_transactions (27 columns) - Added: Phase 12

Time Tracking (2 tables - Phase 13):
- task_types (9 columns)
- time_entries (13 columns)

Client Portal (4 tables - Phase 14):
- client_portal_accounts (14 columns)
- client_portal_magic_links (9 columns)
- client_portal_sessions (12 columns)
- client_portal_activity_logs (11 columns)

AI & System (4 tables - Phase 10):
- ai_conversations (9 columns)
- ai_action_logs (9 columns)
- notifications (14 columns)
- stripe_webhook_events (5 columns) - Added: Phase 17

Foreign Keys: ~45 (extensive relationships)
```

**Migrations:** 0000-0011 (tenant)

**Schema Evolution:** See [audit-report.md](./audit-report.md) for detailed migration history.

---

## 🔧 Script Details

### 1. init/create-tenant.ts

**Purpose:** Universal tenant creation with auto-increment

**Features:**
- Auto-detects next tenant number (tenant_1, tenant_2, ..., tenant_N)
- Applies all current migrations (0000-0011)
- Validates table count (expects 31 tables)
- Shows creation summary with table list

**Usage:**
```bash
pnpm --filter database tsx scripts/init/create-tenant.ts
```

**Output:**
```
🎯 Creating tenant_N...
✅ Database created
✅ Migrations applied (12 files)
✅ Table count: 31 ✅
✅ Tenant tenant_N ready for use
```

---

### 2. init/seed-base-data.ts

**Purpose:** Minimal test data for quick testing

**Data Created:**
- 5 clients (mix of individuals/companies)
- 4 rooms (Studio Principal, Studio Mix, Studio Master, Salle Répétition)
- 6 equipment items (microphones, preamps, interfaces)
- 2 sessions (completed, scheduled)
- 2 projects (albums in progress)
- Total: ~20 records

**Usage:**
```bash
DATABASE_URL="postgresql://postgres@localhost:5432/tenant_N" \
  pnpm --filter database tsx scripts/init/seed-base-data.ts
```

**Use When:**
- Unit tests need minimal data
- Quick testing of specific features
- Don't need realistic volume

---

### 3. init/seed-realistic-data.ts

**Purpose:** Comprehensive test data with faker.js for UI validation

**Data Created:**
- 12 clients (individuals + companies with vCard fields)
- 10 rooms (varied types)
- 15 equipment items (full catalog)
- 8 sessions (various statuses)
- 5 projects (different stages)
- 10 tracks (versioning, metadata)
- 3 musicians/talents
- 5 invoices (with line items)
- 6 service catalog entries
- 3 task types
- 10+ time entries
- Total: 60-78 records

**Features:**
- Realistic names, emails, phones via faker.js
- vCard fields populated (phones[], emails[], websites[], addresses[])
- Company members relationships
- Project-session linkage
- Track versioning (demo/rough/final/master)
- Invoice generation from time entries

**Usage:**
```bash
DATABASE_URL="postgresql://postgres@localhost:5432/tenant_N" \
  pnpm --filter database tsx scripts/init/seed-realistic-data.ts
```

**Use When:**
- UI validation (all views need data)
- Manual testing (realistic workflows)
- Demo environment setup
- Screenshot generation

---

### 4. deploy-master.sh

**Purpose:** Deploy migrations to master database

**Usage:**
```bash
./scripts/deploy-master.sh [database_url]

# Default (localhost rsm_master)
./scripts/deploy-master.sh

# Custom URL
./scripts/deploy-master.sh postgresql://postgres:password@localhost:5432/rsm_master

# Using environment variable
DATABASE_URL="postgresql://..." ./scripts/deploy-master.sh
```

**Features:**
- Pre-flight connection test
- Table count before/after
- Interactive confirmation prompt
- Detailed success/failure reporting
- Color-coded output

**Expected Result:**
- 7 tables created
- ~8 foreign key constraints applied

**Phase 21-03 Test:** ✅ Verified working (2026-01-17)

---

### 5. deploy-tenants.sh

**Purpose:** Deploy migrations to multiple tenant databases

**Usage:**
```bash
./scripts/deploy-tenants.sh [base_url] [tenant_list]

# Default (all 3 tenants)
./scripts/deploy-tenants.sh

# Custom base URL
./scripts/deploy-tenants.sh postgresql://postgres:password@localhost:5432

# Specific tenants only
./scripts/deploy-tenants.sh postgresql://postgres:password@localhost:5432 "tenant_1 tenant_2"

# Production deployment
./scripts/deploy-tenants.sh postgresql://user:pass@prod.db:5432 "tenant_prod_1 tenant_prod_2"
```

**Features:**
- Batch processing of multiple tenants
- Individual tenant progress tracking
- Failure isolation (one failure doesn't stop others)
- Overall summary statistics
- Failed tenant list

**Expected Result per Tenant:**
- 31 tables created
- ~45 foreign key constraints applied

**Phase 21-03 Test:** ✅ Verified working (2026-01-17)

---

### 6. migrate-status.sh

**Purpose:** Check migration status across all databases

**Usage:**
```bash
./scripts/migrate-status.sh [base_url]

# Default (localhost)
./scripts/migrate-status.sh

# Custom host
./scripts/migrate-status.sh postgresql://postgres:password@prod-db.example.com:5432
```

**Output:**
- Connection status for each database
- Table counts (master: 7, tenant: 31)
- Foreign key counts
- Migration status (applied, partial, or empty)

**⚠️ Known Issue:** Expected counts hardcoded to Phase 10 values (6 master, 15 tenant). See [audit-report.md](./audit-report.md) for details.

---

## 🗂️ Archived Scripts

**7 scripts archived** in `archived/` directory (Phase 21-03):

1. `init-tenant.ts` - Migration-based approach (deprecated)
2. `seed-tenant-3.ts` - Missing vCard fields, company_members
3. `add-new-tenant-tables.sql` - Tables in base schema now
4. `fix-sessions-add-project-id.sql` - Migration 0008 handles this
5. `fix-tenant3-sessions-schema.sql` - Migration 0003 handles this
6. `test-data/add-company-with-contacts.sql` - client_contacts deprecated
7. `test-data/setup-test-studio-ui.sql` - Missing 29+ columns

**Why Archived:** Phases 10-17 schema evolution made these scripts incompatible with current schema (7 master + 31 tenant tables).

**See:** [archived/README.md](./archived/README.md) for detailed explanation, migration paths, and what replaces each script.

---

## ⚠️ Troubleshooting

### Connection Failed

**Error:** `Connection failed`

**Solutions:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in connection string
3. Ensure database exists: `psql -l | grep rsm_master`
4. Check network access (firewall, security groups)

### Migration Already Applied

**Error:** `relation "users" already exists`

**Solutions:**
1. Check status: `./scripts/migrate-status.sh`
2. If tables exist with correct schema, deployment is complete
3. If partial deployment, manually inspect and fix
4. For fresh start, drop and recreate database

### psql Not Found

**Error:** `command not found: psql`

**Solutions:**
1. Add PostgreSQL to PATH:
```bash
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
```

2. Or update scripts to use full path:
```bash
# Replace 'psql' with
/opt/homebrew/opt/postgresql@17/bin/psql
```

### Permission Denied

**Error:** `permission denied to create table`

**Solutions:**
1. Ensure user has CREATE privilege:
```sql
GRANT CREATE ON DATABASE rsm_master TO postgres;
```

2. Or use superuser credentials

---

## 🔒 Security Notes

1. **Never commit credentials** to version control
2. **Use environment variables** for production credentials
3. **Rotate passwords** regularly
4. **Use SSL connections** in production
5. **Backup before deployment**
6. **Test on staging first**

---

## 📚 Related Documentation

- **Development Workflow:** `.planning/DEVELOPMENT-WORKFLOW.md` (increment tenant pattern)
- **Audit Report:** `scripts/audit-report.md` (full compatibility matrix)
- **Archive Guide:** `scripts/archived/README.md` (why scripts obsolete)
- **Phase 21 Summary:** `.planning/phases/21-audit-et-correction-scripts-base-de-donnees/21-01-SUMMARY.md`

---

## 🤝 Contributing

When adding new migrations:

1. Generate migrations:
```bash
pnpm drizzle-kit generate --config=drizzle.config.master.ts
pnpm drizzle-kit generate --config=drizzle.config.tenant.ts
```

2. Test on local:
```bash
./scripts/deploy-master.sh
./scripts/deploy-tenants.sh
```

3. Verify:
```bash
./scripts/migrate-status.sh
```

4. Commit migration files:
```bash
git add packages/database/drizzle/migrations/
git commit -m "feat(database): add new migration"
```

---

**Phase 21 Audit Complete:** 2026-01-17
**Scripts Audited:** 13
**Scripts Archived:** 7
**Scripts Created:** 3
**Production Scripts Tested:** 2 (deploy-master.sh, deploy-tenants.sh)
