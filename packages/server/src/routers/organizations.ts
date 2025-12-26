import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { organizations, subscriptionPlans } from '@rsm/database/master';
import { getMasterDb } from '@rsm/database/connection';
import { createTenantDatabase, deleteTenantDatabase } from '../services/tenant-provisioning';
import { getStripeClient } from '../utils/stripe-client';
import { getUsageStats } from '../middleware/subscription-limits';

/**
 * Organizations Router
 *
 * CRUD for organizations (stored in Master DB)
 *
 * Endpoints:
 * - list: Get all organizations (admin only)
 * - get: Get organization by ID
 * - create: Create new organization
 * - update: Update organization
 * - delete: Delete organization (admin only)
 */
export const organizationsRouter = router({
  /**
   * List all organizations (admin only)
   */
  list: adminProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getMasterDb();
      const { limit = 50, offset = 0 } = input || {};

      const orgs = await db
        .select()
        .from(organizations)
        .limit(limit)
        .offset(offset);

      return orgs;
    }),

  /**
   * Get current user's organization
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No organization found for user',
      });
    }

    const db = await getMasterDb();
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, ctx.organizationId),
    });

    if (!org) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Organization not found',
      });
    }

    return org;
  }),

  /**
   * Create new organization
   * Also creates tenant database
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(200),
        phone: z.string().optional(),
        timezone: z.string().default('America/New_York'),
        currency: z.string().default('USD'),
      })
    )
    .mutation(async ({ input, ctx: _ctx }) => {
      const db = await getMasterDb();

      // Generate slug and subdomain from name
      const slug = input.name.toLowerCase().replace(/\s+/g, '-');
      const subdomain = slug + '-' + Date.now();

      // TODO: Use real user ID from ctx.user.id when auth is implemented
      const ownerId = 1; // Mock owner ID

      const [org] = await db
        .insert(organizations)
        .values({
          name: input.name,
          slug,
          subdomain,
          ownerId,
          phone: input.phone,
          timezone: input.timezone,
          currency: input.currency,
        })
        .returning();

      // Create tenant database and apply migrations
      const tenantResult = await createTenantDatabase(org.id);

      if (!tenantResult.success) {
        console.error('[Organizations] Failed to create tenant database:', tenantResult.error);
        // Rollback organization creation
        await db.delete(organizations).where(eq(organizations.id, org.id));
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create tenant database: ${tenantResult.error}`,
        });
      }

      console.log(`[Organizations] Organization ${org.id} created with tenant DB: ${tenantResult.databaseName}`);

      return org;
    }),

  /**
   * Update organization
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(2).max(200).optional(),
          logoUrl: z.string().max(500).nullable().optional(),
          phone: z.string().optional(),
          timezone: z.string().optional(),
          currency: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getMasterDb();

      // Verify user belongs to this organization
      if (ctx.user?.role !== 'admin' && ctx.organizationId !== input.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot update organization you do not belong to',
        });
      }

      const [updated] = await db
        .update(organizations)
        .set(input.data)
        .where(eq(organizations.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      return updated;
    }),

  /**
   * Delete organization (admin only)
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getMasterDb();

      // Delete tenant database first
      try {
        await deleteTenantDatabase(input.id);
      } catch (error) {
        console.error('[Organizations] Failed to delete tenant database:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete tenant database',
        });
      }

      await db.delete(organizations).where(eq(organizations.id, input.id));

      return { success: true };
    }),

  /**
   * Upgrade subscription to higher tier
   *
   * Port from Python billing_routes.py upgrade_subscription()
   *
   * Steps:
   * 1. Validate new plan is higher tier
   * 2. Get Stripe subscription
   * 3. Update subscription with new price (proration automatic)
   * 4. Update organizations table
   */
  upgradeSubscription: protectedProcedure
    .input(
      z.object({
        planId: z.number().int().positive(),
        billingPeriod: z.enum(["monthly", "yearly"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization context',
        });
      }

      const db = await getMasterDb();
      const stripe = getStripeClient();

      // Get organization
      const orgList = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, ctx.organizationId))
        .limit(1);

      if (orgList.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      const org = orgList[0];

      // Verify user is organization owner
      if (org.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only organization owner can upgrade subscription',
        });
      }

      // Check if organization has active subscription
      if (!org.stripeSubscriptionId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active subscription found. Please create a subscription first.',
        });
      }

      // Get new plan
      const newPlanList = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, input.planId))
        .limit(1);

      if (newPlanList.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subscription plan not found',
        });
      }

      const newPlan = newPlanList[0];

      // Get new Stripe Price ID
      const newPriceId =
        input.billingPeriod === "monthly"
          ? newPlan.stripePriceIdMonthly
          : newPlan.stripePriceIdYearly;

      if (!newPriceId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `No Stripe Price ID found for plan ${newPlan.name} (${input.billingPeriod})`,
        });
      }

      // Update Stripe subscription
      const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);

      const updatedSubscription = await stripe.subscriptions.update(org.stripeSubscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "always_invoice", // Charge immediately with prorated amount
        metadata: {
          organization_id: ctx.organizationId.toString(),
          plan_id: input.planId.toString(),
          billing_period: input.billingPeriod,
        },
      });

      // Update organization in database
      await db
        .update(organizations)
        .set({
          subscriptionTier: newPlan.name,
        })
        .where(eq(organizations.id, ctx.organizationId));

      // Calculate prorated amount (from latest invoice)
      const latestInvoice = updatedSubscription.latest_invoice;
      let proratedAmount = 0;

      if (latestInvoice && typeof latestInvoice !== "string") {
        proratedAmount = latestInvoice.amount_paid / 100; // Convert cents to euros
      }

      return {
        status: "success",
        newPlan: {
          id: newPlan.id,
          name: newPlan.name,
          displayName: newPlan.displayName,
        },
        billingPeriod: input.billingPeriod,
        proratedAmount,
      };
    }),

  /**
   * Downgrade subscription to lower tier
   *
   * Port from Python billing_routes.py downgrade_subscription()
   *
   * Options:
   * - immediate: Apply downgrade now (with prorated refund)
   * - end of period: Apply downgrade at period end (default)
   */
  downgradeSubscription: protectedProcedure
    .input(
      z.object({
        planId: z.number().int().positive(),
        billingPeriod: z.enum(["monthly", "yearly"]),
        immediate: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization context',
        });
      }

      const db = await getMasterDb();
      const stripe = getStripeClient();

      // Get organization
      const orgList = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, ctx.organizationId))
        .limit(1);

      if (orgList.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      const org = orgList[0];

      // Verify user is organization owner
      if (org.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only organization owner can downgrade subscription',
        });
      }

      // Check if organization has active subscription
      if (!org.stripeSubscriptionId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active subscription found',
        });
      }

      // Get new plan
      const newPlanList = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, input.planId))
        .limit(1);

      if (newPlanList.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subscription plan not found',
        });
      }

      const newPlan = newPlanList[0];

      // Get new Stripe Price ID
      const newPriceId =
        input.billingPeriod === "monthly"
          ? newPlan.stripePriceIdMonthly
          : newPlan.stripePriceIdYearly;

      if (!newPriceId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `No Stripe Price ID found for plan ${newPlan.name} (${input.billingPeriod})`,
        });
      }

      // Update Stripe subscription
      const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);

      const updateParams: any = {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        metadata: {
          organization_id: ctx.organizationId.toString(),
          plan_id: input.planId.toString(),
          billing_period: input.billingPeriod,
        },
      };

      if (input.immediate) {
        // Apply downgrade immediately with prorated refund
        updateParams.proration_behavior = "always_invoice";
      } else {
        // Schedule downgrade for end of period
        updateParams.proration_behavior = "none";
        updateParams.billing_cycle_anchor = "unchanged";
      }

      const updatedSubscription = await stripe.subscriptions.update(
        org.stripeSubscriptionId,
        updateParams
      );

      // Update organization in database (only if immediate)
      if (input.immediate) {
        await db
          .update(organizations)
          .set({
            subscriptionTier: newPlan.name,
          })
          .where(eq(organizations.id, ctx.organizationId));
      }

      const effectiveDate = input.immediate
        ? new Date()
        : new Date((updatedSubscription as any).current_period_end * 1000);

      return {
        status: "success",
        newPlan: {
          id: newPlan.id,
          name: newPlan.name,
          displayName: newPlan.displayName,
        },
        billingPeriod: input.billingPeriod,
        effectiveDate,
        immediate: input.immediate,
      };
    }),

  /**
   * Cancel subscription
   *
   * Port from Python billing_routes.py cancel_subscription()
   *
   * Options:
   * - immediate: Cancel now and lose access
   * - end of period: Cancel at period end (default)
   */
  cancelSubscription: protectedProcedure
    .input(
      z.object({
        immediate: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization context',
        });
      }

      const db = await getMasterDb();
      const stripe = getStripeClient();

      // Get organization
      const orgList = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, ctx.organizationId))
        .limit(1);

      if (orgList.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      const org = orgList[0];

      // Verify user is organization owner
      if (org.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only organization owner can cancel subscription',
        });
      }

      // Check if organization has active subscription
      if (!org.stripeSubscriptionId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active subscription found',
        });
      }

      let effectiveDate: Date;

      if (input.immediate) {
        // Cancel immediately (delete subscription)
        await stripe.subscriptions.cancel(org.stripeSubscriptionId);

        // Update organization status
        await db
          .update(organizations)
          .set({
            subscriptionStatus: "canceled",
            subscriptionTier: "trial",
          })
          .where(eq(organizations.id, ctx.organizationId));

        effectiveDate = new Date();
      } else {
        // Schedule cancellation at period end
        const updatedSubscription = await stripe.subscriptions.update(org.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        // Update organization status
        await db
          .update(organizations)
          .set({
            subscriptionStatus: "canceling",
          })
          .where(eq(organizations.id, ctx.organizationId));

        effectiveDate = new Date((updatedSubscription as any).current_period_end * 1000);
      }

      // TODO: Send cancellation email (implement in Phase 6)
      // await sendSubscriptionCancellationEmail(org, effectiveDate);

      return {
        status: "canceled",
        effectiveDate,
        immediate: input.immediate,
      };
    }),

  /**
   * Get subscription info with payment method
   *
   * Returns:
   * - Subscription status
   * - Current plan
   * - Billing period
   * - Payment method (last4, brand)
   * - Current period end
   */
  getSubscriptionInfo: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No organization context',
      });
    }

    const db = await getMasterDb();

    // Get organization
    const orgList = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1);

    if (orgList.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Organization not found',
      });
    }

    const org = orgList[0];

    // If no subscription, return trial info
    if (!org.stripeSubscriptionId) {
      return {
        status: org.subscriptionStatus || "trial",
        plan: org.subscriptionTier,
        billingPeriod: null,
        currentPeriodEnd: org.trialEndsAt,
        cancelAtPeriodEnd: false,
        paymentMethod: null,
      };
    }

    // Get Stripe subscription with payment method expanded
    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId, {
      expand: ["default_payment_method"],
    });

    // Extract payment method details
    let paymentMethod = null;
    if (subscription.default_payment_method && typeof subscription.default_payment_method !== "string") {
      const pm = subscription.default_payment_method;
      if (pm.card) {
        paymentMethod = {
          type: "card",
          last4: pm.card.last4,
          brand: pm.card.brand,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        };
      }
    }

    // Determine billing period from subscription
    const billingPeriod = subscription.items.data[0]?.price?.recurring?.interval === "year" ? "yearly" : "monthly";

    return {
      status: subscription.status,
      plan: org.subscriptionTier,
      billingPeriod,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      paymentMethod,
    };
  }),

  /**
   * Get usage statistics for organization
   *
   * Returns:
   * - Sessions used/limit/percentage
   * - Storage used/limit/percentage
   *
   * Used for dashboard meters and usage warnings.
   *
   * Port from Python subscription_limits.py get_limits_status_api()
   */
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No organization context',
      });
    }

    if (!ctx.tenantDb) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'No tenant database connection',
      });
    }

    const stats = await getUsageStats(ctx.organizationId, ctx.tenantDb);
    return stats;
  }),
});
