import { TRPCError } from "@trpc/server";
import { getMasterDb, type TenantDb } from "@rsm/database/connection";
import { subscriptionPlans, organizations } from "@rsm/database/master/schema";
import { sessions } from "@rsm/database/tenant/schema";
import { eq, gte, sql } from "drizzle-orm";

/**
 * Subscription Limits Middleware
 *
 * Enforces subscription tier limits on resource usage:
 * - Sessions per month (maxSessions)
 * - Storage capacity (maxStorage in GB)
 *
 * Port from Python utils/subscription_limits.py
 */

interface SubscriptionPlan {
  id: number;
  name: string;
  displayName: string;
  maxSessions: number | null; // null = unlimited
  maxStorage: number | null; // GB, null = unlimited
}

interface UsageStats {
  sessionsUsed: number;
  sessionsLimit: number | null;
  sessionsPercentage: number;
  storageUsedMB: number;
  storageLimitGB: number | null;
  storagePercentage: number;
}

/**
 * Get organization's current subscription plan with limits
 *
 * @param organizationId - Organization ID
 * @returns Subscription plan with limits
 */
export async function getOrganizationPlan(
  organizationId: number
): Promise<SubscriptionPlan> {
  const masterDb = await getMasterDb();

  // Get organization
  const orgList = await masterDb
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (orgList.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Organization ${organizationId} not found`,
    });
  }

  const org = orgList[0];

  // Map subscription tier to plan (use subscriptionTier from org)
  // For trial period, use trial limits
  const tierName = org.subscriptionTier || "trial";

  // Fetch plan from subscriptionPlans table
  const planList = await masterDb
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.name, tierName))
    .limit(1);

  if (planList.length === 0) {
    // Fallback to trial plan if not found
    const trialPlanList = await masterDb
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, "trial"))
      .limit(1);

    if (trialPlanList.length === 0) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No subscription plans found in database",
      });
    }

    return {
      id: trialPlanList[0].id,
      name: trialPlanList[0].name,
      displayName: trialPlanList[0].displayName,
      maxSessions: trialPlanList[0].maxSessions,
      maxStorage: trialPlanList[0].maxStorage,
    };
  }

  const plan = planList[0];

  return {
    id: plan.id,
    name: plan.name,
    displayName: plan.displayName,
    maxSessions: plan.maxSessions,
    maxStorage: plan.maxStorage,
  };
}

/**
 * Check if organization can create new session (enforce maxSessions limit)
 *
 * Throws TRPCError if limit exceeded.
 *
 * Logic:
 * 1. Get organization's plan
 * 2. If maxSessions is null or -1 → unlimited, allow
 * 3. Count sessions created since current_period_start
 * 4. If count >= maxSessions → throw error with upgrade CTA
 *
 * @param organizationId - Organization ID
 * @param tenantDb - Tenant database connection
 */
export async function checkSessionLimit(
  organizationId: number,
  tenantDb: TenantDb
): Promise<void> {
  const masterDb = await getMasterDb();

  // Get organization's current billing period
  const orgList = await masterDb
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (orgList.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Organization ${organizationId} not found`,
    });
  }

  const org = orgList[0];

  // Get plan limits
  const plan = await getOrganizationPlan(organizationId);

  // Check if unlimited
  if (plan.maxSessions === null || plan.maxSessions === -1) {
    // Unlimited sessions (Pro/Enterprise plan)
    return;
  }

  // Get current period start (default to beginning of month if not set)
  const currentPeriodStart =
    org.currentPeriodEnd || new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Count sessions created in current billing period
  const sessionsCount = await tenantDb
    .select({ count: sql<number>`count(*)::int` })
    .from(sessions)
    .where(gte(sessions.startTime, currentPeriodStart));

  const count = sessionsCount[0]?.count || 0;

  // Check if limit exceeded
  if (count >= plan.maxSessions) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Monthly session limit reached (${plan.maxSessions} sessions). Upgrade to Pro for unlimited sessions.`,
      cause: {
        errorCode: "SESSION_LIMIT_EXCEEDED",
        currentUsage: count,
        limit: plan.maxSessions,
        planName: plan.name,
        upgradeUrl: "/dashboard/subscription",
      },
    });
  }
}

/**
 * Check if organization can upload file (enforce maxStorage limit)
 *
 * Throws TRPCError if limit exceeded.
 *
 * Logic:
 * 1. Get organization's plan
 * 2. If maxStorage is null or -1 → unlimited, allow
 * 3. Sum storage_size from projects table
 * 4. Add new file size
 * 5. If total > maxStorage (GB) → throw error
 *
 * @param organizationId - Organization ID
 * @param tenantDb - Tenant database connection
 * @param newFileSizeMB - Size of file to be uploaded (in MB)
 */
export async function checkStorageLimit(
  organizationId: number,
  tenantDb: TenantDb,
  newFileSizeMB: number = 0
): Promise<void> {
  // Get plan limits
  const plan = await getOrganizationPlan(organizationId);

  // Check if unlimited
  if (plan.maxStorage === null || plan.maxStorage === -1) {
    // Unlimited storage (Pro/Enterprise plan)
    return;
  }

  // Calculate current storage usage (sum of storage_size from projects)
  const storageResult = await tenantDb
    .select({ totalMb: sql<number>`COALESCE(SUM(storage_size), 0)::int` })
    .from(sql`projects`);

  const currentStorageMB = storageResult[0]?.totalMb || 0;
  const totalStorageMB = currentStorageMB + newFileSizeMB;
  const totalStorageGB = totalStorageMB / 1024;

  // Check if limit exceeded
  if (totalStorageGB > plan.maxStorage) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Storage limit exceeded (${plan.maxStorage} GB). Upgrade to Pro for 100 GB or Enterprise for unlimited storage.`,
      cause: {
        errorCode: "STORAGE_LIMIT_EXCEEDED",
        currentUsageGB: Math.round(currentStorageMB / 1024 * 100) / 100,
        newFileGB: Math.round(newFileSizeMB / 1024 * 100) / 100,
        totalGB: Math.round(totalStorageGB * 100) / 100,
        limitGB: plan.maxStorage,
        planName: plan.name,
        upgradeUrl: "/dashboard/subscription",
      },
    });
  }
}

/**
 * Get usage statistics for organization (for dashboard display)
 *
 * Returns:
 * - Sessions used/limit/percentage
 * - Storage used/limit/percentage
 *
 * Used by dashboard to show usage meters and progress bars.
 *
 * Port from Python subscription_limits.py get_limits_status_api()
 *
 * @param organizationId - Organization ID
 * @param tenantDb - Tenant database connection
 * @returns Usage statistics
 */
export async function getUsageStats(
  organizationId: number,
  tenantDb: TenantDb
): Promise<UsageStats> {
  const masterDb = await getMasterDb();

  // Get organization's current billing period
  const orgList = await masterDb
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (orgList.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Organization ${organizationId} not found`,
    });
  }

  const org = orgList[0];

  // Get plan limits
  const plan = await getOrganizationPlan(organizationId);

  // Get current period start (default to beginning of month if not set)
  const currentPeriodStart =
    org.currentPeriodEnd || new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Count sessions in current period
  const sessionsResult = await tenantDb
    .select({ count: sql<number>`count(*)::int` })
    .from(sessions)
    .where(gte(sessions.startTime, currentPeriodStart));

  const sessionsUsed = sessionsResult[0]?.count || 0;

  // Calculate sessions percentage
  const sessionsPercentage =
    plan.maxSessions && plan.maxSessions > 0
      ? Math.round((sessionsUsed / plan.maxSessions) * 100)
      : 0;

  // Calculate storage usage
  const storageResult = await tenantDb
    .select({ totalMb: sql<number>`COALESCE(SUM(storage_size), 0)::int` })
    .from(sql`projects`);

  const storageUsedMB = storageResult[0]?.totalMb || 0;

  // Calculate storage percentage
  const storagePercentage =
    plan.maxStorage && plan.maxStorage > 0
      ? Math.round((storageUsedMB / 1024 / plan.maxStorage) * 100)
      : 0;

  return {
    sessionsUsed,
    sessionsLimit: plan.maxSessions,
    sessionsPercentage,
    storageUsedMB,
    storageLimitGB: plan.maxStorage,
    storagePercentage,
  };
}
