---
phase: quick
plan: 003
type: execute
wave: 1
depends_on: []
files_modified:
  - e2e/crud/quotes-create-local.spec.ts
autonomous: true

must_haves:
  truths:
    - "Quote creation E2E test runs against localhost and passes"
    - "Test validates form submission with shadcn/ui components"
    - "Created quote appears in quotes list"
  artifacts:
    - path: "e2e/crud/quotes-create-local.spec.ts"
      provides: "Local-compatible quote creation E2E test"
  key_links:
    - from: "e2e/crud/quotes-create-local.spec.ts"
      to: "http://localhost:5174/quotes/create"
      via: "Playwright navigation"
      pattern: "page.goto.*quotes"
---

<objective>
Test the quote creation flow by running an E2E test against localhost.

Purpose: Verify that the quote creation feature works end-to-end (UI form -> tRPC mutation -> database -> redirect to list).
Output: A passing E2E test confirming quote creation works locally.
</objective>

<context>
@packages/client/src/pages/QuoteCreate.tsx
@packages/server/src/routers/quotes.ts
@e2e/crud/quotes.spec.ts
@playwright.config.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create and run local quote creation E2E test</name>
  <files>e2e/crud/quotes-create-local.spec.ts</files>
  <action>
    Create a focused E2E test for quote creation that works against localhost.

    IMPORTANT: The existing `quotes.spec.ts` uses native HTML selectors (`select[name="clientId"]`, `input[name="items[0].description"]`) but the actual QuoteCreate.tsx uses shadcn/ui components (Select with Popover/Command pattern, not native HTML select). The test needs to match the REAL UI.

    The test should:
    1. Navigate to http://localhost:5174 (using BASE_URL env var)
    2. Go to /quotes/create (or click "New Quote" from /quotes)
    3. Select a client using the shadcn/ui Select component (click trigger, then click an item from the dropdown)
    4. Fill in a title for the quote
    5. Add at least one line item with description, quantity, and unit price
    6. Submit the form
    7. Verify success toast ("Devis cree avec succes") or navigation back to /quotes

    Auth approach for localhost: The dev environment uses test headers automatically (x-test-user-id: 1, x-test-org-id: 1) so no login step is needed IF tRPC client adds them. However, if the app has a login page that blocks access, use the login flow with test credentials.

    Check QuoteCreate.tsx to understand exact component structure:
    - Client selection: shadcn Popover + Command pattern (search + select)
    - Line items: dynamic array with Input components
    - VAT rate: shadcn Select per line item
    - Submit button text and behavior

    Run with: BASE_URL=http://localhost:5174 npx playwright test e2e/crud/quotes-create-local.spec.ts --headed

    If the test fails due to selector mismatches, inspect the page and fix selectors to match actual DOM. Use Playwright's getByRole, getByText, getByPlaceholder, or getByLabel where possible (more resilient than CSS selectors).
  </action>
  <verify>
    Run: BASE_URL=http://localhost:5174 npx playwright test e2e/crud/quotes-create-local.spec.ts --headed
    Expected: Test passes (green) - quote is created successfully.
    If test fails: Check Playwright trace/screenshot, fix selectors, re-run.
  </verify>
  <done>Quote creation E2E test passes against localhost, confirming the full flow works: form loads, client is selected, line item is added, form submits, quote is created.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Quote creation E2E test running against localhost</what-built>
  <how-to-verify>
    1. Observe the Playwright browser window during test execution
    2. Confirm the quote form loads correctly at /quotes/create
    3. Confirm a client is selected and a line item is filled
    4. Confirm the form submits and navigates to /quotes or shows success toast
    5. Optionally: visit http://localhost:5174/quotes and verify the new quote appears in the list
  </how-to-verify>
  <resume-signal>Type "approved" if quote creation works, or describe issues observed</resume-signal>
</task>

</tasks>

<verification>
- E2E test file exists at e2e/crud/quotes-create-local.spec.ts
- Test passes with: BASE_URL=http://localhost:5174 npx playwright test e2e/crud/quotes-create-local.spec.ts
- Quote is visible in the quotes list after creation
</verification>

<success_criteria>
Quote creation flow verified working end-to-end on localhost via automated Playwright test.
</success_criteria>

<output>
After completion, create `.planning/quick/003-teste-la-creation-de-devis/003-SUMMARY.md`
</output>
