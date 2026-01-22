# Quick Task 008: Revert quote to draft

## Result: SUCCESS

## Problem

If a user accidentally clicked "Envoyer" or "Annuler" on a quote, there was no way to go back to draft status. The quote was stuck.

## Solution

Added "Remettre en brouillon" button for `sent` and `cancelled` quotes:

**State machine updates:**
- `sent` → `draft` (resets sentAt, expiresAt to null)
- `cancelled` → `draft` (allows reuse of cancelled quote)
- `rejected` and `converted_to_project` remain final (no revert possible)

**Backend:** New `revertToDraft` mutation in `packages/server/src/routers/quotes.ts`
**Frontend:** Button with `Undo2` icon, shown for sent and cancelled statuses

## Files Modified
- `packages/server/src/routers/quotes.ts` - Added revertToDraft mutation
- `packages/client/src/pages/QuoteDetail.tsx` - Added mutation, handler, and UI button

## Commit
- `32006de` - feat(quotes): add revert-to-draft for sent/cancelled quotes
