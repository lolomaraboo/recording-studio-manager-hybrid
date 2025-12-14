/**
 * Analytics Router
 *
 * Provides analytics and reporting endpoints for studio management.
 *
 * Endpoints:
 * - dashboard: Get complete dashboard data
 * - revenue: Get revenue metrics
 * - sessions: Get session metrics
 * - clients: Get client metrics
 * - rooms: Get room performance metrics
 * - projects: Get project metrics
 * - invoices: Get invoice metrics
 * - generateReport: Generate custom report
 * - yearOverYear: Get year-over-year comparison
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  getDashboardData,
  getRevenueMetrics,
  getSessionMetrics,
  getClientMetrics,
  getRoomMetrics,
  getProjectMetrics,
  getInvoiceMetrics,
  generateReport,
  getYearOverYearComparison,
  getDateRangeForPeriod,
  type DateRange,
  type MetricType,
  type TimeGranularity,
} from "../_core/analytics";

// ============================================================================
// Input Schemas
// ============================================================================

const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const periodSchema = z.enum(["today", "week", "month", "quarter", "year", "custom"]);

const periodInput = z.object({
  period: periodSchema.default("month"),
  customRange: dateRangeSchema.optional(),
});

const reportConfigSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  metrics: z.array(
    z.enum(["revenue", "sessions", "clients", "rooms", "projects", "invoices", "bookings"])
  ),
  dateRange: dateRangeSchema,
  granularity: z
    .enum(["hour", "day", "week", "month", "quarter", "year"])
    .default("day") as z.ZodDefault<z.ZodEnum<[TimeGranularity, ...TimeGranularity[]]>>,
  groupBy: z.array(z.string()).optional(),
  filters: z.record(z.unknown()).optional(),
  format: z.enum(["json", "csv", "pdf"]).default("json"),
});

const yearInput = z.object({
  year: z.number().min(2020).max(2100).default(new Date().getFullYear()),
});

// ============================================================================
// Helper Functions
// ============================================================================

function resolveRange(period: string, customRange?: DateRange): DateRange {
  if (period === "custom" && customRange) {
    return customRange;
  }
  return getDateRangeForPeriod(
    period as "today" | "week" | "month" | "quarter" | "year" | "custom"
  );
}

function getOrgId(ctx: { organizationId: number | null }): number {
  if (!ctx.organizationId) {
    throw new Error("Organization context required");
  }
  return ctx.organizationId;
}

// ============================================================================
// Router
// ============================================================================

export const analyticsRouter = router({
  /**
   * Get complete dashboard data
   * Includes all metrics and trend data
   */
  dashboard: protectedProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const dateRange = resolveRange(input.period, input.customRange as DateRange | undefined);
    const organizationId = getOrgId(ctx);

    const data = await getDashboardData(organizationId, dateRange);

    return {
      ...data,
      period: input.period,
      dateRange,
    };
  }),

  /**
   * Get revenue metrics
   */
  revenue: protectedProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const dateRange = resolveRange(input.period, input.customRange as DateRange | undefined);

    return getRevenueMetrics(getOrgId(ctx), dateRange);
  }),

  /**
   * Get session metrics
   */
  sessions: protectedProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const dateRange = resolveRange(input.period, input.customRange as DateRange | undefined);

    return getSessionMetrics(getOrgId(ctx), dateRange);
  }),

  /**
   * Get client metrics
   */
  clients: protectedProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const dateRange = resolveRange(input.period, input.customRange as DateRange | undefined);

    return getClientMetrics(getOrgId(ctx), dateRange);
  }),

  /**
   * Get room performance metrics
   */
  rooms: protectedProcedure.query(async ({ ctx }) => {
    return getRoomMetrics(getOrgId(ctx));
  }),

  /**
   * Get project metrics
   */
  projects: protectedProcedure.query(async ({ ctx }) => {
    return getProjectMetrics(getOrgId(ctx));
  }),

  /**
   * Get invoice metrics
   */
  invoices: protectedProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const dateRange = resolveRange(input.period, input.customRange as DateRange | undefined);

    return getInvoiceMetrics(getOrgId(ctx), dateRange);
  }),

  /**
   * Generate a custom report
   * Returns report data in requested format
   */
  generateReport: protectedProcedure
    .input(reportConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await generateReport(getOrgId(ctx), {
        title: input.title,
        description: input.description,
        metrics: input.metrics as MetricType[],
        dateRange: input.dateRange,
        granularity: input.granularity as TimeGranularity,
        groupBy: input.groupBy,
        filters: input.filters,
        format: input.format,
      });

      return report;
    }),

  /**
   * Get year-over-year comparison
   * Admin only - requires elevated access
   */
  yearOverYear: adminProcedure.input(yearInput).query(async ({ ctx, input }) => {
    return getYearOverYearComparison(getOrgId(ctx), input.year);
  }),

  /**
   * Get key performance indicators summary
   */
  kpis: protectedProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const dateRange = resolveRange(input.period, input.customRange as DateRange | undefined);
    const organizationId = getOrgId(ctx);

    const [revenue, sessions, clients, invoices] = await Promise.all([
      getRevenueMetrics(organizationId, dateRange),
      getSessionMetrics(organizationId, dateRange),
      getClientMetrics(organizationId, dateRange),
      getInvoiceMetrics(organizationId, dateRange),
    ]);

    return {
      revenue: {
        total: revenue.totalRevenue,
        growth: revenue.revenueGrowth,
        target: Math.round(revenue.totalRevenue * 1.2), // 20% target growth
        percentOfTarget: Math.round((revenue.totalRevenue / (revenue.totalRevenue * 1.2)) * 100),
      },
      sessions: {
        total: sessions.totalSessions,
        utilizationRate: sessions.utilizationRate,
        cancellationRate: sessions.cancellationRate,
        averageDuration: sessions.averageDuration,
      },
      clients: {
        total: clients.totalClients,
        active: clients.activeClients,
        new: clients.newClients,
        retentionRate: clients.retentionRate,
        averageLifetimeValue: clients.averageLifetimeValue,
      },
      financial: {
        invoiced: invoices.totalInvoiced,
        collected: invoices.totalPaid,
        outstanding: invoices.totalOutstanding,
        collectionRate: invoices.paymentRate,
        avgDaysToPayment: invoices.averageDaysToPayment,
      },
    };
  }),

  /**
   * Get trending data for charts
   */
  trends: protectedProcedure
    .input(
      z.object({
        metric: z.enum(["revenue", "sessions", "clients"]),
        period: periodSchema.default("month"),
        granularity: z.enum(["hour", "day", "week", "month"]).default("day"),
      })
    )
    .query(async ({ ctx, input }) => {
      const dateRange = resolveRange(input.period);

      // Get dashboard data which includes trends
      const data = await getDashboardData(getOrgId(ctx), dateRange);

      const trendData = data.trends[input.metric as keyof typeof data.trends];

      return {
        metric: input.metric,
        period: input.period,
        granularity: input.granularity,
        data: trendData,
        summary: {
          min: Math.min(...trendData.map((d) => d.value)),
          max: Math.max(...trendData.map((d) => d.value)),
          avg: Math.round(trendData.reduce((s, d) => s + d.value, 0) / trendData.length),
          total: trendData.reduce((s, d) => s + d.value, 0),
        },
      };
    }),

  /**
   * Get peak hours analysis
   */
  peakHours: protectedProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const dateRange = resolveRange(input.period, input.customRange as DateRange | undefined);

    const sessions = await getSessionMetrics(getOrgId(ctx), dateRange);

    // Identify peak hours (top 3)
    const sortedHours = [...sessions.peakHours].sort((a, b) => b.count - a.count);
    const peakHours = sortedHours.slice(0, 3).map((h) => h.hour);
    const slowHours = sortedHours.slice(-3).map((h) => h.hour);

    return {
      hourlyDistribution: sessions.peakHours,
      dailyDistribution: sessions.sessionsByDay,
      peakHours,
      slowHours,
      recommendations: [
        peakHours.length > 0
          ? `Consider premium pricing during peak hours (${peakHours.join(", ")}:00)`
          : null,
        slowHours.length > 0
          ? `Offer discounts during slow hours (${slowHours.join(", ")}:00) to increase utilization`
          : null,
        sessions.cancellationRate > 0.1 ? "High cancellation rate - consider deposit requirements" : null,
      ].filter(Boolean),
    };
  }),
});

export type AnalyticsRouter = typeof analyticsRouter;
