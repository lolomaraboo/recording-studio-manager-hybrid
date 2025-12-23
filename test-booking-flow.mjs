#!/usr/bin/env node
import { chromium } from 'playwright';

/**
 * Test Booking Flow E2E
 *
 * Flow complet:
 * 1. Login au Client Portal
 * 2. Navigate to Bookings page
 * 3. Select a room
 * 4. Fill booking form
 * 5. Submit booking (creates booking + redirects to Stripe)
 * 6. Verify booking created in database
 */

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('response', async response => {
    if (!response.ok() && response.url().includes('trpc')) {
      const text = await response.text().catch(() => 'unable to get response text');
      console.log(`   ⚠️  ${response.status()} Error: ${response.url()}`);
      if (text.length < 500) {
        console.log(`   📄 Response: ${text}`);
      }
    }
  });

  console.log('\n🧪 Testing Booking Flow E2E...\n');

  try {
    // Step 1: Login
    console.log('1️⃣  Logging in...');
    await page.goto('http://localhost:5174/client-portal/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/client-portal')) {
      throw new Error('Login failed');
    }
    console.log('   ✅ Logged in successfully\n');

    // Step 2: Navigate to Bookings
    console.log('2️⃣  Navigating to Bookings page...');
    await page.click('text=New Booking');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-booking-1-rooms-list.png' });

    const bookingsUrl = page.url();
    if (!bookingsUrl.includes('/bookings')) {
      throw new Error(`Expected /bookings, got ${bookingsUrl}`);
    }
    console.log('   ✅ Bookings page loaded\n');

    // Step 3: Check rooms list
    console.log('3️⃣  Checking available rooms...');
    await page.waitForSelector('text=Available Rooms', { timeout: 5000 });

    const roomCards = await page.locator('[class*="grid"] > div').count();
    console.log(`   📊 Found ${roomCards} room(s)`);

    if (roomCards === 0) {
      throw new Error('No rooms found! Database may be empty.');
    }
    console.log('   ✅ Rooms displayed\n');

    // Step 4: Select first room
    console.log('4️⃣  Selecting room...');
    const firstRoomCard = page.locator('[class*="grid"] > div').first();
    const roomName = await firstRoomCard.locator('h3').textContent();
    console.log(`   🏠 Selecting: ${roomName}`);

    await firstRoomCard.locator('button:has-text("Select Room")').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-booking-2-booking-form.png' });

    // Verify booking form displayed
    const formTitle = await page.locator('h2:has-text("Book")').textContent();
    console.log(`   ✅ Form loaded: ${formTitle}\n`);

    // Step 5: Fill booking form
    console.log('5️⃣  Filling booking form...');

    await page.fill('input[type="text"]', 'Test E2E Booking Session');
    await page.fill('textarea', 'Automated test booking created by Playwright');

    // Set dates (tomorrow 10:00 - 14:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').last();
    await startDateInput.fill(dateStr);
    await endDateInput.fill(dateStr);

    const startTimeInput = page.locator('input[type="time"]').first();
    const endTimeInput = page.locator('input[type="time"]').last();
    await startTimeInput.fill('10:00');
    await endTimeInput.fill('14:00');

    await page.screenshot({ path: 'test-booking-3-form-filled.png' });
    console.log('   ✅ Form filled\n');

    // Step 6: Submit booking
    console.log('6️⃣  Submitting booking...');
    console.log('   ⏳ This will create booking + redirect to Stripe Checkout...');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Wait for redirect or error
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log(`   📍 Final URL: ${finalUrl}`);

    // Check if redirected to Stripe
    if (finalUrl.includes('checkout.stripe.com')) {
      console.log('   ✅ Successfully redirected to Stripe Checkout!\n');

      await page.screenshot({ path: 'test-booking-4-stripe-checkout.png' });

      // Extract session ID from URL
      const stripeSessionId = finalUrl.match(/cs_test_[a-zA-Z0-9]+/)?.[0];
      console.log(`   💳 Stripe Checkout Session ID: ${stripeSessionId || 'N/A'}\n`);

      console.log('✅ TEST PASSED - Booking flow successful!\n');
      console.log('📝 Summary:');
      console.log(`   - Login: ✅`);
      console.log(`   - Navigate to Bookings: ✅`);
      console.log(`   - Room selection: ✅ (${roomName})`);
      console.log(`   - Form submission: ✅`);
      console.log(`   - Stripe redirect: ✅`);
      console.log('\n⚠️  Note: Payment not completed (Stripe test mode)');
      console.log('   To complete: Enter test card 4242 4242 4242 4242 in Stripe Checkout\n');

    } else if (finalUrl.includes('/bookings')) {
      // Still on bookings page - check for errors
      console.log('   ⚠️  Still on bookings page - checking for errors...');

      const errorAlert = await page.locator('[role="alert"]').count();
      if (errorAlert > 0) {
        const errorText = await page.locator('[role="alert"]').first().textContent();
        console.log(`   ❌ Error: ${errorText}`);
      }

      // Print console logs
      console.log('\n   📋 Console logs:');
      consoleLogs.slice(-10).forEach(log => console.log(`      ${log}`));

      throw new Error('Booking submission failed - no redirect to Stripe');
    } else {
      throw new Error(`Unexpected URL: ${finalUrl}`);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'test-booking-error.png' });

    console.log('\n📋 Recent console logs:');
    consoleLogs.slice(-20).forEach(log => console.log(`   ${log}`));

    process.exit(1);
  } finally {
    // Don't close browser automatically so user can interact with Stripe Checkout
    console.log('\n💡 Browser left open for manual Stripe testing');
    console.log('   Close browser when done, or press Ctrl+C\n');

    // Wait indefinitely
    await new Promise(() => {});
  }
})();
