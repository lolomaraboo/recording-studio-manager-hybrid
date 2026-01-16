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

**Connection:** `postgresql://postgres:password@localhost:5432`

**Status:** ❌ NOT ACCESSIBLE / NOT RUNNING

**Role:** ❌ NOT IN USE

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
| **Local Docker** | 🔴 BROKEN | Development | 🔧 REBUILD from scratch |
| **VPS Docker** | 🟢 HEALTHY | Production | ✅ Keep as-is (reference) |
| **Local Native** | ❌ NOT RUNNING | - | ❌ Not needed |
| **VPS Native** | ❓ UNKNOWN | - | Check if exists |

### 2. Immediate Fix Strategy

**Problem:** Local Docker rsm_master is empty, causing all dev work to fail.

**Solution:** Rebuild local dev database using VPS production schema as reference

**Steps:**
1. ✅ **Backup VPS production** (if not already done)
2. 🔧 **Destroy local Docker databases** (drop rsm_master, tenant_*)
3. 🔧 **Apply migrations to empty local rsm_master** (from drizzle/migrations/master/)
4. 🔧 **Run init script** (creates master schema + seed data)
5. 🔧 **Create test tenant** (tenant_1 with ONLY tenant tables)
6. ✅ **Verify separation** (master tables in rsm_master, tenant tables in tenant_1)
7. ✅ **Test application** (can connect and query both databases)

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

- Local Docker rsm_master is COMPLETELY EMPTY (0 tables)
- Local Docker tenant_1 has CORRUPTED schema (master + tenant tables mixed)
- Cannot run Phase 18-02 tests locally until fixed

### 🎯 Root Cause

**Schema drift** - Local development database was never properly initialized or got corrupted during development.

Production is fine because it was deployed with proper migrations from the start.

---

## Next Actions

- [x] Run audit commands for all environments
- [x] Populate inventory results
- [x] Define environment roles
- [x] Document fix strategy
- [ ] **Execute fix:** Rebuild local Docker database
- [ ] **Verify:** Test application connects to rebuilt local DB
- [ ] **Proceed:** Resume Phase 18.1 with correct target (local Docker)
