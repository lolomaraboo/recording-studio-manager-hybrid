# Project Issues & Deferred Work

**Last updated:** 2025-12-26

---

## 🔴 Active Issues

### ISSUE-010 (P1): E2E Tests Auth Failures
**Status:** 🔄 In Progress  
**Created:** 2025-12-26  
**Phase:** 3.2 - End-to-End Testing  

**Problem:**
- Auth login tests fail (no valid test credentials in production)
- Workflow tests requiring authentication blocked
- 13/79 tests passing (infrastructure + UI validation OK)
- Need permanent test account for E2E test suite

**Impact:**
- Cannot validate full user journeys automatically
- Auth workflows untested (signup, login, session persistence)
- Blocks complete E2E validation before Phase 4 (Marketing)

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

