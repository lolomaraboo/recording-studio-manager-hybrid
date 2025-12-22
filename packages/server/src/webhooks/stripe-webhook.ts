import { Request, Response } from "express";
import Stripe from "stripe";
import { getTenantDb } from "@rsm/database/connection";
import {
  sessions,
  paymentTransactions,
  clientPortalActivityLogs,
  clients,
  rooms,
} from "@rsm/database/tenant/schema";
import { eq, and } from "drizzle-orm";
import {
  getStripeClient,
  verifyWebhookSignature,
  parseStripeAmount,
  calculateStripeFee,
} from "../utils/stripe-client";
import {
  sendPaymentReceiptEmail,
  sendBookingConfirmationEmail,
} from "../utils/email-service";

/**
 * Stripe Webhook Handler
 *
 * Processes Stripe webhook events:
 * - checkout.session.completed: Create payment transaction record
 * - payment_intent.succeeded: Update booking status
 * - charge.refunded: Handle refunds
 *
 * Security:
 * - Verifies webhook signature
 * - Validates organization_id from metadata
 * - Logs all webhook events
 */

/**
 * Main webhook handler endpoint
 *
 * Route: POST /api/webhooks/stripe
 *
 * @param req - Express request with raw body
 * @param res - Express response
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  console.log("[Stripe Webhook] Received webhook request");
  console.log("[Stripe Webhook] Body type:", typeof req.body);
  console.log("[Stripe Webhook] Body is Buffer:", Buffer.isBuffer(req.body));
  console.log("[Stripe Webhook] Body length:", req.body?.length || 0);

  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return res.status(400).json({
      error: "Missing stripe-signature header"
    });
  }

  console.log("[Stripe Webhook] Signature present, verifying...");

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    // req.body must be a Buffer or string for signature verification
    event = verifyWebhookSignature(req.body, signature);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({
      error: `Webhook signature verification failed: ${err.message}`
    });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  try {
    // Route to appropriate handler
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true, eventType: event.type });
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);

    // Return 500 to tell Stripe to retry
    res.status(500).json({
      error: "Webhook processing failed",
      eventType: event.type,
      message: err.message
    });
  }
}

/**
 * Handle checkout.session.completed event
 *
 * Triggered when:
 * - Customer completes payment in Checkout
 * - Payment is successfully authorized
 *
 * Actions:
 * - Create payment transaction record
 * - Link to booking via metadata
 * - Log activity
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  console.log(`[Stripe Webhook] Processing checkout.session.completed: ${session.id}`);

  // Extract metadata
  const organizationId = parseInt(session.metadata?.organization_id || "0");
  const bookingId = parseInt(session.metadata?.booking_id || "0");
  const clientId = parseInt(session.metadata?.client_id || "0");
  const paymentType = session.metadata?.payment_type || "unknown"; // "deposit" | "balance"

  if (!organizationId || !bookingId || !clientId) {
    console.error("[Stripe Webhook] Missing required metadata in checkout session:", {
      organizationId,
      bookingId,
      clientId,
      sessionId: session.id,
    });
    throw new Error("Missing required metadata in checkout session");
  }

  const tenantDb = await getTenantDb(organizationId);

  // Get booking with client and room details for email
  const bookingList = await tenantDb
    .select({
      session: sessions,
      client: clients,
      room: rooms,
    })
    .from(sessions)
    .innerJoin(clients, eq(sessions.clientId, clients.id))
    .innerJoin(rooms, eq(sessions.roomId, rooms.id))
    .where(
      and(
        eq(sessions.id, bookingId),
        eq(sessions.clientId, clientId)
      )
    )
    .limit(1);

  if (bookingList.length === 0) {
    console.error("[Stripe Webhook] Booking not found:", { bookingId, clientId });
    throw new Error(`Booking ${bookingId} not found`);
  }

  const { session: booking, client, room } = bookingList[0];

  // Get payment intent
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(
    session.payment_intent as string
  );

  // Calculate amounts
  const amount = parseStripeAmount(paymentIntent.amount);
  const stripeFee = calculateStripeFee(amount);
  const netAmount = amount - stripeFee;

  // Create payment transaction record
  const [paymentTransaction] = await tenantDb
    .insert(paymentTransactions)
    .values({
      clientId,
      sessionId: bookingId,
      stripePaymentIntentId: paymentIntent.id,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: session.customer as string | null,
      amount: amount.toFixed(2),
      currency: paymentIntent.currency,
      paymentType,
      status: "succeeded",
      stripeStatus: paymentIntent.status,
      paymentMethod: paymentIntent.payment_method_types[0] || null,
      stripeFee: stripeFee.toFixed(2),
      netAmount: netAmount.toFixed(2),
      description: `${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} payment for booking "${booking.title}"`,
      metadata: JSON.stringify({
        checkoutSessionId: session.id,
        customerEmail: session.customer_details?.email,
        paymentType,
      }),
      paidAt: new Date(),
    })
    .returning();

  console.log(`[Stripe Webhook] Created payment transaction: ${paymentTransaction.id}`);

  // Update booking payment status
  if (paymentType === "deposit") {
    // Mark deposit as paid
    await tenantDb
      .update(sessions)
      .set({
        depositPaid: true,
        paymentStatus: "partial", // Deposit paid, balance remaining
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntent.id,
      })
      .where(eq(sessions.id, bookingId));

    console.log(`[Stripe Webhook] Updated booking ${bookingId}: deposit paid, status=partial`);
  } else if (paymentType === "balance") {
    // Mark booking as fully paid
    await tenantDb
      .update(sessions)
      .set({
        paymentStatus: "paid", // Fully paid
        stripePaymentIntentId: paymentIntent.id,
      })
      .where(eq(sessions.id, bookingId));

    console.log(`[Stripe Webhook] Updated booking ${bookingId}: fully paid`);
  }

  // Log activity
  await tenantDb.insert(clientPortalActivityLogs).values({
    clientId,
    action: "payment_completed",
    description: `${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} payment completed for booking "${booking.title}"`,
    resourceType: "session",
    resourceId: bookingId,
    metadata: JSON.stringify({
      paymentTransactionId: paymentTransaction.id,
      amount,
      paymentType,
      stripePaymentIntentId: paymentIntent.id,
    }),
    status: "success",
  });

  // Send payment receipt email
  if (client.email) {
    try {
      await sendPaymentReceiptEmail(client.email, client.name, {
        id: paymentTransaction.id,
        bookingTitle: booking.title || "Studio Session",
        amount: amount.toFixed(2),
        paymentType,
        last4: null, // Will be updated later in payment_intent.succeeded
        brand: null,
        paidAt: new Date(),
      });
    } catch (emailError: any) {
      console.error(`[Stripe Webhook] Failed to send payment receipt email:`, emailError);
      // Don't throw - email failure shouldn't fail the webhook
    }
  }

  // Send booking confirmation email if this was a deposit payment
  if (paymentType === "deposit" && client.email) {
    try {
      const totalAmount = parseFloat(booking.totalAmount || "0");
      const depositAmount = totalAmount * 0.3;

      await sendBookingConfirmationEmail(client.email, client.name, {
        id: booking.id,
        title: booking.title || "Studio Session",
        roomName: room.name,
        startTime: new Date(booking.startTime),
        endTime: new Date(booking.endTime),
        totalAmount: totalAmount.toFixed(2),
        depositAmount: depositAmount.toFixed(2),
      });
    } catch (emailError: any) {
      console.error(`[Stripe Webhook] Failed to send booking confirmation email:`, emailError);
      // Don't throw - email failure shouldn't fail the webhook
    }
  }

  console.log(`[Stripe Webhook] Successfully processed checkout.session.completed for booking ${bookingId}`);
}

/**
 * Handle payment_intent.succeeded event
 *
 * Triggered when:
 * - Payment is successfully captured
 *
 * Actions:
 * - Update booking status if deposit payment
 * - Mark as fully paid if balance payment
 */
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log(`[Stripe Webhook] Processing payment_intent.succeeded: ${paymentIntent.id}`);

  // Extract metadata
  const organizationId = parseInt(paymentIntent.metadata?.organization_id || "0");
  const bookingId = parseInt(paymentIntent.metadata?.booking_id || "0");
  const clientId = parseInt(paymentIntent.metadata?.client_id || "0");

  if (!organizationId || !bookingId || !clientId) {
    console.error("[Stripe Webhook] Missing required metadata in payment intent:", {
      organizationId,
      bookingId,
      clientId,
      paymentIntentId: paymentIntent.id,
    });
    // Don't throw - this might be a payment not related to bookings
    return;
  }

  const tenantDb = await getTenantDb(organizationId);

  // Get payment transaction to determine type
  const paymentTransactionList = await tenantDb
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.stripePaymentIntentId, paymentIntent.id))
    .limit(1);

  if (paymentTransactionList.length === 0) {
    console.warn(`[Stripe Webhook] No payment transaction found for payment intent ${paymentIntent.id}`);
    return;
  }

  const paymentTransaction = paymentTransactionList[0];
  const paymentType = paymentTransaction.paymentType;

  // Update booking status based on payment type
  if (paymentType === "deposit") {
    // Deposit paid -> set booking to "scheduled" (confirmed)
    await tenantDb
      .update(sessions)
      .set({
        status: "scheduled",
        notes: `Deposit paid on ${new Date().toISOString()}`,
      })
      .where(eq(sessions.id, bookingId));

    console.log(`[Stripe Webhook] Booking ${bookingId} confirmed (deposit paid)`);
  } else if (paymentType === "balance") {
    // Balance paid -> booking is fully paid
    await tenantDb
      .update(sessions)
      .set({
        notes: `Fully paid on ${new Date().toISOString()}`,
      })
      .where(eq(sessions.id, bookingId));

    console.log(`[Stripe Webhook] Booking ${bookingId} fully paid (balance paid)`);
  }

  // Update payment transaction with latest payment method details
  const stripe = getStripeClient();
  const charges = await stripe.charges.list({
    payment_intent: paymentIntent.id,
    limit: 1,
  });

  if (charges.data.length > 0) {
    const charge = charges.data[0];
    const paymentMethod = charge.payment_method_details;

    await tenantDb
      .update(paymentTransactions)
      .set({
        status: "succeeded",
        stripeStatus: paymentIntent.status,
        last4: paymentMethod?.card?.last4 || null,
        brand: paymentMethod?.card?.brand || null,
      })
      .where(eq(paymentTransactions.id, paymentTransaction.id));
  }

  console.log(`[Stripe Webhook] Successfully processed payment_intent.succeeded for booking ${bookingId}`);
}

/**
 * Handle charge.refunded event
 *
 * Triggered when:
 * - A charge is refunded (full or partial)
 *
 * Actions:
 * - Update payment transaction with refund info
 * - Log refund activity
 */
async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;

  console.log(`[Stripe Webhook] Processing charge.refunded: ${charge.id}`);

  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.warn("[Stripe Webhook] Charge has no payment_intent, skipping");
    return;
  }

  // Get payment intent to access metadata
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  const organizationId = parseInt(paymentIntent.metadata?.organization_id || "0");
  const bookingId = parseInt(paymentIntent.metadata?.booking_id || "0");
  const clientId = parseInt(paymentIntent.metadata?.client_id || "0");

  if (!organizationId || !bookingId || !clientId) {
    console.error("[Stripe Webhook] Missing metadata in refunded charge");
    return;
  }

  const tenantDb = await getTenantDb(organizationId);

  // Get payment transaction
  const paymentTransactionList = await tenantDb
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.stripePaymentIntentId, paymentIntentId))
    .limit(1);

  if (paymentTransactionList.length === 0) {
    console.warn(`[Stripe Webhook] No payment transaction found for refunded charge ${charge.id}`);
    return;
  }

  const paymentTransaction = paymentTransactionList[0];
  const refundedAmount = parseStripeAmount(charge.amount_refunded);
  const isFullRefund = charge.amount_refunded === charge.amount;

  // Update payment transaction
  await tenantDb
    .update(paymentTransactions)
    .set({
      status: isFullRefund ? "refunded" : "partially_refunded",
      refundedAmount: refundedAmount.toFixed(2),
      refundedAt: new Date(),
      refundReason: "Refunded via Stripe",
    })
    .where(eq(paymentTransactions.id, paymentTransaction.id));

  // Log activity
  await tenantDb.insert(clientPortalActivityLogs).values({
    clientId,
    action: "payment_refunded",
    description: `${isFullRefund ? "Full" : "Partial"} refund processed ($${refundedAmount.toFixed(2)})`,
    resourceType: "session",
    resourceId: bookingId,
    metadata: JSON.stringify({
      paymentTransactionId: paymentTransaction.id,
      refundedAmount,
      isFullRefund,
      chargeId: charge.id,
    }),
    status: "success",
  });

  console.log(`[Stripe Webhook] Successfully processed refund for payment transaction ${paymentTransaction.id}`);
}

/**
 * Handle payment_intent.payment_failed event
 *
 * Triggered when:
 * - Payment fails (card declined, insufficient funds, etc.)
 *
 * Actions:
 * - Create failed payment transaction record
 * - Log failure
 */
async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log(`[Stripe Webhook] Processing payment_intent.payment_failed: ${paymentIntent.id}`);

  const organizationId = parseInt(paymentIntent.metadata?.organization_id || "0");
  const bookingId = parseInt(paymentIntent.metadata?.booking_id || "0");
  const clientId = parseInt(paymentIntent.metadata?.client_id || "0");

  if (!organizationId || !bookingId || !clientId) {
    console.error("[Stripe Webhook] Missing metadata in failed payment intent");
    return;
  }

  const tenantDb = await getTenantDb(organizationId);

  // Check if payment transaction already exists
  const existingTransaction = await tenantDb
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.stripePaymentIntentId, paymentIntent.id))
    .limit(1);

  if (existingTransaction.length > 0) {
    // Update existing transaction
    await tenantDb
      .update(paymentTransactions)
      .set({
        status: "failed",
        stripeStatus: paymentIntent.status,
        errorCode: paymentIntent.last_payment_error?.code || null,
        errorMessage: paymentIntent.last_payment_error?.message || null,
      })
      .where(eq(paymentTransactions.id, existingTransaction[0].id));
  } else {
    // Create failed transaction record
    const amount = parseStripeAmount(paymentIntent.amount);

    await tenantDb.insert(paymentTransactions).values({
      clientId,
      sessionId: bookingId,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: paymentIntent.customer as string | null,
      amount: amount.toFixed(2),
      currency: paymentIntent.currency,
      paymentType: "deposit", // Default to deposit
      status: "failed",
      stripeStatus: paymentIntent.status,
      errorCode: paymentIntent.last_payment_error?.code || null,
      errorMessage: paymentIntent.last_payment_error?.message || null,
      description: `Failed payment for booking ${bookingId}`,
    });
  }

  // Log activity
  await tenantDb.insert(clientPortalActivityLogs).values({
    clientId,
    action: "payment_failed",
    description: `Payment failed: ${paymentIntent.last_payment_error?.message || "Unknown error"}`,
    resourceType: "session",
    resourceId: bookingId,
    metadata: JSON.stringify({
      errorCode: paymentIntent.last_payment_error?.code,
      errorMessage: paymentIntent.last_payment_error?.message,
      paymentIntentId: paymentIntent.id,
    }),
    status: "error",
  });

  console.log(`[Stripe Webhook] Recorded payment failure for booking ${bookingId}`);
}
