---
phase: quick
plan: 023
type: execute
wave: 1
depends_on: []
files_modified:
  - e2e/features/chatbot-crud-operations.spec.ts
autonomous: true

must_haves:
  truths:
    - "After chatbot says it created a resource, the resource actually exists in the database via tRPC API"
    - "After chatbot says it updated a field, the tRPC API returns the new value"
    - "After chatbot says it deleted a resource, the tRPC API confirms it no longer exists"
  artifacts:
    - path: "e2e/features/chatbot-crud-operations.spec.ts"
      provides: "E2E tests with tRPC-based data verification after chatbot CRUD mutations"
      contains: "trpcQuery|trpcGet|verifyViaApi"
  key_links:
    - from: "e2e/features/chatbot-crud-operations.spec.ts"
      to: "http://localhost:3001/api/trpc"
      via: "fetch calls with test headers"
      pattern: "fetch.*localhost:3001.*trpc"
---

<objective>
Strengthen chatbot CRUD E2E tests by adding direct tRPC API verification after each mutation (create, update, delete).

Purpose: The current tests only check the chatbot's text response (which can lie - e.g., chatbot says "date changed to Jan 15" but DB still has Jan 19). By calling tRPC endpoints directly after each mutation, we verify the actual database state matches the chatbot's claims.

Output: Updated `e2e/features/chatbot-crud-operations.spec.ts` with a `trpcQuery()` helper and verification assertions after every create/update/delete test.
</objective>

<context>
@e2e/features/chatbot-crud-operations.spec.ts
@packages/client/src/main.tsx (tRPC client config - test headers x-test-user-id:18, x-test-org-id:24)

tRPC API endpoints available at http://localhost:3001/api/trpc:
- clients.list (input: {limit, offset, search}) -> returns array with id, name, email, phone, type
- clients.get (input: {id}) -> returns single client
- invoices.list (input: {limit, offset}) -> returns array of invoices
- invoices.get (input: {id}) -> returns invoice with items and client
- quotes.list (input: {status, clientId, limit, offset}) -> returns array of quotes
- quotes.get (input: {id}) -> returns quote with items and client
- sessions.list (input: {limit, offset}) -> returns array of sessions
- sessions.get (input: {id}) -> returns single session

tRPC HTTP conventions (for queries):
- GET /api/trpc/{router.procedure}?input={encodeURIComponent(JSON.stringify(inputObj))}
- Headers: x-test-user-id: 18, x-test-org-id: 24, content-type: application/json
- Response: { result: { data: ... } }
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add tRPC query helper and verify create/update/delete for all CRUD groups</name>
  <files>e2e/features/chatbot-crud-operations.spec.ts</files>
  <action>
Add a helper function `trpcQuery` near the top of the file (after `getLastAssistantMessage`) that calls tRPC endpoints directly via fetch:

```typescript
const TRPC_URL = 'http://localhost:3001/api/trpc';
const TEST_HEADERS = {
  'content-type': 'application/json',
  'x-test-user-id': '18',
  'x-test-org-id': '24',
};

/**
 * Call a tRPC query endpoint directly via HTTP to verify database state.
 * For queries: GET with encoded input.
 */
async function trpcQuery(procedure: string, input?: Record<string, unknown>): Promise<any> {
  const url = input
    ? `${TRPC_URL}/${procedure}?input=${encodeURIComponent(JSON.stringify(input))}`
    : `${TRPC_URL}/${procedure}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: TEST_HEADERS,
  });
  if (!response.ok) {
    throw new Error(`tRPC query ${procedure} failed: ${response.status} ${await response.text()}`);
  }
  const json = await response.json();
  return json.result?.data;
}
```

Then add verification assertions to each CRUD test group:

**Clients:**
- After "Create client": call `clients.list` with `{search: TEST_CLIENT_NAME}`, assert result contains an entry with matching name and email. Store the created client ID in a variable shared across the serial group (`let createdClientId: number`).
- After "Update client": call `clients.get` with `{id: createdClientId}`, assert email equals `e2e-updated-${RUN_ID}@test.com`.
- After "Delete client": call `clients.list` with `{search: TEST_CLIENT_NAME}`, assert no results match (or call `clients.get` and expect a 404/error).

**Invoices:**
- After "Create invoice": call `invoices.list`, find invoice with `invoiceNumber === TEST_INVOICE_NUMBER`, assert it exists. Store `createdInvoiceId`.
- After "Update invoice status": call `invoices.get` with `{id: createdInvoiceId}`, assert `status === 'paid'`.
- After "Update invoice issue date": call `invoices.get` with `{id: createdInvoiceId}`, assert `issueDate` contains `2026-01-15`.
- After "Delete invoice": call `invoices.list`, assert no invoice has `invoiceNumber === TEST_INVOICE_NUMBER`.

**Quotes:**
- After "Create quote": call `quotes.list`, find quote with `quoteNumber === TEST_QUOTE_NUMBER`, assert exists. Store `createdQuoteId`.
- After "Update quote status": call `quotes.get` with `{id: createdQuoteId}`, assert `status === 'sent'`.
- After "Delete quote": call `quotes.list`, assert no quote has `quoteNumber === TEST_QUOTE_NUMBER`.

**Sessions:**
- After "Create session": call `sessions.list`, find session with `title === TEST_SESSION_TITLE`, assert exists. Store `createdSessionId`.
- After "Update session": call `sessions.get` with `{id: createdSessionId}`, assert `status === 'completed'`.
- After "Delete session": call `sessions.list`, assert no session has `title === TEST_SESSION_TITLE`.

Important implementation notes:
- The trpcQuery helper uses Node's global fetch (available in Node 18+/Playwright environment) - NOT page.evaluate.
- Wrap each API verification in a `test.step('Verify via tRPC API', ...)` block for clear reporting.
- For "not found" after delete, use try/catch on `trpcQuery('entity.get', {id})` and assert the error or use the list endpoint and filter.
- Keep existing chatbot text assertions as-is (they test the chatbot's communication). The tRPC assertions are ADDITIONAL verification.
- The `createdXxxId` variables must be declared with `let` at the describe-block scope (same level as `let page: Page`).
- Use `expect(createdClientId).toBeDefined()` before subsequent tests rely on it.
  </action>
  <verify>
Run type check: `pnpm check` passes with 0 errors.
Run the test in headed mode against local dev: `BASE_URL=http://localhost:5174 npx playwright test e2e/features/chatbot-crud-operations.spec.ts --headed` - tests should pass and console output should show both chatbot responses AND API verification results.
  </verify>
  <done>
Every create/update/delete test in chatbot-crud-operations.spec.ts now has a corresponding tRPC API call that verifies the actual database state. A chatbot that lies about its actions (says "updated" but didn't) will now cause test failures.
  </done>
</task>

</tasks>

<verification>
1. `pnpm check` passes (TypeScript compiles without errors)
2. Run tests locally with `BASE_URL=http://localhost:5174 npx playwright test e2e/features/chatbot-crud-operations.spec.ts`
3. Each create test verifies the entity exists via API
4. Each update test verifies the field changed via API
5. Each delete test verifies the entity no longer exists via API
6. Existing chatbot text assertions still pass (not removed)
</verification>

<success_criteria>
- trpcQuery helper function exists and works against localhost:3001
- All 4 CRUD groups (clients, invoices, quotes, sessions) have API verification after mutations
- If chatbot claims to update issue_date to Jan 15 but DB has Jan 19, the test FAILS
- If chatbot claims to create a client but it doesn't exist in DB, the test FAILS
- If chatbot claims to delete but entity still exists, the test FAILS
</success_criteria>

<output>
After completion, the test file provides true end-to-end verification:
chatbot command -> AI processing -> DB mutation -> tRPC API verification
</output>
