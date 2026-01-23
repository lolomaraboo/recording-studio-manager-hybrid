# Quick Task 022 - Summary

## Task
Tester avec Playwright que le chatbot est capable de faire toutes les opérations CRUD sur les devis, factures, clients et services.

## Result: SUCCESS ✅

18/18 tests passing in 4.7 minutes.

## Tests Created

**File:** `e2e/features/chatbot-crud-operations.spec.ts`

### Test Groups (serial mode, 18 tests total)

| Group | Tests | Operations |
|-------|-------|------------|
| Clients | 4 | Create, List, Update, Delete |
| Quotes (Devis) | 5 | Create, List, Read details, Update status, Delete |
| Invoices (Factures) | 5 | Create, List, Read details, Update status, Delete |
| Sessions (Services) | 4 | Create, List, Update, Delete |

### Key Design Decisions

1. **Unique Run IDs** - Each test run generates a unique 6-digit timestamp suffix (`RUN_ID`) for all entity names/numbers to avoid conflicts between runs
2. **Local/Production compatibility** - Tests detect `BASE_URL` and skip login in dev mode (app uses test headers automatically)
3. **Robust wait strategy** - Waits for input to become enabled via `waitForFunction` instead of arbitrary timeouts
4. **Flexible assertions** - Uses regex patterns matching French/English keywords to handle AI response variations
5. **90s test timeout** - AI responses can take 10-50s depending on load

### Running the Tests

```bash
# Against local dev server (recommended)
BASE_URL=http://localhost:5174 npx playwright test e2e/features/chatbot-crud-operations.spec.ts --workers=1

# Against production
npx playwright test e2e/features/chatbot-crud-operations.spec.ts --workers=1
```

**Note:** Use `--workers=1` to avoid AI rate limiting issues with parallel requests.

### Test Duration Breakdown

- Client CRUD: ~50s
- Quote CRUD: ~65s
- Invoice CRUD: ~66s
- Session CRUD: ~64s
- Total: ~4.7 minutes

## Issues Discovered

1. **AI rate limiting** - When running with multiple workers, the 3rd+ message in a session often returns "Désolé, une erreur s'est produite" due to backend rate limits or context overflow
2. **Solution:** Run with `--workers=1` for reliable results

## Files Modified

- `e2e/features/chatbot-crud-operations.spec.ts` (new, ~340 lines)
