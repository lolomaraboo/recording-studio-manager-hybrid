import { test, expect } from '@playwright/test';

/**
 * Phase 3.10-01: Test Formulaire Création Client Enrichi
 * Tests automatisés pour validation vCard 4.0
 */

test.describe('Clients Enrichis vCard 4.0', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Login with existing test credentials
    await page.fill('input[type="email"], input[name="email"], #email', 'test@studio.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect away from login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  });

  test('should display 4 tabs in client creation form', async ({ page }) => {
    // Navigate to client creation page
    await page.goto('/clients/new');

    // Wait for the form to load (use domcontentloaded instead of networkidle due to SSE)
    await page.waitForLoadState('domcontentloaded');

    // Verify 4 tabs are visible
    const tabs = page.locator('[role="tablist"] [role="tab"]');
    await expect(tabs).toHaveCount(4);

    // Verify tab labels
    await expect(tabs.nth(0)).toContainText('Identité');
    await expect(tabs.nth(1)).toContainText('Contact');
    await expect(tabs.nth(2)).toContainText('Adresse');
    await expect(tabs.nth(3)).toContainText(/Info/i);
  });

  test('should create individual client with structured name', async ({ page }) => {
    await page.goto('/clients/new');
    await page.waitForLoadState('domcontentloaded');

    // Select Individual type (should be default)
    const individualToggle = page.locator('text=Individual');
    await individualToggle.click();

    // Fill structured name fields in Identité tab
    await page.fill('input[name="prefix"]', 'M.');
    await page.fill('input[name="firstName"]', 'Jean');
    await page.fill('input[name="middleName"]', 'Paul');
    await page.fill('input[name="lastName"]', 'Dupont');
    await page.fill('input[name="suffix"]', 'Jr.');
    await page.fill('input[name="artistName"]', 'JP le Rappeur');

    // Click Contact tab
    await page.click('text=Contact');
    await page.waitForTimeout(500);

    // Add phone
    const addPhoneButton = page.locator('button:has-text("Ajouter un téléphone")').first();
    await addPhoneButton.click();
    await page.selectOption('select[name*="type"]', 'mobile');
    await page.fill('input[name*="number"]', '+33 6 12 34 56 78');

    // Add email
    const addEmailButton = page.locator('button:has-text("Ajouter un email")').first();
    await addEmailButton.click();
    await page.selectOption('select[name*="emailType"]', 'personnel');
    await page.fill('input[name*="email"]', 'jean.dupont@gmail.com');

    // Create client
    await page.click('button:has-text("Créer le client")');

    // Wait for navigation to client detail page
    await page.waitForURL('**/clients/*', { timeout: 10000 });

    // Verify success notification
    await expect(page.locator('text=Client créé avec succès')).toBeVisible({ timeout: 5000 });

    // Verify client name is displayed
    await expect(page.locator('h1, h2').filter({ hasText: /Jean.*Dupont/i })).toBeVisible();
  });

  test('should create minimal client (backward compatibility)', async ({ page }) => {
    await page.goto('/clients/new');
    await page.waitForLoadState('domcontentloaded');

    // Fill only the name field
    await page.fill('input[name="name"]', 'Client Minimal Test');

    // Submit without filling other fields
    await page.click('button:has-text("Créer le client")');

    // Should navigate to client detail without errors
    await page.waitForURL('**/clients/*', { timeout: 10000 });

    // Verify client was created
    await expect(page.locator('text=Client créé avec succès')).toBeVisible({ timeout: 5000 });
  });

  test('should display enriched client information', async ({ page }) => {
    // First create a client with enriched data
    await page.goto('/clients/new');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Enriched');

    // Navigate to Contact tab
    await page.click('text=Contact');
    await page.waitForTimeout(500);

    // Add contact info
    const addPhoneButton = page.locator('button:has-text("Ajouter")').first();
    await addPhoneButton.click();
    await page.fill('input[type="tel"]', '+33 7 11 22 33 44');

    await page.click('button:has-text("Créer le client")');
    await page.waitForURL('**/clients/*', { timeout: 10000 });

    // Click on "Informations enrichies" tab
    const enrichedTab = page.locator('text=Informations enrichies');
    if (await enrichedTab.isVisible()) {
      await enrichedTab.click();

      // Verify enriched data is displayed
      await expect(page.locator('text=Test')).toBeVisible();
      await expect(page.locator('text=Enriched')).toBeVisible();
      await expect(page.locator('text=+33 7 11 22 33 44')).toBeVisible();
    }
  });

  test('should switch between tabs correctly', async ({ page }) => {
    await page.goto('/clients/new');
    await page.waitForLoadState('domcontentloaded');

    // Test tab switching
    const tabs = ['Identité', 'Contact', 'Adresse'];

    for (const tabName of tabs) {
      await page.click(`text=${tabName}`);
      await page.waitForTimeout(300);

      // Verify tab is active (has selected or active class)
      const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
      await expect(tab).toHaveAttribute('data-state', 'active');
    }
  });
});
