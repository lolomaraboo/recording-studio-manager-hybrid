---
phase: quick-020
plan: 01
subsystem: client-ui
tags: [tRPC, cache-invalidation, invoices, bug-fix]
dependency-graph:
  requires: []
  provides: [invoice-status-cache-invalidation]
  affects: []
tech-stack:
  added: []
  patterns: [tRPC-useUtils-cache-invalidation]
key-files:
  created: []
  modified:
    - packages/client/src/pages/InvoiceDetail.tsx
decisions:
  - id: Q020-D1
    decision: "Follow QuoteDetail.tsx pattern for cache invalidation"
    rationale: "Consistent approach across all detail pages with mutations"
metrics:
  duration: "1m15s"
  completed: "2026-01-23"
---

# Quick Task 020: Fix Invoice Status Update No Refresh

**One-liner:** tRPC cache invalidation on InvoiceDetail mutations matching QuoteDetail pattern

## What Was Done

Added `trpc.useUtils()` hook and `utils.invoices.list.invalidate()` calls to all three mutations in InvoiceDetail.tsx:

1. **`updateMutation`** - Used by status dropdown save and "Marquer payee" button
2. **`updateWithItemsMutation`** - Used by the full invoice edit form save
3. **`deleteMutation`** - Used by the delete confirmation dialog

## Root Cause

The InvoiceDetail page never initialized `trpc.useUtils()` and therefore never called cache invalidation on mutation success. While `refetch()` updated the detail page data, the list page cache remained stale, causing the old status to show when navigating back.

## Pattern Applied

Matches QuoteDetail.tsx (line 41, 57, 69, 107, 118):

```typescript
const utils = trpc.useUtils();

// In each mutation onSuccess:
onSuccess: () => {
  utils.invoices.list.invalidate();
  toast.success("...");
  // rest of logic
},
```

## Verification

- Client build: passes (0 new errors)
- `utils.invoices.list.invalidate` count: 3 occurrences
- `trpc.useUtils()` initialized: line 51

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 6f05eb8 | fix(quick-020): add tRPC cache invalidation to InvoiceDetail mutations |
