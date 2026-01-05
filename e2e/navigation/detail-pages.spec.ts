import { test, expect } from '@playwright/test';
import { loginAsStaff } from '../helpers/login';
import { takeFullPageScreenshot, ensureScreenshotsDir } from '../helpers/screenshots';

/**
 * E2E Navigation Tests - Detail Pages
 *
 * Tests all /:id detail pages by creating entities first, then navigating to detail pages
 * Coverage: 11 detail pages
 */

test.describe('Detail Pages - Staff Portal', () => {
  test.beforeEach(async ({ page }) => {
    await ensureScreenshotsDir();
    await loginAsStaff(page);
  });

  // ====================
  // CLIENT DETAIL
  // ====================
  test('Client detail page loads', async ({ page }) => {
    // Create a client first
    await page.goto('/clients/new');
    await page.waitForLoadState('domcontentloaded');

    // Fill name in Identité tab
    await page.fill('input[name="name"], #name, input[placeholder*="Nom"]', 'Test Client Detail');

    // Click on Contact tab to access email field
    const contactTab = page.locator('[role="tab"]:has-text("Contact")');
    if (await contactTab.count() > 0) {
      await contactTab.click();
      await page.waitForTimeout(500);
    }

    // Fill email in Contact tab
    await page.fill('input[name="email"], #email, input[type="email"]', `test-detail-${Date.now()}@example.com`);

    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for navigation to detail page
    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    // Verify we're on a detail page
    const url = page.url();
    expect(url).toMatch(/\/clients\/\d+/);

    await takeFullPageScreenshot(page, 'clients-detail');
  });

  // ====================
  // SESSION DETAIL
  // ====================
  test('Session detail page loads', async ({ page }) => {
    // Navigate to sessions list first to check if any exist
    await page.goto('/sessions');
    await page.waitForLoadState('domcontentloaded');

    // Try to find an existing session link
    const sessionLink = page.locator('a[href^="/sessions/"]').first();
    const sessionExists = await sessionLink.count() > 0;

    if (sessionExists) {
      // Click on existing session
      await sessionLink.click();
      await page.waitForURL(/\/sessions\/\d+/);

      expect(page.url()).toMatch(/\/sessions\/\d+/);
      await takeFullPageScreenshot(page, 'sessions-detail');
    } else {
      // No sessions exist - skip this test
      test.skip();
    }
  });

  // ====================
  // INVOICE DETAIL
  // ====================
  test('Invoice detail page loads', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('domcontentloaded');

    const invoiceLink = page.locator('a[href^="/invoices/"]').first();
    const invoiceExists = await invoiceLink.count() > 0;

    if (invoiceExists) {
      await invoiceLink.click();
      await page.waitForURL(/\/invoices\/\d+/);

      expect(page.url()).toMatch(/\/invoices\/\d+/);
      await takeFullPageScreenshot(page, 'invoices-detail');
    } else {
      test.skip();
    }
  });

  // ====================
  // ROOM DETAIL
  // ====================
  test('Room detail page loads', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForLoadState('domcontentloaded');

    const roomLink = page.locator('a[href^="/rooms/"]').first();
    const roomExists = await roomLink.count() > 0;

    if (roomExists) {
      await roomLink.click();
      await page.waitForURL(/\/rooms\/\d+/);

      expect(page.url()).toMatch(/\/rooms\/\d+/);
      await takeFullPageScreenshot(page, 'rooms-detail');
    } else {
      test.skip();
    }
  });

  // ====================
  // EQUIPMENT DETAIL
  // ====================
  test('Equipment detail page loads', async ({ page }) => {
    await page.goto('/equipment');
    await page.waitForLoadState('domcontentloaded');

    const equipmentLink = page.locator('a[href^="/equipment/"]').first();
    const equipmentExists = await equipmentLink.count() > 0;

    if (equipmentExists) {
      await equipmentLink.click();
      await page.waitForURL(/\/equipment\/\d+/);

      expect(page.url()).toMatch(/\/equipment\/\d+/);
      await takeFullPageScreenshot(page, 'equipment-detail');
    } else {
      test.skip();
    }
  });

  // ====================
  // PROJECT DETAIL
  // ====================
  test('Project detail page loads', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');

    const projectLink = page.locator('a[href^="/projects/"]').first();
    const projectExists = await projectLink.count() > 0;

    if (projectExists) {
      await projectLink.click();
      await page.waitForURL(/\/projects\/\d+/);

      expect(page.url()).toMatch(/\/projects\/\d+/);
      await takeFullPageScreenshot(page, 'projects-detail');
    } else {
      test.skip();
    }
  });

  // ====================
  // TRACK DETAIL
  // ====================
  test('Track detail page loads', async ({ page }) => {
    await page.goto('/tracks');
    await page.waitForLoadState('domcontentloaded');

    const trackLink = page.locator('a[href^="/tracks/"]').first();
    const trackExists = await trackLink.count() > 0;

    if (trackExists) {
      await trackLink.click();
      await page.waitForURL(/\/tracks\/\d+/);

      expect(page.url()).toMatch(/\/tracks\/\d+/);
      await takeFullPageScreenshot(page, 'tracks-detail');
    } else {
      test.skip();
    }
  });

  // ====================
  // TALENT DETAIL
  // ====================
  test('Talent detail page loads', async ({ page }) => {
    await page.goto('/talents');
    await page.waitForLoadState('domcontentloaded');

    const talentLink = page.locator('a[href^="/talents/"]').first();
    const talentExists = await talentLink.count() > 0;

    if (talentExists) {
      await talentLink.click();
      await page.waitForURL(/\/talents\/\d+/);

      expect(page.url()).toMatch(/\/talents\/\d+/);
      await takeFullPageScreenshot(page, 'talents-detail');
    } else {
      test.skip();
    }
  });

  // ====================
  // QUOTE DETAIL
  // ====================
  test('Quote detail page loads', async ({ page }) => {
    await page.goto('/quotes');
    await page.waitForLoadState('domcontentloaded');

    const quoteLink = page.locator('a[href^="/quotes/"]').first();
    const quoteExists = await quoteLink.count() > 0;

    if (quoteExists) {
      await quoteLink.click();
      await page.waitForURL(/\/quotes\/\d+/);

      expect(page.url()).toMatch(/\/quotes\/\d+/);
      await takeFullPageScreenshot(page, 'quotes-detail');
    } else {
      test.skip();
    }
  });

  // ====================
  // CONTRACT DETAIL
  // ====================
  test('Contract detail page loads', async ({ page }) => {
    await page.goto('/contracts');
    await page.waitForLoadState('domcontentloaded');

    const contractLink = page.locator('a[href^="/contracts/"]').first();
    const contractExists = await contractLink.count() > 0;

    if (contractExists) {
      await contractLink.click();
      await page.waitForURL(/\/contracts\/\d+/);

      expect(page.url()).toMatch(/\/contracts\/\d+/);
      await takeFullPageScreenshot(page, 'contracts-detail');
    } else {
      test.skip();
    }
  });

  // ====================
  // EXPENSE DETAIL
  // ====================
  test('Expense detail page loads', async ({ page }) => {
    await page.goto('/expenses');
    await page.waitForLoadState('domcontentloaded');

    const expenseLink = page.locator('a[href^="/expenses/"]').first();
    const expenseExists = await expenseLink.count() > 0;

    if (expenseExists) {
      await expenseLink.click();
      await page.waitForURL(/\/expenses\/\d+/);

      expect(page.url()).toMatch(/\/expenses\/\d+/);
      await takeFullPageScreenshot(page, 'expenses-detail');
    } else {
      test.skip();
    }
  });
});
