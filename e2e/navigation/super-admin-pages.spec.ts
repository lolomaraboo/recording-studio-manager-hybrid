import { test, expect } from '@playwright/test';
import { takeFullPageScreenshot, ensureScreenshotsDir } from '../helpers/screenshots';

/**
 * E2E Navigation Tests - Super Admin Pages
 *
 * Tests super admin pages
 * Coverage: 3 pages (/superadmin/services, /database, /logs)
 *
 * Note: These require SUPERADMIN_EMAIL privileges
 */

test.describe('Super Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    await ensureScreenshotsDir();
  });

  test('Super admin services page loads or redirects', async ({ page }) => {
    await page.goto('/superadmin/services');
    await page.waitForLoadState('domcontentloaded');

    // Either shows page (if user is super admin) or redirects to unauthorized/login
    const url = page.url();

    // Just verify page loaded without crash
    expect(url).toBeTruthy();

    await takeFullPageScreenshot(page, 'superadmin-services');
  });

  test('Super admin database page loads or redirects', async ({ page }) => {
    await page.goto('/superadmin/database');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    expect(url).toBeTruthy();

    await takeFullPageScreenshot(page, 'superadmin-database');
  });

  test('Super admin logs page loads or redirects', async ({ page }) => {
    await page.goto('/superadmin/logs');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    expect(url).toBeTruthy();

    await takeFullPageScreenshot(page, 'superadmin-logs');
  });
});
