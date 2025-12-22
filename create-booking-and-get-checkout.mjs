#!/usr/bin/env node
/**
 * Create booking and get Stripe checkout URL
 */

const BASE_URL = 'http://localhost:3001/api/trpc';
const CLIENT_EMAIL = 'test@example.com';
const CLIENT_PASSWORD = 'password123';

console.log('\n🎫 Creating booking and getting Stripe checkout URL...\n');

// Step 1: Login
console.log('1️⃣  Logging in...');
const loginResponse = await fetch(`${BASE_URL}/clientPortalAuth.login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: CLIENT_EMAIL, password: CLIENT_PASSWORD }),
});

const loginData = await loginResponse.json();
const sessionToken = loginData.result.data.sessionToken;
console.log('   ✅ Logged in');

// Step 2: Create booking
console.log('\n2️⃣  Creating booking...');
const bookingResponse = await fetch(`${BASE_URL}/clientPortalBooking.createBooking`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionToken,
    roomId: 1,
    title: 'Final Stripe Payment Test',
    description: 'Testing complete webhook flow',
    startTime: '2025-12-23T14:00:00.000Z',
    endTime: '2025-12-23T18:00:00.000Z',
  }),
});

const bookingData = await bookingResponse.json();
const booking = bookingData.result.data.booking;
console.log('   ✅ Booking created:', {
  id: booking.id,
  total: booking.totalAmount,
  deposit: booking.depositAmount,
});

// Step 3: Get Stripe checkout URL
console.log('\n3️⃣  Creating Stripe checkout session...');
const checkoutResponse = await fetch(`${BASE_URL}/clientPortalStripe.createDepositCheckout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionToken, bookingId: booking.id }),
});

const checkoutData = await checkoutResponse.json();
const checkoutUrl = checkoutData.result.data.checkoutUrl;

console.log('   ✅ Checkout URL:\n');
console.log(checkoutUrl);
console.log('\n📝 To complete payment:');
console.log('   1. Open URL in browser');
console.log('   2. Use test card: 4242 4242 4242 4242');
console.log('   3. Expiry: 12/34, CVC: 123');
console.log('   4. Email: test@example.com');
console.log('\n⏳ Webhook will automatically update booking status\n');
console.log('📊 Check booking status:');
console.log(`   docker exec rsm-postgres psql -U postgres -d tenant_1 -c "SELECT id, title, deposit_paid, payment_status FROM sessions WHERE id = ${booking.id};"\n`);
