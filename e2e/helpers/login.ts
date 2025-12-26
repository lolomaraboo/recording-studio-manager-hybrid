import { Page } from '@playwright/test';

/**
 * Login helpers for E2E tests
 * Provides reusable authentication functions for staff and client portals
 */

const BASE_URL = process.env.BASE_URL || 'https://recording-studio-manager.com';

/**
 * Login as staff user (admin portal)
 */
export async function loginAsStaff(page: Page, credentials?: { email: string; password: string }) {
  const email = credentials?.email || 'test@example.com';
  const password = credentials?.password || 'password123';

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');

  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Login as client user (client portal)
 */
export async function loginAsClient(page: Page, credentials?: { email: string; password: string }) {
  const email = credentials?.email || 'client@example.com';
  const password = credentials?.password || 'password123';

  await page.goto(`${BASE_URL}/client-portal/login`);
  await page.waitForLoadState('domcontentloaded');

  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to client dashboard
  await page.waitForURL(`${BASE_URL}/client-portal`, { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Register new staff account
 */
export async function registerStaff(page: Page, data: {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}) {
  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState('domcontentloaded');

  await page.fill('#name', data.name);
  await page.fill('#email', data.email);
  await page.fill('#password', data.password);
  await page.fill('#organizationName', data.organizationName);

  await page.click('button[type="submit"]');

  // Registration might auto-login or redirect to login
  await page.waitForTimeout(5000);
}

/**
 * Logout from staff portal
 */
export async function logoutStaff(page: Page) {
  // Look for logout button (usually in user menu or settings)
  await page.click('[aria-label="User menu"]');
  await page.click('button:has-text("Logout")');
  await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });
}

/**
 * Logout from client portal
 */
export async function logoutClient(page: Page) {
  await page.click('[aria-label="User menu"]');
  await page.click('button:has-text("Logout")');
  await page.waitForURL(`${BASE_URL}/client-portal/login`, { timeout: 5000 });
}

/**
 * Check if user is authenticated (staff portal)
 */
export async function isStaffAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('domcontentloaded');
    // If we see the dashboard, we're authenticated
    return page.url() === `${BASE_URL}/`;
  } catch {
    return false;
  }
}

/**
 * Check if user is authenticated (client portal)
 */
export async function isClientAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/client-portal`);
    await page.waitForLoadState('domcontentloaded');
    return page.url().includes('/client-portal');
  } catch {
    return false;
  }
}
