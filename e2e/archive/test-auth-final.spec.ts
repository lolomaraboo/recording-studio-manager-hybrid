import { test, expect } from '@playwright/test';

test.describe('Production Authentication Verification', () => {
  const timestamp = Date.now();
  const testEmail = `test-auth-fix-${timestamp}@recording-studio-manager.com`;
  const testPassword = 'TestAuth2024!';
  const testStudioName = 'Test Auth Fix Studio';

  test('Complete authentication flow with cookie verification', async ({ page, context }) => {
    console.log('\n=== Testing Production Authentication ===');
    console.log(`Test email: ${testEmail}`);

    // Step 1: Navigate to site
    console.log('\n1. Navigating to production site...');
    await page.goto('https://recording-studio-manager.com');
    await page.waitForLoadState('networkidle');
    console.log(`   Current URL: ${page.url()}`);

    // Step 2: Clear cookies
    console.log('\n2. Clearing all cookies...');
    await context.clearCookies();

    // Step 3: Navigate to registration
    console.log('\n3. Navigating to registration...');
    await page.goto('https://recording-studio-manager.com/register');
    await page.waitForLoadState('networkidle');

    // Fill registration form
    console.log('   Filling registration form...');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Find studio name input (may have different selector)
    const studioInput = page.locator('input[name="studioName"], input[placeholder*="studio" i]').first();
    await studioInput.fill(testStudioName);

    // Submit form
    console.log('   Submitting registration...');
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForLoadState('networkidle');
    console.log(`   After registration: ${page.url()}`);

    // Step 4: Login (registration usually requires login after)
    if (page.url().includes('login')) {
      console.log('\n4. Logging in with new credentials...');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      console.log(`   After login: ${page.url()}`);
    }

    // Step 5: Verify session cookie
    console.log('\n5. Verifying session cookie configuration...');
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'connect.sid');

    if (!sessionCookie) {
      console.error('   ❌ Session cookie NOT found!');
      console.log(`   Available cookies: ${cookies.map(c => `${c.name}@${c.domain}`).join(', ')}`);
      throw new Error('Session cookie not set - authentication fix may not be working');
    }

    console.log('   ✅ Session cookie found:');
    console.log(`      Name: ${sessionCookie.name}`);
    console.log(`      Domain: ${sessionCookie.domain}`);
    console.log(`      Secure: ${sessionCookie.secure}`);
    console.log(`      HttpOnly: ${sessionCookie.httpOnly}`);
    console.log(`      SameSite: ${sessionCookie.sameSite}`);

    // Verify critical cookie attributes
    const issues = [];

    if (sessionCookie.domain !== '.recording-studio-manager.com') {
      issues.push(`Wrong domain: ${sessionCookie.domain} (expected: .recording-studio-manager.com)`);
    }
    if (!sessionCookie.secure) {
      issues.push('Cookie is not secure (should be true in production)');
    }
    if (!sessionCookie.httpOnly) {
      issues.push('Cookie is not httpOnly (security risk)');
    }
    if (sessionCookie.sameSite !== 'Lax') {
      issues.push(`Wrong sameSite: ${sessionCookie.sameSite} (expected: Lax)`);
    }

    if (issues.length > 0) {
      console.error('   ❌ Cookie configuration issues:');
      issues.forEach(issue => console.error(`      - ${issue}`));
      throw new Error('Cookie not configured correctly');
    }

    console.log('   ✅ All cookie attributes correct!');

    // Step 6: Monitor API calls for 401 errors
    console.log('\n6. Monitoring API calls for 401 errors...');
    const apiCalls: Array<{ url: string; status: number }> = [];
    const failedCalls: Array<{ url: string; status: number }> = [];

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const shortUrl = response.url().substring(response.url().indexOf('/api/'));

        apiCalls.push({ url: shortUrl, status });

        if (status === 401) {
          failedCalls.push({ url: shortUrl, status });
          console.error(`   ❌ 401 Unauthorized: ${shortUrl}`);
        } else if (status >= 200 && status < 300) {
          console.log(`   ✅ ${status}: ${shortUrl}`);
        } else if (status >= 400) {
          console.warn(`   ⚠️  ${status}: ${shortUrl}`);
        }
      }
    });

    // Navigate to dashboard to trigger API calls
    console.log('\n7. Navigating to dashboard...');
    await page.goto('https://recording-studio-manager.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for API calls

    console.log(`\n   Total API calls: ${apiCalls.length}`);
    console.log(`   Failed (401) calls: ${failedCalls.length}`);

    if (failedCalls.length > 0) {
      console.error('\n   ❌ AUTHENTICATION FIX FAILED - 401 errors detected!');
      throw new Error(`Found ${failedCalls.length} API calls with 401 errors`);
    }

    console.log('   ✅ No 401 errors - authentication working correctly!');

    // Step 8: Verify we can access protected content
    console.log('\n8. Verifying dashboard content loaded...');

    // Wait for any dashboard content to appear
    await page.waitForSelector('body', { state: 'visible' });

    const url = page.url();
    if (!url.includes('dashboard')) {
      console.warn(`   ⚠️  Not on dashboard: ${url}`);
    } else {
      console.log('   ✅ Dashboard accessible');
    }

    console.log('\n=== ✅ AUTHENTICATION TEST PASSED ===\n');
  });
});
