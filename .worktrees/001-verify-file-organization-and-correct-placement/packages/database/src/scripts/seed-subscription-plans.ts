/**
 * Subscription Plans Seed Script
 *
 * Creates 3 subscription plans (Starter/Pro/Enterprise) with Stripe Products + Prices
 * Stores stripe_price_id_monthly and stripe_price_id_yearly in subscriptionPlans table
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... pnpm --filter @rsm/database run seed:plans
 *
 * Requirements:
 *   - DATABASE_URL env var set
 *   - STRIPE_SECRET_KEY env var set (test or live key)
 */

import Stripe from "stripe";
import { getMasterDb, closeAllConnections } from "../connection";
import { subscriptionPlans } from "../master/schema";
import { eq } from "drizzle-orm";

/**
 * Subscription plan definitions matching PROJECT.md pricing tiers
 */
const PLANS = [
  {
    name: "starter",
    displayName: "Starter",
    description: "Perfect for small home studios and independent artists",
    priceMonthly: 2900, // €29.00 in cents
    priceYearly: 29900, // €299.00 in cents (save ~14%)
    features: JSON.stringify([
      "50 recording sessions per month",
      "10GB cloud storage",
      "Basic client portal",
      "Invoice & payment tracking",
      "Email support",
    ]),
    maxUsers: 2,
    maxSessions: 50,
    maxStorage: 10, // GB
  },
  {
    name: "pro",
    displayName: "Pro",
    description: "For growing professional studios with multiple rooms",
    priceMonthly: 9900, // €99.00 in cents
    priceYearly: 99900, // €999.00 in cents (save ~16%)
    features: JSON.stringify([
      "Unlimited recording sessions",
      "100GB cloud storage",
      "Advanced client portal with file sharing",
      "Project management & track collaboration",
      "AI-powered chatbot assistant",
      "Priority email support",
      "Custom branding",
    ]),
    maxUsers: 10,
    maxSessions: null, // unlimited
    maxStorage: 100, // GB
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    description: "Complete solution for large studios and production companies",
    priceMonthly: 29900, // €299.00 in cents
    priceYearly: 299900, // €2999.00 in cents (save ~16%)
    features: JSON.stringify([
      "Unlimited recording sessions",
      "Unlimited cloud storage",
      "White-label client portal",
      "Advanced project management",
      "Multi-location support",
      "Custom integrations & API access",
      "Dedicated account manager",
      "24/7 priority support",
    ]),
    maxUsers: null, // unlimited
    maxSessions: null, // unlimited
    maxStorage: null, // unlimited
  },
];

/**
 * Initialize Stripe client
 */
function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is required. " +
      "Get it from https://dashboard.stripe.com/apikeys"
    );
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
  });
}

/**
 * Create Stripe Product + Prices for a subscription plan
 */
async function createStripeProductAndPrices(
  stripe: Stripe,
  plan: typeof PLANS[0]
): Promise<{
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
}> {
  console.log(`\n📦 Creating Stripe Product: ${plan.displayName}`);

  // 1. Create Product
  const product = await stripe.products.create({
    name: plan.displayName,
    description: plan.description,
    metadata: {
      plan_name: plan.name,
      max_users: plan.maxUsers?.toString() || "unlimited",
      max_sessions: plan.maxSessions?.toString() || "unlimited",
      max_storage_gb: plan.maxStorage?.toString() || "unlimited",
    },
  });

  console.log(`  ✅ Product created: ${product.id}`);

  // 2. Create Monthly Price
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: plan.priceMonthly,
    recurring: {
      interval: "month",
      trial_period_days: 14, // 14-day free trial
    },
    metadata: {
      plan_name: plan.name,
      billing_period: "monthly",
    },
  });

  console.log(`  ✅ Monthly price created: ${monthlyPrice.id} (€${plan.priceMonthly / 100}/month)`);

  // 3. Create Yearly Price
  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: plan.priceYearly,
    recurring: {
      interval: "year",
      trial_period_days: 14, // 14-day free trial
    },
    metadata: {
      plan_name: plan.name,
      billing_period: "yearly",
    },
  });

  console.log(`  ✅ Yearly price created: ${yearlyPrice.id} (€${plan.priceYearly / 100}/year)`);

  return {
    stripePriceIdMonthly: monthlyPrice.id,
    stripePriceIdYearly: yearlyPrice.id,
  };
}

/**
 * Main seed function
 */
async function main() {
  console.log("🚀 Recording Studio Manager - Subscription Plans Seeder\n");
  console.log("📋 This will:");
  console.log("   - Create 3 Stripe Products (Starter, Pro, Enterprise)");
  console.log("   - Create 6 Stripe Prices (monthly + yearly for each tier)");
  console.log("   - Store Price IDs in subscriptionPlans table\n");

  const stripe = getStripeClient();
  const masterDb = await getMasterDb();

  try {
    for (const plan of PLANS) {
      console.log(`\n🌱 Processing plan: ${plan.displayName}`);

      // Check if plan already exists
      const existingPlans = await masterDb
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, plan.name))
        .limit(1);

      if (existingPlans.length > 0) {
        console.log(`  ⚠️  Plan "${plan.name}" already exists in database, updating...`);

        // Create new Stripe Product + Prices
        const { stripePriceIdMonthly, stripePriceIdYearly } =
          await createStripeProductAndPrices(stripe, plan);

        // Update existing plan
        await masterDb
          .update(subscriptionPlans)
          .set({
            displayName: plan.displayName,
            description: plan.description,
            priceMonthly: plan.priceMonthly,
            priceYearly: plan.priceYearly,
            stripePriceIdMonthly,
            stripePriceIdYearly,
            features: plan.features,
            maxUsers: plan.maxUsers,
            maxSessions: plan.maxSessions,
            maxStorage: plan.maxStorage,
            isActive: true,
          })
          .where(eq(subscriptionPlans.name, plan.name));

        console.log(`  ✅ Updated plan in database`);
      } else {
        console.log(`  ✨ Creating new plan: ${plan.name}`);

        // Create Stripe Product + Prices
        const { stripePriceIdMonthly, stripePriceIdYearly } =
          await createStripeProductAndPrices(stripe, plan);

        // Insert into database
        await masterDb.insert(subscriptionPlans).values({
          name: plan.name,
          displayName: plan.displayName,
          description: plan.description,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          stripePriceIdMonthly,
          stripePriceIdYearly,
          features: plan.features,
          maxUsers: plan.maxUsers,
          maxSessions: plan.maxSessions,
          maxStorage: plan.maxStorage,
          isActive: true,
        });

        console.log(`  ✅ Inserted plan into database`);
      }
    }

    console.log("\n✅ ✅ ✅ SUBSCRIPTION PLANS SEEDED! ✅ ✅ ✅\n");

    // Display summary
    const allPlans = await masterDb.select().from(subscriptionPlans);

    console.log("📊 Summary:");
    console.log(`   - Total plans in database: ${allPlans.length}`);
    console.log(`   - Stripe Products created: ${PLANS.length}`);
    console.log(`   - Stripe Prices created: ${PLANS.length * 2} (monthly + yearly)\n`);

    console.log("💳 Plans:");
    allPlans.forEach((p) => {
      console.log(`   - ${p.displayName} (${p.name})`);
      console.log(`     Monthly: €${p.priceMonthly / 100} (${p.stripePriceIdMonthly})`);
      console.log(`     Yearly: €${p.priceYearly / 100} (${p.stripePriceIdYearly})`);
    });

    console.log("\n🎯 Next Steps:");
    console.log("   1. Verify in Stripe Dashboard: https://dashboard.stripe.com/products");
    console.log("   2. Test subscription checkout flow");
    console.log("   3. Configure webhook handlers for subscription events\n");

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await closeAllConnections();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as seedSubscriptionPlans };
