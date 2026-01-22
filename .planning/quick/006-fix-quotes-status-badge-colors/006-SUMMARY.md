# Quick Task 006: Fix quotes status badge colors

## Result: SUCCESS

## Problem

Status badges on `/quotes` list page had different colors than on the detail page.

| Status | List (before) | Detail | After (aligned) |
|--------|--------------|--------|-----------------|
| sent | outline (border) | bg-blue-500 | bg-blue-500 |
| accepted | default (dark) | bg-green-500 | bg-green-500 |
| expired | destructive (red) | outline+gray | outline+gray |
| converted | default (dark) | bg-purple-500 | bg-purple-500 |

## Additional Fix

Detail page used `converted` key but actual DB status is `converted_to_project` → badge never matched. Fixed to use correct key. Also added missing `cancelled` status to detail page.

## Files Modified
- `packages/client/src/pages/Quotes.tsx` - Aligned badge colors to match detail
- `packages/client/src/pages/QuoteDetail.tsx` - Fixed `converted` → `converted_to_project`, added `cancelled`

## Commit
- `fce86f1` - fix(quotes): harmonize status badge colors between list and detail
