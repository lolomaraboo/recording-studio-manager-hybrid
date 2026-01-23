---
phase: quick-018
plan: 01
subsystem: ui
tags: [tailwind, spacing, invoices, card]
dependency-graph:
  requires: []
  provides: [compact-invoice-list-card]
  affects: []
tech-stack:
  added: []
  patterns: [className-override-over-component-edit]
key-files:
  created: []
  modified:
    - packages/client/src/pages/Invoices.tsx
decisions:
  - id: "quick-018-01"
    decision: "Override padding via className props instead of modifying card.tsx component"
    rationale: "Local override keeps the change scoped to invoice list only without affecting other cards"
metrics:
  duration: "1 min"
  completed: "2026-01-23"
---

# Quick Task 018: Reduce Margin Between Invoice List and Card Border

**One-liner:** Reduced Card padding from 24px to 8px on invoice list for tighter, more compact layout.

## What Was Done

### Task 1: Reduce padding on invoice list Card

- Changed `CardHeader` className from `pb-3` to `p-2 pb-2` (overrides default p-6 base)
- Changed `CardContent` from no className to `p-2 pt-0` (overrides default p-6 pt-0)
- Result: 8px gap between table and card border instead of 24px

## Verification

- Build passes: `pnpm --filter client build` completes successfully (3623 modules, 0 client errors)
- Stats cards above invoice list remain unchanged
- Only the invoice list Card is affected

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | a169019 | feat(quick-018): reduce padding on invoice list card |

## Files Modified

| File | Changes |
|------|---------|
| packages/client/src/pages/Invoices.tsx | CardHeader p-2 pb-2, CardContent p-2 pt-0 |
