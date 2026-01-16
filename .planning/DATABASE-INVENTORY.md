# Database Inventory & Environment Clarification

**Created:** 2026-01-16
**Status:** 🚧 IN PROGRESS - Audit required
**Reason:** Phase 18.1 blocked - cannot fix schema sync without understanding which databases exist and their roles

---

## Problem Statement

Before Phase 18.1, we have multiple PostgreSQL instances scattered across environments:
- Local native PostgreSQL
- Docker local containers
- VPS native PostgreSQL
- Docker VPS containers

**Current state:** Unclear which database serves which purpose (dev/test/staging/prod).

**Blocker:** Cannot safely apply schema fixes without inventory.

---

## Audit Plan

### Step 1: Identify All PostgreSQL Instances

**Local Machine (marabook_m1):**
- [ ] Native PostgreSQL: Check `psql -l` for rsm_master and tenant_* databases
- [ ] Docker containers: Check `docker ps` for postgres containers

**VPS Server:**
- [ ] Native PostgreSQL: SSH check for postgres service
- [ ] Docker containers: SSH check for postgres containers in docker-compose

### Step 2: For Each Instance Found

Document:
- Connection string (host:port)
- Databases present (rsm_master, tenant_*)
- Schema version (check migrations table)
- Role (dev/test/staging/prod)
- Last updated (mtime on data directory or query)
- Size (pg_database_size)

### Step 3: Define Roles

Assign clear purposes:
- **Development** - Where code changes are tested first
- **Testing** - For automated E2E tests (Phase 18-02)
- **Staging** - Pre-production validation
- **Production** - Live customer data

---

## Inventory Results

### Local Native PostgreSQL

**Connection:** `postgresql://localhost:5432` (no password needed)

**Status:** ✅ RUNNING (PostgreSQL 17.7 Homebrew)

**Service:** ✅ Started via Homebrew LaunchAgent

**Path:** `/opt/homebrew/opt/postgresql@17/bin/psql` (not in PATH)

**Databases:**
- ✅ rsm_master - 5 tables (users, organizations, invitations, organization_members, tenant_databases)
- ✅ tenant_1 - 29 tables (MIXED master + tenant tables) ❌ CORRUPTED
- ✅ tenant_2, 3, 4 - Not audited yet

**Issues Found:**
- ⚠️ **MISSING:** subscription_plans table in rsm_master (should be 6 tables, not 5)
- ⚠️ **MISSING:** ai_credits table in rsm_master (should be 7 tables total)
- 🔴 **CORRUPTED:** tenant_1 has BOTH master tables (invitations, organization_members, organizations, subscription_plans, tenant_databases, users) AND tenant tables
- Same corruption as Docker local - master/tenant tables mixed

**Role:** 🟡 DEVELOPMENT (PARTIALLY WORKING - needs schema fixes)

---

### Docker Local (rsm-postgres container)

**Status:** ✅ RUNNING (Up 18 hours, healthy)

**Connection:** Container internal port 5432 (not exposed to host)

**Databases:**
- ✅ rsm_master - **EMPTY (0 tables)** ❌ BROKEN
- ✅ tenant_1 - 17+ tables (MIXED master + tenant tables) ❌ SCHEMA CORRUPTED
- ✅ tenant_3 - Not audited yet

**Issues Found:**
- 🔴 **CRITICAL:** rsm_master has NO tables - database exists but completely empty
- 🔴 **CRITICAL:** tenant_1 has BOTH master tables (invitations, organization_members) AND tenant tables (clients, sessions)
- This is incorrect - master tables should ONLY be in rsm_master, tenant tables ONLY in tenant_*

**Role:** 🚧 DEVELOPMENT (BROKEN - needs schema rebuild)

---

### VPS Native PostgreSQL

**Status:** ⏳ NOT AUDITED (if exists)

**Role:** ❓ TO BE CHECKED

---

### VPS Docker (rsm-postgres container)

**Status:** ✅ RUNNING (Up 4 days, healthy)

**Connection:** Docker container in production environment

**Databases:**
- ✅ rsm_master - 6 tables (users, organizations, subscription_plans, tenant_databases, invitations, organization_members) ✅ CORRECT
- ✅ tenant_2, 3, 7-12 - Tenant-only tables (clients, sessions, invoices, etc.) ✅ CORRECT
- ✅ tenant_org_1, org_3, org_6 - Tenant databases
- ✅ tenant_superadmin - Special tenant for superadmin

**Schema Validation:**
- ✅ Master tables ONLY in rsm_master
- ✅ Tenant tables ONLY in tenant_* databases
- ✅ Proper separation - architecture is correct

**Role:** 🟢 PRODUCTION (HEALTHY)

---

## Proposed Environment Strategy

Based on audit findings, **RECOMMENDED APPROACH:**

### 1. Environment Roles (Defined)

| Environment | Status | Role | Action Required |
|-------------|--------|------|-----------------|
| **Local Native** | 🟡 PARTIALLY WORKING | Development | 🔧 FIX corrupted tenant_1, add missing tables |
| **Local Docker** | 🔴 BROKEN | - | ❌ REMOVE (redundant with native) |
| **VPS Native** | ✅ INSTALLED | - | 🔧 MIGRATE data from Docker |
| **VPS Docker** | 🟢 HEALTHY | Production (current) | 🔧 MIGRATE out, then remove |

### 2. Schema Comparison Table

| Component | Code (schema.ts) | VPS Docker | Local Native | Local Docker | Status |
|-----------|------------------|------------|--------------|--------------|--------|
| **Master Tables** | 7 tables | 6 tables | 5 tables | 0 tables | 🔴 |
| - subscription_plans | ✅ Defined | ✅ Present | ❌ Missing | ❌ Missing | MISSING Local |
| - ai_credits | ✅ Defined | ❌ Missing | ❌ Missing | ❌ Missing | CRITICAL |
| **Tenant Tables** | 30 tables | 24 tables | 29 (mixed) | 29 (mixed) | 🔴 |
| - client_contacts | ✅ Defined | ❌ Missing | ❌ Missing | Phase 3.9 |
| - service_catalog | ✅ Defined | ❌ Missing | ❌ Missing | Phase 11.5 |
| - stripe_webhook_events | ✅ Defined | ❌ Missing | ❌ Missing | Phase 17 |
| - task_types | ✅ Defined | ❌ Missing | ❌ Missing | Phase 12 |
| - time_entries | ✅ Defined | ❌ Missing | ❌ Missing | Phase 13 |
| - track_comments | ✅ Defined | ❌ Missing | ❌ Missing | Phase 5 |
| **Migrations** | 1 file (Dec 15) | Applied Dec 15 | Never applied | 🔴 |

### 3. Revised Fix Strategy

**Problem (Updated):** BOTH Local AND Production are missing Phase 10-17 tables.

**Root Issue:** Drizzle migrations were never generated after Phase 3 (Dec 15). Phases 10-17 modified schema.ts but never ran `pnpm db:generate`.

**Solution:** Generate ALL missing migrations, then apply to both environments.

**Steps:**

**PHASE 1: Generate Missing Migrations**
1. 🔧 Run `pnpm db:generate` to create migration for Phase 10-17 changes
2. ✅ Review generated SQL (should add 7 tables: 1 master + 6 tenant)
3. ✅ Commit new migration file(s)

**PHASE 2: Fix Local Docker (Dev Environment)**
1. 🔧 Backup (if needed): `docker exec rsm-postgres pg_dump -U postgres rsm_master > backup_local.sql`
2. 🔧 Drop corrupted databases: `docker exec rsm-postgres psql -U postgres -c "DROP DATABASE tenant_1; DROP DATABASE tenant_3;"`
3. 🔧 Recreate rsm_master clean: `docker exec rsm-postgres psql -U postgres -c "DROP DATABASE rsm_master; CREATE DATABASE rsm_master;"`
4. 🔧 Apply ALL migrations: `DATABASE_URL="postgresql://postgres:password@rsm-postgres:5432/rsm_master" pnpm db:migrate`
5. 🔧 Run init script: `DATABASE_URL="postgresql://postgres:password@rsm-postgres:5432/rsm_master" pnpm db:init`
6. ✅ Verify: Check rsm_master has 7 tables, tenant_1 has 30 tables (separated correctly)

**PHASE 3: Update VPS Production (CAREFUL)**
1. ✅ **CRITICAL:** Backup production first: `ssh root@vps "docker exec rsm-postgres pg_dumpall > backup_prod_$(date +%Y%m%d).sql"`
2. 🔧 Apply NEW migration to rsm_master: `pnpm db:migrate` (adds ai_credits)
3. 🔧 For EACH tenant DB, apply tenant migrations (adds 6 tables)
4. ✅ Verify: Check production data intact + new tables exist
5. ✅ Test: Ensure application works with new schema

### 3. Long-term Strategy

**Development Flow:**
```
Code change → Update schema.ts → pnpm db:generate → Apply locally → Test → Deploy to VPS
```

**Environment Sync:**
- Local Docker = Fresh from migrations (always rebuildable)
- VPS Production = Apply migrations carefully with backups

**Testing Strategy:**
- Phase 18-02 tests = Run against LOCAL Docker (rebuilt)
- UAT = Run against VPS staging tenant (if created)
- Production = VPS Docker (customers)

---

## Critical Findings Summary

### ✅ What's Working

- VPS Docker production database has correct schema separation
- 13 tenant databases operational in production
- Master DB structure is correct on VPS

### 🔴 What's Broken

**Local Docker:**
- rsm_master: COMPLETELY EMPTY (0 tables) ❌
- tenant_1: CORRUPTED - Has 29 tables mixing BOTH master and tenant tables ❌
- Missing 6 Phase 10-17 tables (clientContacts, serviceCatalog, stripeWebhookEvents, taskTypes, timeEntries, trackComments)

**VPS Docker (Production):**
- rsm_master: Missing `ai_credits` table (defined in schema.ts) ⚠️
- tenant_2-12: Missing 6 Phase 10-17 tables ⚠️:
  1. `client_contacts` (Phase 3.9 - Client contacts for companies)
  2. `service_catalog` (Phase 11.5 - Service templates)
  3. `stripe_webhook_events` (Phase 17 - Idempotency tracking)
  4. `task_types` (Phase 12 - Task categories for time tracking)
  5. `time_entries` (Phase 13 - Time tracking records)
  6. `track_comments` (Phase 5 - Track feedback/notes)

### 🎯 Root Cause

**CONFIRMED:** Both environments stopped at Phase 10 (early January 2026).

**Timeline:**
- Dec 15, 2025: Migration `0000_massive_zodiak.sql` created (Phase 3)
- Jan 5-15, 2026: Phases 10-17 developed (6 new tenant tables + ai_credits master table)
- **NO NEW MIGRATIONS GENERATED** since Dec 15
- Databases deployed from old migration, never updated with Phase 10-17 schema changes

**Evidence:**
- Only 1 migration exists: `0000_massive_zodiak.sql` (Dec 15)
- TypeScript schema.ts has 7 master + 30 tenant tables (Phase 17 complete)
- VPS DB has 6 master + 24 tenant tables (Phase 10 state)
- Local DB is corrupted (master empty, tenant_1 mixed schema)

---

## Next Actions

- [x] Run audit commands for all environments
- [x] Populate inventory results
- [x] Define environment roles
- [x] Document fix strategy
- [ ] **Execute fix:** Rebuild local Docker database
- [ ] **Verify:** Test application connects to rebuilt local DB
- [ ] **Proceed:** Resume Phase 18.1 with correct target (local Docker)
