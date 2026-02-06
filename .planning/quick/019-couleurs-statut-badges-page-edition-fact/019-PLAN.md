---
phase: quick-019
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/pages/InvoiceDetail.tsx
  - packages/client/src/pages/InvoiceCreate.tsx
autonomous: true

must_haves:
  truths:
    - "Status select on invoice edit page shows colored dots matching the invoice list filter"
    - "Status select on invoice create page shows colored dots matching the invoice list filter"
    - "Colors: draft=gray-400, sent=blue-500, paid=green-500, overdue=amber-500, cancelled=red-500"
  artifacts:
    - path: "packages/client/src/pages/InvoiceDetail.tsx"
      provides: "Colored status dots in edit mode select"
      contains: "rounded-full bg-"
    - path: "packages/client/src/pages/InvoiceCreate.tsx"
      provides: "Colored status dots in create form select"
      contains: "rounded-full bg-"
  key_links:
    - from: "InvoiceDetail.tsx"
      to: "Invoices.tsx"
      via: "Same dot color pattern"
      pattern: "h-2 w-2 rounded-full bg-"
---

<objective>
Add colored status dots to the status Select on both invoice edit (InvoiceDetail.tsx) and invoice create (InvoiceCreate.tsx) pages, matching the pattern already used in Invoices.tsx list filter and Quotes pages.

Purpose: Visual consistency across all invoice-related pages.
Output: Both files updated with colored dot spans inside SelectItem elements.
</objective>

<context>
@packages/client/src/pages/Invoices.tsx (reference pattern - colored dots in status filter)
@packages/client/src/pages/InvoiceDetail.tsx (target - edit page, lines 460-464)
@packages/client/src/pages/InvoiceCreate.tsx (target - create page, lines 399-403)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add colored status dots to InvoiceDetail.tsx and InvoiceCreate.tsx</name>
  <files>
    packages/client/src/pages/InvoiceDetail.tsx
    packages/client/src/pages/InvoiceCreate.tsx
  </files>
  <action>
Replace the plain text SelectItem elements in both files with the colored dot pattern from Invoices.tsx.

In InvoiceDetail.tsx (lines 460-464), replace:
```tsx
<SelectItem value="draft">Brouillon</SelectItem>
<SelectItem value="sent">Envoyee</SelectItem>
<SelectItem value="paid">Payee</SelectItem>
<SelectItem value="overdue">En retard</SelectItem>
<SelectItem value="cancelled">Annulee</SelectItem>
```

With:
```tsx
<SelectItem value="draft"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gray-400" />Brouillon</span></SelectItem>
<SelectItem value="sent"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" />Envoyee</span></SelectItem>
<SelectItem value="paid"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" />Payee</span></SelectItem>
<SelectItem value="overdue"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" />En retard</span></SelectItem>
<SelectItem value="cancelled"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" />Annulee</span></SelectItem>
```

Apply the exact same replacement in InvoiceCreate.tsx (lines 399-403).

Keep the existing accented characters as they are in each file (e.g., "Envoyee" vs "Envoyée" - preserve whatever is already there).
  </action>
  <verify>
Run `pnpm check` to confirm no TypeScript errors. Then grep both files for "rounded-full bg-" to confirm 5 colored dots each (10 total).
  </verify>
  <done>
Both InvoiceDetail.tsx and InvoiceCreate.tsx status selects display colored dots: draft=gray, sent=blue, paid=green, overdue=amber, cancelled=red. Pattern matches Invoices.tsx filter.
  </done>
</task>

</tasks>

<verification>
- `grep -c "rounded-full" packages/client/src/pages/InvoiceDetail.tsx` returns 5
- `grep -c "rounded-full" packages/client/src/pages/InvoiceCreate.tsx` returns 5
- `pnpm check` passes with 0 errors
</verification>

<success_criteria>
- Status select on invoice edit page shows colored dots (visible in dropdown)
- Status select on invoice create page shows colored dots (visible in dropdown)
- Colors match exactly: gray-400, blue-500, green-500, amber-500, red-500
- No TypeScript errors introduced
</success_criteria>

<output>
After completion, create `.planning/quick/019-couleurs-statut-badges-page-edition-fact/019-SUMMARY.md`
</output>
