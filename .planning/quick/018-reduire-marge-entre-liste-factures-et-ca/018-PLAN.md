---
phase: quick-018
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/pages/Invoices.tsx
autonomous: true

must_haves:
  truths:
    - "The invoice list table has reduced spacing (padding) between itself and the surrounding Card border"
    - "The search/filter area above the table also has reduced padding to match"
    - "The visual result is a tighter, more compact card around the invoice list"
  artifacts:
    - path: "packages/client/src/pages/Invoices.tsx"
      provides: "Invoice list page with reduced card padding"
      contains: "p-2"
  key_links: []
---

<objective>
Reduce the margin/padding between the invoice list table and the Card component that wraps it.

Purpose: The current Card uses default shadcn padding (p-6 = 24px) which creates too much whitespace between the table and the card border. Reducing to p-2 (8px) makes the layout tighter and more space-efficient.

Output: Updated Invoices.tsx with reduced CardHeader and CardContent padding on the invoice list card.
</objective>

<context>
@packages/client/src/pages/Invoices.tsx
@packages/client/src/components/ui/card.tsx

Current structure (lines 186-301 of Invoices.tsx):
- Card wraps the invoice list
- CardHeader (line 187): has `className="pb-3"` - controls search/filter area padding. Default base is `p-6`, so effective padding is p-6 with pb-3 override.
- CardContent (line 213): no className override, uses default `p-6 pt-0` (24px sides/bottom, 0 top)
- Table is inside `<div className="rounded-md border">` (line 221)

The Card component (card.tsx):
- CardHeader default: `p-6`
- CardContent default: `p-6 pt-0`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reduce padding on invoice list Card</name>
  <files>packages/client/src/pages/Invoices.tsx</files>
  <action>
    On the invoice list Card (line 186), reduce internal spacing by overriding padding on CardHeader and CardContent:

    1. Line 187: Change `<CardHeader className="pb-3">` to `<CardHeader className="p-2 pb-2">`
       - This overrides the default p-6 with p-2 (8px all around), keeping bottom at 2 as well for tight spacing before table.

    2. Line 213: Change `<CardContent>` to `<CardContent className="p-2 pt-0">`
       - This overrides the default p-6 pt-0 with p-2 pt-0 (8px sides/bottom, 0 top) for tighter wrapping around the table.

    Do NOT modify the stats cards above (lines 133-181) - only the invoice list Card.
    Do NOT modify the card.tsx component itself - use className overrides locally.
  </action>
  <verify>
    Run `pnpm --filter client build` to confirm no build errors. Visually confirm on localhost:5174/invoices that the table has less whitespace between it and the card border.
  </verify>
  <done>
    The invoice list Card has p-2 padding on both CardHeader and CardContent, resulting in 8px spacing between the table and card border instead of the previous 24px.
  </done>
</task>

</tasks>

<verification>
- `pnpm --filter client build` passes with 0 errors
- Visual check: invoice list table sits closer to the card border (8px gap instead of 24px)
- Stats cards above are unchanged
</verification>

<success_criteria>
- Invoices.tsx CardHeader on invoice list card uses `p-2 pb-2`
- Invoices.tsx CardContent on invoice list card uses `p-2 pt-0`
- Build passes, no TypeScript errors
- Visual spacing reduced as intended
</success_criteria>

<output>
After completion, create `.planning/quick/018-reduire-marge-entre-liste-factures-et-ca/018-SUMMARY.md`
</output>
