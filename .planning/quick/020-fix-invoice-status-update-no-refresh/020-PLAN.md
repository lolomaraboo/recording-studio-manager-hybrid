---
phase: quick-020
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/pages/InvoiceDetail.tsx
autonomous: true

must_haves:
  truths:
    - "Invoice status badge updates immediately in the detail page after saving a status change"
    - "Invoice list page shows updated status when navigating back after a status change"
    - "Mark as paid button updates UI immediately without page refresh"
  artifacts:
    - path: "packages/client/src/pages/InvoiceDetail.tsx"
      provides: "Invoice detail with proper tRPC cache invalidation"
      contains: "utils.invoices.list.invalidate"
  key_links:
    - from: "packages/client/src/pages/InvoiceDetail.tsx"
      to: "trpc.useUtils()"
      via: "cache invalidation on mutation success"
      pattern: "utils\\.invoices\\.list\\.invalidate"
---

<objective>
Fix invoice status update not reflecting in the UI without a page refresh.

Purpose: The InvoiceDetail page mutations (update, updateWithItems, delete) call `refetch()` but never invalidate the tRPC query cache via `utils.invoices.list.invalidate()`. This means the list page shows stale data when navigating back. The `trpc.useUtils()` hook is not even initialized in this component.

Output: InvoiceDetail.tsx with proper cache invalidation matching the established pattern from QuoteDetail.tsx.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/client/src/pages/InvoiceDetail.tsx
@packages/client/src/pages/QuoteDetail.tsx (reference pattern: uses `trpc.useUtils()` + `utils.quotes.list.invalidate()`)
@packages/client/src/lib/trpc.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add tRPC cache invalidation to InvoiceDetail mutations</name>
  <files>packages/client/src/pages/InvoiceDetail.tsx</files>
  <action>
    1. Add `const utils = trpc.useUtils();` after the existing `useNavigate()` call (line 50), following the exact pattern from QuoteDetail.tsx (line 41).

    2. In the `updateMutation` onSuccess callback (line 79-82), add `utils.invoices.list.invalidate();` BEFORE the toast call.

    3. In the `updateWithItemsMutation` onSuccess callback (line 90-93), add `utils.invoices.list.invalidate();` BEFORE the toast call.

    4. In the `deleteMutation` onSuccess callback (line 101-104), add `utils.invoices.list.invalidate();` BEFORE the toast call.

    The resulting pattern for each mutation should match QuoteDetail.tsx:
    ```typescript
    onSuccess: () => {
      utils.invoices.list.invalidate();
      toast.success("...");
      // rest of logic
    },
    ```
  </action>
  <verify>
    Run `pnpm --filter client build` to confirm no TypeScript errors.
    Grep for `utils.invoices.list.invalidate` in InvoiceDetail.tsx to confirm 3 occurrences.
  </verify>
  <done>
    All three mutations (update, updateWithItems, delete) invalidate the invoices list cache on success. The `trpc.useUtils()` hook is initialized. TypeScript compiles without errors.
  </done>
</task>

</tasks>

<verification>
- `pnpm --filter client build` passes with 0 errors
- `grep -c "utils.invoices.list.invalidate" packages/client/src/pages/InvoiceDetail.tsx` returns 3
- `grep "trpc.useUtils" packages/client/src/pages/InvoiceDetail.tsx` shows the hook is initialized
</verification>

<success_criteria>
- Changing invoice status via the status dropdown and saving immediately reflects the new status badge in the detail view
- Navigating back to the invoice list shows the updated status without requiring a page refresh
- The "Marquer payee" button updates the UI immediately
- No TypeScript compilation errors introduced
</success_criteria>

<output>
After completion, create `.planning/quick/020-fix-invoice-status-update-no-refresh/020-SUMMARY.md`
</output>
