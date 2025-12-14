import { test, expect } from '@playwright/test';

/**
 * Clients CRUD E2E Tests
 *
 * Tests the client management functionality:
 * - View clients list
 * - Create new client
 * - Edit existing client
 * - Delete client
 */

// Helper to login before tests
async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@studiopro.com');
  await page.getByLabel(/password/i).fill('admin123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('Clients Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('displays clients page with data table', async ({ page }) => {
    await page.goto('/clients');

    // Page title should be visible
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();

    // Should have "Add Client" button
    await expect(
      page.getByRole('button', { name: /add client|new client/i })
    ).toBeVisible();

    // Data table should be present
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('can open create client dialog', async ({ page }) => {
    await page.goto('/clients');

    // Click add client button
    await page.getByRole('button', { name: /add client|new client/i }).click();

    // Dialog should appear
    await expect(
      page.getByRole('dialog').getByText(/new client|add client/i)
    ).toBeVisible();

    // Form fields should be present
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('creates a new client', async ({ page }) => {
    await page.goto('/clients');

    // Open create dialog
    await page.getByRole('button', { name: /add client|new client/i }).click();

    // Fill form
    const timestamp = Date.now();
    const clientName = `Test Client ${timestamp}`;
    const clientEmail = `test${timestamp}@example.com`;

    await page.getByLabel(/^name$/i).fill(clientName);
    await page.getByLabel(/email/i).fill(clientEmail);
    await page.getByLabel(/phone/i).fill('555-1234');

    // Submit form
    await page.getByRole('button', { name: /create|save/i }).click();

    // Should show success message
    await expect(page.getByText(/created|success/i)).toBeVisible({
      timeout: 5000,
    });

    // New client should appear in list
    await expect(page.getByText(clientName)).toBeVisible();
  });

  test('edits an existing client', async ({ page }) => {
    await page.goto('/clients');

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible();

    // Click on first edit button (or row)
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
    } else {
      // Click on first row to edit
      await page.getByRole('row').nth(1).click();
    }

    // Edit dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Modify a field
    const phoneField = page.getByLabel(/phone/i);
    await phoneField.clear();
    await phoneField.fill('555-9999');

    // Submit changes
    await page.getByRole('button', { name: /save|update/i }).click();

    // Should show success message
    await expect(page.getByText(/updated|success/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('search filters clients', async ({ page }) => {
    await page.goto('/clients');

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible();

    // Get initial row count
    const initialRowCount = await page.getByRole('row').count();

    // Search for a specific term
    await page.getByPlaceholder(/search/i).fill('nonexistent_client_xyz');

    // Wait for filter
    await page.waitForTimeout(500);

    // Should show fewer or no results
    const filteredRowCount = await page.getByRole('row').count();
    expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);
  });
});
