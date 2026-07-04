import { router, protectedProcedure } from "../_core/trpc";
import { getMasterDb } from "@rsm/database/connection";
import { organizations } from "@rsm/database/master/schema";
import { eq } from "drizzle-orm";
import { getStripeClient } from "../utils/stripe-client";
import { TRPCError } from "@trpc/server";

/**
 * Stripe Connect Router (studio-facing)
 *
 * Lets each studio connect ITS OWN Stripe account so it collects payments from
 * ITS clients directly (Express connected account). This is separate from the
 * studio's subscription to RSM (handled in subscriptionsRouter).
 *
 * Flow:
 *   1. createOnboardingLink → creates an Express account (once) + an Account
 *      Link, returns the onboarding URL to open in a browser.
 *   2. The studio completes Stripe onboarding (identity/bank).
 *   3. refreshStatus → pulls charges_enabled and stores it on the org.
 * Payments (invoices / portal checkouts) are then created on that connected
 * account, so the money goes straight to the studio.
 */
export const stripeConnectRouter = router({
  /** Current connection status for the calling studio. */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Aucune organisation" });
    }
    const masterDb = await getMasterDb();
    const [org] = await masterDb
      .select()
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1);
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organisation introuvable" });

    return {
      connected: !!org.stripeConnectAccountId,
      accountId: org.stripeConnectAccountId ?? null,
      status: org.stripeConnectStatus ?? "none",
      chargesEnabled: org.stripeConnectChargesEnabled ?? false,
      onboardedAt: org.stripeConnectOnboardedAt ?? null,
    };
  }),

  /**
   * Create (if needed) the studio's Express account and return an onboarding URL.
   */
  createOnboardingLink: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Aucune organisation" });
    }
    const stripe = getStripeClient();
    const masterDb = await getMasterDb();

    const [org] = await masterDb
      .select()
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1);
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organisation introuvable" });

    let accountId = org.stripeConnectAccountId;

    // Create the connected Express account once.
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: (org.country && org.country.length === 2 ? org.country : "FR").toUpperCase(),
        email: undefined,
        business_profile: { name: org.name },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { organization_id: String(ctx.organizationId) },
      });
      accountId = account.id;
      await masterDb
        .update(organizations)
        .set({
          stripeConnectAccountId: accountId,
          stripeConnectStatus: "pending",
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, ctx.organizationId));
    }

    const base = process.env.CLIENT_URL || "http://localhost:5174";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/settings?tab=payments&connect=refresh`,
      return_url: `${base}/settings?tab=payments&connect=return`,
      type: "account_onboarding",
    });

    return { url: accountLink.url, accountId };
  }),

  /**
   * Pull the latest account state from Stripe and persist it.
   */
  refreshStatus: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Aucune organisation" });
    }
    const stripe = getStripeClient();
    const masterDb = await getMasterDb();

    const [org] = await masterDb
      .select()
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1);
    if (!org?.stripeConnectAccountId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun compte Stripe connecté" });
    }

    const account = await stripe.accounts.retrieve(org.stripeConnectAccountId);
    const chargesEnabled = !!account.charges_enabled;
    const status = chargesEnabled
      ? "active"
      : account.details_submitted
        ? "restricted"
        : "pending";

    await masterDb
      .update(organizations)
      .set({
        stripeConnectChargesEnabled: chargesEnabled,
        stripeConnectStatus: status,
        stripeConnectOnboardedAt: chargesEnabled && !org.stripeConnectOnboardedAt ? new Date() : org.stripeConnectOnboardedAt,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, ctx.organizationId));

    return { connected: true, status, chargesEnabled };
  }),
});
