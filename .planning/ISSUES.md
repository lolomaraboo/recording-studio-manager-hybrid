# Project Issues & Deferred Work

**Last updated:** 2026-01-04

---

## 🔴 Active Issues

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

