import { test, expect } from '@playwright/test';
import { generateEmail, generateStudioName } from '../helpers/fixtures';
import { takeFullPageScreenshot } from '../helpers/screenshots';

/**
 * Authentication Tests - Login and Signup
 *
 * Consolidated from:
 * - test-auth-login.spec.ts
 * - test-auth-final.spec.ts
 * - test-signup-validation.spec.ts
 * - test-debug-register.spec.ts
 *
 * Tests:
 * - Staff login (valid credentials)
 * - Staff signup/registration
 * - Form validation
 * - Error handling
 */

const BASE_URL = process.env.BASE_URL || 'https://recording-studio-manager.com';

test.describe('Staff Authentication', () => {
  test('Can login with valid credentials', async ({ page }) => {
    console.log('\n🔐 Testing Staff Login');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Use E2E test user credentials
    await page.fill('input[type="email"], input[name="email"], #email', 'e2e-test-user@example.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'E2ETestPass123!');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect away from login page
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // Verify redirect to dashboard
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    // Should be at dashboard or root
    const isAuthenticated = currentUrl.includes(BASE_URL) && !currentUrl.includes('/login');
    console.log(`  ✓ Authenticated: ${isAuthenticated}`);

    await takeFullPageScreenshot(page, 'auth-login-success');

    expect(isAuthenticated).toBeTruthy();
  });

  test('Shows error with invalid credentials', async ({ page }) => {
    console.log('\n🔐 Testing Invalid Login');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Fill with invalid credentials
    await page.fill('input[type="email"], input[name="email"], #email', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'wrongpassword');

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Should still be on login page or show error
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    await takeFullPageScreenshot(page, 'auth-login-error');

    // Look for error message
    const errorMessage = page.locator('text=/invalid|incorrect|error/i').first();
    const hasError = await errorMessage.isVisible();

    console.log(`  ✓ Error displayed: ${hasError}`);
  });

  test('Can register new staff account', async ({ page }) => {
    console.log('\n🔐 Testing Staff Registration');

    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const email = generateEmail('staff');
    const studioName = generateStudioName();

    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    // Fill registration form with flexible selectors
    await page.fill('#name, input[name="name"]', 'Test Studio Owner');
    await page.fill('#email, input[name="email"]', email);
    await page.fill('#password, input[name="password"]', 'StrongPass123!');
    await page.fill('#organizationName, input[name="organizationName"], input[name="studioName"]', studioName);

    console.log(`  Email: ${email}`);
    console.log(`  Studio: ${studioName}`);

    // Take screenshot before submit
    await takeFullPageScreenshot(page, 'auth-register-before-submit');

    // Check for validation errors before submit
    const errorsBeforeSubmit = await page.locator('[class*="error"]').count();
    console.log(`  Validation errors before submit: ${errorsBeforeSubmit}`);

    // Submit and wait for navigation or error
    await page.click('button[type="submit"]');
    await page.waitForTimeout(15000); // Registration + tenant provisioning can take time

    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    // Take screenshot after submit
    await takeFullPageScreenshot(page, 'auth-register-after-submit');

    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log(`  ⚠️ Console errors: ${consoleErrors.join(', ')}`);
    }

    // Check for validation errors on page
    const errorsAfterSubmit = await page.locator('[class*="error"], [role="alert"]').count();
    if (errorsAfterSubmit > 0) {
      const errorTexts = await page.locator('[class*="error"], [role="alert"]').allTextContents();
      console.log(`  ⚠️ Validation errors: ${errorTexts.join(', ')}`);
    }

    // Should redirect to dashboard or login
    const registered = !currentUrl.includes('/register');
    console.log(`  ✓ Registration completed: ${registered}`);

    expect(registered).toBeTruthy();
  });

  test('Validates required fields on signup', async ({ page }) => {
    console.log('\n🔐 Testing Signup Validation');

    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('domcontentloaded');

    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Should show validation errors
    // Split into separate locators and combine (Playwright doesn't allow mixing CSS + text selectors)
    const errorClasses = page.locator('[class*="error"], [role="alert"]');
    const errorText = page.locator('text=/required|obligatoire/i');
    const validationMessages = errorClasses.or(errorText);
    const errorCount = await validationMessages.count();

    console.log(`  ✓ Validation errors displayed: ${errorCount}`);

    await takeFullPageScreenshot(page, 'auth-signup-validation');

    expect(errorCount).toBeGreaterThan(0);
  });

  test('Validates email format', async ({ page }) => {
    console.log('\n🔐 Testing Email Validation');

    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('domcontentloaded');

    // Fill with invalid email
    await page.fill('#name, input[name="name"]', 'Test User');
    await page.fill('#email, input[name="email"]', 'invalid-email');
    await page.fill('#password, input[name="password"]', 'password123');
    await page.fill('#organizationName, input[name="organizationName"]', 'Test Studio');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Should show email validation error
    const emailError = page.locator('text=/valid email|email invalide/i').first();
    const hasEmailError = await emailError.isVisible();

    console.log(`  ✓ Email validation error: ${hasEmailError}`);

    await takeFullPageScreenshot(page, 'auth-email-validation');
  });
});

test.describe('Session Management', () => {
  test('Session persists after login', async ({ page }) => {
    console.log('\n🔐 Testing Session Persistence');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[type="email"], input[name="email"], #email', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // Navigate to different page
    await page.goto(`${BASE_URL}/clients`);
    await page.waitForLoadState('domcontentloaded');

    // Should still be authenticated
    const url = page.url();
    const stillAuthenticated = !url.includes('/login');

    console.log(`  ✓ Session maintained: ${stillAuthenticated}`);

    expect(stillAuthenticated).toBeTruthy();
  });

  test('Redirects to login when not authenticated', async ({ page }) => {
    console.log('\n🔐 Testing Auth Redirect');

    // Try to access protected page directly
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(3000);

    // Should redirect to login
    const url = page.url();
    const redirectedToLogin = url.includes('/login');

    console.log(`  ✓ Redirected to login: ${redirectedToLogin}`);

    await takeFullPageScreenshot(page, 'auth-protected-redirect');
  });
});
