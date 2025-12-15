/**
 * Admin Router
 *
 * Super admin endpoints for platform management:
 * - User management
 * - Organization management
 * - Platform statistics
 * - Configuration
 * - Audit logs
 */

import { z } from 'zod';
import { router, adminProcedure } from '../_core/trpc';
import { getMasterDb } from '@rsm/database/connection';
import { users, organizations, auditLogs } from '@rsm/database/master';
import { eq, desc, sql, like, and, gte, lte, count } from 'drizzle-orm';

export const adminRouter = router({
  // ============ USERS ============

  listUsers: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
      role: z.enum(['admin', 'manager', 'user']).optional(),
    }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0, search, role } = input || {};
      const db = await getMasterDb();

      const conditions = [];
      if (search) {
        conditions.push(
          sql`(${users.email} ILIKE ${`%${search}%`} OR ${users.name} ILIKE ${`%${search}%`})`
        );
      }
      if (role) {
        conditions.push(eq(users.role, role));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [userList, totalResult] = await Promise.all([
        db.select().from(users).where(whereClause).limit(limit).offset(offset).orderBy(desc(users.createdAt)),
        db.select({ count: count() }).from(users).where(whereClause),
      ]);

      return {
        users: userList.map((u: typeof userList[0]) => ({
          ...u,
          passwordHash: undefined, // Never expose password hash
        })),
        total: totalResult[0]?.count || 0,
        limit,
        offset,
      };
    }),

  getUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getMasterDb();
      const [user] = await db.select().from(users).where(eq(users.id, input.userId));
      if (!user) throw new Error('User not found');
      return { ...user, passwordHash: undefined };
    }),

  updateUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.enum(['admin', 'manager', 'user']).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getMasterDb();
      const { userId, ...updates } = input;

      const [updated] = await db.update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      return { ...updated, passwordHash: undefined };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getMasterDb();
      await db.delete(users).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ============ ORGANIZATIONS ============

  listOrganizations: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0, search, isActive } = input || {};
      const db = await getMasterDb();

      const conditions = [];
      if (search) {
        conditions.push(like(organizations.name, `%${search}%`));
      }
      if (isActive !== undefined) {
        conditions.push(eq(organizations.isActive, isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [orgList, totalResult] = await Promise.all([
        db.select().from(organizations).where(whereClause).limit(limit).offset(offset).orderBy(desc(organizations.createdAt)),
        db.select({ count: count() }).from(organizations).where(whereClause),
      ]);

      return {
        organizations: orgList,
        total: totalResult[0]?.count || 0,
        limit,
        offset,
      };
    }),

  updateOrganization: adminProcedure
    .input(z.object({
      organizationId: z.number(),
      name: z.string().optional(),
      isActive: z.boolean().optional(),
      subscriptionPlan: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getMasterDb();
      const { organizationId, ...updates } = input;

      const [updated] = await db.update(organizations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(organizations.id, organizationId))
        .returning();

      return updated;
    }),

  // ============ STATISTICS ============

  getStats: adminProcedure.query(async () => {
    const db = await getMasterDb();
    const [
      usersCount,
      orgsCount,
      activeOrgsCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(organizations),
      db.select({ count: count() }).from(organizations).where(eq(organizations.isActive, true)),
    ]);

    return {
      totalUsers: usersCount[0]?.count || 0,
      totalOrganizations: orgsCount[0]?.count || 0,
      activeOrganizations: activeOrgsCount[0]?.count || 0,
      monthlyRevenue: 0, // Would calculate from billing data
      growthRate: 0,
    };
  }),

  getDashboard: adminProcedure.query(async () => {
    const db = await getMasterDb();
    const [
      usersCount,
      orgsCount,
      recentUsers,
      recentOrgs,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(organizations),
      db.select().from(users).orderBy(desc(users.createdAt)).limit(5),
      db.select().from(organizations).orderBy(desc(organizations.createdAt)).limit(5),
    ]);

    return {
      stats: {
        totalUsers: usersCount[0]?.count || 0,
        totalOrganizations: orgsCount[0]?.count || 0,
      },
      recentUsers: recentUsers.map((u: typeof recentUsers[0]) => ({ ...u, passwordHash: undefined })),
      recentOrganizations: recentOrgs,
    };
  }),

  getChartData: adminProcedure
    .input(z.object({
      type: z.enum(['users', 'organizations', 'revenue']),
      period: z.enum(['week', 'month', 'year']).default('month'),
    }))
    .query(async ({ input }) => {
      // Return mock chart data - would aggregate from DB in production
      const labels = input.period === 'week'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : input.period === 'month'
        ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      return {
        labels,
        data: labels.map(() => Math.floor(Math.random() * 100)),
      };
    }),

  // ============ AUDIT LOGS ============

  getLogs: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      category: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0, category, startDate, endDate } = input || {};
      const db = await getMasterDb();

      const conditions = [];
      if (category) {
        conditions.push(eq(auditLogs.category, category));
      }
      if (startDate) {
        conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [logs, totalResult] = await Promise.all([
        db.select().from(auditLogs).where(whereClause).limit(limit).offset(offset).orderBy(desc(auditLogs.createdAt)),
        db.select({ count: count() }).from(auditLogs).where(whereClause),
      ]);

      return {
        logs,
        total: totalResult[0]?.count || 0,
        limit,
        offset,
      };
    }),

  // ============ CONFIGURATION ============

  getConfig: adminProcedure.query(async () => {
    // Return platform configuration
    return {
      maintenanceMode: false,
      allowRegistration: true,
      maxOrganizations: 1000,
      maxUsersPerOrg: 100,
      features: {
        ai: true,
        analytics: true,
        multiRegion: true,
      },
    };
  }),

  updateConfig: adminProcedure
    .input(z.object({
      maintenanceMode: z.boolean().optional(),
      allowRegistration: z.boolean().optional(),
      maxOrganizations: z.number().optional(),
      maxUsersPerOrg: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // Would save to config table/file
      return { success: true, config: input };
    }),

  // ============ SUBSCRIPTIONS ============

  getSubscriptions: adminProcedure.query(async () => {
    // Return subscription plans
    return {
      plans: [
        { id: 'free', name: 'Free', price: 0, features: ['5 sessions/month', '1 room'] },
        { id: 'pro', name: 'Pro', price: 2900, features: ['Unlimited sessions', '5 rooms', 'Analytics'] },
        { id: 'enterprise', name: 'Enterprise', price: 9900, features: ['Everything', 'API access', 'Priority support'] },
      ],
    };
  }),
});
