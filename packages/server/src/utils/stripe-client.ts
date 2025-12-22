import Stripe from "stripe";

/**
 * Stripe Client Singleton
 *
 * Provides a configured Stripe instance for payment processing
 */

let stripeInstance: Stripe | null = null;

/**
 * Get Stripe client instance
 * Initializes on first call, returns cached instance on subsequent calls
 *
 * @returns {Stripe} Configured Stripe client
 * @throws {Error} If STRIPE_SECRET_KEY is not set
 */
export function getStripeClient(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is required for Stripe integration"
    );
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia", // Use latest API version
    typescript: true,
  });

  return stripeInstance;
}

/**
 * Verify Stripe webhook signature
 *
 * @param rawBody - Raw request body (Buffer or string)
 * @param signature - Stripe signature header
 * @returns {Stripe.Event} Parsed and verified Stripe event
 * @throws {Error} If signature is invalid or webhook secret is missing
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET environment variable is required for webhook verification"
    );
  }

  console.log("[Stripe] Webhook secret loaded:", webhookSecret.substring(0, 15) + "...");
  console.log("[Stripe] Raw body type:", typeof rawBody);
  console.log("[Stripe] Raw body is Buffer:", Buffer.isBuffer(rawBody));

  const stripe = getStripeClient();

  // Convert Buffer to string for Stripe verification
  const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  console.log("[Stripe] Body string length:", bodyString.length);

  return stripe.webhooks.constructEvent(bodyString, signature, webhookSecret);
}

/**
 * Calculate Stripe fee for a payment amount
 * Stripe charges 2.9% + 30¢ for standard cards
 *
 * @param amount - Payment amount in dollars
 * @returns {number} Estimated Stripe fee in dollars
 */
export function calculateStripeFee(amount: number): number {
  const percentageFee = amount * 0.029; // 2.9%
  const fixedFee = 0.3; // 30 cents
  return percentageFee + fixedFee;
}

/**
 * Format amount for Stripe
 * Stripe expects amounts in smallest currency unit (cents for USD)
 *
 * @param amount - Amount in dollars
 * @returns {number} Amount in cents (integer)
 */
export function formatStripeAmount(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Parse amount from Stripe
 * Converts cents to dollars
 *
 * @param amount - Amount in cents
 * @returns {number} Amount in dollars
 */
export function parseStripeAmount(amount: number): number {
  return amount / 100;
}

/**
 * Stripe payment statuses mapped to application statuses
 */
export const STRIPE_PAYMENT_STATUS = {
  SUCCEEDED: "succeeded",
  PENDING: "pending",
  FAILED: "failed",
  CANCELED: "canceled",
  REFUNDED: "refunded",
} as const;

export type StripePaymentStatus =
  (typeof STRIPE_PAYMENT_STATUS)[keyof typeof STRIPE_PAYMENT_STATUS];
