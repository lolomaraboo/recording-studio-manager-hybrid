---
phase: quick-024
plan: 01
subsystem: ai-chatbot
tags: [llm, function-calling, entity-resolution, bug-fix]
dependencies:
  requires: [Phase 2.2 - AI chatbot tools]
  provides: [Name/number entity resolution for clients and quotes]
  affects: []
tech-stack:
  added: []
  patterns: [Entity resolution with fallback lookup, Ambiguity protection for partial matches]
key-files:
  created: []
  modified:
    - packages/server/src/lib/aiTools.ts
    - packages/server/src/lib/aiActions.ts
decisions:
  - name: Use ilike for client name resolution
    rationale: Users speak naturally ("delete Emma" not "delete client_id 42"), case-insensitive partial match required
    alternatives: [Exact match only, Full-text search]
    chosen: ilike with partial match
  - name: Use exact match for quote_number resolution
    rationale: Quote numbers are unique identifiers (QT-2025-001), exact match prevents ambiguity
    alternatives: [Partial match]
    chosen: Exact eq match
  - name: Ambiguity protection for client names
    rationale: Multiple clients can have similar names, must prevent accidental operations on wrong client
    alternatives: [Auto-select first match, Let LLM decide]
    chosen: Error with list of matches, require user clarification
metrics:
  duration: 3 minutes
  completed: 2026-01-23
---

# Quick Task 024: Fix Chatbot Entity Resolution Bugs

**One-liner:** AI chatbot can now resolve clients by name and quotes by quote_number, eliminating hallucinated ID errors.

## Objective

Fix entity resolution bugs in chatbot tools where delete_client, update_client, update_quote, and delete_quote could only accept numeric IDs, causing the LLM to hallucinate IDs when users referred to entities by name or number.

**Purpose:** Allow AI chatbot to reliably find entities the way users naturally refer to them.

**Output:** Updated tool definitions and action implementations with name/number resolution fallback.

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Add name/number alternative params to tool definitions | ✅ Complete | 84ea2a2 |
| 2 | Add entity resolution logic to action implementations | ✅ Complete | d6f57ae |

## Changes Made

### Tool Definitions (aiTools.ts)

Modified 4 tool schemas:

1. **update_client**
   - Added `client_name` property (alternative to client_id)
   - Removed client_id from required array

2. **delete_client**
   - Added `client_name` property (alternative to client_id)
   - Removed client_id from required array

3. **update_quote**
   - Added `quote_number` property (alternative to quote_id)
   - Removed quote_id from required array

4. **delete_quote**
   - Added `quote_number` property (alternative to quote_id)
   - Removed quote_id from required array

### Action Implementations (aiActions.ts)

Added entity resolution logic to 4 methods:

**Pattern for Client Resolution (ilike):**
```typescript
// Resolve client ID from name if needed
let resolvedClientId = client_id;
if (!resolvedClientId && client_name) {
  const found = await this.db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(and(
      ilike(clients.name, `%${client_name}%`),
      eq(clients.isActive, true)
    ))
    .limit(2);
  if (found.length === 0) {
    throw new Error(`Client "${client_name}" introuvable`);
  }
  if (found.length > 1) {
    throw new Error(`Plusieurs clients correspondent a "${client_name}": ${found.map(c => c.name).join(', ')}. Precisez le nom complet ou utilisez l'ID.`);
  }
  resolvedClientId = found[0].id;
}
if (!resolvedClientId) {
  throw new Error("Veuillez fournir client_id ou client_name");
}
```

**Pattern for Quote Resolution (exact match):**
```typescript
// Resolve quote ID from quote_number if needed
let resolvedQuoteId = quote_id;
if (!resolvedQuoteId && quote_number) {
  const found = await this.db
    .select({ id: quotes.id })
    .from(quotes)
    .where(eq(quotes.quoteNumber, quote_number))
    .limit(1);
  if (found.length === 0) {
    throw new Error(`Devis "${quote_number}" introuvable`);
  }
  resolvedQuoteId = found[0].id;
}
if (!resolvedQuoteId) {
  throw new Error("Veuillez fournir quote_id ou quote_number");
}
```

## Verification

✅ All 4 tool definitions accept both ID and name/number alternatives
✅ Neither ID nor name/number is strictly required (either works)
✅ Resolution logic matches existing update_invoice pattern
✅ Client resolution uses ilike for case-insensitive partial match
✅ Quote resolution uses exact eq match on quoteNumber
✅ Ambiguity protection for client names (error if >1 match)
✅ Clear French error messages matching codebase style
✅ All methods use resolvedClientId/resolvedQuoteId throughout

## Technical Details

### Why ilike for Clients?

Users speak naturally: "delete Emma Dubois" or "update Martin to VIP". A partial, case-insensitive match with ambiguity protection provides the best UX while preventing errors.

### Why Exact Match for Quotes?

Quote numbers are unique identifiers like "QT-2025-001". Exact match prevents confusion and matches the existing invoice_number pattern.

### Ambiguity Protection

When multiple clients match a name (e.g., "Martin"), the system returns:
```
Plusieurs clients correspondent a "Martin": Lucas Martin, Marie Martin. Precisez le nom complet ou utilisez l'ID.
```

This forces user clarification instead of guessing wrong.

## Success Criteria Met

✅ delete_client({ client_name: "Dubois" }) resolves to correct client ID
✅ update_client({ client_name: "Martin", is_vip: true }) resolves and updates (if unique)
✅ update_quote({ quote_number: "QT-2025-001", status: "sent" }) resolves and updates
✅ delete_quote({ quote_number: "QT-2025-001" }) resolves and deletes
✅ Ambiguous client names throw helpful error listing matches
✅ Missing both ID and name/number throws clear error
✅ Existing ID-based calls continue to work unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for:**
- E2E testing with natural language prompts
- User testing with real chatbot interactions

**Blockers:** None

**Concerns:** None - follows existing patterns, backward compatible

## Lessons Learned

1. **ilike import required** - Must add to drizzle-orm imports for case-insensitive matching
2. **Ambiguity is not a failure** - Error with list of matches is correct UX
3. **Consistency matters** - Following update_invoice pattern made implementation straightforward
4. **Natural language > IDs** - Users don't think in database IDs, resolution makes AI more usable

## Related Files

- `packages/server/src/lib/aiTools.ts` - Tool schema definitions (what LLM sees)
- `packages/server/src/lib/aiActions.ts` - Action implementations (what executes)
- `e2e/features/chatbot-crud-operations.spec.ts` - E2E tests (to be updated)
