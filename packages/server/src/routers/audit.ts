/**
 * Audit Logs Router
 *
 * Endpoints for viewing and searching audit logs.
 * SOC2 compliance - read-only access to audit trail.
 */

import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getMasterDb } from "@rsm/database/connection";
import { auditLogs } from "@rsm/database/master";
import { eq, and, gte, lte, like, desc, sql, or } from "drizzle-orm";
import type { AuditCategory, AuditSeverity, AuditStatus } from "../_core/audit";

// ============================================================================
// Input Schemas
// ============================================================================

const listAuditLogsInput = z.object({
  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),

  // Filters
  userId: z.number().optional(),
  organizationId: z.number().optional(),
  category: z.enum(["auth", "data", "admin", "billing", "security"]).optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  severity: z.enum(["info", "warning", "error", "critical"]).optional(),
  status: z.enum(["success", "failure"]).optional(),

  // Date range
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  // Search
  search: z.string().optional(),
});

const getAuditLogInput = z.object({
  id: z.number(),
});

const getAuditStatsInput = z.object({
  organizationId: z.number().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// Router
// ============================================================================

export const auditRouter = router({
  /**
   * List audit logs with filtering and pagination
   * Requires admin role
   */
  list: adminProcedure.input(listAuditLogsInput).query(async ({ ctx, input }) => {
    const db = await getMasterDb();
    const {
      page,
      limit,
      userId,
      organizationId,
      category,
      action,
      resourceType,
      resourceId,
      severity,
      status,
      startDate,
      endDate,
      search,
    } = input;

    // Build conditions
    const conditions = [];

    // Organization filter - admin can see their org logs
    const orgId = organizationId ?? ctx.organizationId;
    if (orgId) {
      conditions.push(eq(auditLogs.organizationId, orgId));
    }

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (category) {
      conditions.push(eq(auditLogs.category, category));
    }

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (resourceType) {
      conditions.push(eq(auditLogs.resourceType, resourceType));
    }

    if (resourceId) {
      conditions.push(eq(auditLogs.resourceId, resourceId));
    }

    if (severity) {
      conditions.push(eq(auditLogs.severity, severity));
    }

    if (status) {
      conditions.push(eq(auditLogs.status, status));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
    }

    if (search) {
      conditions.push(
        or(
          like(auditLogs.action, `%${search}%`),
          like(auditLogs.description, `%${search}%`),
          like(auditLogs.userEmail, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute queries in parallel
    const [logs, countResult] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),

  /**
   * Get a single audit log by ID
   * Requires admin role
   */
  getById: adminProcedure.input(getAuditLogInput).query(async ({ ctx, input }) => {
    const db = await getMasterDb();
    const [log] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.id, input.id),
          // Ensure user can only see logs from their organization
          ctx.organizationId ? eq(auditLogs.organizationId, ctx.organizationId) : undefined
        )
      );

    if (!log) {
      throw new Error("Audit log not found");
    }

    return log;
  }),

  /**
   * Get audit log statistics
   * Requires admin role
   */
  stats: adminProcedure.input(getAuditStatsInput).query(async ({ ctx, input }) => {
    const db = await getMasterDb();
    const { organizationId, startDate, endDate } = input;

    const conditions = [];

    const orgId = organizationId ?? ctx.organizationId;
    if (orgId) {
      conditions.push(eq(auditLogs.organizationId, orgId));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get stats by category
    const categoryStats = await db
      .select({
        category: auditLogs.category,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.category);

    // Get stats by severity
    const severityStats = await db
      .select({
        severity: auditLogs.severity,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.severity);

    // Get stats by status
    const statusStats = await db
      .select({
        status: auditLogs.status,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.status);

    // Get recent activity (last 7 days by day)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActivity = await db
      .select({
        date: sql<string>`date_trunc('day', ${auditLogs.createdAt})::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .where(
        and(
          ...(conditions.length > 0 ? conditions : []),
          gte(auditLogs.createdAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`date_trunc('day', ${auditLogs.createdAt})`)
      .orderBy(sql`date_trunc('day', ${auditLogs.createdAt})`);

    // Get top actions
    const topActions = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.action)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    return {
      byCategory: categoryStats.reduce(
        (acc, item) => ({ ...acc, [item.category]: item.count }),
        {} as Record<AuditCategory, number>
      ),
      bySeverity: severityStats.reduce(
        (acc, item) => ({ ...acc, [item.severity]: item.count }),
        {} as Record<AuditSeverity, number>
      ),
      byStatus: statusStats.reduce(
        (acc, item) => ({ ...acc, [item.status]: item.count }),
        {} as Record<AuditStatus, number>
      ),
      dailyActivity: dailyActivity.map((d) => ({
        date: d.date,
        count: d.count,
      })),
      topActions: topActions.map((a) => ({
        action: a.action,
        count: a.count,
      })),
    };
  }),

  /**
   * Get user activity audit trail
   * Requires admin role
   */
  userActivity: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getMasterDb();
      const conditions = [eq(auditLogs.userId, input.userId)];

      // Restrict to organization if not super admin
      if (ctx.organizationId) {
        conditions.push(eq(auditLogs.organizationId, ctx.organizationId));
      }

      const logs = await db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit);

      return logs;
    }),

  /**
   * Get resource history
   * Requires admin role
   */
  resourceHistory: adminProcedure
    .input(
      z.object({
        resourceType: z.string(),
        resourceId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getMasterDb();
      const conditions = [
        eq(auditLogs.resourceType, input.resourceType),
        eq(auditLogs.resourceId, input.resourceId),
      ];

      // Restrict to organization if not super admin
      if (ctx.organizationId) {
        conditions.push(eq(auditLogs.organizationId, ctx.organizationId));
      }

      const logs = await db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit);

      return logs;
    }),

  /**
   * Export audit logs (for compliance reports)
   * Requires admin role
   */
  export: adminProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        category: z.enum(["auth", "data", "admin", "billing", "security"]).optional(),
        format: z.enum(["json", "csv"]).default("json"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getMasterDb();
      const conditions = [
        gte(auditLogs.createdAt, new Date(input.startDate)),
        lte(auditLogs.createdAt, new Date(input.endDate)),
      ];

      if (ctx.organizationId) {
        conditions.push(eq(auditLogs.organizationId, ctx.organizationId));
      }

      if (input.category) {
        conditions.push(eq(auditLogs.category, input.category));
      }

      const logs = await db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt));

      if (input.format === "csv") {
        // Generate CSV
        const headers = [
          "id",
          "timestamp",
          "userId",
          "userEmail",
          "action",
          "category",
          "resourceType",
          "resourceId",
          "description",
          "severity",
          "status",
          "ipAddress",
        ];

        const rows = logs.map((log) =>
          [
            log.id,
            log.createdAt.toISOString(),
            log.userId ?? "",
            log.userEmail ?? "",
            log.action,
            log.category,
            log.resourceType ?? "",
            log.resourceId ?? "",
            (log.description ?? "").replace(/"/g, '""'),
            log.severity,
            log.status,
            log.ipAddress ?? "",
          ].join(",")
        );

        return {
          format: "csv",
          content: [headers.join(","), ...rows].join("\n"),
          filename: `audit-logs-${input.startDate.split("T")[0]}-${input.endDate.split("T")[0]}.csv`,
        };
      }

      return {
        format: "json",
        content: logs,
        filename: `audit-logs-${input.startDate.split("T")[0]}-${input.endDate.split("T")[0]}.json`,
      };
    }),
});

export type AuditRouter = typeof auditRouter;
