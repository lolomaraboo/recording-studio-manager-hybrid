---
phase: quick-013
plan: 01
status: complete
completed: 2026-01-23
duration: ~2min
subsystem: e2e-testing
tags: [playwright, invoices, edit, e2e]
tech-stack:
  patterns: [e2e-test-pattern, toast-filter-selector]
key-files:
  created:
    - e2e/crud/invoices-edit-local.spec.ts
decisions:
  - id: toast-filter
    description: "Used .filter({ hasText }) instead of .first() for toast selector to handle overlapping toasts from creation and update"
    rationale: "Creation toast still visible when edit toast appears; filtering by text content is more robust than index-based selection"
---

# Quick 013: Invoice Edit E2E Test Summary

**One-liner:** Playwright E2E test validates full invoice edit flow (create -> modify -> verify persistence) on localhost:5174

## What Was Done

Created `e2e/crud/invoices-edit-local.spec.ts` that tests the complete invoice modification workflow:

1. **Creates an invoice** (setup): navigates to /invoices/new, fills client/number/date/line-item, submits
2. **Enters edit mode**: clicks "Modifier" on the detail page, waits for "Enregistrer" button
3. **Modifies line item**: changes description to "Session modifiee E2E", quantity to 3, unit price to 200
4. **Verifies auto-calculation**: amount input shows "600.00" (3 * 200)
5. **Saves**: clicks "Enregistrer", waits for toast + edit mode exit
6. **Verifies persistence**: checks description and amount are visible on the read-mode page

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed toast selector strict mode violation**

- **Found during:** Task 1 verification
- **Issue:** Two success toasts displayed simultaneously (creation toast "Facture créée avec succès" and update toast "Facture mise à jour"), causing strict mode error with `page.locator('[data-sonner-toast][data-type="success"]')`
- **Fix:** Used `.filter({ hasText: /mise . jour/i })` to target specifically the update toast
- **Files modified:** e2e/crud/invoices-edit-local.spec.ts
- **Commit:** fda0a70

## Test Execution

```bash
BASE_URL=http://localhost:5174 npx playwright test e2e/crud/invoices-edit-local.spec.ts --headed
```

Result: 1 passed (22.1s)

## Commits

| Hash | Message |
|------|---------|
| fda0a70 | test(quick-013): add invoice edit E2E test |
