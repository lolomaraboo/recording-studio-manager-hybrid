import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getMasterDb } from "@rsm/database/connection";
import { subscriptionPlans, organizations } from "@rsm/database/master/schema";
import { eq } from "drizzle-orm";
import { getStripeClient } from "../utils/stripe-client";

/**
 * Subscriptions Router
 *
 * Handles subscription management:
 * - Create checkout sessions with 14-day trial
 * - Get available subscription plans
 * - Get current subscription status
 *
 * Port from Python billing_routes.py and stripe_subscriptions.py
 */
export const subscriptionsRouter = router({
  /**
   * Get all available subscription plans
   *
   * Returns: Array of plans with pricing, features, and limits
   * Auth: Public (needed for pricing page)
   */
  getAvailablePlans: publicProcedure.query(async () => {
    const masterDb = await getMasterDb();

    const plans = await masterDb
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.priceMonthly);

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      priceMonthly: plan.priceMonthly / 100, // Convert cents to euros
      priceYearly: plan.priceYearly / 100,
      stripePriceIdMonthly: plan.stripePriceIdMonthly,
      stripePriceIdYearly: plan.stripePriceIdYearly,
      features: JSON.parse(plan.features || "[]") as string[],
      maxUsers: plan.maxUsers,
      maxSessions: plan.maxSessions,
      maxStorage: plan.maxStorage,
    }));
  }),

  /**
   * Create Stripe Checkout Session for subscription
   *
   * Input:
   * - planId: ID from subscriptionPlans table
   * - billingPeriod: "monthly" | "yearly"
   *
   * Returns:
   * - checkoutUrl: Stripe Checkout URL
   * - sessionId: Stripe Session ID
   *
   * Features:
   * - 14-day free trial via trial_period_days
   * - Metadata includes organization_id, plan_id, billing_period
   * - Customer creation (or reuse if stripe_customer_id exists)
   *
   * Port from Python billing_routes.py create_checkout_session() (lines 39-138)
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planId: z.number().int().positive(),
        billingPeriod: z.enum(["monthly", "yearly"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[createCheckoutSession] Request:", {
        planId: input.planId,
        billingPeriod: input.billingPeriod,
        userId: ctx.user.id,
        organizationId: ctx.organizationId,
      });

      if (!ctx.organizationId) {
        throw new Error("No organization context");
      }

      const masterDb = await getMasterDb();
      const stripe = getStripeClient();

      // 1. Fetch subscription plan
      const planList = await masterDb
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, input.planId))
        .limit(1);

      if (planList.length === 0) {
        throw new Error(`Subscription plan ${input.planId} not found`);
      }

      const plan = planList[0];

      if (!plan.isActive) {
        throw new Error(`Subscription plan ${plan.name} is not active`);
      }

      // 2. Get Stripe Price ID based on billing period
      const stripePriceId =
        input.billingPeriod === "monthly"
          ? plan.stripePriceIdMonthly
          : plan.stripePriceIdYearly;

      if (!stripePriceId) {
        throw new Error(
          `No Stripe Price ID found for plan ${plan.name} (${input.billingPeriod})`
        );
      }

      console.log("[createCheckoutSession] Using Stripe Price:", stripePriceId);

      // 3. Get or create Stripe customer
      const orgList = await masterDb
        .select()
        .from(organizations)
        .where(eq(organizations.id, ctx.organizationId))
        .limit(1);

      if (orgList.length === 0) {
        throw new Error(`Organization ${ctx.organizationId} not found`);
      }

      const organization = orgList[0];
      let stripeCustomerId = organization.stripeCustomerId;

      if (!stripeCustomerId) {
        // Create Stripe customer
        console.log("[createCheckoutSession] Creating Stripe customer");

        const customer = await stripe.customers.create({
          email: ctx.user.email,
          name: organization.name,
          metadata: {
            organization_id: ctx.organizationId.toString(),
            owner_id: ctx.user.id.toString(),
          },
        });

        stripeCustomerId = customer.id;

        // Store customer ID
        await masterDb
          .update(organizations)
          .set({ stripeCustomerId })
          .where(eq(organizations.id, ctx.organizationId));

        console.log("[createCheckoutSession] Stripe customer created:", stripeCustomerId);
      } else {
        console.log("[createCheckoutSession] Using existing Stripe customer:", stripeCustomerId);
      }

      // 4. Create Stripe Checkout Session
      const successUrl = `${process.env.CLIENT_URL || "https://app.recording-studio-manager.com"}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${process.env.CLIENT_URL || "https://app.recording-studio-manager.com"}/dashboard/subscription`;

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: 14, // 14-day free trial
          metadata: {
            organization_id: ctx.organizationId.toString(),
            plan_id: input.planId.toString(),
            billing_period: input.billingPeriod,
          },
        },
        metadata: {
          organization_id: ctx.organizationId.toString(),
          plan_id: input.planId.toString(),
          billing_period: input.billingPeriod,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
      });

      console.log("[createCheckoutSession] Checkout session created:", {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      });

      return {
        checkoutUrl: checkoutSession.url!,
        sessionId: checkoutSession.id,
      };
    }),

  /**
   * Get current subscription status for organization
   *
   * Returns:
   * - subscriptionTier: "trial" | "starter" | "pro" | "enterprise"
   * - subscriptionStatus: "trial" | "active" | "past_due" | "canceled" | "suspended"
   * - trialEndsAt: Date | null
   * - currentPeriodEnd: Date | null
   * - stripeSubscriptionId: string | null
   */
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    const masterDb = await getMasterDb();

    const orgList = await masterDb
      .select()
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1);

    if (orgList.length === 0) {
      throw new Error(`Organization ${ctx.organizationId} not found`);
    }

    const organization = orgList[0];

    return {
      subscriptionTier: organization.subscriptionTier,
      subscriptionStatus: organization.subscriptionStatus || "trial",
      trialEndsAt: organization.trialEndsAt,
      currentPeriodEnd: organization.currentPeriodEnd,
      stripeSubscriptionId: organization.stripeSubscriptionId,
      stripeCustomerId: organization.stripeCustomerId,
    };
  }),

  /**
   * Create Stripe Customer Portal Session
   *
   * Enables self-service billing management:
   * - Update payment method
   * - View invoice history
   * - Cancel subscription
   * - Download receipts
   *
   * Returns:
   * - portalUrl: URL to Stripe Customer Portal
   *
   * Note: Requires Customer Portal configuration in Stripe Dashboard:
   * - Dashboard > Settings > Billing > Customer Portal
   * - Enable customer cancellation, payment method updates, invoice history
   * - Set business information (name, support email)
   *
   * Port from Python billing_routes.py create_customer_portal_session() (lines 301-343)
   */
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    console.log("[createPortalSession] Request:", {
      userId: ctx.user.id,
      organizationId: ctx.organizationId,
    });

    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    const masterDb = await getMasterDb();
    const stripe = getStripeClient();

    // 1. Get organization's Stripe customer ID
    const orgList = await masterDb
      .select()
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1);

    if (orgList.length === 0) {
      throw new Error(`Organization ${ctx.organizationId} not found`);
    }

    const organization = orgList[0];
    const stripeCustomerId = organization.stripeCustomerId;

    if (!stripeCustomerId) {
      throw new Error(
        "No Stripe customer ID found. Please subscribe to a plan first."
      );
    }

    console.log("[createPortalSession] Using Stripe customer:", stripeCustomerId);

    // 2. Create billing portal session
    const returnUrl = `${process.env.CLIENT_URL || "https://app.recording-studio-manager.com"}/settings?tab=billing`;

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    console.log("[createPortalSession] Portal session created:", {
      sessionId: session.id,
      url: session.url,
    });

    return {
      portalUrl: session.url,
    };
  }),
});
