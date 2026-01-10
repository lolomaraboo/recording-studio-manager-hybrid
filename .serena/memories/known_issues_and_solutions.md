# Known Issues and Solutions

## 1. Docker Build Cache Issue (COMMON)

### Symptom
UI changes not appearing in Docker containers despite code changes.

### Root Cause
Stale Docker build cache.

### Solution
```bash
# Full cache clear
docker builder prune -af
rm -rf packages/client/dist
docker-compose build --no-cache client
docker-compose restart client
```

### When This Occurs
- After UI component changes
- After TailwindCSS modifications
- After package.json dependency updates

### Prevention
Add `--no-cache` flag when rebuilding after major changes.

---

## 2. DATABASE_URL Not Configured

### Symptom
```
Error: DATABASE_URL environment variable is not configured
```

### Root Cause
Server requires `DATABASE_URL` to connect to master database.

### Solution
**Option 1 (Recommended):** Use startup script
```bash
./start.sh
```

**Option 2:** Set manually
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" pnpm dev
```

**Option 3:** Add to `.env` file
```bash
# packages/server/.env
DATABASE_URL=postgresql://postgres:password@localhost:5432/rsm_master
```

### When This Occurs
- Running `pnpm dev` without environment variable
- Missing `.env` file in `packages/server/`

---

## 3. Tenant Database Not Found

### Symptom
```
Error: Tenant database not found for organization X
```

### Root Cause
Organization exists in master database but corresponding tenant database was not created.

### Solution
**For development:**
```typescript
// Use this function to create tenant database
import { createTenantDatabase } from '@rsm/database/connection';
await createTenantDatabase(organizationId);
```

**For production:**
This should never occur - tenant databases are automatically created during organization creation.

### When This Occurs
- Testing with manually inserted organization records
- Database corruption or deletion
- Migration issues

---

## 4. TypeScript Strict Mode Errors

### Symptom
Hundreds of TypeScript errors in strict mode.

### Root Cause
This project uses **strict TypeScript** with all strict options enabled.

### Solution
**Fix errors, don't disable strict mode.**

Common fixes:
```typescript
// ❌ Bad
function getValue(obj: any) {
  return obj.value;
}

// ✅ Good
function getValue(obj: { value: string }): string {
  return obj.value;
}

// ❌ Bad
const users = await db.query.users.findMany();
const firstUser = users[0]; // Error: possibly undefined

// ✅ Good
const users = await db.query.users.findMany();
const firstUser = users[0];
if (!firstUser) throw new Error('No users found');
```

### Validation
```bash
pnpm check  # Must return 0 errors
```

---

## 5. Existing Tenant Databases Don't Have New Schema

### Symptom
New columns/tables not appearing in existing tenant databases after migration.

### Root Cause
Migrations only apply to **new** tenant databases created after migration.

### Solution
Create manual migration script:

```typescript
// packages/database/src/scripts/migrate-existing-tenants.ts
import { getMasterDb, getTenantDb } from '../connection';
import { sql } from 'drizzle-orm';

async function migrateAllTenants() {
  const masterDb = await getMasterDb();
  const tenants = await masterDb.query.tenant_databases.findMany();
  
  for (const tenant of tenants) {
    console.log(`Migrating tenant ${tenant.organization_id}...`);
    const tenantDb = await getTenantDb(tenant.organization_id);
    
    // Apply manual migration
    await tenantDb.execute(sql`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS artist_name TEXT;
      -- Add other schema changes
    `);
  }
  
  console.log('All tenants migrated successfully');
}

migrateAllTenants();
```

Run:
```bash
pnpm --filter database tsx src/scripts/migrate-existing-tenants.ts
```

---

## 6. pnpm Workspace Dependencies Not Found

### Symptom
```
Error: Cannot find package '@rsm/shared'
```

### Root Cause
Workspace dependencies not properly linked.

### Solution
```bash
# Reinstall all dependencies
pnpm install

# If that doesn't work, clear and reinstall
rm -rf node_modules packages/*/node_modules
pnpm install
```

### When This Occurs
- After cloning repository
- After changing workspace configuration
- After package.json modifications

---

## 7. Playwright Tests Failing on First Run

### Symptom
E2E tests fail with "No test user found" or authentication errors.

### Root Cause
Global setup didn't run or test user not created.

### Solution
```bash
# Run global setup explicitly
npx playwright test e2e/global-setup.ts

# Then run tests
npx playwright test
```

**Or:** Delete test user and let global setup recreate:
```sql
DELETE FROM users WHERE email = 'e2e-test-user@example.com';
DELETE FROM organizations WHERE name = 'E2E Test Studio';
```

---

## 8. Vite Dev Server Not Hot Reloading

### Symptom
Changes to React components not appearing without manual refresh.

### Root Cause
Vite HMR (Hot Module Replacement) issue.

### Solution
```bash
# Restart Vite dev server
pnpm --filter client dev
```

If issue persists:
```bash
# Clear Vite cache
rm -rf packages/client/node_modules/.vite
pnpm --filter client dev
```

---

## 9. PostgreSQL Connection Refused

### Symptom
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

### Root Cause
PostgreSQL not running or wrong connection string.

### Solution
**Check PostgreSQL status:**
```bash
# macOS
brew services list | grep postgresql

# Start if not running
brew services start postgresql
```

**Verify connection string:**
```bash
# Test connection
psql -U postgres -d rsm_master

# If fails, check DATABASE_URL in .env
```

---

## 10. Stripe Webhook Signature Verification Failed

### Symptom
```
Error: Webhook signature verification failed
```

### Root Cause
`STRIPE_WEBHOOK_SECRET` doesn't match Stripe CLI forwarding session.

### Solution
1. Start new Stripe CLI session:
   ```bash
   stripe listen --forward-to http://localhost:3001/api/webhooks/stripe
   ```

2. Copy new webhook secret from output:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxx
   ```

3. Update `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

4. Restart server

---

## 11. Cookie Security Warning (ISSUE-011)

### Issue
Development cookies use `secure: false` for localhost. Must be changed to `secure: true` in production.

### Location
Check cookie configuration in:
- `packages/server/src/middleware/auth.ts`
- Session cookie settings

### Reminder
Before production deployment, set:
```typescript
res.cookie('token', jwt, {
  httpOnly: true,
  secure: true,  // ← MUST be true in production
  sameSite: 'strict',
});
```

### Documented
`.planning/phases/03-authentication-billing-ux/03-14-04-SUMMARY.md`

---

## 12. Git Submodule Issues

### Symptom
Git submodules not initializing or updating.

### Solution
```bash
# Initialize all submodules
git submodule update --init --recursive

# Update all submodules
git submodule update --remote --recursive
```

---

## Quick Debugging Commands

```bash
# Check all services status
docker-compose ps

# View server logs
docker-compose logs -f server

# View client logs  
docker-compose logs -f client

# Check database connectivity
psql -U postgres -d rsm_master -c "SELECT 1"

# Test backend health
curl http://localhost:3001/health

# Check frontend running
curl http://localhost:5174

# Verify TypeScript config
pnpm check

# List all databases
psql -U postgres -l
```
