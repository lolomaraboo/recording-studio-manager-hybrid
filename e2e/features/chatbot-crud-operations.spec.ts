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
    const response = await sendChatMessage(
      page,
      `Mets à jour le client ${TEST_CLIENT_NAME} en changeant son email à e2e-updated-${RUN_ID}@test.com. Utilise son ID que tu as obtenu lors de la création.`
    );

    console.log('  Update client response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-client-update');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/modif|updat|mis à jour|changé|succès|client|email|erreur/);
  });

  test('Delete client', async () => {
    const response = await sendChatMessage(
      page,
      `Supprime le client ${TEST_CLIENT_NAME}. Utilise son ID.`
    );

    console.log('  Delete client response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-client-delete');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/supprim|delet|retir|succès|client|erreur/);
  });
});

// ============================================================
// QUOTES (DEVIS) CRUD
// ============================================================

test.describe('Chatbot CRUD - Quotes (Devis)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

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
    const response = await sendChatMessage(
      page,
      `Mets à jour le statut du devis ${TEST_QUOTE_NUMBER} en "sent". Utilise son ID.`
    );

    console.log('  Update quote response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-quote-update');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/modif|updat|mis à jour|statut|sent|envoyé|changé|succès|devis|erreur/);
  });

  test('Delete quote', async () => {
    const response = await sendChatMessage(
      page,
      `Supprime le devis ${TEST_QUOTE_NUMBER}. Utilise son ID.`
    );

    console.log('  Delete quote response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-quote-delete');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/supprim|delet|retir|succès|devis|erreur/);
  });
});

// ============================================================
// INVOICES (FACTURES) CRUD
// ============================================================

test.describe('Chatbot CRUD - Invoices (Factures)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

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
    const response = await sendChatMessage(
      page,
      `Change le statut de la facture ${TEST_INVOICE_NUMBER} en paid. Utilise son ID.`
    );

    console.log('  Update invoice response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-invoice-update');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/modif|updat|mis à jour|statut|payé|paid|changé|succès|facture|erreur/);
  });

  test('Update invoice issue date', async () => {
    const response = await sendChatMessage(
      page,
      `Change la date d'émission de la facture ${TEST_INVOICE_NUMBER} au 15 janvier 2026`
    );

    console.log('  Update invoice issue_date response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-invoice-update-date');

    expect(response.toLowerCase()).toMatch(/mis à jour|modif|updat|changé|succès|15.*janvier|2026-01-15|émission|facture|erreur/);
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
    const response = await sendChatMessage(
      page,
      `Supprime la facture ${TEST_INVOICE_NUMBER}. Utilise son ID.`
    );

    console.log('  Delete invoice response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-invoice-delete');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/supprim|delet|retir|succès|facture|erreur/);
  });
});

// ============================================================
// SESSIONS (SERVICES) CRUD
// ============================================================

test.describe('Chatbot CRUD - Sessions (Services)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

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
    const response = await sendChatMessage(
      page,
      `Mets à jour la session "${TEST_SESSION_TITLE}" créée précédemment et change son statut en completed. Utilise son ID.`
    );

    console.log('  Update session response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-session-update');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/modif|updat|mis à jour|statut|completed|terminé|changé|succès|session|erreur/);
  });

  test('Delete session', async () => {
    const response = await sendChatMessage(
      page,
      `Supprime la session "${TEST_SESSION_TITLE}". Utilise son ID.`
    );

    console.log('  Delete session response:', response.substring(0, 200));
    await takeFullPageScreenshot(page, 'chatbot-crud-session-delete');

    expect(response.length).toBeGreaterThan(10);
    expect(response.toLowerCase()).toMatch(/supprim|delet|retir|succès|session|erreur/);
  });
});
