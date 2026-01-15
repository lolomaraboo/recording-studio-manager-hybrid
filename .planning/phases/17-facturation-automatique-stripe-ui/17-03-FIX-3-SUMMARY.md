---
phase: 17-facturation-automatique-stripe-ui
plan: 17-03-FIX-3
type: fix
status: complete
completed_at: 2026-01-15
---

# Phase 17-03-FIX-3: Invoice Rendering Issue Resolution

## Executive Summary

✅ **Status:** All 8 E2E tests passing (100%)
⏱️ **Duration:** ~3-4 hours intensive debugging session
🎯 **Impact:** Phase 17 UAT validation complete, v4.0 milestone ready

## Root Cause Analysis

### Primary Issue: Dual PostgreSQL Instance Conflict (ISSUE-012)

The "Drizzle ORM silent failure" was NOT a Drizzle bug, but rather a **development environment configuration issue**:

1. **Two PostgreSQL instances running simultaneously:**
   - **Homebrew PostgreSQL** (localhost:5432) - Used by Express server
   - **Docker PostgreSQL** (rsm-postgres container) - Used by test setup commands

2. **Data inconsistency:**
   - Express app connected to Homebrew PostgreSQL (74 old sessions from previous tests)
   - Test setup (\`docker exec psql\`) inserted data into Docker PostgreSQL (2 fresh sessions)
   - Tests queried one database, app queried another → zero results

3. **Discovery method:**
   \`\`\`bash
   # Homebrew PostgreSQL
   ps aux | grep postgres
   postgres: postgres tenant_1 ::1(61203) idle

   # Docker PostgreSQL
   docker ps | grep postgres
   rsm-postgres   5432/tcp (NOT exposed to host)
   \`\`\`

### Secondary Issues Discovered

1. **Frontend Data Destructuring Errors:**
   - \`ClientInvoices.tsx\`: API returns \`{invoices: [], total, limit}\` but code expected array directly
   - \`ClientInvoiceDetail.tsx\`: API returns \`{invoice, items}\` but code aliased entire response as \`invoice\`
   - **Result:** Pay Now button never rendered because \`invoice.status\` was undefined

2. **E2E Test Selector Mismatches:**
   - Tests looked for \`href\` links but component uses \`onClick\` navigation
   - URL pattern missing \`client-portal\` prefix (\`/client/invoices\` vs \`/client-portal/invoices\`)
   - No wait for async data loading before checking for Download PDF button

## Fixes Applied

### Fix 1: Database Synchronization
\`\`\`bash
# Synchronized Docker → Homebrew PostgreSQL
docker exec rsm-postgres pg_dump -U postgres tenant_1 > /tmp/tenant_1_fresh.sql
dropdb tenant_1 && createdb tenant_1
psql -d tenant_1 < /tmp/tenant_1_fresh.sql

# Applied missing migrations
psql -d tenant_1 -f packages/database/drizzle/migrations/0010_add_deposit_fields_to_invoices.sql
psql -d tenant_1 -f packages/database/drizzle/migrations/0011_add_pdf_s3_key_to_invoices.sql
\`\`\`

### Fix 2: E2E Tests Modified for Homebrew PostgreSQL
All test data operations now target Homebrew PostgreSQL directly instead of Docker

### Fix 3: Frontend Data Destructuring
Fixed response destructuring in ClientInvoices.tsx and ClientInvoiceDetail.tsx

## Test Results

### Before Fixes
\`\`\`
✓  1/8 tests passing (12.5%)
✘  7/8 tests failing (87.5%)
\`\`\`

### After Fixes
\`\`\`
✅ Test 1: Login successful
✅ Test 2: Invoice list displays correctly
✅ Test 3: Invoice detail page works
✅ Test 4: Pay Now button displayed for SENT invoice
✅ Test 5: Download PDF button exists
✅ Test 6: Stripe Checkout redirect (test passed)
✅ Test 7: Success page route accessible
✅ Test 8: Cancel page route accessible

8 passed (34.0s) - 100% pass rate
\`\`\`

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 048e9d2 | fix | Correct E2E test selectors and URL patterns |
| fe70696 | fix | Fix frontend invoice data destructuring |
| af31a10 | chore | Remove obsolete test scripts |

## ISSUE-012 Resolution

**ISSUE-012: Drizzle ORM silent failure**
- ✅ **Root cause identified:** Dual PostgreSQL instance conflict
- ✅ **Solution:** Synchronized databases + modified tests to use Homebrew PostgreSQL
- ✅ **Documented:** See root cause analysis above

## Phase 17 UAT Validation

✅ **Invoice Payment Flow - Complete**

## Next Steps

1. Mark Phase 17 complete in ROADMAP.md
2. Update STATE.md with completion
3. Consider v4.0 milestone completion
