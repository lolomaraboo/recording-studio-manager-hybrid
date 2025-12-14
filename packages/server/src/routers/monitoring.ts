/**
 * Monitoring Router
 *
 * Endpoints for system monitoring and health checks:
 * - System metrics
 * - Service health checks
 * - Alert management
 * - Dashboard data
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  collectMetrics,
  getRecentMetrics,
  getAllServiceHealth,
  performFullHealthCheck,
  getActiveAlerts,
  getAlertHistory,
  getDashboardData,
  healthEndpoint,
  startMonitoring,
  stopMonitoring,
} from "../_core/monitoring";
import { CURRENT_REGION } from "../_core/region";

// ============================================================================
// Router
// ============================================================================

export const monitoringRouter = router({
  /**
   * Simple health check endpoint
   * Public for load balancer health checks
   */
  health: publicProcedure.query(async () => {
    return healthEndpoint();
  }),

  /**
   * Ping endpoint for latency testing
   */
  ping: publicProcedure.query(() => {
    return {
      pong: true,
      region: CURRENT_REGION,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Get current system metrics
   */
  getMetrics: protectedProcedure.query(() => {
    const metrics = collectMetrics();
    return {
      timestamp: metrics.timestamp.toISOString(),
      region: metrics.region,
      cpu: metrics.cpu,
      memory: {
        usedMB: Math.round(metrics.memory.used / 1024 / 1024),
        totalMB: Math.round(metrics.memory.total / 1024 / 1024),
        percentage: Number(metrics.memory.percentage.toFixed(1)),
      },
      requests: {
        total: metrics.requests.total,
        success: metrics.requests.success,
        errors: metrics.requests.errors,
        avgLatencyMs: Number(metrics.requests.avgLatencyMs.toFixed(0)),
        p95LatencyMs: metrics.requests.p95LatencyMs,
        p99LatencyMs: metrics.requests.p99LatencyMs,
      },
    };
  }),

  /**
   * Get metrics history
   */
  getMetricsHistory: adminProcedure
    .input(z.object({ count: z.number().min(1).max(1000).default(60) }))
    .query(({ input }) => {
      const metrics = getRecentMetrics(input.count);
      return metrics.map((m) => ({
        timestamp: m.timestamp.toISOString(),
        region: m.region,
        memoryPercentage: Number(m.memory.percentage.toFixed(1)),
        requestsTotal: m.requests.total,
        errorRate:
          m.requests.total > 0
            ? Number(((m.requests.errors / m.requests.total) * 100).toFixed(2))
            : 0,
        avgLatencyMs: Number(m.requests.avgLatencyMs.toFixed(0)),
      }));
    }),

  /**
   * Get all service health statuses
   */
  getServiceHealth: protectedProcedure.query(() => {
    const services = getAllServiceHealth();
    return services.map((s) => ({
      name: s.name,
      status: s.status,
      latencyMs: s.latencyMs,
      lastCheck: s.lastCheck.toISOString(),
      details: s.details,
    }));
  }),

  /**
   * Perform full health check
   */
  performHealthCheck: adminProcedure.mutation(async () => {
    const result = await performFullHealthCheck();
    return {
      region: result.region,
      status: result.status,
      services: result.services.map((s) => ({
        name: s.name,
        status: s.status,
        latencyMs: s.latencyMs,
      })),
      regionHealth: {
        status: result.regionHealth.status,
        apiLatencyMs: result.regionHealth.apiLatencyMs,
        dbLatencyMs: result.regionHealth.dbLatencyMs,
        errorRate: result.regionHealth.errorRate,
      },
      metrics: {
        memoryPercentage: Number(result.metrics.memory.percentage.toFixed(1)),
        requestsTotal: result.metrics.requests.total,
      },
    };
  }),

  /**
   * Get active alerts
   */
  getAlerts: protectedProcedure.query(() => {
    const alerts = getActiveAlerts();
    return alerts.map((a) => ({
      id: a.id,
      metric: a.metric,
      value: a.value,
      threshold: a.threshold,
      severity: a.severity,
      region: a.region,
      timestamp: a.timestamp.toISOString(),
    }));
  }),

  /**
   * Get alert history
   */
  getAlertHistory: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(({ input }) => {
      const alerts = getAlertHistory().slice(-input.limit);
      return alerts.map((a) => ({
        id: a.id,
        metric: a.metric,
        value: a.value,
        threshold: a.threshold,
        severity: a.severity,
        region: a.region,
        timestamp: a.timestamp.toISOString(),
        resolved: a.resolved,
        resolvedAt: a.resolvedAt?.toISOString() ?? null,
      }));
    }),

  /**
   * Get dashboard data for multi-region overview
   */
  getDashboard: adminProcedure.query(() => {
    const dashboard = getDashboardData();
    return {
      currentRegion: dashboard.currentRegion,
      regions: dashboard.regions,
      metrics: dashboard.metrics
        ? {
            timestamp: dashboard.metrics.timestamp.toISOString(),
            memoryPercentage: Number(dashboard.metrics.memory.percentage.toFixed(1)),
            requestsTotal: dashboard.metrics.requests.total,
            avgLatencyMs: Number(dashboard.metrics.requests.avgLatencyMs.toFixed(0)),
          }
        : null,
      alerts: dashboard.alerts.map((a) => ({
        id: a.id,
        metric: a.metric,
        severity: a.severity,
        region: a.region,
      })),
    };
  }),

  /**
   * Start background monitoring
   * Admin only
   */
  startMonitoring: adminProcedure
    .input(z.object({ intervalMs: z.number().min(5000).max(300000).default(30000) }))
    .mutation(({ input }) => {
      startMonitoring(input.intervalMs);
      return {
        success: true,
        message: `Monitoring started with ${input.intervalMs}ms interval`,
      };
    }),

  /**
   * Stop background monitoring
   * Admin only
   */
  stopMonitoring: adminProcedure.mutation(() => {
    stopMonitoring();
    return {
      success: true,
      message: "Monitoring stopped",
    };
  }),

  /**
   * Get server info
   */
  getServerInfo: adminProcedure.query(() => {
    return {
      region: CURRENT_REGION,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.floor(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
      pid: process.pid,
      env: process.env.NODE_ENV ?? "development",
    };
  }),
});

// ============================================================================
// Helpers
// ============================================================================

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}

export type MonitoringRouter = typeof monitoringRouter;
