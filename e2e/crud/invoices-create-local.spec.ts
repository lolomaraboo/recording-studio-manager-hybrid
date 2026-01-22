import { test, expect } from '@playwright/test';

/**
 * Quick Task 009: Invoice Creation E2E Test (localhost)
 *
 * Tests the invoice creation flow against localhost:5174.
 * In dev mode, the tRPC client automatically adds test headers
 * (x-test-user-id: 18, x-test-org-id: 24) so no login is needed.
 *
 * The auth.me query returns successfully with dev headers,
 * so ProtectedRoute allows access without login.
 *
 * Run: BASE_URL=http://localhost:5174 npx playwright test e2e/crud/invoices-create-local.spec.ts --headed
 */

test.describe('Invoice Creation (localhost)', () => {

  test('should create an invoice with client selection and line item', async ({ page }) => {
    // Navigate directly to invoice creation page
    // Dev mode bypasses auth via test headers in tRPC client
    await page.goto('/invoices/new');

    // Wait for the invoice form to appear (don't use networkidle - SSE/WebSocket keeps it busy)
    await expect(page.locator('h1')).toContainText('Nouvelle Facture', { timeout: 15000 });

    // Step 1: Select a client using shadcn Select component
    // The client Select has id="clientId" on the SelectTrigger
    const clientTrigger = page.locator('#clientId');
    await expect(clientTrigger).toBeVisible({ timeout: 10000 });
    await clientTrigger.click();

    // Wait for the select content to appear and pick the first client option
    const clientOption = page.locator('[role="option"]').first();
    await clientOption.waitFor({ state: 'visible', timeout: 10000 });
    await clientOption.click();

    // Step 2: Fill in the invoice number (unique per run)
    const invoiceNumber = `INV-E2E-${Date.now()}`;
    await page.locator('#invoiceNumber').fill(invoiceNumber);

    // Step 3: Fill in the issue date (YYYY-MM-DD format for type="date" input)
    const today = new Date().toISOString().split('T')[0];
    await page.locator('#issueDate').fill(today);

    // Step 4: Fill in the first line item
    // Description input has autocomplete (Popover+Command) with placeholder "Tapez pour rechercher..."
    // The Input is wrapped in a div inside PopoverTrigger
    const descriptionInput = page.locator('[placeholder="Tapez pour rechercher..."]').first();
    await descriptionInput.fill('Enregistrement studio 2h');
    // Dismiss autocomplete popover if it appeared
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Quantity input (type=number, step=0.01) - first number input in line item
    const quantityInput = page.locator('input[type="number"][step="0.01"]').first();
    await quantityInput.clear();
    await quantityInput.fill('2');

    // Unit price input - second number input in line item
    const unitPriceInput = page.locator('input[type="number"][step="0.01"]').nth(1);
    await unitPriceInput.clear();
    await unitPriceInput.fill('150');

    // Verify amount was auto-calculated (2 * 150 = 300.00)
    const amountInput = page.locator('input[readonly]').first();
    await expect(amountInput).toHaveValue('300.00');

    // Step 5: Submit the form
    const submitButton = page.getByRole('button', { name: /Cr.er la facture/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Step 6: Wait for mutation to complete
    await page.waitForTimeout(2000);

    // Check if we got an error toast
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    const hasError = await errorToast.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorToast.textContent();
      throw new Error(`Form submission failed with error: ${errorText}`);
    }

    // Wait for URL to change to /invoices/{id} (detail page, NOT list)
    await expect(page).toHaveURL(/\/invoices\/\d+/, { timeout: 15000 });

    // Verify detail page loaded - check for invoice content
    await expect(page.locator('body')).toContainText(invoiceNumber, { timeout: 10000 });
  });

});
