import { test, expect } from '@playwright/test';

/**
 * Quick Task 013: Invoice Edit E2E Test (localhost)
 *
 * Tests the invoice modification flow against localhost:5174.
 * Creates an invoice first, then navigates to its detail page,
 * enters edit mode, modifies line item fields, saves, and verifies
 * the update persisted (toast + exit edit mode + data on page).
 *
 * In dev mode, the tRPC client automatically adds test headers
 * (x-test-user-id: 18, x-test-org-id: 24) so no login is needed.
 *
 * Run: BASE_URL=http://localhost:5174 npx playwright test e2e/crud/invoices-edit-local.spec.ts --headed
 */

test.describe('Invoice Edit (localhost)', () => {

  test('should create an invoice, edit its line item, and verify changes persist', async ({ page }) => {
    // ========================================
    // STEP 1: Create an invoice to edit
    // ========================================

    await page.goto('/invoices/new');

    // Wait for the invoice form to appear
    await expect(page.locator('h1')).toContainText('Nouvelle Facture', { timeout: 15000 });

    // Select a client via shadcn Select
    const clientTrigger = page.locator('#clientId');
    await expect(clientTrigger).toBeVisible({ timeout: 10000 });
    await clientTrigger.click();

    const clientOption = page.locator('[role="option"]').first();
    await clientOption.waitFor({ state: 'visible', timeout: 10000 });
    await clientOption.click();

    // Fill invoice number (unique per run)
    const invoiceNumber = `INV-EDIT-${Date.now()}`;
    await page.locator('#invoiceNumber').fill(invoiceNumber);

    // Fill issue date
    const today = new Date().toISOString().split('T')[0];
    await page.locator('#issueDate').fill(today);

    // Fill line item description (autocomplete popover input)
    const descriptionInput = page.locator('[placeholder="Tapez pour rechercher..."]').first();
    await descriptionInput.fill('Session originale');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Fill quantity
    const quantityInput = page.locator('input[type="number"][step="0.01"]').first();
    await quantityInput.clear();
    await quantityInput.fill('1');

    // Fill unit price
    const unitPriceInput = page.locator('input[type="number"][step="0.01"]').nth(1);
    await unitPriceInput.clear();
    await unitPriceInput.fill('100');

    // Submit the form
    const submitButton = page.getByRole('button', { name: /Cr.er la facture/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Wait for navigation to invoice detail page
    await expect(page).toHaveURL(/\/invoices\/\d+/, { timeout: 15000 });

    // ========================================
    // STEP 2: Enter edit mode
    // ========================================

    // Wait for "Modifier" button (confirms detail page loaded and we are in read mode)
    const editButton = page.getByRole('button', { name: /Modifier/i });
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await editButton.click();

    // Wait for "Enregistrer" button (confirms edit mode is active)
    const saveButton = page.getByRole('button', { name: /Enregistrer/i });
    await expect(saveButton).toBeVisible({ timeout: 10000 });

    // ========================================
    // STEP 3: Modify the line item
    // ========================================

    // In edit mode, description is in the popover input
    const editDescriptionInput = page.locator('[placeholder="Tapez pour rechercher..."]').first();
    await editDescriptionInput.clear();
    await editDescriptionInput.fill('Session modifiee E2E');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Modify quantity (first number input in edit items table)
    const editQuantityInput = page.locator('input[type="number"][step="0.01"]').first();
    await editQuantityInput.clear();
    await editQuantityInput.fill('3');

    // Modify unit price (second number input in edit items table)
    const editUnitPriceInput = page.locator('input[type="number"][step="0.01"]').nth(1);
    await editUnitPriceInput.clear();
    await editUnitPriceInput.fill('200');

    // Verify amount auto-calculated (3 * 200 = 600.00)
    const amountInput = page.locator('input[readonly]').first();
    await expect(amountInput).toHaveValue('600.00', { timeout: 5000 });

    // ========================================
    // STEP 4: Save changes
    // ========================================

    await saveButton.click();

    // Wait for success toast: "Facture mise a jour" (with accent in actual text)
    // Use filter to target specifically the update toast (creation toast may still be visible)
    const successToast = page.locator('[data-sonner-toast][data-type="success"]').filter({ hasText: /mise . jour/i });
    await expect(successToast).toBeVisible({ timeout: 10000 });

    // Wait for "Modifier" button to reappear (confirms exit from edit mode)
    await expect(editButton).toBeVisible({ timeout: 10000 });

    // ========================================
    // STEP 5: Verify changes persisted
    // ========================================

    // Verify the updated description is visible on the page
    await expect(page.locator('body')).toContainText('Session modifiee E2E', { timeout: 10000 });

    // Verify the updated amount is visible (600.00 in some format)
    await expect(page.locator('body')).toContainText(/600[.,]00/, { timeout: 5000 });
  });

});
