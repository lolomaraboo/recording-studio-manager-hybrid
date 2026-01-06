import { test, expect } from '@playwright/test';

/**
 * Phase 10-03: Quotes Management E2E Tests
 * Tests the complete quote lifecycle: create → send → accept → convert to project
 */

test.describe('Quotes Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Login with existing test credentials (from global-setup.ts)
    await page.fill('input[type="email"], input[name="email"], #email', 'e2e-test-user@example.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'E2ETestPass123!');
    await page.click('button[type="submit"]');

    // Wait for redirect away from login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  });

  test('complete quote lifecycle: create → send → accept → convert to project', async ({ page }) => {
    // Navigate to quotes page
    await page.goto('/quotes');
    await page.waitForLoadState('domcontentloaded');

    // Click "New Quote" button
    await page.click('button:has-text("New Quote"), a:has-text("Create Quote")');
    await page.waitForLoadState('domcontentloaded');

    // Wait for client selector
    await page.waitForSelector('select[name="clientId"], [data-testid="client-select"]', { timeout: 5000 });

    // Select first client (assumes test data exists)
    const clientSelect = page.locator('select[name="clientId"]').first();
    const firstClientValue = await clientSelect.locator('option').nth(1).getAttribute('value');
    if (firstClientValue) {
      await clientSelect.selectOption(firstClientValue);
    }

    // Fill quote details
    await page.fill('input[name="validityDays"]', '30');
    await page.fill('textarea[name="notes"]', 'Test quote for E2E validation');
    await page.fill('textarea[name="terms"]', 'Payment due within 15 days of acceptance');

    // Add first item
    await page.fill('input[name="items[0].description"]', 'Recording Session (4 hours)');
    await page.fill('input[name="items[0].quantity"]', '4');
    await page.fill('input[name="items[0].unitPrice"]', '75');

    // Add second item
    await page.click('button:has-text("Add Item")');
    await page.fill('input[name="items[1].description"]', 'Mixing Service');
    await page.fill('input[name="items[1].quantity"]', '1');
    await page.fill('input[name="items[1].unitPrice"]', '200');

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Quote")');

    // Wait for navigation to quote detail page
    await page.waitForURL('**/quotes/*', { timeout: 10000 });

    // Verify quote was created
    await expect(page.locator('text=Quote created successfully')).toBeVisible({ timeout: 5000 });

    // Verify quote status is "draft"
    await expect(page.locator('text=Draft, text=draft').first()).toBeVisible();

    // Verify quote number format (Q-YYYY-NNNN)
    const quoteNumber = await page.locator('[data-testid="quote-number"], h1:has-text("Q-")').first().textContent();
    expect(quoteNumber).toMatch(/Q-\d{4}-\d{4}/);

    // Verify totals
    await expect(page.locator('text=€300.00')).toBeVisible(); // First item total
    await expect(page.locator('text=€200.00')).toBeVisible(); // Second item total
    await expect(page.locator('text=€600.00')).toBeVisible(); // Grand total (500 + 20% tax)

    // STEP 2: Send quote (draft → sent)
    await page.click('button:has-text("Send Quote")');

    // Confirm send action if modal appears
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Send")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    await page.waitForTimeout(1000);

    // Verify status changed to "sent"
    await expect(page.locator('text=Sent, text=sent').first()).toBeVisible({ timeout: 5000 });

    // Verify expiration date is shown
    await expect(page.locator('text=Valid Until, text=Expires')).toBeVisible();

    // STEP 3: Accept quote (sent → accepted)
    await page.click('button:has-text("Accept Quote")');

    // Confirm accept if modal appears
    const acceptConfirm = page.locator('button:has-text("Confirm"), button:has-text("Accept")');
    if (await acceptConfirm.isVisible({ timeout: 2000 })) {
      await acceptConfirm.click();
    }

    await page.waitForTimeout(1000);

    // Verify status changed to "accepted"
    await expect(page.locator('text=Accepted, text=accepted').first()).toBeVisible({ timeout: 5000 });

    // STEP 4: Convert to project
    await page.click('button:has-text("Convert to Project")');

    // Confirm conversion if modal appears
    const convertConfirm = page.locator('button:has-text("Confirm"), button:has-text("Convert")');
    if (await convertConfirm.isVisible({ timeout: 2000 })) {
      await convertConfirm.click();
    }

    await page.waitForTimeout(1000);

    // Verify status changed to "converted_to_project"
    await expect(page.locator('text=Converted, text=converted').first()).toBeVisible({ timeout: 5000 });

    // Verify link to project is shown
    await expect(page.locator('a:has-text("View Project")').first()).toBeVisible();

    // STEP 5: Verify project was created
    const projectLink = page.locator('a:has-text("View Project")').first();
    await projectLink.click();

    await page.waitForURL('**/projects/*', { timeout: 10000 });

    // Verify project details
    await expect(page.locator('h1, h2').filter({ hasText: new RegExp(quoteNumber || 'Q-') })).toBeVisible();
    await expect(page.locator('text=€600.00')).toBeVisible(); // Budget should match quote total
    await expect(page.locator('text=Pre Production, text=pre_production').first()).toBeVisible();
  });

  test('state machine validation: prevent invalid transitions', async ({ page }) => {
    // Navigate to quotes list
    await page.goto('/quotes');
    await page.waitForLoadState('domcontentloaded');

    // Create a draft quote (similar to above but abbreviated)
    await page.click('button:has-text("New Quote"), a:has-text("Create Quote")');
    await page.waitForLoadState('domcontentloaded');

    const clientSelect = page.locator('select[name="clientId"]').first();
    const firstClientValue = await clientSelect.locator('option').nth(1).getAttribute('value');
    if (firstClientValue) {
      await clientSelect.selectOption(firstClientValue);
    }

    await page.fill('input[name="items[0].description"]', 'Test Item');
    await page.fill('input[name="items[0].quantity"]', '1');
    await page.fill('input[name="items[0].unitPrice"]', '100');

    await page.click('button[type="submit"]:has-text("Create Quote")');
    await page.waitForURL('**/quotes/*', { timeout: 10000 });

    // Verify quote is in draft status
    await expect(page.locator('text=Draft, text=draft').first()).toBeVisible();

    // Try to accept draft quote directly (should fail or button shouldn't exist)
    const acceptButton = page.locator('button:has-text("Accept Quote")');
    await expect(acceptButton).not.toBeVisible(); // Button shouldn't exist for draft quotes

    // Try to convert draft quote (should also fail or button shouldn't exist)
    const convertButton = page.locator('button:has-text("Convert to Project")');
    await expect(convertButton).not.toBeVisible(); // Button shouldn't exist for draft quotes
  });

  test('PDF generation', async ({ page }) => {
    // Navigate to quotes list
    await page.goto('/quotes');
    await page.waitForLoadState('domcontentloaded');

    // Find first quote in list or create one
    const firstQuote = page.locator('[data-testid="quote-row"], tr').first();

    // If no quotes exist, skip or create one
    if (await firstQuote.isVisible({ timeout: 2000 })) {
      await firstQuote.click();
    } else {
      // Create a minimal quote for PDF testing
      await page.click('button:has-text("New Quote"), a:has-text("Create Quote")');
      await page.waitForLoadState('domcontentloaded');

      const clientSelect = page.locator('select[name="clientId"]').first();
      const firstClientValue = await clientSelect.locator('option').nth(1).getAttribute('value');
      if (firstClientValue) {
        await clientSelect.selectOption(firstClientValue);
      }

      await page.fill('input[name="items[0].description"]', 'PDF Test Item');
      await page.fill('input[name="items[0].quantity"]', '1');
      await page.fill('input[name="items[0].unitPrice"]', '100');

      await page.click('button[type="submit"]:has-text("Create Quote")');
      await page.waitForURL('**/quotes/*', { timeout: 10000 });
    }

    // Look for PDF download/preview button
    const pdfButton = page.locator('button:has-text("Download PDF"), button:has-text("View PDF"), a:has-text("PDF")').first();

    if (await pdfButton.isVisible({ timeout: 3000 })) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      // Click PDF button
      await pdfButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify filename matches pattern
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/quote-Q-\d{4}-\d{4}\.pdf/);

      // Verify file is downloaded
      const path = await download.path();
      expect(path).toBeTruthy();
    } else {
      // If PDF button doesn't exist yet (Phase 11 UI), mark as pending
      test.skip();
    }
  });
});
