---
phase: quick-019
plan: 01
subsystem: ui
tags: [invoices, status-badges, visual-consistency]
dependency-graph:
  requires: [quick-016, quick-017]
  provides: [colored-status-dots-invoice-edit-create]
  affects: []
tech-stack:
  added: []
  patterns: [colored-dot-status-indicator]
key-files:
  created: []
  modified:
    - packages/client/src/pages/InvoiceDetail.tsx
    - packages/client/src/pages/InvoiceCreate.tsx
decisions: []
metrics:
  duration: 1 min
  completed: 2026-01-23
---

# Quick Task 019: Colored Status Dots on Invoice Edit/Create Pages

**One-liner:** Added colored status dots (gray/blue/green/amber/red) to invoice edit and create page status selects, matching Invoices.tsx filter and Quotes pages pattern.

## What Was Done

### Task 1: Add colored status dots to InvoiceDetail.tsx and InvoiceCreate.tsx

Both files had their plain-text `<SelectItem>` elements replaced with the colored dot pattern:

```tsx
<SelectItem value="draft"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gray-400" />Brouillon</span></SelectItem>
<SelectItem value="sent"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" />Envoyee</span></SelectItem>
<SelectItem value="paid"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" />Payee</span></SelectItem>
<SelectItem value="overdue"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" />En retard</span></SelectItem>
<SelectItem value="cancelled"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" />Annulee</span></SelectItem>
```

**Commit:** c5931bb

## Verification

- InvoiceDetail.tsx: 5 `rounded-full` occurrences confirmed
- InvoiceCreate.tsx: 5 `rounded-full` occurrences confirmed
- No TypeScript errors introduced (pre-existing errors in server/database packages unchanged)

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Met

- [x] Status select on invoice edit page shows colored dots
- [x] Status select on invoice create page shows colored dots
- [x] Colors match exactly: gray-400, blue-500, green-500, amber-500, red-500
- [x] No TypeScript errors introduced
