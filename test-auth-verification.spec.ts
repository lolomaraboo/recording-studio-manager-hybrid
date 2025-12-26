import { test, expect } from '@playwright/test';

test.describe('Production Authentication Verification', () => {
  const timestamp = Date.now();
  const testEmail = `test-auth-fix-${timestamp}@recording-studio-manager.com`;
  const testPassword = 'TestAuth2024!';
  const testStudioName = 'Test Auth Fix';

  test('Complete authentication flow with cookie verification', async ({ page, context }) => {
    console.log('\n=== Testing Production Authentication ===');
    console.log(`Test email: ${testEmail}`);

    // Step 1: Navigate to site
    console.log('\n1. Navigating to production site...');
    await page.goto('https://recording-studio-manager.com', { waitUntil: 'networkidle' });

    // Step 2: Clear cookies and verify
    console.log('\n2. Clearing all cookies...');
    await context.clearCookies();
    const cookiesBeforeAuth = await context.cookies();
    console.log(`   Cookies before auth: ${cookiesBeforeAuth.length}`);

    // Step 3: Register new account
    console.log('\n3. Registering new test account...');

    // Find and click Sign Up button
    const signupButton = page.locator('text=Sign Up').first();
    await signupButton.click();
    await page.waitForURL(/.*signup.*/);

    // Fill registration form
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.fill('input[name="studioName"], input[placeholder*="studio" i]', testStudioName);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect (either to dashboard or login)
    await page.waitForLoadState('networkidle');
    console.log(`   Current URL after signup: ${page.url()}`);

    // Step 4: Verify session cookie
    console.log('\n4. Verifying session cookie configuration...');
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'connect.sid');

    if (!sessionCookie) {
      console.error('   ❌ Session cookie NOT found!');
      console.log(`   Available cookies: ${cookies.map(c => c.name).join(', ')}`);
      throw new Error('Session cookie not set');
    }

    console.log('   ✅ Session cookie found:');
    console.log(`      Name: ${sessionCookie.name}`);
    console.log(`      Domain: ${sessionCookie.domain}`);
    console.log(`      Secure: ${sessionCookie.secure}`);
    console.log(`      HttpOnly: ${sessionCookie.httpOnly}`);
    console.log(`      SameSite: ${sessionCookie.sameSite}`);

    // Verify cookie attributes
    expect(sessionCookie.domain).toBe('.recording-studio-manager.com');
    expect(sessionCookie.secure).toBe(true);
    expect(sessionCookie.httpOnly).toBe(true);
    expect(sessionCookie.sameSite).toBe('Lax');
    console.log('   ✅ All cookie attributes correct!');

    // Step 5: Login if signup redirected to login page
    if (page.url().includes('login')) {
      console.log('\n5. Signup completed, logging in...');
      await page.fill('input[name="email"], input[type="email"]', testEmail);
      await page.fill('input[name="password"], input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    // Step 6: Verify we're on dashboard
    console.log('\n6. Verifying dashboard access...');
    await page.waitForURL(/.*dashboard.*/, { timeout: 10000 });
    console.log(`   ✅ Redirected to: ${page.url()}`);

    // Step 7: Monitor network for 401 errors
    console.log('\n7. Monitoring tRPC requests for 401 errors...');
    const requests: Array<{ url: string; status: number }> = [];
    const failedRequests: Array<{ url: string; status: number }> = [];

    page.on('response', response => {
      if (response.url().includes('/api/trpc/')) {
        const status = response.status();
        requests.push({ url: response.url(), status });

        if (status === 401) {
          failedRequests.push({ url: response.url(), status });
          console.error(`   ❌ 401 Error: ${response.url()}`);
        } else {
          console.log(`   ✅ ${status}: ${response.url().split('/api/trpc/')[1]?.substring(0, 50)}`);
        }
      }
    });

    // Wait for dashboard to load and make API calls
    await page.waitForTimeout(3000);

    console.log(`\n   Total tRPC requests: ${requests.length}`);
    console.log(`   Failed (401) requests: ${failedRequests.length}`);

    if (failedRequests.length > 0) {
      throw new Error(`Found ${failedRequests.length} requests with 401 errors`);
    }

    // Step 8: Check console for errors
    console.log('\n8. Checking browser console for errors...');
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error(`   Console error: ${msg.text()}`);
      }
    });

    // Navigate around to trigger more requests
    await page.waitForTimeout(2000);

    console.log(`\n   Console errors found: ${consoleErrors.length}`);
    const authErrors = consoleErrors.filter(e =>
      e.includes('401') || e.includes('Unauthorized') || e.includes('authentication')
    );

    if (authErrors.length > 0) {
      console.error('   ❌ Authentication-related console errors found!');
      authErrors.forEach(e => console.error(`      ${e}`));
    } else {
      console.log('   ✅ No authentication errors in console');
    }

    console.log('\n=== AUTHENTICATION TEST COMPLETE ===\n');
  });
});
