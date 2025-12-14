import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * Tests the staff authentication flow:
 * - Login page display
 * - Login with valid credentials
 * - Protected route access
 * - Logout functionality
 */

test.describe('Staff Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored auth state
    await page.context().clearCookies();
  });

  test('shows login page for unauthenticated users', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Login form should be visible
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Use test credentials (from seed data)
    await page.getByLabel(/email/i).fill('admin@studiopro.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Dashboard content should be visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@studiopro.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for dashboard
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Click logout (in header menu)
    await page.getByRole('button', { name: /logout|sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('protected routes redirect to login when not authenticated', async ({
    page,
  }) => {
    // Try accessing protected routes directly
    const protectedRoutes = [
      '/sessions',
      '/clients',
      '/invoices',
      '/projects',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    }
  });
});

test.describe('Client Portal Authentication', () => {
  test('shows client portal login page', async ({ page }) => {
    await page.goto('/portal/login');

    // Client portal login should be visible
    await expect(page.getByRole('heading', { name: /client.*portal|sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('client portal protected routes redirect to portal login', async ({
    page,
  }) => {
    const portalRoutes = [
      '/portal',
      '/portal/sessions',
      '/portal/invoices',
      '/portal/bookings',
    ];

    for (const route of portalRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/portal/login');
    }
  });
});
