import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import {
  clients,
  sessions,
  rooms,
  clientPortalSessions,
  clientPortalActivityLogs,
} from "@rsm/database/tenant/schema";
import { getTenantDb } from "@rsm/database/connection";
import { eq, and } from "drizzle-orm";
import { isTokenExpired } from "../utils/client-portal-auth";
import {
  getStripeClient,
  formatStripeAmount,
  parseStripeAmount,
  calculateStripeFee,
} from "../utils/stripe-client";

/**
 * Extract organization ID from hostname
 * Development: localhost → org 1
 * Production: subdomain → query master DB (TODO)
 */
function getOrganizationIdFromHostname(hostname: string): number {
  // Development: localhost always maps to organization 1
  if (hostname === "localhost" || hostname.startsWith("localhost:")) {
    return 1;
  }

  // Production: Extract subdomain and query master DB
  // TODO: Implement subdomain → organization lookup from master DB
  // For now, return 1 as fallback
  return 1;
}

/**
 * Middleware helper to validate client portal session
 */
async function validateClientSession(
  organizationId: number,
  sessionToken: string
): Promise<number> {
  const tenantDb = await getTenantDb(organizationId);

  const sessionList = await tenantDb
    .select()
    .from(clientPortalSessions)
    .where(eq(clientPortalSessions.token, sessionToken))
    .limit(1);

  if (sessionList.length === 0) {
    throw new Error("Invalid session");
  }

  const session = sessionList[0];

  if (isTokenExpired(session.expiresAt)) {
    await tenantDb
      .delete(clientPortalSessions)
      .where(eq(clientPortalSessions.id, session.id));
    throw new Error("Session expired");
  }

  await tenantDb
    .update(clientPortalSessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(clientPortalSessions.id, session.id));

  return session.clientId;
}

/**
 * Client Portal Stripe Router
 *
 * Handles payment processing for booking deposits:
 * - Create checkout sessions for deposits
 * - Handle successful payments
 * - Process refunds
 * - View payment history
 */
export const clientPortalStripeRouter = router({
  /**
   * Create Stripe Checkout Session for booking deposit
   *
   * Deposit policy: 30% of total booking amount
   */
  createDepositCheckout: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        bookingId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[createDepositCheckout] Request:', { bookingId: input.bookingId });

        const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);
        console.log('[createDepositCheckout] Organization ID:', organizationId);

        const clientId = await validateClientSession(
          organizationId,
          input.sessionToken
        );
        console.log('[createDepositCheckout] Client ID:', clientId);

        const tenantDb = await getTenantDb(organizationId);
        console.log('[createDepositCheckout] Tenant DB connected');

        const stripe = getStripeClient();
        console.log('[createDepositCheckout] Stripe client initialized');

      // Get booking (verify ownership)
      const bookingList = await tenantDb
        .select({
          session: sessions,
          room: rooms,
          client: clients,
        })
        .from(sessions)
        .innerJoin(rooms, eq(sessions.roomId, rooms.id))
        .innerJoin(clients, eq(sessions.clientId, clients.id))
        .where(
          and(eq(sessions.id, input.bookingId), eq(sessions.clientId, clientId))
        )
        .limit(1);

      if (bookingList.length === 0) {
        throw new Error("Booking not found or access denied");
      }

      const { session: booking, room, client } = bookingList[0];

      // Check if booking can accept deposit
      if (booking.status === "cancelled") {
        throw new Error("Cannot pay deposit for cancelled booking");
      }

      if (booking.status === "completed") {
        throw new Error("Cannot pay deposit for completed booking");
      }

      // Calculate deposit amount (30% of total)
      const totalAmount = parseFloat(booking.totalAmount || "0");
      const depositAmount = totalAmount * 0.3;
      const depositAmountCents = formatStripeAmount(depositAmount);

      if (depositAmountCents < 50) {
        // Stripe minimum is $0.50
        throw new Error("Deposit amount is too low (minimum $0.50)");
      }

      // Calculate Stripe fee
      const stripeFee = calculateStripeFee(depositAmount);

      // Create or retrieve Stripe customer
      let stripeCustomerId: string | null = null;

      // TODO: Store stripeCustomerId in clients table
      // For now, create a new customer each time or search by email
      if (client.email) {
        const existingCustomers = await stripe.customers.list({
          email: client.email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          stripeCustomerId = existingCustomers.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            email: client.email,
            name: client.name,
            metadata: {
              client_id: client.id.toString(),
              organization_id: organizationId.toString(),
            },
          });
          stripeCustomerId = customer.id;
        }
      }

      // Create Checkout Session
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId || undefined,
        customer_email: !stripeCustomerId && client.email ? client.email : undefined,
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Booking Deposit - ${booking.title}`,
                description: `30% deposit for ${room.name} on ${new Date(booking.startTime).toLocaleDateString()}`,
                metadata: {
                  booking_id: booking.id.toString(),
                  room_name: room.name,
                },
              },
              unit_amount: depositAmountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          booking_id: booking.id.toString(),
          client_id: clientId.toString(),
          organization_id: organizationId.toString(),
          payment_type: "deposit",
          total_amount: totalAmount.toFixed(2),
          deposit_amount: depositAmount.toFixed(2),
        },
        success_url: `${process.env.CLIENT_PORTAL_URL || "http://localhost:3000"}/bookings/${booking.id}?payment=success`,
        cancel_url: `${process.env.CLIENT_PORTAL_URL || "http://localhost:3000"}/bookings/${booking.id}?payment=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
        payment_intent_data: {
          metadata: {
            booking_id: booking.id.toString(),
            client_id: clientId.toString(),
            organization_id: organizationId.toString(),
          },
        },
      });

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "create_payment_checkout",
        description: `Created payment checkout for booking "${booking.title}"`,
        resourceType: "session",
        resourceId: booking.id,
        metadata: JSON.stringify({
          checkoutSessionId: checkoutSession.id,
          depositAmount,
          stripeFee,
        }),
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      console.log('[createDepositCheckout] Checkout session created:', checkoutSession.id);

      return {
        checkoutUrl: checkoutSession.url,
        checkoutSessionId: checkoutSession.id,
        deposit: {
          amount: depositAmount,
          stripeFee,
          total: totalAmount,
          percentage: 30,
        },
        expiresAt: new Date(checkoutSession.expires_at * 1000),
      };
    } catch (error) {
      console.error('[createDepositCheckout] ERROR:', error);
      throw error;
    }
  }),

  /**
   * Create Stripe Checkout Session for remaining balance
   * Called after deposit is paid and booking is confirmed
   */
  createBalanceCheckout: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        bookingId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);
      const stripe = getStripeClient();

      // Get booking (verify ownership)
      const bookingList = await tenantDb
        .select({
          session: sessions,
          room: rooms,
          client: clients,
        })
        .from(sessions)
        .innerJoin(rooms, eq(sessions.roomId, rooms.id))
        .innerJoin(clients, eq(sessions.clientId, clients.id))
        .where(
          and(eq(sessions.id, input.bookingId), eq(sessions.clientId, clientId))
        )
        .limit(1);

      if (bookingList.length === 0) {
        throw new Error("Booking not found or access denied");
      }

      const { session: booking, room, client } = bookingList[0];

      // Validate booking status
      if (booking.status !== "scheduled") {
        throw new Error(
          "Can only pay balance for confirmed bookings. Please pay deposit first."
        );
      }

      // Calculate remaining balance (70% of total)
      const totalAmount = parseFloat(booking.totalAmount || "0");
      const depositAmount = totalAmount * 0.3;
      const balanceAmount = totalAmount - depositAmount;
      const balanceAmountCents = formatStripeAmount(balanceAmount);

      if (balanceAmountCents < 50) {
        throw new Error("Balance amount is too low (minimum $0.50)");
      }

      // Calculate Stripe fee
      const stripeFee = calculateStripeFee(balanceAmount);

      // Get or create Stripe customer
      let stripeCustomerId: string | null = null;

      if (client.email) {
        const existingCustomers = await stripe.customers.list({
          email: client.email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          stripeCustomerId = existingCustomers.data[0].id;
        }
      }

      // Create Checkout Session
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId || undefined,
        customer_email: !stripeCustomerId && client.email ? client.email : undefined,
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Booking Balance - ${booking.title}`,
                description: `Remaining 70% for ${room.name} on ${new Date(booking.startTime).toLocaleDateString()}`,
                metadata: {
                  booking_id: booking.id.toString(),
                  room_name: room.name,
                },
              },
              unit_amount: balanceAmountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          booking_id: booking.id.toString(),
          client_id: clientId.toString(),
          organization_id: organizationId.toString(),
          payment_type: "balance",
          total_amount: totalAmount.toFixed(2),
          balance_amount: balanceAmount.toFixed(2),
        },
        success_url: `${process.env.CLIENT_PORTAL_URL || "http://localhost:3000"}/bookings/${booking.id}?payment=success`,
        cancel_url: `${process.env.CLIENT_PORTAL_URL || "http://localhost:3000"}/bookings/${booking.id}?payment=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
        payment_intent_data: {
          metadata: {
            booking_id: booking.id.toString(),
            client_id: clientId.toString(),
            organization_id: organizationId.toString(),
          },
        },
      });

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "create_balance_checkout",
        description: `Created balance payment checkout for booking "${booking.title}"`,
        resourceType: "session",
        resourceId: booking.id,
        metadata: JSON.stringify({
          checkoutSessionId: checkoutSession.id,
          balanceAmount,
          stripeFee,
        }),
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        checkoutUrl: checkoutSession.url,
        checkoutSessionId: checkoutSession.id,
        balance: {
          amount: balanceAmount,
          stripeFee,
          total: totalAmount,
          percentage: 70,
        },
        expiresAt: new Date(checkoutSession.expires_at * 1000),
      };
    }),

  /**
   * Get payment status for a booking
   * Returns information about deposits and payments
   */
  getBookingPaymentStatus: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        bookingId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Get booking (verify ownership)
      const bookingList = await tenantDb
        .select()
        .from(sessions)
        .where(
          and(eq(sessions.id, input.bookingId), eq(sessions.clientId, clientId))
        )
        .limit(1);

      if (bookingList.length === 0) {
        throw new Error("Booking not found or access denied");
      }

      const booking = bookingList[0];
      const totalAmount = parseFloat(booking.totalAmount || "0");
      const depositAmount = totalAmount * 0.3;
      const balanceAmount = totalAmount * 0.7;

      // TODO: Query payment transactions from database
      // For now, return calculated amounts
      return {
        bookingId: booking.id,
        totalAmount,
        deposit: {
          amount: depositAmount,
          required: true,
          paid: false, // TODO: Check payment records
        },
        balance: {
          amount: balanceAmount,
          required: true,
          paid: false, // TODO: Check payment records
        },
        fullyPaid: false, // TODO: Check if both deposit and balance are paid
      };
    }),

  /**
   * Request refund for a cancelled booking
   * Only available if deposit was paid and booking is cancelled
   */
  requestRefund: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        bookingId: z.number().int().positive(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Get booking (verify ownership)
      const bookingList = await tenantDb
        .select()
        .from(sessions)
        .where(
          and(eq(sessions.id, input.bookingId), eq(sessions.clientId, clientId))
        )
        .limit(1);

      if (bookingList.length === 0) {
        throw new Error("Booking not found or access denied");
      }

      const booking = bookingList[0];

      // Validate booking is cancelled
      if (booking.status !== "cancelled") {
        throw new Error("Booking must be cancelled before requesting a refund");
      }

      // TODO: Implement refund logic
      // 1. Check if payment exists for this booking
      // 2. Calculate refund amount based on cancellation policy
      // 3. Create Stripe refund
      // 4. Log refund in database

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "request_refund",
        description: `Requested refund for booking "${booking.title}"${input.reason ? `: ${input.reason}` : ""}`,
        resourceType: "session",
        resourceId: booking.id,
        metadata: JSON.stringify({
          reason: input.reason,
        }),
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        message:
          "Refund request received. Our team will process it within 5-7 business days.",
        bookingId: booking.id,
      };
    }),
});
