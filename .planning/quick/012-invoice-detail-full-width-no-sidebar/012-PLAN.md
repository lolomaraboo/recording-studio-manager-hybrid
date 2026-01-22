---
phase: quick-012
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/pages/InvoiceDetail.tsx
autonomous: true

must_haves:
  truths:
    - "Invoice detail page renders full width without a sidebar column"
    - "Client name (linked) and email are shown in the page header subtitle"
    - "Created/updated dates are displayed at the bottom of the invoice info card"
    - "Overdue alert is shown inline in the info card (not in a removed sidebar)"
    - "All header action buttons (PDF, Send, Mark paid, Edit, Delete) still function"
    - "Edit mode still works with full item editing, catalog, and save"
  artifacts:
    - path: "packages/client/src/pages/InvoiceDetail.tsx"
      provides: "Full-width invoice detail layout"
      contains: "space-y-4"
  key_links:
    - from: "Header subtitle"
      to: "/clients/{id}"
      via: "Link component"
      pattern: "to=.*clients/"
---

<objective>
Refactor InvoiceDetail.tsx to remove the right sidebar (Summary, Quick Actions, Client cards) and display all content full-width. Client info moves to the header subtitle, dates and status alerts move inline into the info card.

Purpose: Eliminate redundant UI (sidebar duplicates header buttons and info already shown in cards) for a cleaner, more focused layout.
Output: A single-column full-width invoice detail page with all functionality preserved.
</objective>

<context>
@packages/client/src/pages/InvoiceDetail.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove sidebar, full-width layout, integrate client + dates inline</name>
  <files>packages/client/src/pages/InvoiceDetail.tsx</files>
  <action>
  1. HEADER SUBTITLE - Replace the simple `<p>` subtitle (line 371) with a richer client line:
     ```tsx
     <div className="flex items-center gap-2 text-sm text-muted-foreground">
       <User className="h-4 w-4" />
       <Link to={`/clients/${client?.id}`} className="hover:underline">
         {client?.name || "Client inconnu"}
       </Link>
       {client?.email && <span>- {client.email}</span>}
     </div>
     ```

  2. REMOVE GRID LAYOUT - Replace the `<div className="grid gap-6 md:grid-cols-3">` wrapper (line 418) and the inner `<div className="md:col-span-2 space-y-6">` (line 420) with a single:
     ```tsx
     <div className="space-y-4">
     ```
     This wraps the 3 existing cards (Invoice Info, Items/Billing, Notes) at full width.

  3. ADD DATES TO INFO CARD (read mode) - After the paidAt block (after line 556, inside the read-mode branch of the info card), add created/updated dates:
     ```tsx
     <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
       <span>Creee le {format(new Date(invoice.createdAt), "dd MMM yyyy", { locale: fr })}</span>
       <span>-</span>
       <span>Mise a jour le {format(new Date(invoice.updatedAt), "dd MMM yyyy", { locale: fr })}</span>
     </div>
     ```

  4. ADD OVERDUE ALERT INLINE - After the dates block just added, include the overdue alert (moved from sidebar):
     ```tsx
     {isOverdue && (
       <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md mt-3">
         <p className="text-sm text-red-600 dark:text-red-400 font-medium">
           Facture en retard
         </p>
         <p className="text-xs text-red-600 dark:text-red-400 mt-1">
           Echeance depassee depuis le{" "}
           {format(new Date(invoice.dueDate), "dd MMM yyyy", { locale: fr })}
         </p>
       </div>
     )}
     ```
     Note: The existing `isOverdue` warning next to the due date (line 542-544) can remain as a subtle inline hint. This block provides the more prominent alert that was in the sidebar.

  5. DELETE ENTIRE RIGHT COLUMN - Remove lines 820-933 (the `<div className="space-y-6">` containing Summary card, Quick Actions card, and Client Info card). These are fully redundant:
     - Summary: status badge is in info card header, total is in items card, dates now in info card
     - Quick Actions: duplicates header buttons exactly
     - Client: now shown in header subtitle

  6. VERIFY no dangling closing divs remain from the removed grid structure. The structure after changes should be:
     ```
     <div className="container pt-2 pb-4 px-2">
       <div className="space-y-2">
         {/* Header */}
         ...
         {/* Main Content */}
         <div className="space-y-4">
           {/* Invoice Info Card */}
           {/* Invoice Items Card */}
           {/* Notes Card */}
         </div>
       </div>
     </div>
     ```
  </action>
  <verify>
  - `pnpm --filter client build` completes with no TypeScript errors
  - Visual check: page loads at full width, no sidebar visible
  - Header shows client name as link + email
  - Info card shows created/updated dates at bottom in read mode
  - Overdue alert displays inline when invoice is overdue
  - All buttons in header still work (PDF, Send, Mark paid, Edit, Delete)
  - Edit mode fully functional (items table, catalog modal, save/cancel)
  </verify>
  <done>
  InvoiceDetail renders full-width without sidebar. Client info in header subtitle. Dates and overdue alert inline in info card. All existing functionality preserved. Zero TypeScript errors.
  </done>
</task>

</tasks>

<verification>
- `pnpm --filter client build` passes with 0 errors
- No references to `grid-cols-3` or `col-span-2` remain in InvoiceDetail.tsx
- No "Resume", "Actions rapides", or sidebar Client card markup remains
- The `isOverdue` logic variable is still computed and used
- The `getStatusBadge` function is still used in the info card header
</verification>

<success_criteria>
- Full-width layout (no grid, no sidebar)
- Client name linked in header + email shown
- Created/updated dates in info card footer
- Overdue alert inline in info card
- All actions functional (PDF, email, mark paid, edit, delete)
- Clean build with 0 TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/012-invoice-detail-full-width-no-sidebar/012-SUMMARY.md`
</output>
