/**
 * Stripe Integration Module
 *
 * Handles payment processing for invoices:
 * - Create payment intents
 * - Create checkout sessions
 * - Handle webhooks
 * - Process refunds
 */

import Stripe from 'stripe';

// Initialize Stripe with API key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not set - payment features will be disabled');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })
  : null;

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return stripe !== null;
}

/**
 * Create a checkout session for invoice payment
 */
export async function createCheckoutSession(params: {
  invoiceId: number;
  invoiceNumber: string;
  amount: number; // in cents
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) {
    console.error('Stripe not configured');
    return null;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: `Invoice ${params.invoiceNumber}`,
            description: `Payment for invoice ${params.invoiceNumber}`,
          },
          unit_amount: params.amount, // amount in cents
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      invoiceId: params.invoiceId.toString(),
      invoiceNumber: params.invoiceNumber,
      ...params.metadata,
    },
  });

  return session;
}

/**
 * Create a payment intent for custom payment flow
 */
export async function createPaymentIntent(params: {
  amount: number; // in cents
  currency: string;
  invoiceId: number;
  invoiceNumber: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) {
    console.error('Stripe not configured');
    return null;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency.toLowerCase(),
    receipt_email: params.customerEmail,
    metadata: {
      invoiceId: params.invoiceId.toString(),
      invoiceNumber: params.invoiceNumber,
      ...params.metadata,
    },
  });

  return paymentIntent;
}

/**
 * Retrieve a payment intent
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) return null;
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) return null;
  return stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Create a refund for a payment
 */
export async function createRefund(params: {
  paymentIntentId: string;
  amount?: number; // in cents (optional, full refund if not specified)
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}): Promise<Stripe.Refund | null> {
  if (!stripe) return null;

  const refund = await stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: params.amount,
    reason: params.reason,
  });

  return refund;
}

/**
 * Construct webhook event from raw body and signature
 */
export function constructWebhookEvent(
  rawBody: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event | null {
  if (!stripe) return null;

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return null;
  }
}

/**
 * Get Stripe public key for frontend
 */
export function getPublishableKey(): string | null {
  return process.env.STRIPE_PUBLISHABLE_KEY || null;
}
