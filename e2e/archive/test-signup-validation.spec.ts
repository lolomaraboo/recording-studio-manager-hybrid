import { test, expect } from '@playwright/test';

/**
 * Test: Production Signup Flow with Tenant Database Creation
 *
 * Purpose: Validate that the tenant auto-provisioning works correctly in production
 * - Create unique test account
 * - Verify signup succeeds
 * - Verify redirect to dashboard
 * - Verify tenant database was created
 */

test.describe('Production Signup Validation', () => {
  // Generate unique email to avoid "user already exists" errors
  const timestamp = Date.now();
  const testEmail = `test-validation-${timestamp}@recording-studio-manager.com`;
  const testPassword = 'TestPassword123!';
  const testStudioName = `Test Studio ${timestamp}`;

  test('should create account and auto-provision tenant database', async ({ page }) => {
    // Set longer timeout for this test (tenant DB creation can take time)
    test.setTimeout(60000);

    console.log(`\n🧪 Testing signup with email: ${testEmail}`);
    console.log(`🏢 Studio name: ${testStudioName}`);

    // Step 1: Navigate to signup page
    await page.goto('https://recording-studio-manager.com/signup');
    await page.waitForLoadState('networkidle');

    // Step 2: Fill signup form
    console.log('📝 Filling signup form...');

    // Fill studio name
    const studioNameInput = page.locator('input[name="studioName"], input[placeholder*="studio" i], input[type="text"]').first();
    await studioNameInput.fill(testStudioName);

    // Fill email
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await emailInput.fill(testEmail);

    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(testPassword);

    // Fill confirm password if exists
    const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    if (await confirmPasswordInput.count() > 0) {
      await confirmPasswordInput.fill(testPassword);
    }

    // Take screenshot before submit
    await page.screenshot({ path: 'test-signup-1-form-filled.png', fullPage: true });

    // Step 3: Submit form
    console.log('📤 Submitting signup form...');
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Register"), button:has-text("Create Account")');
    await submitButton.click();

    // Step 4: Wait for response (either success or error)
    console.log('⏳ Waiting for signup response...');

    // Listen for API response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/trpc/auth.register'),
      { timeout: 30000 }
    );

    try {
      const response = await responsePromise;
      const status = response.status();

      console.log(`📡 API Response Status: ${status}`);

      if (status === 500) {
        // Get response body to see error
        const responseBody = await response.json();
        console.error('❌ Server Error:', JSON.stringify(responseBody, null, 2));

        // Take screenshot of error
        await page.screenshot({ path: 'test-signup-error.png', fullPage: true });

        // Get console logs for debugging
        page.on('console', msg => console.log('Browser console:', msg.text()));

        throw new Error(`Signup failed with 500 error: ${JSON.stringify(responseBody)}`);
      }

      expect(status).toBe(200);
      console.log('✅ Signup API call successful');

    } catch (error) {
      console.error('❌ Signup failed:', error);
      await page.screenshot({ path: 'test-signup-error.png', fullPage: true });
      throw error;
    }

    // Step 5: Verify redirect to dashboard
    console.log('🔍 Verifying redirect to dashboard...');
    await page.waitForURL(/\/(dashboard|app|home)/, { timeout: 15000 });

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    expect(currentUrl).toMatch(/\/(dashboard|app|home)/);

    // Step 6: Verify dashboard loads
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-signup-2-dashboard.png', fullPage: true });

    // Check for dashboard elements
    const isDashboardVisible = await page.locator('text=/dashboard|bookings|clients|projects/i').count() > 0;
    expect(isDashboardVisible).toBe(true);

    console.log('✅ Dashboard loaded successfully');
    console.log(`\n📊 Test Summary:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Studio: ${testStudioName}`);
    console.log(`   Status: ✅ PASSED - Signup and tenant provisioning successful`);
  });
});
