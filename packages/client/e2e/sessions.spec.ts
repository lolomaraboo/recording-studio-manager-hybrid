import { test, expect } from '@playwright/test';

/**
 * Sessions CRUD E2E Tests
 *
 * Tests the recording session management:
 * - View sessions list
 * - Create new session
 * - Edit session
 * - View session details
 */

async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@studiopro.com');
  await page.getByLabel(/password/i).fill('admin123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('Sessions Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('displays sessions page', async ({ page }) => {
    await page.goto('/sessions');

    // Page should load
    await expect(page.getByRole('heading', { name: /sessions/i })).toBeVisible();

    // Should have create button
    await expect(
      page.getByRole('button', { name: /new session|add session|book/i })
    ).toBeVisible();
  });

  test('can open create session dialog', async ({ page }) => {
    await page.goto('/sessions');

    // Click create button
    await page
      .getByRole('button', { name: /new session|add session|book/i })
      .click();

    // Dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Form fields should be present
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/client/i)).toBeVisible();
  });

  test('creates a new session', async ({ page }) => {
    await page.goto('/sessions');

    // Open create dialog
    await page
      .getByRole('button', { name: /new session|add session|book/i })
      .click();

    // Fill form
    const timestamp = Date.now();
    const sessionTitle = `Recording Session ${timestamp}`;

    await page.getByLabel(/title/i).fill(sessionTitle);

    // Select a client (first one available)
    const clientSelect = page.getByLabel(/client/i);
    await clientSelect.click();
    await page.getByRole('option').first().click();

    // Select a room (first one available)
    const roomSelect = page.getByLabel(/room/i);
    if (await roomSelect.isVisible()) {
      await roomSelect.click();
      await page.getByRole('option').first().click();
    }

    // Set start time
    const startTimeInput = page.getByLabel(/start/i);
    if (await startTimeInput.isVisible()) {
      await startTimeInput.fill('2025-12-20T10:00');
    }

    // Set end time
    const endTimeInput = page.getByLabel(/end/i);
    if (await endTimeInput.isVisible()) {
      await endTimeInput.fill('2025-12-20T12:00');
    }

    // Submit
    await page.getByRole('button', { name: /create|save|book/i }).click();

    // Should show success
    await expect(page.getByText(/created|success|booked/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('displays session stats cards', async ({ page }) => {
    await page.goto('/sessions');

    // Stats cards should be visible
    await expect(page.getByText(/scheduled|upcoming/i).first()).toBeVisible();
    await expect(page.getByText(/completed|total/i).first()).toBeVisible();
  });
});
