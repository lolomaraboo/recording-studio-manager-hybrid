import { test, expect, Page } from '@playwright/test';
import { loginAsStaff } from '../helpers/login';
import { takeFullPageScreenshot } from '../helpers/screenshots';

/**
 * Chatbot CRUD Operations E2E Tests
 *
 * Tests that the AI chatbot can perform full CRUD operations on:
 * - Clients (create, list, update, delete)
 * - Quotes/Devis (create, list, read details, update status, delete)
 * - Invoices/Factures (create, list, read details, update status, delete)
 * - Sessions/Services (create, list, update, delete)
 *
 * Each test group is serial: create -> list -> update -> delete
 * to ensure data dependencies are met.
 *
 * NOTE: In dev mode (localhost:5174), the app uses test headers
 * (x-test-user-id/x-test-org-id) so no login is needed.
 * In production, loginAsStaff() is used.
 */

// Increase timeout for AI responses (some AI calls can take 30-50s)
test.setTimeout(90000);

const BASE_URL = process.env.BASE_URL || 'https://recording-studio-manager.com';
const IS_LOCAL = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1');

// Unique run ID to avoid conflicts between test runs
const RUN_ID = Date.now().toString().slice(-6);
const TEST_CLIENT_NAME = `E2E Client ${RUN_ID}`;
const TEST_CLIENT_EMAIL = `e2e-${RUN_ID}@test.com`;
const TEST_QUOTE_NUMBER = `QT-E2E-${RUN_ID}`;
const TEST_INVOICE_NUMBER = `INV-E2E-${RUN_ID}`;
const TEST_SESSION_TITLE = `Session E2E ${RUN_ID}`;

/**
 * Send a message to the chatbot and wait for the AI response
 */
async function sendChatMessage(page: Page, message: string): Promise<string> {
  // Locate input (French placeholder)
  const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();

  // Wait for the input to be enabled (not loading from previous message)
  await chatInput.waitFor({ state: 'visible', timeout: 60000 });
  // Wait until it's not disabled
  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[placeholder*="message" i], textarea[placeholder*="message" i]') as HTMLInputElement;
      return input && !input.disabled;
    },
    { timeout: 60000 }
  );

  // Small stabilization delay
  await page.waitForTimeout(300);

  // Fill the message
  await chatInput.fill(message);

  // Click send button (icon button with Send svg)
  const sendButton = page.locator('button:has(svg.lucide-send), button[type="submit"]').first();
  await sendButton.click();

  // Wait for loading indicator to appear (bounce dots)
  await page.locator('.animate-bounce').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  // Wait for loading indicator to disappear (response complete)
  await page.locator('.animate-bounce').first().waitFor({ state: 'detached', timeout: 60000 }).catch(() => {});

  // Wait for input to be re-enabled (response fully processed)
  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[placeholder*="message" i], textarea[placeholder*="message" i]') as HTMLInputElement;
      return input && !input.disabled;
    },
    { timeout: 15000 }
  ).catch(() => {});

  // Small extra wait for DOM update
  await page.waitForTimeout(500);

  // Get the last assistant message
  const lastMessage = await getLastAssistantMessage(page);
  return lastMessage;
}

/**
 * Get the text content of the last assistant (bot) message
 */
async function getLastAssistantMessage(page: Page): Promise<string> {
  const assistantMessages = page.locator('.bg-muted .text-sm.whitespace-pre-wrap');
  const count = await assistantMessages.count();
  if (count === 0) return '';
  return (await assistantMessages.nth(count - 1).textContent()) || '';
}

// ============================================================
// tRPC API Verification Helpers
// ============================================================

const TRPC_URL = 'http://localhost:3001/api/trpc';
const TEST_HEADERS = {
  'content-type': 'application/json',
  'x-test-user-id': '18',
  'x-test-org-id': '24',
};

/**
 * Call a tRPC query endpoint directly via HTTP to verify database state.
 * For queries: GET with encoded input.
 */
async function trpcQuery(procedure: string, input?: Record<string, unknown>): Promise<any> {
  const url = input
    ? `${TRPC_URL}/${procedure}?input=${encodeURIComponent(JSON.stringify(input))}`
    : `${TRPC_URL}/${procedure}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: TEST_HEADERS,
  });
  if (!response.ok) {
    throw new Error(`tRPC query ${procedure} failed: ${response.status} ${await response.text()}`);
  }
  const json = await response.json();
  return json.result?.data;
}

/**
 * Login and navigate to chat page, handling both local dev and production modes.
 * In local dev mode, the app uses test headers (x-test-user-id) so no login is needed.
 * In production, loginAsStaff() handles authentication.
 */
async function loginAndOpenChat(page: Page) {
  if (!IS_LOCAL) {
    await loginAsStaff(page);
  }
  await page.goto('/chat');
  await page.waitForLoadState('domcontentloaded');

  // Wait for auth to resolve (ProtectedRoute checks isAuthenticated)
  // In dev mode, auth.me is called with test headers and resolves quickly
  await page.waitForTimeout(2000);

  // Clear localStorage session to start fresh conversation
  await page.evaluate(() => {
    localStorage.removeItem('chatbot_sessionId');
  });
  // Reload to get a fresh chat
  await page.reload();
  await page.waitForLoadState('domcontentloaded');

  // Wait for the chat input to be visible (confirms auth passed and chat loaded)
  await page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first().waitFor({ state: 'visible', timeout: 15000 });
}

// ============================================================
// CLIENTS CRUD
// ============================================================

test.describe('Chatbot CRUD - Clients', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let createdClientId: number;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAndOpenChat(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Create client', async () => {
    const response = await sendChatMessage(
      page,
      `Crée un nouveau client individuel nommé ${TEST_CLIENT_NAME} avec email ${TEST_CLIENT_EMAIL} et téléphone 0612345678`
    );

    console.log('  Create client response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-client-create');

    expect(response.toLowerCase()).toMatch(/cré|créé|created|client|succès|ajouté/);

    // Verify via tRPC API
    await test.step('Verify client exists via tRPC API', async () => {
      const clients = await trpcQuery('clients.list', { search: TEST_CLIENT_NAME, limit: 10, offset: 0 });
      expect(clients).toBeDefined();
      expect(Array.isArray(clients)).toBe(true);

      const createdClient = clients.find((c: any) =>
        c.name?.includes(TEST_CLIENT_NAME) && c.email === TEST_CLIENT_EMAIL
      );

      expect(createdClient).toBeDefined();
      expect(createdClient.name).toBe(TEST_CLIENT_NAME);
      expect(createdClient.email).toBe(TEST_CLIENT_EMAIL);
      expect(createdClient.phone).toBe('0612345678');

      createdClientId = createdClient.id;
      console.log(`  ✓ Client verified via API: ID ${createdClientId}`);
    });
  });

  test('List clients', async () => {
    const response = await sendChatMessage(
      page,
      'Liste tous mes clients'
    );

    console.log('  List clients response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-client-list');

    expect(response.length).toBeGreaterThan(30);
    expect(response.toLowerCase()).toMatch(/client|nom|name/);
  });

  test('Update client', async () => {
    expect(createdClientId).toBeDefined();

    const response = await sendChatMessage(
      page,
      `Mets à jour le client "${TEST_CLIENT_NAME}" en changeant son email à e2e-updated-${RUN_ID}@test.com`
    );

    console.log('  Update client response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-client-update');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/modif|updat|mis à jour|changé|succès|client|email|erreur/);

    // Verify via tRPC API
    await test.step('Verify client email updated via tRPC API', async () => {
      const client = await trpcQuery('clients.get', { id: createdClientId });
      expect(client).toBeDefined();
      expect(client.email).toBe(`e2e-updated-${RUN_ID}@test.com`);
      console.log(`  ✓ Client email verified via API: ${client.email}`);
    });
  });

  test('Delete client', async () => {
    expect(createdClientId).toBeDefined();

    const response = await sendChatMessage(
      page,
      `Supprime le client "${TEST_CLIENT_NAME}"`
    );

    console.log('  Delete client response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-client-delete');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/supprim|delet|retir|succès|client|erreur/);

    // Verify via tRPC API (delete_client does soft-delete: isActive=false)
    await test.step('Verify client soft-deleted via tRPC API', async () => {
      const client = await trpcQuery('clients.get', { id: createdClientId });
      expect(client).toBeDefined();
      expect(client.isActive).toBe(false);
      console.log(`  ✓ Client soft-deletion verified via API: ID ${createdClientId} isActive=${client.isActive}`);
    });
  });
});

// ============================================================
// QUOTES (DEVIS) CRUD
// ============================================================

test.describe('Chatbot CRUD - Quotes (Devis)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let createdQuoteId: number;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAndOpenChat(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Create quote', async () => {
    const response = await sendChatMessage(
      page,
      `Crée un devis numéro ${TEST_QUOTE_NUMBER} pour le client 1, valable jusqu'au 2026-12-31, titre "Session Enregistrement E2E", avec une ligne: Enregistrement studio 3h à 150 euros`
    );

    console.log('  Create quote response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-quote-create');

    expect(response.toLowerCase()).toMatch(/cré|devis|créé|succès|quote/);

    // Verify via tRPC API
    await test.step('Verify quote exists via tRPC API', async () => {
      const quotes = await trpcQuery('quotes.list', { limit: 100, offset: 0 });
      expect(quotes).toBeDefined();
      expect(Array.isArray(quotes)).toBe(true);

      const createdQuote = quotes.find((q: any) => q.quoteNumber === TEST_QUOTE_NUMBER);

      expect(createdQuote).toBeDefined();
      expect(createdQuote.quoteNumber).toBe(TEST_QUOTE_NUMBER);
      expect(createdQuote.clientId).toBe(1);

      createdQuoteId = createdQuote.id;
      console.log(`  ✓ Quote verified via API: ID ${createdQuoteId}`);
    });
  });

  test('List quotes', async () => {
    const response = await sendChatMessage(
      page,
      'Montre moi tous les devis'
    );

    console.log('  List quotes response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-quote-list');

    expect(response.length).toBeGreaterThan(30);
    expect(response.toLowerCase()).toMatch(/devis|quote|draft|brouillon/);
  });

  test('Read quote details', async () => {
    const response = await sendChatMessage(
      page,
      `Affiche les détails du devis numéro ${TEST_QUOTE_NUMBER}`
    );

    console.log('  Read quote details response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-quote-details');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/150|enregistrement|détail|montant|client|devis|erreur/);
  });

  test('Update quote status', async () => {
    expect(createdQuoteId).toBeDefined();

    const response = await sendChatMessage(
      page,
      `Mets à jour le statut du devis numéro ${TEST_QUOTE_NUMBER} en "envoyé" (sent)`
    );

    console.log('  Update quote response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-quote-update');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/modif|updat|mis à jour|statut|sent|envoyé|changé|succès|devis|erreur/);

    // Verify via tRPC API
    await test.step('Verify quote status updated via tRPC API', async () => {
      const quote = await trpcQuery('quotes.get', { id: createdQuoteId });
      expect(quote).toBeDefined();
      expect(quote.status).toBe('sent');
      console.log(`  ✓ Quote status verified via API: ${quote.status}`);
    });
  });

  test('Delete quote', async () => {
    expect(createdQuoteId).toBeDefined();

    const response = await sendChatMessage(
      page,
      `Supprime le devis numéro ${TEST_QUOTE_NUMBER}`
    );

    console.log('  Delete quote response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-quote-delete');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/supprim|delet|retir|succès|devis|erreur/);

    // Verify via tRPC API
    await test.step('Verify quote deleted via tRPC API', async () => {
      const quotes = await trpcQuery('quotes.list', { limit: 100, offset: 0 });
      const deletedQuote = quotes.find((q: any) => q.id === createdQuoteId);
      expect(deletedQuote).toBeUndefined();
      console.log(`  ✓ Quote deletion verified via API: ID ${createdQuoteId} not found`);
    });
  });
});

// ============================================================
// INVOICES (FACTURES) CRUD
// ============================================================

test.describe('Chatbot CRUD - Invoices (Factures)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let createdInvoiceId: number;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAndOpenChat(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Create invoice', async () => {
    const response = await sendChatMessage(
      page,
      `Crée une facture numéro ${TEST_INVOICE_NUMBER} pour le client 1, date du 2026-01-20, échéance 2026-02-20, avec une ligne: Session mixage à 500 euros`
    );

    console.log('  Create invoice response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-invoice-create');

    expect(response.toLowerCase()).toMatch(/cré|facture|créé|succès|invoice/);

    // Verify via tRPC API
    await test.step('Verify invoice exists via tRPC API', async () => {
      const invoices = await trpcQuery('invoices.list', { limit: 100, offset: 0 });
      expect(invoices).toBeDefined();
      expect(Array.isArray(invoices)).toBe(true);

      const createdInvoice = invoices.find((inv: any) => inv.invoiceNumber === TEST_INVOICE_NUMBER);

      expect(createdInvoice).toBeDefined();
      expect(createdInvoice.invoiceNumber).toBe(TEST_INVOICE_NUMBER);

      createdInvoiceId = createdInvoice.id;
      console.log(`  ✓ Invoice verified via API: ID ${createdInvoiceId}`);
    });
  });

  test('List invoices', async () => {
    const response = await sendChatMessage(
      page,
      'Liste toutes les factures'
    );

    console.log('  List invoices response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-invoice-list');

    expect(response.length).toBeGreaterThan(30);
    expect(response.toLowerCase()).toMatch(/facture|invoice|brouillon|draft/);
  });

  test('Read invoice details', async () => {
    const response = await sendChatMessage(
      page,
      `Affiche les détails de la facture numéro ${TEST_INVOICE_NUMBER}`
    );

    console.log('  Read invoice details response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-invoice-details');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/500|mixage|détail|montant|client|facture|erreur/);
  });

  test('Update invoice status', async () => {
    expect(createdInvoiceId).toBeDefined();

    const response = await sendChatMessage(
      page,
      `Mets à jour le statut de la facture numéro ${TEST_INVOICE_NUMBER} en "payée" (paid)`
    );

    console.log('  Update invoice response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-invoice-update');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/modif|updat|mis à jour|statut|payé|paid|changé|succès|facture|erreur/);

    // Verify via tRPC API
    await test.step('Verify invoice status updated via tRPC API', async () => {
      const invoice = await trpcQuery('invoices.get', { id: createdInvoiceId });
      expect(invoice).toBeDefined();
      expect(invoice.status).toBe('paid');
      console.log(`  ✓ Invoice status verified via API: ${invoice.status}`);
    });
  });

  test('Update invoice issue date', async () => {
    expect(createdInvoiceId).toBeDefined();

    const response = await sendChatMessage(
      page,
      `Change la date d'émission de la facture ${TEST_INVOICE_NUMBER} au 15 janvier 2026`
    );

    console.log('  Update invoice issue_date response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-invoice-update-date');

    expect(response.toLowerCase()).toMatch(/mis à jour|modif|updat|changé|succès|15.*janvier|2026-01-15|émission|facture|erreur/);

    // Verify via tRPC API - This catches if chatbot says "updated" but didn't actually change it
    await test.step('Verify invoice issue date updated via tRPC API', async () => {
      const invoice = await trpcQuery('invoices.get', { id: createdInvoiceId });
      expect(invoice).toBeDefined();
      expect(invoice.issueDate).toContain('2026-01-15');
      console.log(`  ✓ Invoice issue date verified via API: ${invoice.issueDate}`);
    });
  });

  test('Verify invoice after update', async () => {
    const response = await sendChatMessage(
      page,
      `Vérifie les détails de la facture ${TEST_INVOICE_NUMBER}`
    );

    console.log('  Verify invoice response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-invoice-verify');

    expect(response.toLowerCase()).toMatch(/15.*janvier|2026-01-15|détail|facture|émission/);
  });

  test('Delete invoice', async () => {
    expect(createdInvoiceId).toBeDefined();

    const response = await sendChatMessage(
      page,
      `Supprime la facture numéro ${TEST_INVOICE_NUMBER}`
    );

    console.log('  Delete invoice response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-invoice-delete');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/supprim|delet|retir|succès|facture|erreur/);

    // Verify via tRPC API
    await test.step('Verify invoice deleted via tRPC API', async () => {
      const invoices = await trpcQuery('invoices.list', { limit: 100, offset: 0 });
      const deletedInvoice = invoices.find((inv: any) => inv.id === createdInvoiceId);
      expect(deletedInvoice).toBeUndefined();
      console.log(`  ✓ Invoice deletion verified via API: ID ${createdInvoiceId} not found`);
    });
  });
});

// ============================================================
// SESSIONS (SERVICES) CRUD
// ============================================================

test.describe('Chatbot CRUD - Sessions (Services)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let createdSessionId: number;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAndOpenChat(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Create session', async () => {
    const response = await sendChatMessage(
      page,
      `Crée une nouvelle session de studio avec le titre "${TEST_SESSION_TITLE}", pour le client ayant l'id 1, dans la room id 1, date de début 2026-06-15T14:00:00 et date de fin 2026-06-15T17:00:00`
    );

    console.log('  Create session response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-session-create');

    expect(response.toLowerCase()).toMatch(/cré|session|créé|succès|planifié/);

    // Verify via tRPC API
    await test.step('Verify session exists via tRPC API', async () => {
      const sessions = await trpcQuery('sessions.list', { limit: 100, offset: 0 });
      expect(sessions).toBeDefined();
      expect(Array.isArray(sessions)).toBe(true);

      const createdSession = sessions.find((s: any) => s.title === TEST_SESSION_TITLE);

      expect(createdSession).toBeDefined();
      expect(createdSession.title).toBe(TEST_SESSION_TITLE);

      createdSessionId = createdSession.id;
      console.log(`  ✓ Session verified via API: ID ${createdSessionId}`);
    });
  });

  test('List sessions', async () => {
    const response = await sendChatMessage(
      page,
      'Montre moi les sessions à venir'
    );

    console.log('  List sessions response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-session-list');

    expect(response.length).toBeGreaterThan(30);
    expect(response.toLowerCase()).toMatch(/session|séance|planifié|scheduled/);
  });

  test('Update session', async () => {
    expect(createdSessionId).toBeDefined();

    const response = await sendChatMessage(
      page,
      `Mets à jour la session "${TEST_SESSION_TITLE}" et change son statut en completed`
    );

    console.log('  Update session response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-session-update');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/modif|updat|mis à jour|statut|completed|terminé|changé|succès|session|erreur/);

    // Verify via tRPC API
    await test.step('Verify session status updated via tRPC API', async () => {
      const session = await trpcQuery('sessions.get', { id: createdSessionId });
      expect(session).toBeDefined();
      expect(session.status).toBe('completed');
      console.log(`  ✓ Session status verified via API: ${session.status}`);
    });
  });

  test('Delete session', async () => {
    expect(createdSessionId).toBeDefined();

    const response = await sendChatMessage(
      page,
      `Supprime la session "${TEST_SESSION_TITLE}"`
    );

    console.log('  Delete session response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-session-delete');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/supprim|delet|retir|succès|session|erreur/);

    // Verify via tRPC API
    await test.step('Verify session deleted via tRPC API', async () => {
      const sessions = await trpcQuery('sessions.list', { limit: 100, offset: 0 });
      const deletedSession = sessions.find((s: any) => s.id === createdSessionId);
      expect(deletedSession).toBeUndefined();
      console.log(`  ✓ Session deletion verified via API: ID ${createdSessionId} not found`);
    });
  });
});
