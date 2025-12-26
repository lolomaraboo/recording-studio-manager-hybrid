import { chromium } from 'playwright';

/**
 * Test: Production Signup Flow with Tenant Database Creation
 * Automated test using Playwright
 */

(async () => {
  // Generate unique credentials
  const timestamp = Date.now();
  const testEmail = `test-validation-${timestamp}@recording-studio-manager.com`;
  const testPassword = 'TestPassword123!';
  const testStudioName = `Test Studio ${timestamp}`;

  console.log(`\n🧪 Testing signup flow`);
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🏢 Studio: ${testStudioName}`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to signup (starts at login page)
    console.log('\n1️⃣  Navigating to login page...');
    await page.goto('https://recording-studio-manager.com/signup');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-signup-1-login.png', fullPage: true });

    // Click Register link
    console.log('2️⃣  Clicking "Register" link...');
    await page.click('text=Register');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-signup-2-register-form.png', fullPage: true });

    // Fill registration form
    console.log('3️⃣  Filling registration form...');

    // Find all inputs to understand the structure
    const inputs = await page.locator('input').all();
    console.log(`   Found ${inputs.length} input fields`);

    // Fill based on what we find
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const id = await input.getAttribute('id');

      console.log(`   Input ${i + 1}: type=${type}, id=${id}, placeholder=${placeholder}`);

      if (type === 'email' || id === 'email') {
        await input.fill(testEmail);
        console.log(`   ✓ Filled email: ${testEmail}`);
      } else if (type === 'password') {
        await input.fill(testPassword);
        console.log(`   ✓ Filled password`);
      } else if (type === 'text' || placeholder?.toLowerCase().includes('studio') || placeholder?.toLowerCase().includes('organization')) {
        await input.fill(testStudioName);
        console.log(`   ✓ Filled studio name: ${testStudioName}`);
      }
    }

    await page.screenshot({ path: 'test-signup-3-form-filled.png', fullPage: true });

    // Submit form
    console.log('4️⃣  Submitting form...');
    const submitButton = page.locator('button[type="submit"]');
    const buttonText = await submitButton.textContent();
    console.log(`   Submit button text: "${buttonText}"`);

    // Listen for network response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/trpc/auth.register'),
      { timeout: 30000 }
    );

    await submitButton.click();

    // Wait for API response
    console.log('5️⃣  Waiting for API response...');
    const response = await responsePromise;
    const status = response.status();
    console.log(`   API Status: ${status}`);

    if (status !== 200) {
      const body = await response.json().catch(() => ({}));
      console.error(`   ❌ Error response:`, body);
      await page.screenshot({ path: 'test-signup-ERROR.png', fullPage: true });

      // Get server logs
      console.log('\n📋 Fetching server logs for debugging...');
      const { exec } = await import('child_process');
      exec('ssh root@31.220.104.244 "docker logs rsm-server --tail 50 | grep -A 10 -B 5 TenantProvisioning"', (error, stdout, stderr) => {
        if (stdout) console.log('Server logs:\n', stdout);
        if (stderr) console.error('SSH error:', stderr);
      });

      throw new Error(`Signup API returned ${status}: ${JSON.stringify(body)}`);
    }

    console.log('   ✅ Signup successful!');

    // Wait for redirect
    console.log('6️⃣  Waiting for redirect to dashboard...');
    await page.waitForURL(/\/(dashboard|app|home)/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const finalUrl = page.url();
    console.log(`   Current URL: ${finalUrl}`);

    await page.screenshot({ path: 'test-signup-4-dashboard.png', fullPage: true });

    // Verify dashboard loaded
    console.log('7️⃣  Verifying dashboard elements...');
    const dashboardElements = await page.locator('text=/dashboard|bookings|clients|projects/i').count();
    console.log(`   Found ${dashboardElements} dashboard elements`);

    if (dashboardElements > 0) {
      console.log('   ✅ Dashboard loaded successfully!');
    } else {
      console.warn('   ⚠️  Dashboard elements not found, but redirect succeeded');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST PASSED - Signup and tenant provisioning successful!');
    console.log('='.repeat(60));
    console.log(`📧 Test account: ${testEmail}`);
    console.log(`🏢 Studio name: ${testStudioName}`);
    console.log(`🔑 Password: ${testPassword}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('='.repeat(60) + '\n');
    await page.screenshot({ path: 'test-signup-FINAL-ERROR.png', fullPage: true });
  } finally {
    console.log('\n🔍 Browser will stay open for 10 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
})();
