# Quick Task 007: Editable validity days for quotes

## Result: SUCCESS

## Problem

The validity duration was hardcoded to 30 days in QuoteCreate.tsx with no way to change it from the UI.

## Fix

Added "Durée de validité (jours)" input field:
- **Creation form**: Number input (min 1, max 365, default 30)
- **Detail page (read mode)**: Shows "Validité: X jours" in the info grid
- **Detail page (edit mode)**: Editable number input, saved via update mutation

The backend already accepted `validityDays` in both create and update mutations - only the frontend was missing the field.

## Files Modified
- `packages/client/src/pages/QuoteCreate.tsx` - Added validityDays to form state + input field
- `packages/client/src/pages/QuoteDetail.tsx` - Added validityDays display + edit field

## Commit
- `0db194c` - feat(quotes): add editable validity days field
