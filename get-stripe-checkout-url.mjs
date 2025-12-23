#!/usr/bin/env node
/**
 * Get Stripe Checkout URL for testing
 */

const BASE_URL = 'http://localhost:3001/api/trpc';
const CLIENT_EMAIL = 'test@example.com';
const CLIENT_PASSWORD = 'password123';
const BOOKING_ID = 8; // Change this to the booking ID you want to pay for

// Login
const loginResponse = await fetch(`${BASE_URL}/clientPortalAuth.login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: CLIENT_EMAIL, password: CLIENT_PASSWORD }),
});

const loginData = await loginResponse.json();
const sessionToken = loginData.result.data.sessionToken;

// Get checkout URL
const checkoutResponse = await fetch(`${BASE_URL}/clientPortalStripe.createDepositCheckout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionToken, bookingId: BOOKING_ID }),
});

const checkoutData = await checkoutResponse.json();
const checkoutUrl = checkoutData.result.data.checkoutUrl;

console.log('\n💳 Stripe Checkout URL:');
console.log(checkoutUrl);
console.log('\n📝 Test Card: 4242 4242 4242 4242');
console.log('   Expiry: Any future date (e.g., 12/34)');
console.log('   CVC: Any 3 digits (e.g., 123)');
console.log('\n⏳ Open this URL in your browser to complete payment\n');
