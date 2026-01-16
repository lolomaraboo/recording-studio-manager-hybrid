# Migration Docker → Native PostgreSQL

**Created:** 2026-01-16
**Decision:** Simplify architecture - remove Docker overhead for PostgreSQL
**Risk:** ZERO - No production customers yet (still in dev)

---

## Current State

**Local Mac:**
- PostgreSQL: ❌ Not installed
- Docker rsm-postgres: ✅ Running (corrupted DBs)

**VPS:**
- PostgreSQL: ✅ Installed v16.11 (systemd active)
- Docker rsm-postgres: ✅ Running (contains current data)

---

## Target Architecture

**Local Dev:**
```
PostgreSQL native (localhost:5432)
└── rsm_master (7 tables)
└── tenant_1 (30 tables)
```

**VPS:**
```
PostgreSQL native (localhost:5432)
└── rsm_master (7 tables)
└── tenant_2, 3, 7-12, org_1, org_3, org_6, superadmin (30 tables each)
```

**Docker:** ❌ Removed entirely

---

## Migration Plan

### Phase 1: Install PostgreSQL Local (Mac)

```bash
# Install via Homebrew
brew install postgresql@16

# Start service
brew services start postgresql@16

# Create user (if needed)
createuser -s postgres

# Verify
psql -l
```

### Phase 2: Migrate VPS Data (Docker → Native)

```bash
# 1. Backup Docker data
docker exec rsm-postgres pg_dumpall -U postgres > /root/backup_docker_$(date +%Y%m%d).sql

# 2. Stop application (to prevent writes during migration)
docker-compose stop server client

# 3. Import to native PostgreSQL
sudo -u postgres psql < /root/backup_docker_$(date +%Y%m%d).sql

# 4. Verify databases exist
sudo -u postgres psql -l | grep -E "rsm_|tenant_"

# 5. Verify table counts
sudo -u postgres psql -d rsm_master -c "\dt" | wc -l
sudo -u postgres psql -d tenant_2 -c "\dt" | wc -l
```

### Phase 3: Update Application Configuration

**VPS - Update docker-compose.yml:**

BEFORE:
```yaml
server:
  environment:
    - DATABASE_URL=postgresql://postgres:password@rsm-postgres:5432/rsm_master
```

AFTER:
```yaml
server:
  environment:
    - DATABASE_URL=postgresql://postgres:password@localhost:5432/rsm_master
  network_mode: host  # Allow access to host PostgreSQL
```

**Local - Update .env / start scripts:**

```bash
# .env or start.sh
DATABASE_URL="postgresql://postgres@localhost:5432/rsm_master"
```

### Phase 4: Generate & Apply Missing Migrations

```bash
# Generate migration for Phase 10-17 tables
cd packages/database
pnpm db:generate

# Apply to local native
DATABASE_URL="postgresql://postgres@localhost:5432/rsm_master" pnpm db:migrate

# Apply to VPS native
ssh root@vps "cd /var/www/rsm && DATABASE_URL='postgresql://postgres:password@localhost:5432/rsm_master' pnpm db:migrate"
```

### Phase 5: Test Applications

**Local:**
```bash
DATABASE_URL="postgresql://postgres@localhost:5432/rsm_master" pnpm dev
# Access http://localhost:5174 and test
```

**VPS:**
```bash
# Restart app with new DATABASE_URL
docker-compose up -d
# Access https://recording-studio-manager.com and test
```

### Phase 6: Cleanup Docker

**Only after verified working for 24h+**

```bash
# Stop Docker postgres
docker-compose stop rsm-postgres

# Remove container (data persists in volume)
docker-compose rm rsm-postgres

# Optional: Remove Docker volume (only when 100% confident)
docker volume rm rsm-postgres-data
```

---

## Verification Checklist

**Local:**
- [ ] PostgreSQL 16 installed and running
- [ ] rsm_master database created
- [ ] All 7 master tables exist
- [ ] tenant_1 database created with 30 tables only
- [ ] Application connects and works
- [ ] Can register new user
- [ ] Can create organization

**VPS:**
- [ ] Data migrated from Docker to native
- [ ] All 13 tenant databases present
- [ ] Master database has 7 tables (after migration applied)
- [ ] Tenant databases have 30 tables (after migration applied)
- [ ] Application connects and works
- [ ] Existing test accounts still work
- [ ] No errors in application logs

---

## Rollback Plan

**If anything fails:**

**VPS:**
```bash
# Revert docker-compose.yml to use rsm-postgres:5432
git checkout docker-compose.yml

# Restart Docker postgres
docker-compose up -d rsm-postgres

# Restart application
docker-compose restart server client
```

**Local:**
```bash
# Go back to Docker (if needed)
docker-compose up -d rsm-postgres

# Update DATABASE_URL in start scripts
```

---

## Benefits of Native PostgreSQL

✅ **Simpler:** Direct `psql` access, no `docker exec`
✅ **Faster:** No Docker I/O overhead
✅ **Less RAM:** No container overhead (~200MB saved)
✅ **Easier debugging:** Standard PostgreSQL logs
✅ **Better tooling:** GUI tools connect directly (Postico, pgAdmin)
✅ **Cleaner architecture:** One less moving part

---

## Next Actions

This migration will be implemented as Phase 18.1 plans:
- 18.1-01: Install PostgreSQL native + generate migrations
- 18.1-02: Setup local native database
- 18.1-03: Migrate VPS Docker → Native
- 18.1-04: Test & cleanup Docker
