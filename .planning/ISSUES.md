# Project Issues & Deferred Work

**Last updated:** 2026-01-15

---

## 🔴 Active Issues

### ISSUE-012 (P0): 🔴 CRITICAL - Drizzle ORM Silent Failure Blocks E2E Tests
**Status:** 🔴 BLOCKING Phase 17 UAT
**Created:** 2026-01-15
**Phase:** 17-03-FIX-5 - Invoice Payment Flow E2E Tests
**Severity:** CRITICAL - Architecture Bug

**Problem:**
Drizzle ORM operations fail silently in server context, preventing E2E test validation:
1. `clientPortalAuth.login` INSERT into `client_portal_sessions` returns 200 OK but doesn't write to database
2. All UPDATE and INSERT operations in login endpoint fail silently (no errors thrown)
3. Session validation always fails with "Invalid session" despite valid session token in DB
4. Even raw SQL via `tenantDb.execute()` fails with "relation does not exist" despite tables existing

**Evidence:**
```typescript
// Test creates session manually via docker exec psql
docker exec rsm-postgres psql -U postgres -d tenant_3 -c "
  INSERT INTO client_portal_sessions (client_id, token, expires_at, ...)
  VALUES (1, 'd989ceec...', '2026-01-22 08:49:02.951', ...);
"
// ✅ Success - verified with SELECT, data exists

// Backend tries to query same session via Drizzle
const sessions = await tenantDb
  .select()
  .from(clientPortalSessions)
  .where(eq(clientPortalSessions.token, 'd989ceec...'))
  .limit(1);
// ❌ Returns 0 rows - "Invalid session" error

// Even raw SQL fails
await tenantDb.execute(`SELECT * FROM client_portal_sessions WHERE token = '...'`);
// ❌ Error: relation "client_portal_sessions" does not exist
// BUT: psql shows table exists with data!
```

**Root Cause (Hypothesis):**
Connection pool isolation or transaction state corruption in `getTenantDb()`:
- `packages/database/src/connection.ts:70-128` uses connection caching
- Cached connection may be stale or connected to wrong database
- postgres.js library behavior differs from direct psql connections

**Impact:**
- ❌ Phase 17 E2E tests stuck at 1/8 passing (12.5%)
- ❌ UAT validation impossible without manual testing
- ❌ Client portal authentication untestable
- ❌ Cannot validate invoice payment flow
- ⚠️ May affect production if login endpoint has same issue

**Workarounds Attempted (ALL FAILED):**
1. ✅ Manual session creation via docker exec → Data exists but still not found
2. ✅ Switched from tenant_1 to tenant_3 → Same issue
3. ✅ Applied all 12 migrations → Tables exist, same issue
4. ✅ Recreated tenant_3 from scratch → Same issue
5. ✅ Restarted dev server → Cache cleared, same issue
6. ✅ Used raw SQL instead of Drizzle query → Still fails with "relation does not exist"

**Comparison: Works vs Doesn't Work**

| Method | Context | Result |
|--------|---------|--------|
| Direct INSERT via psql | Docker exec | ✅ Works |
| Direct SELECT via psql | Docker exec | ✅ Works |
| Drizzle INSERT | Script (`test-tenant-insert.ts`) | ✅ Works (70 sessions created!) |
| Drizzle SELECT | Script (`test-tenant3-session.ts`) | ❌ Fails - "relation does not exist" |
| Drizzle INSERT | Express/tRPC server | ❌ Fails silently (no error, no data) |
| Drizzle SELECT | Express/tRPC server | ❌ Fails - "Invalid session" |
| Raw SQL execute | Script | ❌ Fails - "relation does not exist" |

**Key Observation:** Drizzle works in standalone scripts but fails in server context.

**Investigation Findings:**
- Database exists: `tenant_3` created and registered in `tenant_databases`
- Tables exist: `\dt` shows all tables including `client_portal_sessions`
- Data exists: psql queries return correct rows
- Connection established: Logs show "Tenant DB connection established for org 3"
- Connection shows correct DB: `SELECT current_database()` returns "tenant_3"
- BUT: Drizzle queries fail as if connected to different DB or schema

**Reproduction Steps:**
1. Create session manually: `docker exec rsm-postgres psql -U postgres -d tenant_3 -c "INSERT INTO client_portal_sessions ..."`
2. Verify with psql: `SELECT * FROM client_portal_sessions WHERE token = '...'` → Returns 1 row
3. Query via Drizzle in server: `tenantDb.select().from(clientPortalSessions).where(...)` → Returns 0 rows
4. Check with raw SQL: `tenantDb.execute(SELECT * FROM client_portal_sessions...)` → Error: relation does not exist

**Potential Solutions (Not Yet Attempted):**
1. **Replace postgres.js with pg library:** Drizzle supports both, pg may have better connection pooling
2. **Add explicit schema to queries:** May be connecting to wrong schema despite showing correct database
3. **Disable connection caching:** Force fresh connections for each query
4. **Use connection string instead of getTenantDb():** Bypass caching entirely
5. **Add transaction wrapping:** Explicit BEGIN/COMMIT may force proper connection state
6. **Investigate Drizzle schema mismatch:** Schema definition may not match actual DB structure

**Files Affected:**
- `packages/database/src/connection.ts` (getTenantDb function)
- `packages/server/src/routers/client-portal-auth.ts` (login endpoint)
- `packages/server/src/routers/client-portal-dashboard.ts` (session validation)
- `e2e/test-phase17-invoice-payment.spec.ts` (workaround implemented)

**Next Steps:**
1. Research postgres.js vs pg library connection pooling differences
2. Add extensive debug logging to getTenantDb() to track connection state
3. Test with direct pg library connection to isolate issue
4. Consider refactoring to use single connection pool with schema switching
5. Document findings and create minimal reproduction case for Drizzle team

**Related Issues:**
- Phase 17-03-FIX-3: Fixed frontend calling wrong router (completed)
- Phase 17-03-FIX-4: Fixed localStorage race condition (completed)
- Phase 17-03-FIX-5: Attempted API-based test setup (blocked by this issue)

**Time Investment:** ~3 hours of investigation (2026-01-15)

**Priority Justification:**
- P0 BLOCKER: Cannot complete Phase 17 UAT
- Critical for production readiness: Client portal auth may be broken
- Architectural issue: Affects all multi-tenant DB operations
- No workaround: Manual testing not scalable

---

### ISSUE-011 (P0): ⚠️ CONFIGURATION TEMPORAIRE DEV - Session Cookies `secure: false`
**Status:** 🟡 TEMPORARY DEV CONFIG
**Created:** 2026-01-04
**Phase:** 3.14 - Améliorations UI
**File:** `packages/server/src/index.ts` lignes 126-132

**Configuration actuelle (DEV SEULEMENT):**
```javascript
cookie: {
  secure: false, // ⚠️ TEMPORARY - Allow cookies over HTTP for localhost
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  domain: undefined, // ⚠️ TEMPORARY - No domain restriction
  sameSite: 'lax',
}
```

**AVANT DÉPLOIEMENT PRODUCTION, REMETTRE:**
```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  domain: process.env.NODE_ENV === 'production' ? '.recording-studio-manager.com' : undefined,
  sameSite: 'lax',
}
```

**Raison:**
- Vite dev (`localhost:5174`) communique avec Backend Docker (`localhost:3002`)
- Navigateur bloque cookies avec `secure: true` sur HTTP (localhost)
- En production HTTPS, `secure: true` est OBLIGATOIRE pour sécurité

**Impact:**
- ✅ Permet développement local avec Vite hot-reload
- ⚠️ SÉCURITÉ RÉDUITE si déployé en production tel quel
- ⚠️ Docker container a `NODE_ENV=production` donc ignore les conditionals

**Résolution:**
- Avant `docker-compose build` pour production: remettre configuration conditionnelle
- OU ajouter variable d'environnement `COOKIE_SECURE=true` en production

---

### ISSUE-010 (P1): E2E Tests Auth Failures - Backend Registration Fixed
**Status:** ✅ PARTIALLY RESOLVED (2025-12-26)
**Created:** 2025-12-26
**Phase:** 3.2 - End-to-End Testing

**Problem:**
- ✅ **FIXED:** Backend registration endpoint returned 500 SQL error (missing Stripe columns)
- ⚠️ **REMAINING:** Auth login tests timeout on redirect (4/7 passing)
- 13/79 tests passing initially → Expected improvement after registration fix

**Root Cause (Resolved):**
- PostgreSQL schema missing 4 Stripe columns (stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end)
- Drizzle migration 0006 never ran on production
- Manual ALTER TABLE applied successfully

**Impact:**
- Registration endpoint now functional (200 OK)
- Auth workflows partially tested (signup works, login redirect issues remain)
- E2E validation partially unblocked

**Resolution Steps:**
1. Create permanent test account in production
   - Email: `e2e-test@recording-studio-manager.com`
   - Password: Store in environment variable
   - Organization: "E2E Test Studio"

2. Update test helpers with credentials
   - `e2e/helpers/login.ts` - use env var for credentials
   - Create `.env.test` file with test credentials
   - Update playwright.config.ts to load env vars

3. Re-run full test suite (79 tests)
   - Navigation tests (44)
   - Auth tests (7)
   - Workflows (5)
   - Features (13)
   - Infrastructure (6)
   - UI validation (7)

4. Fix any remaining failures
   - Adjust selectors if UI changed
   - Update timeouts if needed
   - Screenshot failures for debugging

**Expected Outcome:**
- 79/79 tests passing (or documented exceptions)
- Production fully validated via E2E tests
- Ready for Phase 4 (Marketing Foundation)

**Files to modify:**
- `.env.test` (create)
- `e2e/helpers/login.ts`
- `playwright.config.ts`
- Production DB (create test user)

---

## ⚠️ Deferred Issues (Non-blocking)

### ISSUE-011 (P1): SSE Notifications Endpoint Missing - 404 Error
**Status:** ✅ RESOLVED (2025-12-27)
**Created:** 2025-12-27
**Phase:** Production Stability

**Problem:**
- Frontend (NotificationCenter.tsx) attempting to connect to `/api/notifications/stream` via EventSource
- Backend endpoint returned 404 Not Found
- Polling fallback caused excessive server load (1532 requests, every 10s)
- Console error: `[SSE] Connection error, retrying...`

**Root Cause:**
- SSE streaming endpoint not implemented in backend
- NotificationCenter.tsx:57 had EventSource connection code but no server-side handler
- Polling continued as fallback mechanism

**Resolution:**
1. Created `/packages/server/src/lib/notificationBroadcaster.ts`
   - Singleton SSE connection manager
   - Methods: `addClient()`, `removeClient()`, `sendToUser()`, `sendToOrganization()`
   - Tracks connected clients in Map<clientId, Response>

2. Added SSE endpoint in `/packages/server/src/index.ts:171-208`
   - `GET /api/notifications/stream`
   - Session authentication required (userId + organizationId)
   - Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`
   - Keep-alive ping every 30 seconds
   - Automatic cleanup on client disconnect

3. Enhanced `/packages/server/src/routers/notifications.ts`
   - Added `create` mutation for creating notifications
   - Automatic broadcast via `notificationBroadcaster.sendToUser()`
   - Real-time push to connected SSE clients

**Verification:**
- ✅ Endpoint responds 200 OK (was 404)
- ✅ SSE headers correct (`text/event-stream`)
- ✅ Client connection logs: `[SSE] Client connected: 26-21-1766811521775 (total: 1)`
- ✅ Graceful disconnect handling
- ✅ Keep-alive mechanism active
- ✅ Polling reduced from 10s to 30s as fallback

**Impact:**
- Real-time notifications now functional
- Server load reduced (SSE vs polling)
- Better UX (instant notification delivery)

**Files Modified:**
- `packages/server/src/index.ts` (packages/server/src/index.ts:171-208)
- `packages/server/src/lib/notificationBroadcaster.ts` (new file)
- `packages/server/src/routers/notifications.ts` (packages/server/src/routers/notifications.ts:131-170)

**Deployment:**
- Production deployed 2025-12-27 04:58 UTC
- Docker image rebuilt with new SSE code
- Verified via Chrome DevTools MCP

---

### ISSUE-001 (P0): Production database not initialized
**Status:** ✅ RESOLVED (2025-12-26)
**Resolution:** Migrations run, database operational

### ISSUE-006 (P3): Debug logging in context.ts
**Status:** ✅ RESOLVED (2025-12-26)  
**Resolution:** Debug logging removed

### ISSUE-007 (P3): Deployment script missing migration step
**Status:** 📋 Deferred to Phase 7 (Production Hardening)  
**Rationale:** Manual deployment OK for now, automation needed at scale

### ISSUE-008 (P3): No automated rollback strategy
**Status:** 📋 Deferred to Phase 7 (Production Hardening)  
**Rationale:** Low deployment frequency, manual rollback acceptable

### ISSUE-009 (P3): VPS resource monitoring not configured
**Status:** 📋 Deferred to Phase 7 (Production Hardening)  
**Rationale:** Uptime Kuma monitors availability, detailed metrics needed at scale

---

## 📝 Notes

**Priority Levels:**
- **P0:** BLOCKER - Breaks production
- **P1:** HIGH - Blocks current phase
- **P2:** MEDIUM - Important but workaround exists
- **P3:** LOW - Nice to have, can defer

**Issue Lifecycle:**
- 🔴 Active - Currently being worked on
- 📋 Deferred - Logged for later
- ✅ Resolved - Fixed and verified
- ❌ Closed - Won't fix / not relevant

