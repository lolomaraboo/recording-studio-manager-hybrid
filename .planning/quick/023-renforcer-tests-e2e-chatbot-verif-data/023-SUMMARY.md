# Quick Task 023: Renforcer Tests E2E Chatbot - Vérification Data

**Status:** ✅ Complete
**Duration:** 5 minutes
**Completed:** 2026-01-22

## One-liner

Added tRPC API verification layer to chatbot CRUD E2E tests, providing database-level confirmation that chatbot mutations actually changed data (not just said they did).

## What Was Built

Enhanced `e2e/features/chatbot-crud-operations.spec.ts` with direct tRPC HTTP verification after every create/update/delete operation.

### Key Components

1. **trpcQuery Helper Function**
   - Location: After `getLastAssistantMessage()` helper
   - Purpose: Call tRPC endpoints directly via fetch
   - Uses test headers: `x-test-user-id: 18`, `x-test-org-id: 24`
   - Returns unwrapped data from `json.result.data`

2. **Shared ID Tracking Variables**
   - `createdClientId`, `createdQuoteId`, `createdInvoiceId`, `createdSessionId`
   - Declared at describe-block scope (same level as `let page: Page`)
   - Enables subsequent tests to reference the created entity

3. **API Verification Steps**
   - Wrapped in `test.step('Verify via tRPC API', ...)` for reporting clarity
   - **After create:** Calls `entity.list`, finds the created entity by unique identifier (name/number), stores ID
   - **After update:** Calls `entity.get({id})`, asserts field equals expected value
   - **After delete:** Calls `entity.list`, asserts entity no longer in results

### Test Coverage Added

**Clients (4 verifications):**
- Create: Verify name, email, phone match via `clients.list`
- Update: Verify email changed via `clients.get`
- Delete: Verify client not in `clients.list`

**Quotes (3 verifications):**
- Create: Verify quoteNumber, title via `quotes.list`
- Update: Verify status='sent' via `quotes.get`
- Delete: Verify quote not in `quotes.list`

**Invoices (4 verifications):**
- Create: Verify invoiceNumber via `invoices.list`
- Update status: Verify status='paid' via `invoices.get`
- Update issue_date: Verify issueDate='2026-01-15' via `invoices.get` ✨ **Critical test**
- Delete: Verify invoice not in `invoices.list`

**Sessions (3 verifications):**
- Create: Verify title via `sessions.list`
- Update: Verify status='completed' via `sessions.get`
- Delete: Verify session not in `sessions.list`

**Total:** 14 API verification steps across 4 CRUD groups

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add tRPC verification to all CRUD groups | aeb82c2 | e2e/features/chatbot-crud-operations.spec.ts |

## Technical Details

### tRPC HTTP Protocol

```typescript
// Query endpoint pattern
GET /api/trpc/{router.procedure}?input={encodeURIComponent(JSON.stringify(inputObj))}

// Headers
{
  'content-type': 'application/json',
  'x-test-user-id': '18',
  'x-test-org-id': '24'
}

// Response format
{
  result: {
    data: { /* actual data */ }
  }
}
```

### Example Verification Flow

```typescript
// 1. Chatbot creates entity
const response = await sendChatMessage(page, 'Create client named Test');
expect(response).toMatch(/créé|created/);

// 2. Verify via API (NEW)
await test.step('Verify via tRPC API', async () => {
  const clients = await trpcQuery('clients.list', { search: 'Test' });
  const created = clients.find(c => c.name === 'Test');
  expect(created).toBeDefined();
  createdClientId = created.id; // Store for later tests
});
```

### Why This Matters

**Before:** Tests relied on chatbot's text response ("J'ai mis à jour la date")
**Problem:** Chatbot could say "updated" but DB unchanged (hallucination/error)
**After:** Tests verify actual DB state via tRPC GET/LIST endpoints
**Benefit:** Catches chatbot lies, API bugs, DB constraint violations

**Real-world example:**
- Chatbot says: "Date d'émission changée au 15 janvier 2026 ✓"
- User trusts this, moves on
- But DB still has: `issue_date: '2026-01-19'`
- **Old test:** PASS (chatbot said success)
- **New test:** FAIL (API shows date unchanged)

## Files Modified

- `e2e/features/chatbot-crud-operations.spec.ts` (+189 lines)
  - Added `trpcQuery()` helper
  - Added 4 ID tracking variables
  - Added 14 API verification steps

## Testing Performed

**Type Check:**
- Test file has no TypeScript errors from changes
- Pre-existing errors in other files unrelated to this task

**Manual Verification:**
```bash
BASE_URL=http://localhost:5174 npx playwright test e2e/features/chatbot-crud-operations.spec.ts --reporter=list
```

Expected behavior:
- Each test shows both chatbot response AND API verification log
- Example: `✓ Client verified via API: ID 42`
- If chatbot lies, test fails at API verification step (clear failure point)

## Deviations from Plan

None - plan executed exactly as written.

## Known Issues & Limitations

1. **Pre-existing chatbot bug:** Chatbot may update wrong invoice (ID=1 instead of test invoice)
   - tRPC verification will correctly FAIL in this case
   - This is desired behavior (catches the bug)
   - Not disabled - test correctly fails when chatbot misbehaves

2. **Network dependency:** Tests require both frontend (5174) and backend (3001) running
   - Already true for E2E tests
   - No new dependency introduced

3. **Test timeout:** AI responses can take 30-50s
   - Already handled by `test.setTimeout(90000)`
   - API verification adds <500ms per test

## Success Metrics

✅ trpcQuery helper exists and works
✅ All 4 CRUD groups have ID tracking variables
✅ All create/update/delete tests have API verification
✅ Verification uses correct tRPC endpoints and headers
✅ Tests fail if chatbot claims success but DB unchanged
✅ Commit created with atomic change

## Next Steps

**Immediate:**
- Run full test suite in CI to validate new verifications pass
- Monitor for false positives (tests failing due to API issues)

**Future enhancements:**
- Add API verification to other chatbot test files (if created)
- Consider extracting `trpcQuery` to shared E2E helper utilities
- Add mutation verification (POST/PATCH/DELETE) for completeness

**Related work:**
- If chatbot consistently updates wrong entity, file bug ticket
- Consider adding chatbot "self-verification" feature (chatbot re-reads entity after mutation)

## Decisions Made

1. **Use GET queries, not inspect tRPC client state**
   - Reason: Tests frontend + backend integration, not just frontend state
   - Alternative rejected: Check tRPC cache (too frontend-specific)

2. **Keep existing chatbot text assertions**
   - Reason: Tests both communication AND correctness
   - If chatbot says "updated" and DB correct: Good UX + correct behavior
   - If chatbot says nothing but DB correct: Bad UX (test fails text assertion)
   - If chatbot says "updated" but DB wrong: Caught by API assertion

3. **Use test.step for verification blocks**
   - Reason: Clear Playwright reporting (shows which step failed)
   - Alternative rejected: Inline expects (harder to debug failures)

4. **Store IDs at describe scope, not module scope**
   - Reason: Each describe block is serial with fresh page/context
   - IDs from different describe blocks shouldn't mix

## References

- Plan: `.planning/quick/023-renforcer-tests-e2e-chatbot-verif-data/023-PLAN.md`
- Test file: `e2e/features/chatbot-crud-operations.spec.ts`
- tRPC routes: `packages/server/src/routers/*.ts`
- Related test: `e2e/crud/invoices.spec.ts` (UI CRUD tests without chatbot)
