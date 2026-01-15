---
phase: 17-facturation-automatique-stripe-ui
plan: 17-03-FIX-4
type: fix-summary
status: in-progress
---

# Phase 17-03-FIX-4 Summary: localStorage Persistence Investigation

## Objective

Fix localStorage persistence issue preventing Tests 2-6 from passing in E2E invoice payment flow tests.

**Target:** 8/8 tests passing (100%)

## Investigation Findings

### Root Cause Identified

The original assumption that localStorage wasn't persisting was **partially correct**. Through systematic debugging, multiple issues were discovered:

#### 1. localStorage Timing Race Condition (FIXED ✅)

**Problem:** After successful login, `page.goto()` navigation occurred before localStorage was written by React's state update cycle.

**Solution Applied:**
```typescript
// Wait for localStorage to be written (fixes race condition)
await page.waitForFunction(() => {
  return localStorage.getItem('client_portal_session_token') !== null;
}, { timeout: 3000 });
```

**Result:** localStorage now persists correctly across page navigations. Verified with debug logging:
```
📦 localStorage before navigation: { token: '13c58dfa...', client: '{"id":11,...}' }
📦 localStorage after navigation: { token: '13c58dfa...', client: '{"id":11,...}' }
```

#### 2. Test Data Persistence Issue (PARTIALLY RESOLVED ⚠️)

**Problem:** Test data created in `beforeAll` hook exists during test execution but doesn't persist in database queries.

**Investigation:**
- Client and invoice ARE created (logs confirm: `✅ Test invoice created: { id: 93 }`)
- Data EXISTS when test runs (DB query inside test confirms invoice is present)
- Session token is generated and stored in localStorage
- BUT: No session exists in `client_portal_sessions` table

**Hypothesis:** The `emailVerified` check in login router (line 267-269) should block login if email isn't verified, but Test 1 passes with "Login successful". This suggests either:
1. The account DOES have `emailVerified=true` during test execution
2. The verification check is bypassed somehow
3. Transaction isolation is preventing session writes

#### 3. Test Credentials Mismatch (FIXED ✅)

**Initial Problem:** Tests were trying to use non-existent seed data (`test@phase17.local`).

**Solution:** Tests now create their own client/account:
```typescript
const TEST_CLIENT_EMAIL = 'phase17-e2e@test.local';
const TEST_CLIENT_PASSWORD = 'TestPass123!';
```

#### 4. Invoice Number Conflicts (FIXED ✅)

**Problem:** Parallel test execution caused duplicate invoice_number violations.

**Solutions Applied:**
- Use timestamp-based invoice numbers: `E2E-${Date.now()}`
- Set test suite to serial mode: `test.describe.configure({ mode: 'serial' })`
- Delete previous test invoices before creating new ones

## Current Status

**Test Results:**
- Test 1: ✅ Login successful (PASSING)
- Test 2: ❌ Invoice list shows 0 invoices (FAILING)
- Tests 3-6: ⏸️ Not run (serial mode stops after first failure)
- Tests 7-8: ✅ Success/Cancel pages accessible (PASSING when run individually)

**Pass Rate:** 1/8 (12.5%) when run as full suite
**Individual Tests:** 3/8 passing when run with `--grep`

## Technical Details

### Files Modified

1. `e2e/test-phase17-invoice-payment.spec.ts`
   - Added localStorage persistence fix (lines 156-159)
   - Changed to serial execution mode (line 21)
   - Updated test credentials to self-contained setup
   - Added timestamp-based invoice numbering
   - Removed bcrypt dependency conflicts

### Debug Artifacts

**localStorage Debug Logs:**
```
📦 localStorage before navigation: {
  token: 'e2d6b81a5f2feae60fb17beb5204c9d769f368b6d492f01375a26c8aebb52e39',
  client: '{"id":11,"userId":null,"name":"Phase 17 E2E Test Client",...}'
}
```

**Database State Verification:**
```sql
-- Invoice exists in DB during test execution
🗄️  Invoices in DB at test start: [
  { id: 93, invoice_number: 'E2E-1768463991226', client_id: 11 }
]

-- But no sessions exist (root cause of API returning 0 invoices)
SELECT * FROM client_portal_sessions WHERE client_id = 11;
-- Returns: 0 rows
```

### Remaining Mystery

**Why does Test 1 pass if no session exists?**

Test 1 asserts:
1. Login form submission succeeds ✅
2. Redirect to `/client-portal` occurs ✅
3. URL matches `/client-portal` ✅

But if `client_portal_sessions` is empty, the `listInvoices` API in Test 2 should fail session validation. Yet Test 1 completes successfully.

**Possible Explanations:**
1. Session is created but in a transaction that hasn't committed
2. Test 1 doesn't actually validate the session persistence
3. There's a timing window where session exists but is cleaned up
4. Dev server is using different database connection/transaction

## Next Steps

### Immediate Actions Required

1. ✅ localStorage persistence fix applied and verified
2. ⚠️ Session persistence needs investigation:
   - Check if `client_portal_sessions` INSERT is wrapped in transaction
   - Verify `postgr

es` library commit behavior
   - Consider using `beforeEach` instead of `beforeAll` for test isolation

3. 🔲 Alternative approach: Use API-based test data setup instead of direct DB manipulation

### Recommended Approach

Instead of direct database manipulation in `beforeAll`, use the application's own APIs:

```typescript
test.beforeEach(async () => {
  // 1. Create client via admin API (ensures proper DB commits)
  // 2. Create portal account via registration API
  // 3. Login via auth API to get real session token
  // 4. Create invoice via admin API
});
```

This ensures all data goes through the same code paths as production, with proper transaction handling.

## Deviation Notes

**Plan vs Actual:**
- ✅ Task 1: Debug logging added (localStorage state verified)
- ✅ Task 2: Root cause identified (timing + session persistence)
- ⚠️ Task 3: Fix partially applied (localStorage fixed, session issue remains)
- ❌ Task 4: Full test suite not passing yet (1/8 instead of 8/8)
- ❌ Task 5: Debug logging not cleaned up (still needed for investigation)

**Time Investment:**
Significant time spent on database persistence investigation revealed deeper architectural issues with test data setup strategy.

## Conclusion

The localStorage persistence issue **is solved** ✅, but a deeper session persistence issue was uncovered that prevents the invoice list API from returning data.

**Recommendation:** Convert to API-based test setup (use application endpoints instead of direct DB manipulation) to ensure proper transaction handling and data persistence.

**Alternative:** If direct DB manipulation is required, investigate `postgres` library transaction commit behavior and consider using explicit `BEGIN/COMMIT` blocks in `beforeAll`.

---

**Status:** Investigation complete, partial fix applied, architectural improvements recommended
**Next Owner:** Review recommended approaches and decide between API-based vs DB-based test data setup
