#!/usr/bin/env node
/**
 * Test Stripe Payment Flow E2E
 *
 * This script:
 * 1. Logs in as test client
 * 2. Creates a booking
 * 3. Initiates Stripe checkout
 * 4. Simulates successful payment using Stripe CLI
 * 5. Verifies webhook processed correctly
 * 6. Checks database for payment records
 */

const BASE_URL = 'http://localhost:3001/api/trpc';
const CLIENT_EMAIL = 'test@example.com';
const CLIENT_PASSWORD = 'password123';

console.log('\n🧪 Testing Stripe Payment Flow E2E...\n');

// Step 1: Login
console.log('1️⃣  Logging in...');
const loginResponse = await fetch(`${BASE_URL}/clientPortalAuth.login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: CLIENT_EMAIL,
    password: CLIENT_PASSWORD,
  }),
});

if (!loginResponse.ok) {
  console.error('❌ Login failed');
  process.exit(1);
}

const loginData = await loginResponse.json();
const sessionToken = loginData.result.data.sessionToken;
console.log('   ✅ Logged in successfully');

// Step 2: Create booking
console.log('\n2️⃣  Creating booking...');
const bookingResponse = await fetch(`${BASE_URL}/clientPortalBooking.createBooking`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionToken,
    roomId: 1,
    title: 'Stripe Payment Test Booking',
    description: 'Testing E2E Stripe payment flow',
    startTime: '2025-12-23T10:00:00.000Z',
    endTime: '2025-12-23T14:00:00.000Z',
    notes: 'Test booking for payment verification',
  }),
});

if (!bookingResponse.ok) {
  console.error('❌ Booking creation failed');
  const error = await bookingResponse.text();
  console.error(error);
  process.exit(1);
}

const bookingData = await bookingResponse.json();
const booking = bookingData.result.data.booking;
console.log('   ✅ Booking created:', {
  id: booking.id,
  title: booking.title,
  totalAmount: booking.totalAmount,
  depositAmount: booking.depositAmount,
});

// Step 3: Create Stripe checkout session
console.log('\n3️⃣  Creating Stripe checkout...');
const checkoutResponse = await fetch(`${BASE_URL}/clientPortalStripe.createDepositCheckout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionToken,
    bookingId: booking.id,
  }),
});

if (!checkoutResponse.ok) {
  console.error('❌ Checkout creation failed');
  const error = await checkoutResponse.text();
  console.error(error);
  process.exit(1);
}

const checkoutData = await checkoutResponse.json();
const checkoutSessionId = checkoutData.result.data.checkoutSessionId;
console.log('   ✅ Checkout session created:', {
  id: checkoutSessionId,
  depositAmount: checkoutData.result.data.deposit.amount,
  stripeFee: checkoutData.result.data.deposit.stripeFee,
});

// Step 4: Simulate successful payment with Stripe CLI
console.log('\n4️⃣  Simulating successful payment...');
console.log('   💡 Use Stripe CLI to trigger payment:');
console.log(`   stripe trigger checkout.session.completed --override checkout_session:id=${checkoutSessionId}`);
console.log('\n   Waiting 10 seconds for manual trigger...');
console.log('   (Press Ctrl+C if you want to skip)');

await new Promise(resolve => setTimeout(resolve, 10000));

// Step 5: Check booking status
console.log('\n5️⃣  Checking booking status...');
const statusResponse = await fetch(`${BASE_URL}/clientPortalBooking.listMyBookings?input=${encodeURIComponent(JSON.stringify({ sessionToken, limit: 10 }))}`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
});

if (!statusResponse.ok) {
  console.error('❌ Failed to get booking status');
  process.exit(1);
}

const statusData = await statusResponse.json();
const updatedBooking = statusData.result.data.bookings.find(b => b.session.id === booking.id);

if (updatedBooking) {
  console.log('   📊 Booking status:', {
    id: updatedBooking.session.id,
    title: updatedBooking.session.title,
    status: updatedBooking.session.status,
    paymentStatus: updatedBooking.session.paymentStatus,
    depositPaid: updatedBooking.session.depositPaid,
  });

  if (updatedBooking.session.depositPaid === true) {
    console.log('\n✅ TEST PASSED - Payment successfully processed!');
    console.log('\n📝 Summary:');
    console.log('   - Booking created: ✅');
    console.log('   - Stripe checkout: ✅');
    console.log('   - Payment webhook: ✅');
    console.log('   - Database updated: ✅');
  } else {
    console.log('\n⚠️  Payment not yet processed by webhook');
    console.log('   Run this command to trigger payment:');
    console.log(`   stripe trigger checkout.session.completed --override checkout_session:id=${checkoutSessionId}`);
  }
} else {
  console.error('❌ Booking not found in list');
}

console.log('\n');
