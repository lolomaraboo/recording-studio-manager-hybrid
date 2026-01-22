import { test, expect } from '@playwright/test';

/**
 * Quick Task 003: Quote Creation E2E Test (localhost)
 *
 * Tests the quote creation flow against localhost:5174.
 * In dev mode, the tRPC client automatically adds test headers
 * (x-test-user-id: 18, x-test-org-id: 24) so no login is needed.
 *
 * The auth.me query returns successfully with dev headers,
 * so ProtectedRoute allows access without login.
 *
 * Run: BASE_URL=http://localhost:5174 npx playwright test e2e/crud/quotes-create-local.spec.ts --headed
 */

test.describe('Quote Creation (localhost)', () => {

  test('should create a quote with client selection and line item', async ({ page }) => {
    // Navigate directly to quotes creation page
    // Dev mode bypasses auth via test headers in tRPC client
    await page.goto('/quotes/new');

    // Wait for the quote form to appear (don't use networkidle - SSE/WebSocket keeps it busy)
    await expect(page.locator('h1')).toContainText('Nouveau Devis', { timeout: 15000 });

    // Step 1: Select a client using shadcn Select component
    // The client Select has id="clientId" on the SelectTrigger
    const clientTrigger = page.locator('#clientId');
    // Wait for clients to load (placeholder text changes when data arrives)
    await expect(clientTrigger).toBeVisible({ timeout: 10000 });
    await clientTrigger.click();

    // Wait for the select content to appear and pick the first client option
    const clientOption = page.locator('[role="option"]').first();
    await clientOption.waitFor({ state: 'visible', timeout: 10000 });
    await clientOption.click();

    // Step 2: Fill in the title
    await page.locator('#title').fill('Test Devis E2E - Session Studio');

    // Step 3: Fill in the first line item
    // Description input is wrapped in PopoverTrigger (asChild), which sets type="button"
    // We need to use nativeInputValueSetter to trigger React's onChange properly
    const descriptionInput = page.locator('[placeholder="Tapez pour rechercher..."]').first();

    // Set value using native setter and dispatch input event for React controlled component
    await descriptionInput.evaluate((el) => {
      // Change type to text so it accepts value
      el.setAttribute('type', 'text');
      // Use native setter to bypass React's controlled component
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )!.set!;
      nativeInputValueSetter.call(el, 'Enregistrement studio 4h');
      // Dispatch input event that React listens to
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Wait for autocomplete debounce and dismiss popover if open
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Quantity input (type=number, step=0.01) - first number input in line item
    const quantityInput = page.locator('input[type="number"][step="0.01"]').first();
    await quantityInput.clear();
    await quantityInput.fill('4');

    // Unit price input - second number input in line item
    const unitPriceInput = page.locator('input[type="number"][step="0.01"]').nth(1);
    await unitPriceInput.clear();
    await unitPriceInput.fill('75');

    // Verify amount was auto-calculated (4 * 75 = 300.00)
    const amountInput = page.locator('input[readonly]').first();
    await expect(amountInput).toHaveValue('300.00');

    // Step 4: Submit the form
    const submitButton = page.getByRole('button', { name: /Cr.er le devis/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Step 5: Wait for either success toast OR error toast OR URL change
    // The mutation onSuccess: toast.success("Devis cree avec succes") + navigate("/quotes")
    // The mutation onError: toast.error(...)
    // Give some time for the mutation to complete
    await page.waitForTimeout(2000);

    // Check if we got an error toast
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    const hasError = await errorToast.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorToast.textContent();
      throw new Error(`Form submission failed with error: ${errorText}`);
    }

    // Wait for URL to change to /quotes (client-side navigation)
    await expect(page).toHaveURL(/\/quotes$/, { timeout: 15000 });

    // Verify the page shows the quotes list heading (it's h2 with an icon)
    await expect(page.locator('h2').filter({ hasText: 'Devis' })).toBeVisible({ timeout: 10000 });

    // Verify at least one quote exists in the list (from this or previous runs)
    await expect(page.locator('td').filter({ hasText: /Q-\d{4}-\d{4}/ }).first()).toBeVisible({ timeout: 5000 });
  });

});
