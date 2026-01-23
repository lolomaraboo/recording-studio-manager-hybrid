---
phase: quick-022
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - e2e/features/chatbot-crud-operations.spec.ts
autonomous: true

must_haves:
  truths:
    - "Chatbot can create, list, read, update, and delete clients via natural language"
    - "Chatbot can create, list, read, update, and delete quotes (devis) via natural language"
    - "Chatbot can create, list, read, update, and delete invoices (factures) via natural language"
    - "Chatbot can create and list sessions (services) via natural language"
    - "Each CRUD cycle is serial: create -> list -> update -> delete"
  artifacts:
    - path: "e2e/features/chatbot-crud-operations.spec.ts"
      provides: "Comprehensive E2E test for chatbot CRUD on clients, quotes, invoices, sessions"
      min_lines: 300
  key_links:
    - from: "e2e/features/chatbot-crud-operations.spec.ts"
      to: "packages/client/src/components/AIAssistant.tsx"
      via: "Playwright interacts with chat input and reads assistant responses"
      pattern: "placeholder.*message"
---

<objective>
Create a comprehensive Playwright E2E test file that validates the chatbot can perform full CRUD operations on clients, quotes (devis), invoices (factures), and sessions (services) using natural language commands.

Purpose: Ensure the AI chatbot's 37+ tools work end-to-end from the UI, validating that natural language requests are correctly interpreted and executed against the database.

Output: A single test file `e2e/features/chatbot-crud-operations.spec.ts` with serial test groups for each entity type.
</objective>

<context>
@packages/server/src/lib/aiTools.ts (tool definitions with required params)
@packages/client/src/components/AIAssistant.tsx (chat UI structure)
@e2e/features/ai-chatbot.spec.ts (existing test patterns)
@e2e/helpers/login.ts (loginAsStaff helper)
@playwright.config.ts (test config: 60s timeout, chromium, BASE_URL)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create chatbot CRUD E2E test file</name>
  <files>e2e/features/chatbot-crud-operations.spec.ts</files>
  <action>
Create a comprehensive Playwright test file with the following structure:

**Imports and setup:**
- Import `test, expect` from `@playwright/test`
- Import `loginAsStaff` from `../helpers/login`
- Import `takeFullPageScreenshot` from `../helpers/screenshots`

**Helper function `sendChatMessage(page, message)`:**
- Locates input: `page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first()`
- Fills message
- Clicks send button: `page.locator('button:has(svg.lucide-send), button[type="submit"]').first()`
- Waits for response: wait for the loading indicator (bouncing dots in `.animate-bounce`) to appear then disappear, with a max timeout of 30s. Use `page.waitForSelector('.animate-bounce', { state: 'visible', timeout: 5000 }).catch(() => {})` then `page.waitForSelector('.animate-bounce', { state: 'detached', timeout: 30000 }).catch(() => {})`
- Returns the last assistant message text: `page.locator('.bg-muted .text-sm.whitespace-pre-wrap').last().textContent()`

**Helper function `getLastAssistantMessage(page)`:**
- Returns `page.locator('.bg-muted .text-sm.whitespace-pre-wrap').last().textContent()`

**Test structure - use `test.describe.configure({ mode: 'serial' })` for each describe block:**

**1. describe('Chatbot CRUD - Clients')**
- `beforeAll`: loginAsStaff, navigate to `/chat`, wait for load
- Test "Create client": Send "Cree un nouveau client individuel nomme E2E Test Client Chatbot avec email e2e-chatbot-client@test.com et telephone 0612345678". Verify response contains confirmation (client name or "cree"/"created").
- Test "List clients": Send "Liste tous mes clients". Verify response mentions "E2E Test Client Chatbot" or contains client listing.
- Test "Update client": Send "Modifie le client E2E Test Client Chatbot, change son email en e2e-updated@test.com". Verify response contains confirmation of update.
- Test "Delete client": Send "Supprime le client E2E Test Client Chatbot". Verify response confirms deletion.

**2. describe('Chatbot CRUD - Quotes (Devis)')**
- `beforeAll`: loginAsStaff, navigate to `/chat`, wait for load
- Test "Create quote": Send "Cree un devis numero QT-E2E-001 pour le client 1, valable jusqu'au 2026-12-31, avec une ligne: Enregistrement studio 3h a 150 euros". Verify response confirms quote creation.
- Test "List quotes": Send "Montre moi tous les devis". Verify response mentions QT-E2E-001 or shows quote listing.
- Test "Read quote details": Send "Donne moi les details du devis QT-E2E-001". Verify response includes details (amount, client, items).
- Test "Update quote": Send "Change le statut du devis QT-E2E-001 en sent". Verify response confirms update.
- Test "Delete quote": Send "Supprime le devis QT-E2E-001". Verify response confirms deletion.

**3. describe('Chatbot CRUD - Invoices (Factures)')**
- `beforeAll`: loginAsStaff, navigate to `/chat`, wait for load
- Test "Create invoice": Send "Cree une facture INV-E2E-001 pour le client 1, date du 2026-01-20, echeance 2026-02-20, montant HT 500 euros, avec une ligne: Session mixage a 500 euros". Verify response confirms invoice creation.
- Test "List invoices": Send "Liste toutes les factures". Verify response mentions INV-E2E-001 or shows invoice listing.
- Test "Read invoice details": Send "Donne moi les details de la facture INV-E2E-001". Verify response includes details (amount, status, items).
- Test "Update invoice status": Send "Marque la facture INV-E2E-001 comme payee". Verify response confirms status change.
- Test "Delete invoice": Send "Supprime la facture INV-E2E-001". Verify response confirms deletion.

**4. describe('Chatbot CRUD - Sessions (Services)')**
- `beforeAll`: loginAsStaff, navigate to `/chat`, wait for load
- Test "Create session": Send "Cree une session intitulee Session E2E Chatbot pour le client 1 dans la salle 1, le 2026-06-15 de 14h a 17h". Verify response confirms session creation.
- Test "List sessions": Send "Montre moi les sessions a venir". Verify response lists sessions or mentions the E2E session.
- Test "Update session": Send "Change le statut de la derniere session creee en completed". Verify response confirms update.
- Test "Delete session": Send "Supprime la derniere session creee". Verify response confirms deletion.

**Verification patterns for assertions:**
- Use flexible text matching: `expect(response?.toLowerCase()).toMatch(/cree|created|succes|confirmation|nouveau/)` for create operations
- For list operations: check response is not empty and is reasonably long (>50 chars)
- For updates: `expect(response?.toLowerCase()).toMatch(/modif|updat|mis a jour|change|statut/)`
- For deletes: `expect(response?.toLowerCase()).toMatch(/supprim|delet|retir/)`
- Always take screenshot after each test for debugging: `await takeFullPageScreenshot(page, 'chatbot-crud-{entity}-{action}')`

**Important implementation notes:**
- Do NOT use accented characters in chat messages sent to the AI (use "Cree" not "Cree" with accent, "echeance" not "echeance" with accent) to avoid encoding issues in test selectors. Actually, DO use proper French with accents since the AI understands French - use: Cree, echéance, etc. The input field handles UTF-8 fine.
- Set test timeout to 45000ms per test (AI responses can take 10-20s)
- Use `test.describe.configure({ mode: 'serial' })` so create runs before read/update/delete
- The chat page is at `/chat` route (direct page, not the floating widget)
- After login, clear any existing chat session by checking for a "new chat" button or localStorage clear
  </action>
  <verify>
Run `npx playwright test e2e/features/chatbot-crud-operations.spec.ts --headed` against the production instance. All 4 entity groups should show tests passing (create/list/update/delete for each).
  </verify>
  <done>
Test file exists at e2e/features/chatbot-crud-operations.spec.ts with 17+ tests covering CRUD for clients, quotes, invoices, and sessions. Tests use serial mode, proper wait strategies for AI responses, and flexible assertion patterns.
  </done>
</task>

</tasks>

<verification>
- File exists: `ls e2e/features/chatbot-crud-operations.spec.ts`
- TypeScript compiles: `npx tsc --noEmit --project tsconfig.json` (or playwright's own TS compilation)
- Tests can be listed: `npx playwright test e2e/features/chatbot-crud-operations.spec.ts --list`
- Tests pass against production: `npx playwright test e2e/features/chatbot-crud-operations.spec.ts`
</verification>

<success_criteria>
- Single test file covers CRUD for 4 entity types (clients, quotes, invoices, sessions)
- Tests are serial within each describe block (create before read/update/delete)
- AI response waiting uses proper selector-based waits (not arbitrary timeouts)
- Assertions are flexible (regex matching on response text, not exact string matching)
- Each test takes a screenshot for debugging
- All tests pass against the live production instance
</success_criteria>

<output>
After completion, create `.planning/quick/022-test-chatbot-crud-devis-factures-clients/022-SUMMARY.md`
</output>
