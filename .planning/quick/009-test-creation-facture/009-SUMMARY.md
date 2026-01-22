---
phase: quick-009
plan: 01
subsystem: testing
tags: [playwright, e2e, invoices, crud]
tech-stack:
  patterns: [playwright-e2e, shadcn-select-testing, dev-mode-auth-bypass]
key-files:
  created:
    - e2e/crud/invoices-create-local.spec.ts
metrics:
  duration: 56s
  completed: 2026-01-22
---

# Quick Task 009: Invoice Creation E2E Test Summary

**One-liner:** Playwright E2E test for invoice creation flow with client selection, line item, and detail page navigation verification.

## What Was Done

Created `e2e/crud/invoices-create-local.spec.ts` that validates the complete invoice creation workflow against localhost:5174.

### Test Coverage

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Navigate to `/invoices/new` | h1 contains "Nouvelle Facture" |
| 2 | Select client via shadcn Select | First option selected |
| 3 | Fill invoice number | "INV-E2E-001" |
| 4 | Fill issue date | Today's date (YYYY-MM-DD) |
| 5 | Fill line item description | "Enregistrement studio 2h" |
| 6 | Fill quantity + unit price | 2 * 150 |
| 7 | Verify auto-calculated amount | 300.00 (readonly field) |
| 8 | Submit form | Click "Creer la facture" |
| 9 | Error check | No error toast visible |
| 10 | Navigation assertion | URL matches `/invoices/\d+` |
| 11 | Detail page verification | Body contains "INV-E2E-001" |

### Key Technical Decisions

1. **Standard `.fill()` for description** - Unlike quotes (which use Popover+Command pattern requiring native setter hack), invoices use a regular Input component. Simple `.fill()` works correctly.

2. **No Escape key needed** - No popover to dismiss after typing description.

3. **Detail page assertion** - Invoice creation navigates to `/invoices/{id}` (detail page), not back to list. Used regex URL match `\/invoices\/\d+`.

4. **SSE/WebSocket awareness** - Used explicit element waits instead of `networkidle` (SSE keeps network busy indefinitely).

## Commits

| Hash | Message |
|------|---------|
| dbe817e | test(quick-009): add invoice creation E2E test |

## Deviations from Plan

None - plan executed exactly as written. Test passed on first run.

## Run Command

```bash
BASE_URL=http://localhost:5174 npx playwright test e2e/crud/invoices-create-local.spec.ts --headed
```
