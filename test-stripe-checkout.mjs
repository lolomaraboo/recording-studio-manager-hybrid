#!/usr/bin/env node
/**
 * Automated Stripe Checkout Test with Playwright
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3001/api/trpc';
const CLIENT_EMAIL = 'test@example.com';
const CLIENT_PASSWORD = 'password123';
const BOOKING_ID = 8;

console.log('\n🧪 Testing Stripe Checkout Automation...\n');

// Get checkout URL
console.log('1️⃣  Getting checkout URL...');
const loginResponse = await fetch(`${BASE_URL}/clientPortalAuth.login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: CLIENT_EMAIL, password: CLIENT_PASSWORD }),
});

const loginData = await loginResponse.json();
const sessionToken = loginData.result.data.sessionToken;

const checkoutResponse = await fetch(`${BASE_URL}/clientPortalStripe.createDepositCheckout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionToken, bookingId: BOOKING_ID }),
});

const checkoutData = await checkoutResponse.json();
const checkoutUrl = checkoutData.result.data.checkoutUrl;
console.log('   ✅ Checkout URL retrieved');

// Launch browser
console.log('\n2️⃣  Launching browser...');
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Navigate to checkout
console.log('\n3️⃣  Navigating to Stripe Checkout...');
await page.goto(checkoutUrl);
await page.waitForTimeout(2000);

// Fill in test card
console.log('\n4️⃣  Filling payment form...');
try {
  // Wait for iframe to load
  await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 10000 });

  // Card number
  const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
  await cardFrame.locator('input[name="number"]').fill('4242424242424242');
  console.log('   ✅ Card number entered');

  // Expiry
  await cardFrame.locator('input[name="expiry"]').fill('1234');
  console.log('   ✅ Expiry entered');

  // CVC
  await cardFrame.locator('input[name="cvc"]').fill('123');
  console.log('   ✅ CVC entered');

  // Email (if visible)
  const emailInput = page.locator('input[name="email"]');
  if (await emailInput.isVisible()) {
    await emailInput.fill('test@example.com');
    console.log('   ✅ Email entered');
  }

  // Submit payment
  console.log('\n5️⃣  Submitting payment...');
  await page.click('button[type="submit"]');

  // Wait for success page
  console.log('   ⏳ Waiting for payment confirmation...');
  await page.waitForURL(/success|payment=success/, { timeout: 30000 });

  console.log('\n✅ Payment successful!');
  console.log('   URL:', page.url());

  // Wait a bit for webhook to process
  console.log('\n6️⃣  Waiting for webhook to process (5s)...');
  await page.waitForTimeout(5000);

} catch (error) {
  console.error('\n❌ Payment failed:', error.message);
  await page.screenshot({ path: 'stripe-checkout-error.png' });
  console.log('   Screenshot saved: stripe-checkout-error.png');
}

await browser.close();

// Check database for payment record
console.log('\n7️⃣  Checking database...');
console.log('   Run: docker exec rsm-postgres psql -U postgres -d tenant_1 -c "SELECT * FROM sessions WHERE id = 8;"');
console.log('   Expected: deposit_paid = true, payment_status = partial');

console.log('\n');
