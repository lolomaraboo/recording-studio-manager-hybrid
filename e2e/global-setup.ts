import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup - runs once before all tests
 * Creates E2E test user if it doesn't exist
 */
async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Global Setup: Ensuring E2E test user exists...\n');

  const BASE_URL = process.env.BASE_URL || 'https://recording-studio-manager.com';
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const email = 'e2e-test-user@example.com';
  const password = 'E2ETestPass123!';
  const studioName = 'E2E Test Studio';

  try {
    // Try to login first - if succeeds, user already exists
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"], input[name="email"], #email', email);
    await page.fill('input[type="password"], input[name="password"], #password', password);

    await page.click('button[type="submit"]');

    // Wait to see if we redirect away from login
    try {
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
      console.log('  ✅ E2E test user already exists\n');
      await browser.close();
      return;
    } catch {
      // Login failed, need to register
      console.log('  ℹ️  E2E test user not found, creating...');
    }
  } catch (error) {
    console.log('  ℹ️  Login attempt failed, will create user');
  }

  // Create new test user
  try {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    await page.fill('#name, input[name="name"]', 'E2E Test User');
    await page.fill('#email, input[name="email"]', email);
    await page.fill('#password, input[name="password"]', password);
    await page.fill('#confirmPassword, input[name="confirmPassword"]', password);
    await page.fill('#organizationName, input[name="organizationName"], input[name="studioName"]', studioName);

    // Take screenshot before submit (for debugging)
    await page.screenshot({ path: 'global-setup-before-register.png', fullPage: true });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(15000); // Wait for registration + tenant provisioning

    const currentUrl = page.url();
    const registered = !currentUrl.includes('/register');

    if (registered) {
      console.log('  ✅ E2E test user created successfully\n');
    } else {
      console.log('  ⚠️  Registration may have failed, check screenshots\n');
      await page.screenshot({ path: 'global-setup-after-register.png', fullPage: true });

      // Check for error messages
      const errors = await page.locator('[class*="error"], [role="alert"]').allTextContents();
      if (errors.length > 0) {
        console.log(`  ⚠️  Errors found: ${errors.join(', ')}\n`);
      }
    }
  } catch (error) {
    console.error('  ❌ Failed to create E2E test user:', error);
    await page.screenshot({ path: 'global-setup-error.png', fullPage: true });
  }

  await browser.close();
}

export default globalSetup;
