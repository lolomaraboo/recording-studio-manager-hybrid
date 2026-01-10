import { test, expect } from '@playwright/test';

test.describe('Client Portal - Invoices', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to client portal login
    await page.goto('http://localhost:5174/client-portal/login');
  });

  test('should display invoices list page', async ({ page }) => {
    // Login (assuming magic link or existing auth)
    // For now, check if invoices menu item exists after navigation
    await page.goto('http://localhost:5174/client-portal');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check if Invoices menu item is visible
    const invoicesLink = page.locator('a[href="/client-portal/invoices"]');
    await expect(invoicesLink).toBeVisible();

    // Click on Invoices
    await invoicesLink.click();

    // Wait for navigation
    await page.waitForURL('**/client-portal/invoices');

    // Check page title
    const pageTitle = page.locator('h1:has-text("My Invoices")');
    await expect(pageTitle).toBeVisible();

    // Check if FileText icon is present
    const icon = page.locator('svg.lucide-file-text').first();
    await expect(icon).toBeVisible();

    // Check if card with "All Invoices" title exists
    const cardTitle = page.locator('h3:has-text("All Invoices")');
    await expect(cardTitle).toBeVisible();
  });

  test('should display invoice detail page', async ({ page }) => {
    // Navigate directly to invoices list
    await page.goto('http://localhost:5174/client-portal/invoices');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check if there are invoices
    const invoicesList = page.locator('[class*="divide-y"] > div');
    const count = await invoicesList.count();

    if (count > 0) {
      // Click on first invoice
      await invoicesList.first().click();

      // Wait for navigation to detail page
      await page.waitForURL('**/client-portal/invoices/*');

      // Check page elements
      const backButton = page.locator('button:has(svg.lucide-arrow-left)');
      await expect(backButton).toBeVisible();

      // Check invoice number in title
      const invoiceTitle = page.locator('h1[class*="text-2xl"]');
      await expect(invoiceTitle).toContainText('Invoice #');

      // Check if status badge is visible
      const statusBadge = page.locator('[class*="badge"]').first();
      await expect(statusBadge).toBeVisible();

      // Check if "Invoice Details" card exists
      const detailsCard = page.locator('h3:has-text("Invoice Details")');
      await expect(detailsCard).toBeVisible();

      // Check if "Line Items" card exists
      const lineItemsCard = page.locator('h3:has-text("Line Items")');
      await expect(lineItemsCard).toBeVisible();

      // Check if Download PDF button exists
      const downloadButton = page.locator('button:has-text("Download PDF")');
      await expect(downloadButton).toBeVisible();

      // Check if Pay Now button exists (depends on invoice status)
      const payButton = page.locator('button:has-text("Pay Now")');
      const isPayButtonVisible = await payButton.isVisible().catch(() => false);

      console.log(`Pay Now button visible: ${isPayButtonVisible}`);
    } else {
      console.log('No invoices found to test detail page');
    }
  });

  test('should have correct status badge colors', async ({ page }) => {
    await page.goto('http://localhost:5174/client-portal/invoices');
    await page.waitForTimeout(2000);

    // Check if any badges exist
    const badges = page.locator('[class*="badge"]');
    const badgeCount = await badges.count();

    console.log(`Found ${badgeCount} status badges`);

    if (badgeCount > 0) {
      // Check first badge has one of the expected variants
      const firstBadge = badges.first();
      const badgeClasses = await firstBadge.getAttribute('class');

      console.log(`Badge classes: ${badgeClasses}`);

      // Badges should have variant classes (success, default, destructive, warning, secondary)
      const hasValidVariant =
        badgeClasses?.includes('success') ||
        badgeClasses?.includes('default') ||
        badgeClasses?.includes('destructive') ||
        badgeClasses?.includes('warning') ||
        badgeClasses?.includes('secondary');

      expect(hasValidVariant).toBeTruthy();
    }
  });

  test('should navigate back from detail to list', async ({ page }) => {
    await page.goto('http://localhost:5174/client-portal/invoices');
    await page.waitForTimeout(2000);

    const invoicesList = page.locator('[class*="divide-y"] > div');
    const count = await invoicesList.count();

    if (count > 0) {
      // Click on first invoice
      await invoicesList.first().click();
      await page.waitForURL('**/client-portal/invoices/*');

      // Click back button
      const backButton = page.locator('button:has(svg.lucide-arrow-left)');
      await backButton.click();

      // Should be back on list page
      await page.waitForURL('**/client-portal/invoices');

      const pageTitle = page.locator('h1:has-text("My Invoices")');
      await expect(pageTitle).toBeVisible();
    }
  });

  test('should display responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:5174/client-portal/invoices');
    await page.waitForTimeout(2000);

    // Check if page is visible
    const pageTitle = page.locator('h1:has-text("My Invoices")');
    await expect(pageTitle).toBeVisible();

    // Check if card adapts to mobile width
    const card = page.locator('[class*="card"]').first();
    const cardBox = await card.boundingBox();

    if (cardBox) {
      // Card should fit within mobile viewport (allowing some padding)
      expect(cardBox.width).toBeLessThanOrEqual(375);
    }
  });
});
