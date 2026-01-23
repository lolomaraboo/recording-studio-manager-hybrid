---
phase: quick-013
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - e2e/crud/invoices-edit-local.spec.ts
autonomous: true

must_haves:
  truths:
    - "E2E test creates an invoice, navigates to its detail, edits it, and verifies the update persists"
    - "Test confirms 'Facture mise a jour' success toast appears after save"
    - "Test confirms page exits edit mode (Modifier button reappears)"
  artifacts:
    - path: "e2e/crud/invoices-edit-local.spec.ts"
      provides: "Invoice edit E2E test"
      min_lines: 60
  key_links:
    - from: "e2e/crud/invoices-edit-local.spec.ts"
      to: "packages/client/src/pages/InvoiceDetail.tsx"
      via: "Playwright selectors matching edit mode UI"
      pattern: "Modifier|Enregistrer|Facture mise"
---

<objective>
Create a Playwright E2E test that validates the invoice modification flow on localhost:5174.

Purpose: Verify that editing an existing invoice (changing line item description, quantity, unit price) saves correctly and exits edit mode.
Output: A passing E2E test file at `e2e/crud/invoices-edit-local.spec.ts`
</objective>

<context>
@e2e/crud/invoices-create-local.spec.ts (pattern reference for auth bypass, selectors, timing)
@packages/client/src/pages/InvoiceDetail.tsx (edit mode UI structure)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create invoice edit E2E test</name>
  <files>e2e/crud/invoices-edit-local.spec.ts</files>
  <action>
Create `e2e/crud/invoices-edit-local.spec.ts` following the pattern of `invoices-create-local.spec.ts`.

The test structure:

1. **Setup: Create an invoice first** (reuse creation flow inline):
   - Navigate to `/invoices/new`
   - Wait for `h1` to contain "Nouvelle Facture" (timeout 15s)
   - Select first client via `#clientId` trigger + `[role="option"]` first
   - Fill `#invoiceNumber` with `INV-EDIT-${Date.now()}`
   - Fill `#issueDate` with today's date (YYYY-MM-DD)
   - Fill description input (`[placeholder="Tapez pour rechercher..."]` first) with "Session originale"
   - Press Escape after 300ms to dismiss autocomplete
   - Fill quantity (first `input[type="number"][step="0.01"]`) with "1"
   - Fill unit price (nth(1) `input[type="number"][step="0.01"]`) with "100"
   - Click "Creer la facture" button
   - Wait for URL to match `/invoices/\d+` (timeout 15s) - this means we are on the detail page

2. **Edit the invoice:**
   - Wait for "Modifier" button to be visible (timeout 10s)
   - Click "Modifier" button
   - Wait for "Enregistrer" button to be visible (confirms edit mode)
   - Locate description input (`[placeholder="Tapez pour rechercher..."]` first), clear it, fill with "Session modifiee E2E"
   - Press Escape after 300ms to dismiss autocomplete if it appears
   - Locate quantity input (first `input[type="number"][step="0.01"]`), clear, fill with "3"
   - Locate unit price input (nth(1) `input[type="number"][step="0.01"]`), clear, fill with "200"
   - Verify amount readonly input shows "600.00" (3 * 200)
   - Click "Enregistrer" button

3. **Verify success:**
   - Wait for success toast: `page.locator('[data-sonner-toast][data-type="success"]')` should contain "Facture mise a jour" (use regex for accent: `/mise . jour/`) within 10s
   - Wait for "Modifier" button to reappear (confirms exit from edit mode)
   - Verify page body contains "Session modifiee E2E" (the updated description persists)

Important implementation details:
- Do NOT use `waitForLoadState('networkidle')` - SSE/WebSocket keeps connection alive
- Use `page.waitForTimeout(300)` sparingly, only for autocomplete dismissal
- Use `await expect(...).toBeVisible({ timeout: ... })` for waiting on elements
- Test headers (x-test-user-id/org-id) are set automatically by the dev tRPC client, no login needed
- Add a comment header explaining the test purpose and run command:
  `BASE_URL=http://localhost:5174 npx playwright test e2e/crud/invoices-edit-local.spec.ts --headed`
  </action>
  <verify>
Run: `cd /Users/marabook_m1/Documents/APP_HOME/CascadeProjects/windsurf-project/recording-studio-manager-hybrid && BASE_URL=http://localhost:5174 npx playwright test e2e/crud/invoices-edit-local.spec.ts --headed`

Test should pass (green). If dev server is not running, at minimum verify the file compiles: `npx tsc --noEmit e2e/crud/invoices-edit-local.spec.ts` or just confirm file structure is correct.
  </verify>
  <done>
File `e2e/crud/invoices-edit-local.spec.ts` exists, follows project E2E patterns, tests full invoice edit flow (create -> modify -> verify), and passes against localhost:5174 when dev server is running.
  </done>
</task>

</tasks>

<verification>
- File exists at `e2e/crud/invoices-edit-local.spec.ts`
- File imports from `@playwright/test`
- Test creates invoice, enters edit mode, modifies fields, saves, verifies toast + exit edit mode + persisted data
- No hardcoded IDs (creates its own invoice dynamically)
</verification>

<success_criteria>
- Test passes against localhost:5174 with dev server running
- Test is self-contained (creates its own invoice, no dependency on prior test state)
- Success toast "Facture mise a jour" verified
- Edit mode exit verified (Modifier button reappears)
- Modified data visible on page after save
</success_criteria>

<output>
After completion, the test file is ready for use. No summary needed for quick tasks.
</output>
