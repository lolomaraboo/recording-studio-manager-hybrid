# Quick Task 005: Fix quotes status display

## Result: SUCCESS

## Problem

On `/quotes` list page, status badges didn't update after changing quote status. Two issues:
1. `cancelled` and `converted_to_project` statuses were missing from `getStatusBadge()` mapping → displayed as "Brouillon"
2. Filter dropdown also missing these two statuses

## Fix

Added missing status variants to both:
- `getStatusBadge()`: `cancelled` → "Annulé" (secondary), `converted_to_project` → "Converti" (default)
- Filter dropdown: Added "Annulé" and "Converti" options

## Files Modified
- `packages/client/src/pages/Quotes.tsx`

## Commit
- `fe50334` - fix(quotes): add missing status badges (cancelled, converted_to_project)
