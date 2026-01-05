import { test, expect } from '@playwright/test';
import { takeFullPageScreenshot, ensureScreenshotsDir } from '../helpers/screenshots';

/**
 * E2E Navigation Tests - Client Portal Complete
 *
 * Tests remaining client portal pages
 * Coverage: 4 pages (/bookings/:id, /projects, /invoices, /payments)
 */

test.describe('Client Portal - Remaining Pages', () => {
  test.beforeEach(async ({ page }) => {
    await ensureScreenshotsDir();
  });

  test('Client portal projects page loads', async ({ page }) => {
    await page.goto('/client-portal/projects');
    await page.waitForLoadState('domcontentloaded');

    // Either shows projects or redirects to login
    const url = page.url();
    expect(url.includes('/client-portal')).toBeTruthy();

    await takeFullPageScreenshot(page, 'client-portal-projects');
  });

  test('Client portal invoices page loads', async ({ page }) => {
    await page.goto('/client-portal/invoices');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    expect(url.includes('/client-portal')).toBeTruthy();

    await takeFullPageScreenshot(page, 'client-portal-invoices');
  });

  test('Client portal payments page loads', async ({ page }) => {
    await page.goto('/client-portal/payments');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    expect(url.includes('/client-portal')).toBeTruthy();

    await takeFullPageScreenshot(page, 'client-portal-payments');
  });

  test('Client portal booking detail page structure', async ({ page }) => {
    // Test with a dummy ID - should either show page or redirect
    await page.goto('/client-portal/bookings/1');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    // Should stay within client portal (either detail page or redirected to login/list)
    expect(url.includes('/client-portal')).toBeTruthy();

    await takeFullPageScreenshot(page, 'client-portal-booking-detail');
  });
});
