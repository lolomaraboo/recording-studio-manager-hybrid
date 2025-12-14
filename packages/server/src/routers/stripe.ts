import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { invoices } from '@rsm/database/tenant';
import {
  isStripeConfigured,
  createCheckoutSession,
  createPaymentIntent,
  getCheckoutSession,
  getPublishableKey,
} from '../_core/stripe';

/**
 * Stripe Router
 *
 * Payment processing endpoints:
 * - config: Get Stripe publishable key
 * - createCheckoutSession: Create Stripe checkout for invoice
 * - createPaymentIntent: Create payment intent for custom flow
 * - verifyPayment: Verify and update invoice after payment
 */
export const stripeRouter = router({
  /**
   * Get Stripe configuration (public key)
   */
  config: publicProcedure.query(() => {
    const publishableKey = getPublishableKey();
    return {
      isConfigured: isStripeConfigured(),
      publishableKey,
    };
  }),

  /**
   * Create a Stripe Checkout session for an invoice
   * Redirects client to Stripe-hosted payment page
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isStripeConfigured()) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Stripe is not configured',
        });
      }

      const tenantDb = await ctx.getTenantDb();

      // Get the invoice
      const [invoice] = await tenantDb
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      // Check if invoice is payable
      if (invoice.status === 'paid') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invoice is already paid',
        });
      }

      if (invoice.status === 'cancelled') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invoice has been cancelled',
        });
      }

      // Convert amount to cents
      const amountInCents = Math.round(parseFloat(invoice.total) * 100);

      // Get client email (we need to fetch it from clients table)
      // For now, use a placeholder or get from context
      const customerEmail = ctx.user?.email || 'customer@example.com';

      const session = await createCheckoutSession({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: amountInCents,
        currency: 'usd', // TODO: Make configurable per organization
        customerEmail,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        metadata: {
          organizationId: ctx.organizationId?.toString() || '',
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session',
        });
      }

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  /**
   * Create a Payment Intent for custom payment flow
   * Returns client secret for Stripe Elements
   */
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isStripeConfigured()) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Stripe is not configured',
        });
      }

      const tenantDb = await ctx.getTenantDb();

      // Get the invoice
      const [invoice] = await tenantDb
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      if (invoice.status === 'paid') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invoice is already paid',
        });
      }

      // Convert amount to cents
      const amountInCents = Math.round(parseFloat(invoice.total) * 100);

      const paymentIntent = await createPaymentIntent({
        amount: amountInCents,
        currency: 'usd',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerEmail: ctx.user?.email,
        metadata: {
          organizationId: ctx.organizationId?.toString() || '',
        },
      });

      if (!paymentIntent) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create payment intent',
        });
      }

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    }),

  /**
   * Verify payment and update invoice status
   * Called after successful payment to mark invoice as paid
   */
  verifyPayment: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        paymentIntentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isStripeConfigured()) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Stripe is not configured',
        });
      }

      if (!input.sessionId && !input.paymentIntentId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either sessionId or paymentIntentId is required',
        });
      }

      let invoiceId: number | null = null;
      let paymentStatus: string | null = null;

      // Verify checkout session
      if (input.sessionId) {
        const session = await getCheckoutSession(input.sessionId);
        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Checkout session not found',
          });
        }

        paymentStatus = session.payment_status;
        invoiceId = session.metadata?.invoiceId
          ? parseInt(session.metadata.invoiceId)
          : null;
      }

      if (!invoiceId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Could not determine invoice from payment',
        });
      }

      // Update invoice if payment was successful
      if (paymentStatus === 'paid') {
        const tenantDb = await ctx.getTenantDb();

        await tenantDb
          .update(invoices)
          .set({
            status: 'paid',
            paidAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));

        return {
          success: true,
          invoiceId,
          status: 'paid',
        };
      }

      return {
        success: false,
        invoiceId,
        status: paymentStatus,
      };
    }),
});
