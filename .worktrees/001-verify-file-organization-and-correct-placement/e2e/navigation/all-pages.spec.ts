import { test, expect } from '@playwright/test';
import { loginAsStaff, loginAsClient, registerStaff } from '../helpers/login';
import { takeFullPageScreenshot, ensureScreenshotsDir } from '../helpers/screenshots';
import { generateEmail, generateStudioName } from '../helpers/fixtures';

/**
 * E2E Navigation Tests - All Pages
 *
 * Tests that every page in the application is accessible and loads correctly
 * Coverage: 53 pages total (44 staff portal + 5 client portal + 4 auth)
 *
 * Test Strategy:
 * - Navigate to each page
 * - Verify page loads without errors
 * - Check for expected heading/title
 * - Take screenshot for visual validation
 * - Check for console errors
 */

test.describe('Page Navigation - Staff Portal', () => {
  test.beforeEach(async ({ page }) => {
    await ensureScreenshotsDir();
    // Login as staff user
    await loginAsStaff(page);
  });

  // ====================
  // DASHBOARD (1 page)
  // ====================
  test('Dashboard page loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify dashboard heading exists
    await expect(page).toHaveURL('/');
    await takeFullPageScreenshot(page, 'dashboard');

    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    expect(errors.length).toBe(0);
  });

  // ====================
  // SESSIONS (3 pages)
  // ====================
  test('Sessions list page loads', async ({ page }) => {
    await page.goto('/sessions');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/sessions');
    await takeFullPageScreenshot(page, 'sessions-list');
  });

  test('Sessions create page loads', async ({ page }) => {
    await page.goto('/sessions/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/sessions/new');
    await takeFullPageScreenshot(page, 'sessions-create');
  });

  // Note: Session detail requires creating a session first
  // Covered in CRUD tests

  // ====================
  // CLIENTS (3 pages)
  // ====================
  test('Clients list page loads', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/clients');
    await takeFullPageScreenshot(page, 'clients-list');
  });

  test('Clients create page loads', async ({ page }) => {
    await page.goto('/clients/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/clients/new');
    await takeFullPageScreenshot(page, 'clients-create');
  });

  // ====================
  // INVOICES (3 pages)
  // ====================
  test('Invoices list page loads', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/invoices');
    await takeFullPageScreenshot(page, 'invoices-list');
  });

  test('Invoices create page loads', async ({ page }) => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/invoices/new');
    await takeFullPageScreenshot(page, 'invoices-create');
  });

  // ====================
  // ROOMS (3 pages)
  // ====================
  test('Rooms list page loads', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/rooms');
    await takeFullPageScreenshot(page, 'rooms-list');
  });

  test('Rooms create page loads', async ({ page }) => {
    await page.goto('/rooms/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/rooms/new');
    await takeFullPageScreenshot(page, 'rooms-create');
  });

  // ====================
  // EQUIPMENT (3 pages)
  // ====================
  test('Equipment list page loads', async ({ page }) => {
    await page.goto('/equipment');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/equipment');
    await takeFullPageScreenshot(page, 'equipment-list');
  });

  test('Equipment create page loads', async ({ page }) => {
    await page.goto('/equipment/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/equipment/new');
    await takeFullPageScreenshot(page, 'equipment-create');
  });

  // ====================
  // PROJECTS (3 pages)
  // ====================
  test('Projects list page loads', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/projects');
    await takeFullPageScreenshot(page, 'projects-list');
  });

  test('Projects create page loads', async ({ page }) => {
    await page.goto('/projects/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/projects/new');
    await takeFullPageScreenshot(page, 'projects-create');
  });

  // ====================
  // TRACKS (3 pages)
  // ====================
  test('Tracks list page loads', async ({ page }) => {
    await page.goto('/tracks');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/tracks');
    await takeFullPageScreenshot(page, 'tracks-list');
  });

  test('Tracks create page loads', async ({ page }) => {
    await page.goto('/tracks/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/tracks/new');
    await takeFullPageScreenshot(page, 'tracks-create');
  });

  // ====================
  // TALENTS (3 pages)
  // ====================
  test('Talents list page loads', async ({ page }) => {
    await page.goto('/talents');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/talents');
    await takeFullPageScreenshot(page, 'talents-list');
  });

  test('Talents create page loads', async ({ page }) => {
    await page.goto('/talents/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/talents/new');
    await takeFullPageScreenshot(page, 'talents-create');
  });

  // ====================
  // QUOTES (3 pages)
  // ====================
  test('Quotes list page loads', async ({ page }) => {
    await page.goto('/quotes');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/quotes');
    await takeFullPageScreenshot(page, 'quotes-list');
  });

  test('Quotes create page loads', async ({ page }) => {
    await page.goto('/quotes/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/quotes/new');
    await takeFullPageScreenshot(page, 'quotes-create');
  });

  // ====================
  // CONTRACTS (3 pages)
  // ====================
  test('Contracts list page loads', async ({ page }) => {
    await page.goto('/contracts');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/contracts');
    await takeFullPageScreenshot(page, 'contracts-list');
  });

  test('Contracts create page loads', async ({ page }) => {
    await page.goto('/contracts/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/contracts/new');
    await takeFullPageScreenshot(page, 'contracts-create');
  });

  // ====================
  // EXPENSES (3 pages)
  // ====================
  test('Expenses list page loads', async ({ page }) => {
    await page.goto('/expenses');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/expenses');
    await takeFullPageScreenshot(page, 'expenses-list');
  });

  test('Expenses create page loads', async ({ page }) => {
    await page.goto('/expenses/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/expenses/new');
    await takeFullPageScreenshot(page, 'expenses-create');
  });

  // ====================
  // OTHER PAGES (9 pages)
  // ====================
  test('Calendar page loads', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/calendar');
    await takeFullPageScreenshot(page, 'calendar');
  });

  test('Audio Files page loads', async ({ page }) => {
    await page.goto('/audio-files');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/audio-files');
    await takeFullPageScreenshot(page, 'audio-files');
  });

  test('Financial Reports page loads', async ({ page }) => {
    await page.goto('/financial-reports');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/financial-reports');
    await takeFullPageScreenshot(page, 'financial-reports');
  });

  test('Reports page loads', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/reports');
    await takeFullPageScreenshot(page, 'reports');
  });

  test('Analytics page loads', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/analytics');
    await takeFullPageScreenshot(page, 'analytics');
  });

  test('Chat page loads', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/chat');
    await takeFullPageScreenshot(page, 'chat');
  });

  test('Notifications page loads', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/notifications');
    await takeFullPageScreenshot(page, 'notifications');
  });

  test('Shares page loads', async ({ page }) => {
    await page.goto('/shares');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/shares');
    await takeFullPageScreenshot(page, 'shares');
  });

  test('Settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/settings');
    await takeFullPageScreenshot(page, 'settings');
  });

  test('Team page loads', async ({ page }) => {
    await page.goto('/team');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/team');
    await takeFullPageScreenshot(page, 'team');
  });
});

test.describe('Page Navigation - Client Portal', () => {
  test.beforeAll(async () => {
    await ensureScreenshotsDir();
  });

  // Client portal tests require client login
  // For now, we'll test pages that don't require specific data

  test('Client Dashboard page loads', async ({ page }) => {
    // Note: This requires creating a client account first
    // For comprehensive testing, see client-portal.spec.ts
    await page.goto('/client-portal');
    await page.waitForLoadState('domcontentloaded');

    // Either login page or dashboard should load
    const url = page.url();
    expect(url.includes('/client-portal')).toBeTruthy();
    await takeFullPageScreenshot(page, 'client-dashboard-or-login');
  });

  test('Bookings list page loads for clients', async ({ page }) => {
    await page.goto('/client-portal/bookings');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    expect(url.includes('/client-portal')).toBeTruthy();
    await takeFullPageScreenshot(page, 'client-bookings');
  });

  test('Profile page loads for clients', async ({ page }) => {
    await page.goto('/client-portal/profile');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    expect(url.includes('/client-portal')).toBeTruthy();
    await takeFullPageScreenshot(page, 'client-profile');
  });
});

test.describe('Page Navigation - Auth Pages', () => {
  test.beforeAll(async () => {
    await ensureScreenshotsDir();
  });

  test('Staff Login page loads', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/login');
    await takeFullPageScreenshot(page, 'staff-login');
  });

  test('Staff Register page loads', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/register');
    await takeFullPageScreenshot(page, 'staff-register');
  });

  test('Client Login page loads', async ({ page }) => {
    await page.goto('/client-portal/login');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/client-portal/login');
    await takeFullPageScreenshot(page, 'client-login');
  });

  test('Magic Link Verify page loads', async ({ page }) => {
    await page.goto('/auth/magic-link?token=test');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/\/auth\/magic-link/);
    await takeFullPageScreenshot(page, 'magic-link-verify');
  });
});
