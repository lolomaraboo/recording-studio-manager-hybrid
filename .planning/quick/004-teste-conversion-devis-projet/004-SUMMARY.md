# Quick Task 004: Teste conversion devis → projet

## Result: BUG FOUND AND FIXED

## Problem

When accepting a quote and clicking "Convertir en projet":
- The project was created in the database (backend worked)
- But navigation failed: went to `/projects/[object Object]` instead of `/projects/123`
- Additionally, the quotes list didn't refresh after any mutation (same cache issue as quick-001)

## Root Cause

`packages/client/src/pages/QuoteDetail.tsx` line ~142:
```typescript
// BEFORE (bug)
onSuccess: (projectId) => {
  navigate(`/projects/${projectId}`);
}

// Backend actually returns:
return { project, quote: updatedQuote };
// So projectId was { project: {...}, quote: {...} } → "[object Object]"
```

## Fix

1. **convertToProject handler**: Changed to `result.project.id`
2. **Cache invalidation**: Added `utils.quotes.list.invalidate()` to ALL 7 mutations (create, update, delete, send, accept, reject, cancel, convertToProject)

## Files Modified
- `packages/client/src/pages/QuoteCreate.tsx` - Added utils + invalidate on create
- `packages/client/src/pages/QuoteDetail.tsx` - Added utils + invalidate on all mutations + fixed convertToProject result handling

## Commit
- `747d604` - fix(quotes): add cache invalidation and fix convertToProject navigation
