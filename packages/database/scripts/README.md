# Database Scripts

Automated scripts for database management in Database-per-Tenant architecture.

## ⚠️ Phase 21 Audit Results (2026-01-17)

**CRITICAL:** Many scripts are **obsolete** due to schema evolution (Phases 10-20 added 16 tables).

**Script Status:**
- ✅ **5 scripts WORKING** (38%) - deploy-master.sh, deploy-tenants.sh, create-tenant-3.ts, create-test-studio-user.sql, validate-ui-complete.sh
- ⚠️ **3 scripts PARTIAL** (23%) - seed-tenant-3.ts, migrate-status.sh, setup-test-studio-ui.sql
- ❌ **5 scripts OBSOLETE** (38%) - init-tenant.ts, add-new-tenant-tables.sql, fix-*.sql, add-company-with-contacts.sql

**Recommended Actions:**
1. ✅ **USE** working scripts for production deployments
2. ⚠️ **UPDATE** partial scripts before use (see audit-report.md)
3. ❌ **DO NOT USE** obsolete scripts (archived or deprecated)

📊 **Full Audit Report:** [audit-report.md](./audit-report.md)

---

## 📋 Overview

This directory contains scripts for deploying and managing database migrations across:
- **Master Database** (rsm_master): Platform-level tables (users, organizations, tenants, subscription_plans, ai_credits)
- **Tenant Databases** (tenant_N): Business logic tables per organization (clients, sessions, projects, invoices, etc.)

## 🎯 Current Best Practices (Post-Audit)

**Development Tenant Creation:**
- ✅ **DO:** Use `create-tenant-3.ts` pattern (apply all migrations to fresh database)
- ✅ **DO:** Follow "increment tenant number" pattern from [DEVELOPMENT-WORKFLOW.md](../../../.planning/DEVELOPMENT-WORKFLOW.md)
- ❌ **DON'T:** Use `init-tenant.ts` (migration-based approach causes issues)
- ❌ **DON'T:** Create fix scripts for schema mismatches (increment tenant number instead)

**Test Data:**
- ✅ **DO:** Use `create-test-studio-user.sql` for master DB users
- ⚠️ **CAUTION:** `seed-tenant-3.ts` missing vCard fields (update before use)
- ⚠️ **CAUTION:** `setup-test-studio-ui.sql` missing 16 tables (outdated)
- ❌ **DON'T:** Use `add-company-with-contacts.sql` (uses deprecated `client_contacts` table)

**Production Deployment:**
- ✅ **DO:** Use `deploy-master.sh` and `deploy-tenants.sh` (production-ready)
- ✅ **DO:** Test on staging first
- ✅ **DO:** Backup before deployment

**Monitoring:**
- ✅ **DO:** Use `migrate-status.sh` for quick status check
- ⚠️ **NOTE:** Expects 6 master / 15 tenant tables (actual: 7 / 31)

**Recommended Development Pattern:**
```bash
# Schema changed or tenant broken? Create NEW tenant
createdb tenant_4  # Or tenant_5, tenant_6, etc.
cd packages/database
DATABASE_URL="postgresql://postgres@localhost:5432/tenant_4" \
  pnpm exec drizzle-kit push --config=drizzle.tenant.config.ts
# Fresh schema in 30 seconds vs 2-3 hours debugging
```

---

## 🚀 Scripts

### 1. migrate-status.sh

Check migration status across all databases.

**Usage:**
```bash
./migrate-status.sh [base_url]
```

**Examples:**
```bash
# Default (localhost)
./migrate-status.sh

# Custom host
./migrate-status.sh postgresql://postgres:password@prod-db.example.com:5432
```

**Output:**
- Connection status for each database
- Table counts (master: 7, tenant: 31) ⚠️ **Note:** Script expects 6/15 (outdated)
- Foreign key counts
- Migration status (applied, partial, or empty)

⚠️ **Known Issue:** Expected counts hardcoded to Phase 10 values (6 master, 15 tenant). See [audit-report.md](./audit-report.md) for details.

---

### 2. deploy-master.sh

Deploy migrations to the master database.

**Usage:**
```bash
./deploy-master.sh [database_url]
```

**Examples:**
```bash
# Default (localhost rsm_master)
./deploy-master.sh

# Custom URL
./deploy-master.sh postgresql://postgres:password@localhost:5432/rsm_master

# Using environment variable
DATABASE_URL="postgresql://..." ./deploy-master.sh
```

**Features:**
- Pre-flight connection test
- Table count before/after
- Interactive confirmation prompt
- Detailed success/failure reporting
- Color-coded output

**Expected Result:**
- 7 tables created (users, organizations, tenant_databases, organization_members, invitations, subscription_plans, ai_credits)
- ~8 foreign key constraints applied

---

### 3. deploy-tenants.sh

Deploy migrations to multiple tenant databases.

**Usage:**
```bash
./deploy-tenants.sh [base_url] [tenant_list]
```

**Examples:**
```bash
# Default (all 3 tenants)
./deploy-tenants.sh

# Custom base URL
./deploy-tenants.sh postgresql://postgres:password@localhost:5432

# Specific tenants only
./deploy-tenants.sh postgresql://postgres:password@localhost:5432 "tenant_1 tenant_2"

# Production deployment
./deploy-tenants.sh postgresql://user:pass@prod.db:5432 "tenant_prod_1 tenant_prod_2"
```

**Features:**
- Batch processing of multiple tenants
- Individual tenant progress tracking
- Failure isolation (one failure doesn't stop others)
- Overall summary statistics
- Failed tenant list

**Expected Result per Tenant:**
- 31 tables created (clients, sessions, projects, invoices, tracks, quotes, time_entries, client_portal_*, etc.)
- ~45 foreign key constraints applied

---

## 🔧 Prerequisites

### Local Development

1. **PostgreSQL 17** installed and running:
```bash
# Homebrew (macOS)
brew services start postgresql@17

# Or check status
pg_isready -h localhost -p 5432
```

2. **Database credentials** configured:
- Default: `postgresql://postgres:password@localhost:5432`
- Override via environment: `DATABASE_URL`

3. **Databases exist**:
```bash
# Create if needed
psql postgresql://postgres:password@localhost:5432/postgres -c "CREATE DATABASE rsm_master;"
psql postgresql://postgres:password@localhost:5432/postgres -c "CREATE DATABASE tenant_1;"
psql postgresql://postgres:password@localhost:5432/postgres -c "CREATE DATABASE tenant_2;"
psql postgresql://postgres:password@localhost:5432/postgres -c "CREATE DATABASE tenant_3;"
```

### Production

1. **psql** must be in PATH or update scripts with full path
2. **Network access** to database server
3. **Appropriate credentials** with CREATE TABLE, ALTER TABLE permissions
4. **Backup** existing databases before deployment

---

## 📂 Migration Files

Scripts apply migrations from:
- **Master**: `../drizzle/migrations/master/0000_*.sql`
- **Tenant**: `../drizzle/migrations/tenant/0000_*.sql`

Generated by:
```bash
pnpm drizzle-kit generate --config=drizzle.config.master.ts
pnpm drizzle-kit generate --config=drizzle.config.tenant.ts
```

---

## 🔄 Deployment Workflow

### Initial Deployment (Fresh Databases)

```bash
# 1. Check current status
./migrate-status.sh

# 2. Deploy master database
./deploy-master.sh

# 3. Deploy to all tenants
./deploy-tenants.sh

# 4. Verify deployment
./migrate-status.sh
```

### Production Deployment

```bash
# 1. Backup databases
pg_dump rsm_master > backup_master_$(date +%Y%m%d).sql
pg_dump tenant_1 > backup_tenant_1_$(date +%Y%m%d).sql

# 2. Run on staging first
./deploy-master.sh postgresql://user:pass@staging:5432/rsm_master
./deploy-tenants.sh postgresql://user:pass@staging:5432 "tenant_staging"

# 3. Verify staging
./migrate-status.sh postgresql://user:pass@staging:5432

# 4. Deploy to production (with confirmation)
./deploy-master.sh postgresql://user:pass@prod:5432/rsm_master
./deploy-tenants.sh postgresql://user:pass@prod:5432 "tenant_prod_1 tenant_prod_2 tenant_prod_3"

# 5. Verify production
./migrate-status.sh postgresql://user:pass@prod:5432
```

### Adding New Tenant

```bash
# 1. Create tenant database
psql postgresql://postgres:password@localhost:5432/postgres -c "CREATE DATABASE tenant_4;"

# 2. Deploy migrations to new tenant only
./deploy-tenants.sh postgresql://postgres:password@localhost:5432 "tenant_4"

# 3. Verify
./migrate-status.sh | grep tenant_4
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

### Tenant Database (31 tables - Phases 1-20)

```
Core Business:
- clients (53+ columns) - Added: vCard fields (Phase 20)
- client_notes (5 columns) - Added: Phase 15
- client_contacts (8 columns) - DEPRECATED in Phase 20
- company_members (6 columns) - Added: Phase 20.1 (many-to-many)
- rooms (19 columns)
- sessions (17 columns) - Added: payment tracking (Phase 12)
- equipment (23 columns)
- projects (26 columns)
- tracks (39 columns) - Added: 17 Phase 5 fields (versioning, copyright, technical)
- track_comments (16 columns) - Added: Phase 13
- musicians (14 columns)
- track_credits (8 columns)

Financial:
- invoices (19 columns) - Added: deposit fields (Phase 17)
- invoice_items (7 columns)
- quotes (19 columns) - Added: Phase 11
- quote_items (9 columns) - Added: Phase 11
- service_catalog (9 columns) - Added: Phase 11
- contracts (20 columns)
- expenses (19 columns)
- payments (17 columns)
- payment_transactions (27 columns) - Added: Phase 12

Time Tracking (Phase 13):
- task_types (9 columns)
- time_entries (13 columns)

Client Portal (Phase 14):
- client_portal_accounts (14 columns)
- client_portal_magic_links (9 columns)
- client_portal_sessions (12 columns)
- client_portal_activity_logs (11 columns)

AI & System (Phase 10):
- ai_conversations (9 columns)
- ai_action_logs (9 columns)
- notifications (14 columns)
- stripe_webhook_events (5 columns) - Added: Phase 17

Foreign Keys: ~45 (extensive relationships)
```

**Schema Evolution:** See [audit-report.md](./audit-report.md) for detailed migration history (0000-0011).

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
1. Check status: `./migrate-status.sh`
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

- [Database Architecture](../../docs/architecture/multi-tenant.md)
- [Drizzle Migrations Guide](../../docs/migrations.md)
- [Production Deployment Checklist](../../docs/deployment.md)

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
./deploy-master.sh
./deploy-tenants.sh
```

3. Verify:
```bash
./migrate-status.sh
```

4. Commit migration files:
```bash
git add packages/database/drizzle/migrations/
git commit -m "feat(database): add new migration"
```

---

## 📋 Script Status Table

Quick reference for all scripts (Phase 21 Audit - 2026-01-17):

| Script | Category | Status | Action | Notes |
|--------|----------|--------|--------|-------|
| **create-tenant-3.ts** | INIT | ✅ WORKING | Use (can generalize) | Preferred pattern for new tenants |
| **deploy-master.sh** | DEPLOY | ✅ WORKING | Use | Production master deployment |
| **deploy-tenants.sh** | DEPLOY | ✅ WORKING | Use | Batch tenant deployment |
| **create-test-studio-user.sql** | SEED | ✅ WORKING | Use | Master DB user creation |
| **validate-ui-complete.sh** | MONITOR | ✅ WORKING | Use | UI validation tool |
| **seed-tenant-3.ts** | SEED | ⚠️ PARTIAL | Update first | Missing vCard fields |
| **migrate-status.sh** | MONITOR | ⚠️ PARTIAL | Update first | Hardcoded counts outdated (6→7, 15→31) |
| **setup-test-studio-ui.sql** | SEED | ⚠️ PARTIAL | Major update needed | Missing 16 tables + columns |
| **init-tenant.ts** | INIT | ❌ OBSOLETE | Archive | Migration-based approach deprecated |
| **add-new-tenant-tables.sql** | FIX | ❌ OBSOLETE | Archive | Tables in base migrations now |
| **fix-sessions-add-project-id.sql** | FIX | ❌ OBSOLETE | Archive | Column in migration 0008 |
| **fix-tenant3-sessions-schema.sql** | FIX | ❌ OBSOLETE | Archive | Columns in migration 0003 |
| **add-company-with-contacts.sql** | SEED | ❌ OBSOLETE | Archive | Uses deprecated `client_contacts` |

**Legend:**
- ✅ **WORKING:** Compatible with current schema, safe to use
- ⚠️ **PARTIAL:** Works but missing recent schema additions, update before use
- ❌ **OBSOLETE:** Broken, outdated, or redundant - do not use

**See [audit-report.md](./audit-report.md) for detailed analysis.**

---

**Last Updated:** 2026-01-17 (Phase 21 Audit)
**Current Schema:** 7 master tables, 31 tenant tables
**Migration Files:** 0000-0002 (master), 0000-0011 (tenant)
**Audit Report:** [audit-report.md](./audit-report.md)
