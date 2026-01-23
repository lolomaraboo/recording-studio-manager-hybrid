# Quick Task 014: Summary

## Status: COMPLETE

## What was done
Fixed the description input field in invoice line items that was not responding to clicks/typing after adding a new line.

## Root Cause
`PopoverTrigger asChild` merges button semantics onto its child element (role="button", onClick, aria-expanded). This interfered with the Input's native focus and typing behavior. The previous fix (wrapping in `<div>`) was insufficient because the div still received button semantics from PopoverTrigger.

## Solution
Replaced `PopoverTrigger` with `PopoverAnchor` in both invoice form files. `PopoverAnchor` only provides positional reference for the PopoverContent without adding any button behavior, allowing the Input to function normally.

Since the Popover is already controlled programmatically via `open={autocompleteOpen === index}` and `onOpenChange`, a trigger is not needed - only an anchor point for positioning.

## Files Modified
- `packages/client/src/pages/InvoiceCreate.tsx` - Import + usage change
- `packages/client/src/pages/InvoiceDetail.tsx` - Import + usage change

## Build Verification
Client build passes without errors.
