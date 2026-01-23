# Quick Task 015: Summary

## Status: COMPLETE

## What was done
Added distinct colors for invoice status badges across all views:
- **Brouillon** (draft): gray background
- **Envoyée** (sent): blue background
- **Payée** (paid): green background
- **En retard** (overdue): amber background
- **Annulée** (cancelled): red background

## Files Modified
- `packages/client/src/pages/Invoices.tsx`
- `packages/client/src/pages/InvoiceDetail.tsx`
- `packages/client/src/pages/client-portal/ClientInvoices.tsx`
- `packages/client/src/pages/client-portal/ClientInvoiceDetail.tsx`
- `packages/client/src/pages/QuoteCreate.tsx` (removed unused Badge import)

## Approach
Used `variant="outline"` as base (no opaque background) with custom Tailwind classes for each status color (bg-*-100, text-*-700, border-*-200).
