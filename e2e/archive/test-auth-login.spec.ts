import { test, expect } from '@playwright/test';

test.describe('Production Authentication Verification - Using Existing Account', () => {
  // Use existing test account from validation test
  const testEmail = 'test-validation-1735251822533@recording-studio-manager.com';
  const testPassword = 'TestPass123!';

  test('Verify authentication with existing account', async ({ page, context }) => {
    console.log('\n=== Testing Production Authentication (Existing Account) ===');
    console.log(`Test email: ${testEmail}`);

    // Step 1: Clear cookies
    console.log('\n1. Clearing all cookies...');
    await context.clearCookies();

    // Step 2: Navigate to login
    console.log('\n2. Navigating to login...');
    await page.goto('https://recording-studio-manager.com/login');
    await page.waitForLoadState('networkidle');

    // Step 3: Login
    console.log('\n3. Logging in...');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log(`   After login: ${page.url()}`);

    // Step 4: Verify session cookie
    console.log('\n4. Verifying session cookie configuration...');
    const cookies = await context.cookies();
    console.log(`   Total cookies: ${cookies.length}`);

    cookies.forEach(cookie => {
      console.log(`   - ${cookie.name} @ ${cookie.domain}`);
    });

    const sessionCookie = cookies.find(c => c.name === 'connect.sid');

    if (!sessionCookie) {
      console.error('   ❌ Session cookie NOT found!');
      console.error('   This means the authentication fix is NOT working!');
      throw new Error('Session cookie not set - authentication fix failed');
    }

    console.log('\n   ✅ Session cookie found:');
    console.log(`      Name: ${sessionCookie.name}`);
    console.log(`      Domain: ${sessionCookie.domain}`);
    console.log(`      Secure: ${sessionCookie.secure}`);
    console.log(`      HttpOnly: ${sessionCookie.httpOnly}`);
    console.log(`      SameSite: ${sessionCookie.sameSite}`);
    console.log(`      Path: ${sessionCookie.path}`);

    // Verify critical cookie attributes from our fix
    const issues = [];

    if (sessionCookie.domain !== '.recording-studio-manager.com') {
      issues.push(`❌ Wrong domain: "${sessionCookie.domain}" (expected: ".recording-studio-manager.com")`);
    } else {
      console.log('   ✅ Domain correct: .recording-studio-manager.com');
    }

    if (!sessionCookie.secure) {
      issues.push('❌ Cookie is not secure (should be true in production)');
    } else {
      console.log('   ✅ Secure flag: true');
    }

    if (!sessionCookie.httpOnly) {
      issues.push('❌ Cookie is not httpOnly (security risk)');
    } else {
      console.log('   ✅ HttpOnly flag: true');
    }

    if (sessionCookie.sameSite !== 'Lax') {
      issues.push(`❌ Wrong sameSite: "${sessionCookie.sameSite}" (expected: "Lax")`);
    } else {
      console.log('   ✅ SameSite: Lax');
    }

    if (issues.length > 0) {
      console.error('\n   🚨 AUTHENTICATION FIX VERIFICATION FAILED:');
      issues.forEach(issue => console.error(`      ${issue}`));
      throw new Error('Cookie not configured correctly - authentication fix not applied');
    }

    console.log('\n   🎉 ALL COOKIE ATTRIBUTES CORRECT!');

    // Step 5: Monitor API calls for 401 errors
    console.log('\n5. Monitoring API calls for 401 errors...');
    const apiCalls: Array<{ url: string; status: number; method: string }> = [];
    const failedCalls: Array<{ url: string; status: number }> = [];

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const method = response.request().method();
        const shortUrl = response.url().substring(response.url().indexOf('/api/'));

        apiCalls.push({ url: shortUrl, status, method });

        if (status === 401) {
          failedCalls.push({ url: shortUrl, status });
          console.error(`   ❌ 401 Unauthorized: ${method} ${shortUrl}`);
        } else if (status >= 200 && status < 300) {
          console.log(`   ✅ ${status}: ${method} ${shortUrl.substring(0, 60)}`);
        } else if (status >= 400) {
          console.warn(`   ⚠️  ${status}: ${method} ${shortUrl.substring(0, 60)}`);
        }
      }
    });

    // Navigate to dashboard to trigger API calls
    console.log('\n6. Navigating to dashboard to trigger API calls...');
    await page.goto('https://recording-studio-manager.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for all API calls to complete

    console.log(`\n   Summary:`);
    console.log(`   Total API calls: ${apiCalls.length}`);
    console.log(`   Failed (401) calls: ${failedCalls.length}`);

    if (failedCalls.length > 0) {
      console.error('\n   🚨 AUTHENTICATION FIX FAILED - 401 errors detected!');
      console.error('   The session cookie is set correctly but API calls are still failing.');
      console.error('   This suggests a server-side session handling issue.');
      failedCalls.forEach(call => {
        console.error(`      - ${call.url}`);
      });
      throw new Error(`Found ${failedCalls.length} API calls with 401 errors`);
    }

    console.log('   ✅ No 401 errors - all API calls authenticated successfully!');

    // Step 7: Verify dashboard content
    console.log('\n7. Verifying dashboard accessible...');
    const url = page.url();
    if (!url.includes('dashboard')) {
      console.warn(`   ⚠️  Not on dashboard: ${url} (may have been redirected)`);
    } else {
      console.log(`   ✅ On dashboard: ${url}`);
    }

    // Take final screenshot
    await page.screenshot({ path: 'auth-test-success.png', fullPage: true });
    console.log('   Screenshot saved: auth-test-success.png');

    console.log('\n=== ✅ AUTHENTICATION FIX VERIFIED SUCCESSFULLY ===');
    console.log('Cookie configuration is correct:');
    console.log('  - Domain: .recording-studio-manager.com (subdomain sharing enabled)');
    console.log('  - Secure: true (HTTPS only)');
    console.log('  - HttpOnly: true (XSS protection)');
    console.log('  - SameSite: Lax (CSRF protection)');
    console.log('  - No 401 errors on protected endpoints');
    console.log('===================================================\n');
  });
});
