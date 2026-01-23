# Quick Task 014: Fix description input focus on invoice line items

## Goal
Fix the bug where clicking on the description field after adding a new invoice line item does not allow typing.

## Root Cause
`PopoverTrigger asChild` adds button semantics (`role="button"`, `onClick` handlers, `aria-expanded`) to the wrapper element. Even with a `<div>` wrapper, the PopoverTrigger steals focus from the Input inside it on click, preventing text input.

## Fix
Replace `PopoverTrigger asChild` + `<div>` wrapper with `PopoverAnchor asChild` directly on the Input. `PopoverAnchor` only provides positioning reference for the PopoverContent without adding button semantics or interfering with input focus.

## Tasks

### Task 1: Update InvoiceCreate.tsx
- Replace `PopoverTrigger` import with `PopoverAnchor`
- Replace `<PopoverTrigger asChild><div><Input .../></div></PopoverTrigger>` with `<PopoverAnchor asChild><Input .../></PopoverAnchor>`

### Task 2: Update InvoiceDetail.tsx
- Same changes as Task 1

## Files Modified
- `packages/client/src/pages/InvoiceCreate.tsx`
- `packages/client/src/pages/InvoiceDetail.tsx`
