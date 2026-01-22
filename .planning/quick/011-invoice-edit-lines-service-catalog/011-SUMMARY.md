# Quick Task 011: Invoice Edit Lines + Service Catalog Summary

**One-liner:** Invoice detail page displays line items in read mode and provides full editable items table with service catalog autocomplete/modal in edit mode, backed by updateWithItems mutation.

## Completed Tasks

| # | Task | Commit | Duration |
|---|------|--------|----------|
| 1 | Add updateWithItems mutation to invoices router | 6bc19de | 3 min |
| 2 | Display items in read/edit mode with service catalog | 44d2815 | 8 min |

**Total Duration:** ~11 min

## What Was Built

### Backend (Task 1)
- New `updateWithItems` mutation in `packages/server/src/routers/invoices.ts`
- Accepts optional `items` array alongside metadata fields (clientId, invoiceNumber, dates, status, notes)
- When items provided: deletes existing invoiceItems, inserts replacements, recalculates subtotal/taxAmount/total
- Validates each item's vatRateId (throws BAD_REQUEST if invalid)
- Computes weighted average taxRate for backward compatibility with legacy header field
- Sets updatedAt timestamp on every update

### Frontend (Task 2)
- **Read mode:** Items displayed in a formatted Table (description, quantity, unit price, VAT rate, amount)
- **Edit mode:** Full editable items table with:
  - Autocomplete Popover on description field (searches service catalog with 200ms debounce)
  - Number inputs for quantity and unit price (auto-calculates amount)
  - Select dropdown for VAT rate per line item
  - Add/remove line buttons (minimum 1 line enforced)
  - "Du catalogue" button opens modal to browse services by category
  - Dynamic totals (subtotal HT, TVA, Total TTC) recalculated live
- `startEditing()` initializes editItems from existing invoice data
- `handleSave()` sends items via `updateWithItems` mutation (filters empty descriptions)
- Catalog modal with category filter (Studio, Post-production, Location materiel, Autre)

## Key Files

| File | Change |
|------|--------|
| `packages/server/src/routers/invoices.ts` | +104 lines (updateWithItems mutation) |
| `packages/client/src/pages/InvoiceDetail.tsx` | +459/-50 lines (items table, edit UI, catalog modal) |

## Verification

- [x] `pnpm check` - InvoiceDetail.tsx and invoices.ts compile with 0 errors (pre-existing errors in other files only)
- [x] Read mode shows items table when invoice has items
- [x] Edit mode shows editable table with autocomplete + catalog modal
- [x] Totals recalculate dynamically in edit mode
- [x] Backend mutation replaces items and recalculates invoice totals

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

1. **Separate mutation (updateWithItems) vs modifying existing update:** Kept existing `update` mutation untouched since other code (handleMarkAsPaid) uses it. New mutation handles the items + metadata combo.
2. **Filter empty descriptions on save:** `editItems.filter(item => item.description.trim() !== "")` prevents sending empty line items to backend.
3. **startEditing pattern:** Instead of useEffect to initialize editItems, used explicit function call to avoid race conditions with invoice data loading.
