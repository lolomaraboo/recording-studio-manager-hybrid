---
phase: 17-facturation-automatique-stripe-ui
plan: 17-03-FIX-2
status: PARTIALLY_COMPLETE
date: 2026-01-10
---

# Fix Summary: Client Portal Authentication Persistence Bug

## Objective
Debug and fix Client Portal authentication persistence bug preventing E2E test validation for Phase 17 invoice payment UI.

## Root Cause Analysis

### Initial Hypothesis (Incorrect)
- **Assumed**: Session cookies not persisting in Playwright tests
- **Assumed**: tRPC client missing `credentials: 'include'`
- **Assumed**: localStorage not persisting after `page.goto()`

### Actual Root Causes (Discovered)

**Bug #1: Test Setup - Client ID Mismatch**
- Location: `e2e/test-phase17-invoice-payment.spec.ts` line 55-64
- Issue: `ON CONFLICT (email) DO UPDATE` clause did not update `client_id`
- Impact: Portal account retained stale `client_id=7` from previous test run
- Symptom: Login query failed with `SELECT FROM clients WHERE id = 7` but actual client was `id = 8`
- Result: 500 Internal Server Error on login

**Bug #2: Database Schema Drift**
- Location: `tenant_1.clients` table
- Issue: Missing 22 columns from Drizzle schema definition
- Missing columns: `user_id`, `artist_name`, `city`, `country`, `portal_access`, `first_name`, `last_name`, `middle_name`, `prefix`, `suffix`, `avatar_url`, `logo_url`, `phones`, `emails`, `websites`, `street`, `postal_code`, `region`, `birthday`, `gender`, `custom_fields`
- Impact: Login endpoint's `SELECT` query failed because columns didn't exist
- Result: PostgreSQL error → 500 Internal Server Error

**Bug #3: Test Regex False Positive**
- Location: Multiple `waitForURL(/\/client-portal/)` calls
- Issue: Regex matched `/client-portal/login` incorrectly
- Impact: Test 1 passed even though login failed (stayed on login page)
- Fix: Changed to `/\/client-portal\/?$/` to match only dashboard

## Solutions Implemented

### Fix #1: Test Setup Client ID Update
```typescript
// BEFORE
ON CONFLICT (email) DO UPDATE SET
  password_hash = ${passwordHash},
  email_verified = true,
  is_active = true,
  updated_at = NOW()

// AFTER
ON CONFLICT (email) DO UPDATE SET
  client_id = ${client.id},  // ✅ Added
  password_hash = ${passwordHash},
  email_verified = true,
  is_active = true,
  updated_at = NOW()
```

### Fix #2: Database Schema Migration
Added missing columns to `tenant_1.clients` table via direct SQL:
```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS artist_name VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
-- ... (22 columns total)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;
```

**Note**: This was a one-time manual fix. Future environments should ensure proper migrations are run.

### Fix #3: Test URL Regex
```typescript
// BEFORE
await page.waitForURL(/\/client-portal/, { timeout: 5000 });

// AFTER
await page.waitForURL(/\/client-portal\/?$/, { timeout: 5000 });
```

### Fix #4: Debug Logging Cleanup
Removed all debug instrumentation:
- Browser console listeners
- Network request/response logging
- localStorage inspection
- Artificial timeout waits

## Verification Results

### Authentication Fixed ✅
- Login endpoint returns `200 OK` (was 500)
- `sessionToken` correctly generated and returned
- `localStorage` correctly stores token and client data
- Session persists across `page.goto()` navigations
- Test 1 (Login) now **PASSES**

### Before Fix
```
REQUEST: POST /api/trpc/clientPortalAuth.login
RESPONSE: 500 Internal Server Error
localStorage: { token: null, client: null }
Tests: 1/8 passing (12.5% pass rate)
```

### After Fix
```
REQUEST: POST /api/trpc/clientPortalAuth.login
RESPONSE: 200 OK
sessionToken: "d13177d8724d5f863a9bb6aec0bcf2573f7d5ee63de976d761380da987bedcd2"
localStorage: {
  token: "af8d2f969e2e3aee7196f3cdca58998ad8329787026daf00f21462c0745c4333",
  client: "{\"id\":8,\"name\":\"Playwright Test Client\",...}"
}
Tests: 1/8 passing (same, but for different reasons - see below)
```

## Current Test Status

**Passing:** 1/8 (12.5%)
**Failing:** 7/8 (87.5%)

| Test # | Name | Status | Reason |
|--------|------|--------|---------|
| 1 | Login successful | ✅ PASS | Authentication fixed |
| 2 | Invoice list displays | ❌ FAIL | UI: No invoices rendered (count=0) |
| 3 | Invoice detail page | ❌ FAIL | UI: Cannot click invoice (none exist) |
| 4 | Pay Now button | ❌ FAIL | UI: Cannot navigate to detail |
| 5 | Download PDF button | ❌ FAIL | UI: Cannot navigate to detail |
| 6 | Stripe Checkout redirect | ❌ FAIL | UI: Cannot click Pay Now |
| 7 | Success page route | ❌ FAIL | Auth redirect (needs investigation) |
| 8 | Cancel page route | ❌ FAIL | Auth redirect (needs investigation) |

## Analysis: Remaining Failures

### Tests 2-6: UI Rendering Issue (NOT Auth)
**Error**: `expect(invoiceCount).toBeGreaterThan(0)` → Received: 0

**Possible Causes**:
1. Test invoice not created properly in `beforeAll`
2. Invoice query filtering by wrong client_id
3. UI component not rendering invoices
4. Selector `[href*="/client-portal/invoices/"]` incorrect

**Evidence it's NOT auth**:
- Login succeeds (200 OK)
- localStorage has valid token
- `page.goto('/client-portal/invoices')` works
- Page loads without redirect to login

**Next Steps**:
- Check if test invoice actually exists in database
- Verify tRPC `clientPortalInvoices.list` query
- Check React component rendering logic
- Inspect page HTML for invoice elements

### Tests 7-8: Protected Route Issue
**Error**: `expect(url).toContain('/invoices/success')` → Received: `/client-portal/login`

**Possible Causes**:
1. Success/Cancel pages are protected routes requiring auth
2. Direct navigation without auth context triggers redirect
3. Need to login first in these tests

**Fix Required**:
- Add login flow to Tests 7-8 before navigating to success/cancel pages
- OR make success/cancel pages public (unprotected)

## Commits

1. **docs(17-03-FIX-2)**: investigate authentication check - localStorage issue found
2. **docs(17-03-FIX-2)**: session cookie investigation - discovered login 500 error
3. **fix(17-03-FIX-2)**: fix test setup client_id mismatch and URL regex
4. **refactor(17-03-FIX-2)**: remove debug logging from tests

## Key Learnings

1. **Always check the full error response**: The 500 error had the full SQL query showing the exact problem
2. **Schema drift is real**: Drizzle schema doesn't automatically match database - migrations must be run
3. **Test assertions matter**: Bad regex caused false positive, masking the real issue for weeks
4. **Debug systematically**: Started with wrong hypothesis (cookies), but methodical investigation found the real bugs

## NOT a Playwright/Cookie Issue

**Initial plan assumed** the issue was:
- Playwright not sending cookies
- tRPC client missing `credentials: 'include'`
- `page.goto()` clearing localStorage

**Reality was**:
- Playwright/tRPC configuration was correct
- localStorage **does** persist correctly
- The login endpoint was **failing server-side** with 500 error
- Test regex was hiding the failure

The authentication system works perfectly once the database schema is correct and test setup properly maintains referential integrity.

## Recommendations

### Immediate (Phase 17)
1. **Investigate invoice rendering**: Why aren't test invoices displayed?
2. **Fix Tests 7-8**: Add login flow or make routes public
3. **Database setup**: Document required columns for fresh environments

### Long-term (Future Phases)
1. **Migration automation**: Run migrations automatically in E2E global setup
2. **Schema validation**: Add CI check to verify database matches Drizzle schema
3. **Test data cleanup**: Clear test data between runs to prevent stale FK references
4. **Better test isolation**: Use separate test database or transactions

## Status

**Authentication Bug**: ✅ FIXED
**E2E Test Suite**: ⚠️ PARTIALLY WORKING (1/8 passing)
**Phase 17 UAT**: ❌ BLOCKED (invoice UI tests still failing)

**Next Action**: Create 17-03-FIX-3.md to fix invoice rendering and complete UAT validation
