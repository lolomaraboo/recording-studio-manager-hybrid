import { test, expect } from '@playwright/test';

/**
 * Projects E2E Tests
 *
 * Tests the music project management:
 * - View projects list with pipeline view
 * - Create new project
 * - View project details
 * - Navigate between list and detail
 */

async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@studiopro.com');
  await page.getByLabel(/password/i).fill('admin123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('Projects Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('displays projects page with pipeline view', async ({ page }) => {
    await page.goto('/projects');

    // Page should load
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();

    // Pipeline status columns should be visible
    await expect(page.getByText(/pre-production/i)).toBeVisible();
    await expect(page.getByText(/recording/i)).toBeVisible();
    await expect(page.getByText(/mixing/i)).toBeVisible();
  });

  test('can switch between pipeline and table view', async ({ page }) => {
    await page.goto('/projects');

    // Should have view toggle
    const tableViewButton = page.getByRole('button', { name: /table|list/i });
    if (await tableViewButton.isVisible()) {
      await tableViewButton.click();

      // Table should be visible
      await expect(page.getByRole('table')).toBeVisible();
    }
  });

  test('can open create project dialog', async ({ page }) => {
    await page.goto('/projects');

    // Click create button
    await page
      .getByRole('button', { name: /new project|add project/i })
      .click();

    // Dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Form fields should be present
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/client/i)).toBeVisible();
    await expect(page.getByLabel(/type/i)).toBeVisible();
  });

  test('creates a new project', async ({ page }) => {
    await page.goto('/projects');

    // Open create dialog
    await page
      .getByRole('button', { name: /new project|add project/i })
      .click();

    // Fill form
    const timestamp = Date.now();
    const projectName = `Test Album ${timestamp}`;

    await page.getByLabel(/project name|name/i).first().fill(projectName);

    // Select a client
    const clientSelect = page.getByLabel(/client/i);
    await clientSelect.click();
    await page.getByRole('option').first().click();

    // Select type (should default to Album)
    const typeSelect = page.getByLabel(/type/i);
    await typeSelect.click();
    await page.getByRole('option', { name: /album/i }).click();

    // Select genre
    const genreSelect = page.getByLabel(/genre/i);
    if (await genreSelect.isVisible()) {
      await genreSelect.click();
      await page.getByRole('option', { name: /rock|pop/i }).first().click();
    }

    // Submit
    await page.getByRole('button', { name: /create/i }).click();

    // Should show success
    await expect(page.getByText(/created|success/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('navigates to project detail page', async ({ page }) => {
    await page.goto('/projects');

    // Wait for projects to load
    await page.waitForTimeout(1000);

    // Click on a project (view button or row)
    const viewButton = page.getByRole('button', { name: /view/i }).first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
    } else {
      // Click on first project in table/list
      await page.getByRole('row').nth(1).click();
    }

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/projects\/\d+/);

    // Detail page should show tabs
    await expect(page.getByRole('tab', { name: /tracks/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /files/i })).toBeVisible();
  });

  test('project detail page shows tabs', async ({ page }) => {
    // Navigate to a project detail (assuming at least one exists)
    await page.goto('/projects');
    await page.waitForTimeout(1000);

    const viewButton = page.getByRole('button', { name: /view/i }).first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await expect(page).toHaveURL(/\/projects\/\d+/);

      // Check tabs
      await expect(page.getByRole('tab', { name: /tracks/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /files/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /credits/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /details/i })).toBeVisible();

      // Click on files tab
      await page.getByRole('tab', { name: /files/i }).click();

      // File upload area should be visible
      await expect(page.getByText(/drag.*drop|upload/i)).toBeVisible();
    }
  });
});
