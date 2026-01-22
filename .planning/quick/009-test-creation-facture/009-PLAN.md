---
phase: quick-009
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - e2e/crud/invoices-create-local.spec.ts
autonomous: true

must_haves:
  truths:
    - "E2E test navigates to /invoices/new and creates an invoice"
    - "Test selects a client, fills invoice number, date, and line item"
    - "Test verifies auto-calculated amount and successful navigation to detail page"
  artifacts:
    - path: "e2e/crud/invoices-create-local.spec.ts"
      provides: "Invoice creation E2E test"
      min_lines: 60
  key_links:
    - from: "e2e/crud/invoices-create-local.spec.ts"
      to: "/invoices/new"
      via: "page.goto"
      pattern: "goto.*invoices/new"
---

<objective>
Create a Playwright E2E test for invoice creation against localhost.

Purpose: Validate the invoice creation flow works end-to-end (client selection, form fill, line item, submit, navigation to detail).
Output: Working E2E test file at e2e/crud/invoices-create-local.spec.ts
</objective>

<context>
@e2e/crud/quotes-create-local.spec.ts (reference pattern)
@packages/client/src/pages/invoices/InvoiceCreate.tsx (form structure)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create invoice creation E2E test</name>
  <files>e2e/crud/invoices-create-local.spec.ts</files>
  <action>
Create Playwright test file following the quotes-create-local.spec.ts pattern but adapted for invoices:

1. Header comment explaining the test purpose and run command
2. Test: "should create an invoice with client selection and line item"
3. Steps:
   a. `page.goto('/invoices/new')`
   b. Wait for h1 containing "Nouvelle Facture" (timeout: 15000)
   c. Select client: click `#clientId` trigger, wait for `[role="option"]` first, click it
   d. Fill `#invoiceNumber` with "INV-E2E-001"
   e. Fill `#issueDate` with today's date (format: YYYY-MM-DD, use `new Date().toISOString().split('T')[0]`)
   f. Fill first line item description: use `page.locator('[placeholder="Description de l\'article"]').first()` and `.fill('Enregistrement studio 2h')` (standard Input, NO native setter hack needed - unlike quotes, this is a regular input not a Popover)
   g. Fill quantity: `input[type="number"][step="0.01"]` first = clear + fill "2"
   h. Fill unit price: `input[type="number"][step="0.01"]` nth(1) = clear + fill "150"
   i. Verify amount auto-calculated: `input[readonly]` first should have value "300.00"
   j. Click submit: `page.getByRole('button', { name: /Créer la facture/i })`
   k. Wait 2000ms for mutation
   l. Check for error toast (`[data-sonner-toast][data-type="error"]`), throw if visible
   m. Wait for URL to match `/invoices/\d+` (detail page, NOT list) with timeout 15000
   n. Verify detail page loaded: check for heading or content indicating invoice detail

Key differences from quotes test:
- NO title field (use invoiceNumber instead)
- Description input is a standard Input (use .fill() directly, NO native setter trick)
- NO Escape key press needed (no popover to dismiss)
- Success navigates to `/invoices/{id}` (detail page), NOT `/invoices` (list)
- Date field needs YYYY-MM-DD format via fill()
  </action>
  <verify>
Run: BASE_URL=http://localhost:5174 npx playwright test e2e/crud/invoices-create-local.spec.ts --headed
Test should pass: navigates to /invoices/new, fills form, submits, ends on /invoices/\d+ detail page.
  </verify>
  <done>
Test file exists at e2e/crud/invoices-create-local.spec.ts and passes against running localhost dev server.
  </done>
</task>

</tasks>

<verification>
- File exists: e2e/crud/invoices-create-local.spec.ts
- Test passes: BASE_URL=http://localhost:5174 npx playwright test e2e/crud/invoices-create-local.spec.ts
- No TypeScript errors in test file
</verification>

<success_criteria>
- Invoice creation E2E test passes against localhost:5174
- Test covers: client selection, invoice number, date, line item with amount verification, form submission, navigation to detail page
</success_criteria>

<output>
After completion, create `.planning/quick/009-test-creation-facture/009-SUMMARY.md`
</output>
