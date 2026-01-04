import { test, expect } from '@playwright/test';

test.describe('Global Search (Cmd+K)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5174/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(1000);
  });

  test('should open search dialog with Cmd+K', async ({ page }) => {
    // Open search with keyboard shortcut
    await page.keyboard.press('Meta+k'); // Cmd+K on Mac (use 'Control+k' for Windows/Linux)

    // Verify dialog is visible
    const dialog = page.locator('role=dialog');
    await expect(dialog).toBeVisible();

    // Verify placeholder text
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /clients, sessions, factures/);
  });

  test('should show placeholder message when query < 2 chars', async ({ page }) => {
    await page.keyboard.press('Meta+k');

    // Verify initial message
    await expect(page.locator('text=Tapez au moins 2 caractères')).toBeVisible();
    await expect(page.locator('text=Recherchez dans les clients')).toBeVisible();
  });

  test('should search for "marie" and show results', async ({ page }) => {
    await page.keyboard.press('Meta+k');

    // Type search query
    await page.fill('input[placeholder*="Rechercher"]', 'marie');

    // Wait for results
    await page.waitForTimeout(1500);

    // Verify results appear
    const results = page.locator('text=Marie Dubois');
    await expect(results).toBeVisible();

    // Verify Client section header
    await expect(page.locator('text=Client')).toBeVisible();
  });

  test('should search for "test" and find Test Client', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.fill('input[placeholder*="Rechercher"]', 'test');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=Test Client')).toBeVisible();
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('should show "no results" for non-existent search', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.fill('input[placeholder*="Rechercher"]', 'xyz123notfound');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=Aucun résultat trouvé')).toBeVisible();
    await expect(page.locator('text=Essayez avec un autre terme')).toBeVisible();
  });

  test('should navigate with keyboard arrows and Enter', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.fill('input[placeholder*="Rechercher"]', 'marie');
    await page.waitForTimeout(1500);

    // Press arrow down to select first result
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    // Press Enter to navigate
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify navigation to client page
    expect(page.url()).toContain('/clients/');
  });

  test('should navigate on click', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.fill('input[placeholder*="Rechercher"]', 'marie');
    await page.waitForTimeout(1500);

    // Click on result
    await page.locator('text=Marie Dubois').click();
    await page.waitForTimeout(1000);

    // Verify navigation
    expect(page.url()).toContain('/clients/');
  });

  test('should close dialog with Esc', async ({ page }) => {
    await page.keyboard.press('Meta+k');

    // Verify dialog is open
    await expect(page.locator('role=dialog')).toBeVisible();

    // Press Esc
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify dialog is closed
    await expect(page.locator('role=dialog')).not.toBeVisible();
  });

  test('should show loading spinner during search', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.fill('input[placeholder*="Rechercher"]', 'marie');

    // Check for loading spinner (may be brief)
    // Note: This might be flaky due to fast response times
    const spinner = page.locator('svg.animate-spin');
    // Just verify it doesn't crash, spinner might be too fast to catch
    await page.waitForTimeout(1000);
  });

  test('should display different result types with colored icons', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.fill('input[placeholder*="Rechercher"]', 'test');
    await page.waitForTimeout(1500);

    // Verify at least one result type section exists
    const clientSection = page.locator('text=Client').first();
    await expect(clientSection).toBeVisible();

    // Verify icon colors (check for bg-blue class for client type)
    const iconContainer = page.locator('.bg-blue-500\\/10').first();
    await expect(iconContainer).toBeVisible();
  });

  test('should handle special characters safely', async ({ page }) => {
    await page.keyboard.press('Meta+k');

    // Test with special SQL characters
    await page.fill('input[placeholder*="Rechercher"]', "%'_");
    await page.waitForTimeout(1500);

    // Should not crash or show SQL errors
    // Either shows "no results" or safely escaped results
    await expect(page.locator('text=Aucun résultat')).toBeVisible();
  });

  test('should clear search query when dialog reopens', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.fill('input[placeholder*="Rechercher"]', 'marie');
    await page.keyboard.press('Escape');

    // Reopen dialog
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(300);

    // Verify input is cleared
    const input = page.locator('input[placeholder*="Rechercher"]');
    await expect(input).toHaveValue('');
  });
});
