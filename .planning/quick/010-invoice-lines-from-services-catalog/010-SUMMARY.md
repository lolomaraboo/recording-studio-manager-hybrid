---
phase: quick-010
plan: 01
subsystem: invoices
tags: [service-catalog, autocomplete, modal, invoices, UX-consistency]
dependency-graph:
  requires: [service-catalog-router, quote-create-pattern]
  provides: [invoice-service-catalog-integration]
  affects: []
tech-stack:
  added: []
  patterns: [popover-autocomplete, catalog-modal-dialog, debounced-search]
key-files:
  created: []
  modified:
    - packages/client/src/pages/InvoiceCreate.tsx
decisions:
  - id: "010-01"
    decision: "Use vatRates lookup instead of service.taxRate for catalog modal TVA column"
    context: "serviceCatalog.list returns vatRateId (number) not taxRate - need to join with vatRates data"
    rationale: "Type-safe approach that uses existing vatRates query already in the component"
metrics:
  duration: "4m 21s"
  completed: "2026-01-22"
---

# Quick Task 010: Invoice Lines from Services Catalog - Summary

**One-liner:** Service catalog autocomplete + browseable modal on InvoiceCreate.tsx matching QuoteCreate.tsx UX pattern with number-typed InvoiceItem fields.

## What Was Done

Added service catalog integration to InvoiceCreate.tsx with two entry points:

### 1. Autocomplete on Description Field
- Popover + Command component wrapping the description Input
- Triggers at 2+ characters typed with 200ms debounce
- Shows up to 10 matching services (name, category, price)
- Selecting a service auto-fills: description, quantity, unitPrice, amount, vatRateId
- Manual typing still works without selecting from autocomplete

### 2. "Du catalogue" Button + Modal
- Secondary button next to "Ajouter une ligne"
- Opens Dialog with full-width service table
- Category filter (All, Studio, Post-production, Location materiel, Autre)
- Clickable rows that add a new pre-filled line item
- Shows service name, description, category, unit price, VAT rate, default quantity
- Empty state with link to Services page

### Key Technical Details
- InvoiceItem uses `number` types (not strings like QuoteCreate's LineItem)
- `parseFloat()` used to convert service catalog string values to numbers
- VAT rate column uses `vatRates?.find()` lookup instead of non-existent `service.taxRate`
- All state management follows existing component patterns

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 2f444a3 | feat(quick-010): add service catalog autocomplete and modal to InvoiceCreate |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed taxRate property reference**
- **Found during:** Task 1 verification
- **Issue:** Plan referenced `service.taxRate` but serviceCatalog.list returns `vatRateId` (number FK), not `taxRate`
- **Fix:** Used `vatRates?.find(r => r.id === service.vatRateId)?.rate` to look up the actual rate
- **Files modified:** packages/client/src/pages/InvoiceCreate.tsx
- **Commit:** 2f444a3

## Verification

- [x] `pnpm check` - InvoiceCreate.tsx compiles with 0 TypeScript errors (other pre-existing errors in unrelated files)
- [x] File contains `trpc.serviceCatalog.list.useQuery` (2 calls)
- [x] File contains `handleServiceSelect` and `handleCatalogServiceSelect`
- [x] File contains `catalogModalOpen` state
- [x] File contains Popover/PopoverContent/PopoverTrigger components
- [x] File contains Dialog/DialogContent components

## Files Changed

| File | Lines Added | Lines Removed |
|------|-------------|---------------|
| packages/client/src/pages/InvoiceCreate.tsx | +217 | -11 |
