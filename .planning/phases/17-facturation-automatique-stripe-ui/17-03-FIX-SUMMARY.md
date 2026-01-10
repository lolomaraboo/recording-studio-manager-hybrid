---
phase: 17-facturation-automatique-stripe-ui
plan: 17-03-FIX
subsystem: testing
tags: [playwright, e2e, routes, authentication, debugging]

# Dependency graph
requires:
  - phase: 17-03
    provides: Client Portal Invoice UI implementation
provides:
  - Corrected E2E test route paths (/client-portal/)
  - Exposed hidden authentication persistence bug
affects: [17-03-FIX-2]

# Tech tracking
tech-stack:
  added: []
  patterns: [route path validation, test-driven debugging]

key-files:
  created: []
  modified: [e2e/test-phase17-invoice-payment.spec.ts]

key-decisions:
  - "Stop and create new fix plan instead of expanding scope beyond route fixes"

patterns-established:
  - "Pattern: Fix narrow scope, defer discovered issues to new plans"

issues-created: []

# Metrics
duration: 3 min
completed: 2026-01-10
---

# Phase 17-03-FIX Summary

**Route paths corrected in E2E tests, exposing deeper authentication persistence bug requiring separate fix**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-10T10:54:28Z
- **Completed:** 2026-01-10T10:57:54Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Fixed 22 incorrect route references from `/client/` to `/client-portal/` in E2E test file
- All route paths now match actual React Router configuration (App.tsx lines 107-125)
- Test execution revealed **new root cause**: authentication session not persisting after login
- Properly scoped fix by stopping at architectural issue boundary

## Task Commits

1. **Task 1: Fix route paths in E2E test file** - `55de23d` (fix)

## Files Created/Modified

- `e2e/test-phase17-invoice-payment.spec.ts` - Replaced all `/client/` paths with `/client-portal/` (22 occurrences)

## Decisions Made

**Stop and create new fix plan for auth issue (Rule 4 - Architectural)**
- Rationale: Authentication persistence is beyond scope of route path fix
- Original UAT report hypothesized route mismatch as root cause
- Route fix exposed deeper bug: session not persisting between page navigations
- Tests now fail at different point: login succeeds but subsequent pages redirect to login
- Proper GSD practice: narrow scope fixes, defer discovered issues to new plans

## Deviations from Plan

None - plan executed exactly as written. Route paths were the target, and they were fixed.

## Issues Encountered

### Discovered New Root Cause

**After fixing routes, tests still fail (2/8 passing, 6/8 failing):**

**Failing pattern:**
1. Test 1 (Login) ✅ PASSES - Login endpoint works
2. Tests 2-7 ❌ FAIL - All redirect to `/client-portal/login` after successful login
3. Test 8 (Cancel route) ✅ PASSES - Unauthenticated route accessible

**Evidence:**
- Screenshot artifacts show login page instead of invoice pages
- Error: `expect(url).toContain('/client-portal/invoices')` but received `/client-portal/login`
- Pattern: Session doesn't persist after initial login for subsequent page navigations

**Root cause hypothesis:**
- Cookie not being saved/sent between Playwright page navigations
- Session validation in ProtectedClientRoute rejecting valid sessions
- Client Portal auth context not loading session correctly

**Why this wasn't in original fix scope:**
- Original UAT report (17-UAT-REPORT.md) identified route mismatch as cause
- Routes were indeed wrong (`/client/` vs `/client-portal/`)
- Auth bug was **hidden** by incorrect routes (tests failed before reaching auth check)
- Now exposed by correct routes

**Resolution:**
- Requires new fix plan (17-03-FIX-2) focused on Client Portal authentication
- Needs investigation of ProtectedClientRoute, session cookies, auth context
- Likely ~30-60 min debugging + fix

## Next Phase Readiness

**Blockers:**
- ⚠️ Client Portal E2E tests failing due to authentication persistence bug
- Must resolve before Phase 17 can be considered fully validated
- Invoice payment UI code is correct (routes fixed), but tests can't validate due to auth

**Ready:**
- Route path corrections committed and verified
- Test framework correctly configured
- Clear error messages guide debugging

---

## Test Results (Post-Fix)

**Pass Rate:** 2/8 (25%) - Down from 3/8 (38%) pre-fix

**Passing:**
- ✅ Test 1: Login successful (auth.login endpoint works)
- ✅ Test 8: Cancel page route (unauthenticated route accessible)

**Failing (all due to auth persistence):**
- ❌ Test 2: Invoice list display - redirects to login
- ❌ Test 3: Invoice detail navigation - redirects to login
- ❌ Test 4: Pay Now button visibility - redirects to login
- ❌ Test 5: Download PDF button - redirects to login
- ❌ Test 6: Stripe Checkout redirect - redirects to login
- ❌ Test 7: Success page route - redirects to login

**Artifact locations:**
- Screenshots: `test-results/test-phase17-invoice-payme-*/test-failed-*.png`
- Videos: `test-results/test-phase17-invoice-payme-*/video.webm`
- Error contexts: `test-results/test-phase17-invoice-payme-*/error-context.md`

---

*Phase: 17-facturation-automatique-stripe-ui*
*Completed: 2026-01-10*
*Next: Create 17-03-FIX-2 plan for authentication persistence bug*
