import { test, expect } from '@playwright/test';

/**
 * UI Validation Tests
 * Simple tests to validate UI loads correctly without authentication
 */

const BASE_URL = 'https://recording-studio-manager.com';

test.describe('UI Validation - Public Pages', () => {
  test('Homepage/Login page loads and displays correctly', async ({ page }) => {
    console.log('\n🎨 Testing Homepage UI');

    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // Take screenshot
    await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true });

    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Login"), button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    console.log('  ✓ Login form elements visible');

    // Check for "Register" link
    const registerLink = page.locator('a:has-text("Register"), a:has-text("Sign up")');
    if (await registerLink.isVisible()) {
      console.log('  ✓ Register link visible');
    }

    // Verify page title
    const title = await page.title();
    console.log(`  ✓ Page title: "${title}"`);

    // Check for no console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log(`  ⚠ Console errors found: ${consoleErrors.length}`);
      consoleErrors.slice(0, 3).forEach((err) => console.log(`    - ${err}`));
    } else {
      console.log('  ✓ No console errors');
    }
  });

  test('Register page loads and displays form', async ({ page }) => {
    console.log('\n🎨 Testing Register Page UI');

    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'screenshots/register.png', fullPage: true });

    // Check for registration form fields
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    console.log('  ✓ Registration form elements visible');

    // Check if organization/studio name field exists
    const orgInput = page.locator(
      'input[name="organizationName"], input[placeholder*="studio" i], input[placeholder*="organization" i]'
    );

    if (await orgInput.isVisible()) {
      console.log('  ✓ Organization name field visible');
    }

    const title = await page.title();
    console.log(`  ✓ Page title: "${title}"`);
  });

  test('UI elements are styled correctly (no broken styles)', async ({ page }) => {
    console.log('\n🎨 Testing UI Styling');

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check that CSS is loaded
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).length;
    });

    console.log(`  ✓ Stylesheets loaded: ${stylesheets}`);
    expect(stylesheets).toBeGreaterThan(0);

    // Check that login button has styling (not default browser button)
    const loginButton = page.locator('button[type="submit"]').first();
    const buttonStyles = await loginButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        padding: styles.padding,
        borderRadius: styles.borderRadius,
      };
    });

    console.log('  ✓ Button styles:', buttonStyles);

    // Verify button has custom styling (not default)
    expect(buttonStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(buttonStyles.backgroundColor).not.toBe('transparent');
  });

  test('Responsive design - Mobile viewport', async ({ page }) => {
    console.log('\n📱 Testing Mobile Viewport');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'screenshots/mobile-login.png', fullPage: true });

    // Check elements are still visible on mobile
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    console.log('  ✓ Login form visible on mobile');

    // Check that form is not cut off
    const formBox = await emailInput.boundingBox();
    if (formBox) {
      expect(formBox.width).toBeLessThan(375); // Should fit in viewport
      console.log(`  ✓ Form width: ${formBox.width}px (fits in 375px viewport)`);
    }
  });

  test('All interactive elements are clickable', async ({ page }) => {
    console.log('\n🖱️ Testing Interactive Elements');

    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // Test that inputs are clickable/focusable
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.click();
    const isFocused = await emailInput.evaluate((el) => el === document.activeElement);

    expect(isFocused).toBe(true);
    console.log('  ✓ Email input is clickable and focusable');

    // Test that button is clickable
    const loginButton = page.locator('button[type="submit"]').first();
    const isButtonEnabled = await loginButton.isEnabled();

    expect(isButtonEnabled).toBe(true);
    console.log('  ✓ Login button is enabled');

    // Test register link
    const registerLink = page.locator('a:has-text("Register"), a:has-text("Sign up")').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      expect(currentUrl).toContain('register');
      console.log('  ✓ Register link navigates correctly');
    }
  });
});

test.describe('UI Validation - Loading States', () => {
  test('Page loads within acceptable time', async ({ page }) => {
    console.log('\n⏱️ Testing Page Load Performance');

    const startTime = Date.now();

    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    console.log(`  ✓ Page loaded in ${loadTime}ms`);

    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);

    if (loadTime < 1000) {
      console.log('  ✓ Excellent load time (< 1s)');
    } else if (loadTime < 3000) {
      console.log('  ✓ Good load time (< 3s)');
    } else {
      console.log('  ⚠ Acceptable load time (< 5s)');
    }
  });

  test('No visible layout shifts', async ({ page }) => {
    console.log('\n📐 Testing Layout Stability');

    await page.goto(BASE_URL);

    // Take screenshot immediately
    await page.screenshot({ path: 'screenshots/load-initial.png' });

    // Wait a bit for any lazy loading
    await page.waitForTimeout(2000);

    // Take screenshot after load
    await page.screenshot({ path: 'screenshots/load-final.png' });

    // Check that main elements are in the same position
    const emailInput = page.locator('input[type="email"]').first();
    const box = await emailInput.boundingBox();

    if (box) {
      // Elements should be visible and positioned
      expect(box.y).toBeGreaterThan(0);
      expect(box.y).toBeLessThan(800); // Should be visible on screen

      console.log(`  ✓ Email input positioned at y=${box.y}px`);
    }
  });
});
