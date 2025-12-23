#!/usr/bin/env node
import { chromium } from 'playwright';

/**
 * Test Client Portal Login Flow
 *
 * Test complet du flow:
 * 1. Accès login page
 * 2. Login avec test@example.com / password123
 * 3. Vérification redirection vers dashboard
 * 4. Vérification affichage du dashboard
 */

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs and network errors
  const consoleLogs = [];
  const networkErrors = [];

  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('requestfailed', request => {
    networkErrors.push(`${request.url()} - ${request.failure().errorText}`);
  });

  page.on('response', async response => {
    if (!response.ok()) {
      const text = await response.text().catch(() => 'unable to get response text');
      console.log(`   ⚠️  ${response.status()} Error: ${response.url()}`);
      if (text.length < 500) {
        console.log(`   📄 Response: ${text}`);
      }
    }
  });

  console.log('\n🧪 Testing Client Portal Login Flow...\n');

  try {
    // Step 1: Navigate to login page
    console.log('1️⃣  Navigating to login page...');
    await page.goto('http://localhost:5174/client-portal/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-login-1-page.png' });
    console.log('   ✅ Login page loaded');

    // Step 2: Fill login form
    console.log('2️⃣  Filling login form...');
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await page.screenshot({ path: 'test-login-2-form-filled.png' });
    console.log('   ✅ Form filled');

    // Step 3: Submit form
    console.log('3️⃣  Submitting login form...');
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for navigation or error
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-login-3-after-submit.png' });

    // Step 4: Check current URL
    const currentUrl = page.url();
    console.log(`   📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes('/client-portal/login')) {
      console.log('   ❌ Still on login page - checking for errors...');

      // Check for error messages
      const errorAlert = await page.locator('[role="alert"]').count();
      if (errorAlert > 0) {
        const errorText = await page.locator('[role="alert"]').first().textContent();
        console.log(`   ⚠️  Error message: ${errorText}`);
      }

      // Print captured logs
      console.log('\n   📋 Console logs:');
      consoleLogs.forEach(log => console.log(`      ${log}`));

      if (networkErrors.length > 0) {
        console.log('\n   🌐 Network errors:');
        networkErrors.forEach(err => console.log(`      ${err}`));
      }

      throw new Error('Login failed - still on login page');
    }

    // Step 5: Verify dashboard
    if (currentUrl.includes('/client-portal')) {
      console.log('   ✅ Redirected to Client Portal!');

      // Wait for dashboard to load
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-login-4-dashboard.png' });

      // Check for dashboard elements
      const hasWelcome = await page.locator('h1:has-text("Welcome back")').count() > 0;
      const hasStats = await page.locator('text=Upcoming Bookings').count() > 0;

      if (hasWelcome) {
        console.log('   ✅ Dashboard "Welcome back" found');
      }

      if (hasStats) {
        console.log('   ✅ Dashboard stats cards found');
      }

      // Check localStorage for session
      const sessionToken = await page.evaluate(() =>
        localStorage.getItem('client_portal_session_token')
      );
      const clientData = await page.evaluate(() =>
        localStorage.getItem('client_portal_client_data')
      );

      if (sessionToken) {
        console.log('   ✅ Session token stored in localStorage');
        console.log(`   📝 Token: ${sessionToken.substring(0, 20)}...`);
      } else {
        console.log('   ⚠️  No session token in localStorage');
      }

      if (clientData) {
        const client = JSON.parse(clientData);
        console.log('   ✅ Client data stored in localStorage');
        console.log(`   👤 Client: ${client.name} (${client.email})`);
      } else {
        console.log('   ⚠️  No client data in localStorage');
      }

      console.log('\n✅ TEST PASSED - Login flow successful!\n');
    } else {
      throw new Error(`Unexpected URL: ${currentUrl}`);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'test-login-error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
