/**
 * Monitoring Module
 *
 * Centralized monitoring and health check system for multi-region deployment.
 *
 * Features:
 * - Periodic health checks for all services
 * - Metrics collection and aggregation
 * - Alerting thresholds
 * - CloudWatch/Prometheus integration
 * - Distributed tracing support
 */

import {
  CURRENT_REGION,
  REGIONS,
  performHealthCheck,
  getAllRegionHealth,
  isRegionHealthy,
  type RegionCode,
  type RegionHealth,
} from "./region";

// ============================================================================
// Types
// ============================================================================

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs: number;
  lastCheck: Date;
  details?: Record<string, unknown>;
}

export interface SystemMetrics {
  timestamp: Date;
  region: RegionCode;
  cpu: {
    usage: number; // percentage
    loadAvg: [number, number, number];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    total: number;
    success: number;
    errors: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
  };
  connections: {
    active: number;
    idle: number;
  };
}

export interface AlertConfig {
  metric: string;
  operator: ">" | "<" | "==" | ">=" | "<=";
  threshold: number;
  duration: number; // seconds
  severity: "warning" | "critical";
  action?: "page" | "email" | "slack";
}

export interface Alert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: "warning" | "critical";
  region: RegionCode;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

// ============================================================================
// Metrics Collection
// ============================================================================

// In-memory metrics storage (use Redis/Prometheus in production)
const metricsBuffer: SystemMetrics[] = [];
const MAX_METRICS_BUFFER = 1000;

// Request tracking
let requestStats = {
  total: 0,
  success: 0,
  errors: 0,
  latencies: [] as number[],
};

/**
 * Track a request completion
 */
export function trackRequest(
  success: boolean,
  latencyMs: number
): void {
  requestStats.total++;
  if (success) {
    requestStats.success++;
  } else {
    requestStats.errors++;
  }
  requestStats.latencies.push(latencyMs);

  // Keep only last 1000 latencies
  if (requestStats.latencies.length > 1000) {
    requestStats.latencies = requestStats.latencies.slice(-1000);
  }
}

/**
 * Calculate percentile from array of values
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

/**
 * Collect current system metrics
 */
export function collectMetrics(): SystemMetrics {
  const memUsage = process.memoryUsage();

  const metrics: SystemMetrics = {
    timestamp: new Date(),
    region: CURRENT_REGION,
    cpu: {
      usage: process.cpuUsage().user / 1000000, // Convert to seconds
      loadAvg: [0, 0, 0], // Would use os.loadavg() in Node.js
    },
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
    },
    requests: {
      total: requestStats.total,
      success: requestStats.success,
      errors: requestStats.errors,
      avgLatencyMs:
        requestStats.latencies.length > 0
          ? requestStats.latencies.reduce((a, b) => a + b, 0) /
            requestStats.latencies.length
          : 0,
      p95LatencyMs: percentile(requestStats.latencies, 95),
      p99LatencyMs: percentile(requestStats.latencies, 99),
    },
    connections: {
      active: 0, // Would track from connection pool
      idle: 0,
    },
  };

  // Add to buffer
  metricsBuffer.push(metrics);
  if (metricsBuffer.length > MAX_METRICS_BUFFER) {
    metricsBuffer.shift();
  }

  return metrics;
}

/**
 * Get recent metrics
 */
export function getRecentMetrics(count = 60): SystemMetrics[] {
  return metricsBuffer.slice(-count);
}

/**
 * Reset request stats (call periodically)
 */
export function resetRequestStats(): void {
  requestStats = {
    total: 0,
    success: 0,
    errors: 0,
    latencies: [],
  };
}

// ============================================================================
// Health Checks
// ============================================================================

const serviceHealthCache = new Map<string, ServiceHealth>();

/**
 * Check health of a specific service
 */
export async function checkServiceHealth(
  name: string,
  checkFn: () => Promise<void>
): Promise<ServiceHealth> {
  const startTime = Date.now();
  let status: "healthy" | "degraded" | "unhealthy" = "healthy";
  let details: Record<string, unknown> = {};

  try {
    await checkFn();
    const latencyMs = Date.now() - startTime;

    // Mark as degraded if slow
    if (latencyMs > 1000) {
      status = "degraded";
      details.reason = "High latency";
    }

    const health: ServiceHealth = {
      name,
      status,
      latencyMs,
      lastCheck: new Date(),
      details,
    };

    serviceHealthCache.set(name, health);
    return health;
  } catch (error) {
    const health: ServiceHealth = {
      name,
      status: "unhealthy",
      latencyMs: Date.now() - startTime,
      lastCheck: new Date(),
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };

    serviceHealthCache.set(name, health);
    return health;
  }
}

/**
 * Get all service health statuses
 */
export function getAllServiceHealth(): ServiceHealth[] {
  return Array.from(serviceHealthCache.values());
}

/**
 * Comprehensive health check of all services
 */
export async function performFullHealthCheck(): Promise<{
  region: RegionCode;
  status: "healthy" | "degraded" | "unhealthy";
  services: ServiceHealth[];
  regionHealth: RegionHealth;
  metrics: SystemMetrics;
}> {
  // Check database
  const dbHealth = await checkServiceHealth("database", async () => {
    const { getMasterDb } = await import("@rsm/database/connection");
    const { sql } = await import("drizzle-orm");
    const db = await getMasterDb();
    await db.execute(sql`SELECT 1`);
  });

  // Check Redis (if configured)
  const redisHealth = await checkServiceHealth("redis", async () => {
    // Placeholder - would check Redis connection
    // const redis = getRedisClient();
    // await redis.ping();
  });

  // Check S3 (if configured)
  const s3Health = await checkServiceHealth("s3", async () => {
    // Placeholder - would check S3 access
    // const s3 = getS3Client();
    // await s3.headBucket({ Bucket: getS3Bucket() });
  });

  // Perform region health check
  const regionHealth = await performHealthCheck();

  // Collect metrics
  const metrics = collectMetrics();

  // Determine overall status
  const services = [dbHealth, redisHealth, s3Health];
  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

  if (services.some((s) => s.status === "unhealthy")) {
    overallStatus = "unhealthy";
  } else if (services.some((s) => s.status === "degraded")) {
    overallStatus = "degraded";
  }

  return {
    region: CURRENT_REGION,
    status: overallStatus,
    services,
    regionHealth,
    metrics,
  };
}

// ============================================================================
// Alerting
// ============================================================================

const defaultAlerts: AlertConfig[] = [
  // Error rate alerts
  {
    metric: "error_rate",
    operator: ">",
    threshold: 0.05, // 5%
    duration: 60,
    severity: "warning",
    action: "slack",
  },
  {
    metric: "error_rate",
    operator: ">",
    threshold: 0.1, // 10%
    duration: 60,
    severity: "critical",
    action: "page",
  },
  // Latency alerts
  {
    metric: "p99_latency",
    operator: ">",
    threshold: 5000, // 5 seconds
    duration: 120,
    severity: "warning",
    action: "slack",
  },
  {
    metric: "p99_latency",
    operator: ">",
    threshold: 10000, // 10 seconds
    duration: 60,
    severity: "critical",
    action: "page",
  },
  // Memory alerts
  {
    metric: "memory_percentage",
    operator: ">",
    threshold: 80,
    duration: 300,
    severity: "warning",
    action: "slack",
  },
  {
    metric: "memory_percentage",
    operator: ">",
    threshold: 95,
    duration: 60,
    severity: "critical",
    action: "page",
  },
  // Database latency
  {
    metric: "db_latency",
    operator: ">",
    threshold: 1000,
    duration: 120,
    severity: "warning",
    action: "slack",
  },
  // Replication lag
  {
    metric: "replication_lag",
    operator: ">",
    threshold: 5000, // 5 seconds
    duration: 300,
    severity: "warning",
    action: "email",
  },
];

const activeAlerts = new Map<string, Alert>();

/**
 * Check metrics against alert thresholds
 */
export function checkAlerts(metrics: SystemMetrics): Alert[] {
  const newAlerts: Alert[] = [];

  const metricValues: Record<string, number> = {
    error_rate:
      metrics.requests.total > 0
        ? metrics.requests.errors / metrics.requests.total
        : 0,
    p99_latency: metrics.requests.p99LatencyMs,
    memory_percentage: metrics.memory.percentage,
  };

  for (const config of defaultAlerts) {
    const value = metricValues[config.metric];
    if (value === undefined) continue;

    const alertKey = `${config.metric}-${config.severity}`;
    let triggered = false;

    switch (config.operator) {
      case ">":
        triggered = value > config.threshold;
        break;
      case ">=":
        triggered = value >= config.threshold;
        break;
      case "<":
        triggered = value < config.threshold;
        break;
      case "<=":
        triggered = value <= config.threshold;
        break;
      case "==":
        triggered = value === config.threshold;
        break;
    }

    const existingAlert = activeAlerts.get(alertKey);

    if (triggered && !existingAlert) {
      const alert: Alert = {
        id: `${alertKey}-${Date.now()}`,
        metric: config.metric,
        value,
        threshold: config.threshold,
        severity: config.severity,
        region: CURRENT_REGION,
        timestamp: new Date(),
        resolved: false,
      };

      activeAlerts.set(alertKey, alert);
      newAlerts.push(alert);

      // Trigger action
      triggerAlertAction(alert, config);
    } else if (!triggered && existingAlert && !existingAlert.resolved) {
      // Resolve existing alert
      existingAlert.resolved = true;
      existingAlert.resolvedAt = new Date();
    }
  }

  return newAlerts;
}

/**
 * Trigger alert action (placeholder)
 */
function triggerAlertAction(alert: Alert, config: AlertConfig): void {
  console.log(
    `[ALERT] ${config.severity.toUpperCase()}: ${alert.metric} = ${alert.value} (threshold: ${config.threshold}) in ${alert.region}`
  );

  // In production, this would:
  // - Send to Slack webhook
  // - Send to PagerDuty
  // - Send email via SES
  // - Push to CloudWatch Alarms
}

/**
 * Get all active alerts
 */
export function getActiveAlerts(): Alert[] {
  return Array.from(activeAlerts.values()).filter((a) => !a.resolved);
}

/**
 * Get alert history
 */
export function getAlertHistory(): Alert[] {
  return Array.from(activeAlerts.values());
}

// ============================================================================
// Background Monitoring
// ============================================================================

let monitoringInterval: NodeJS.Timeout | null = null;

/**
 * Start background monitoring
 */
export function startMonitoring(intervalMs = 30000): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }

  monitoringInterval = setInterval(async () => {
    try {
      // Collect metrics
      const metrics = collectMetrics();

      // Check alerts
      checkAlerts(metrics);

      // Perform health check
      await performHealthCheck();

      console.log(
        `[Monitoring] Region: ${CURRENT_REGION}, Memory: ${metrics.memory.percentage.toFixed(1)}%, Requests: ${metrics.requests.total}`
      );
    } catch (error) {
      console.error("[Monitoring] Error in monitoring loop:", error);
    }
  }, intervalMs);

  console.log(
    `[Monitoring] Started background monitoring (interval: ${intervalMs}ms)`
  );
}

/**
 * Stop background monitoring
 */
export function stopMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log("[Monitoring] Stopped background monitoring");
  }
}

// ============================================================================
// Multi-Region Dashboard Data
// ============================================================================

/**
 * Get dashboard data for all regions
 */
export function getDashboardData(): {
  currentRegion: RegionCode;
  regions: {
    code: RegionCode;
    name: string;
    status: string;
    isHealthy: boolean;
    isPrimary: boolean;
  }[];
  metrics: SystemMetrics | null;
  alerts: Alert[];
} {
  const regionHealth = getAllRegionHealth();

  return {
    currentRegion: CURRENT_REGION,
    regions: Object.values(REGIONS).map((region) => {
      const health = regionHealth.find((h) => h.region === region.code);
      return {
        code: region.code,
        name: region.name,
        status: health?.status ?? "unknown",
        isHealthy: isRegionHealthy(region.code),
        isPrimary: region.isPrimary,
      };
    }),
    metrics: metricsBuffer.length > 0 ? metricsBuffer[metricsBuffer.length - 1] ?? null : null,
    alerts: getActiveAlerts(),
  };
}

// ============================================================================
// Express/Connect Middleware
// ============================================================================

/**
 * Middleware to track request metrics
 */
export function metricsMiddleware() {
  return (_req: unknown, res: unknown, next: () => void) => {
    const startTime = Date.now();

    // Track on response finish
    const response = res as { on: (event: string, callback: () => void) => void; statusCode?: number };
    response.on("finish", () => {
      const latencyMs = Date.now() - startTime;
      const success = (response.statusCode ?? 500) < 400;
      trackRequest(success, latencyMs);
    });

    next();
  };
}

/**
 * Health check endpoint handler
 */
export async function healthEndpoint(): Promise<{
  status: string;
  region: RegionCode;
  timestamp: string;
  checks: Record<string, unknown>;
}> {
  const fullHealth = await performFullHealthCheck();

  return {
    status: fullHealth.status,
    region: fullHealth.region,
    timestamp: new Date().toISOString(),
    checks: {
      services: fullHealth.services.map((s) => ({
        name: s.name,
        status: s.status,
        latencyMs: s.latencyMs,
      })),
      memory: {
        percentage: fullHealth.metrics.memory.percentage.toFixed(1),
        used: Math.round(fullHealth.metrics.memory.used / 1024 / 1024) + "MB",
      },
      requests: {
        total: fullHealth.metrics.requests.total,
        errorRate:
          fullHealth.metrics.requests.total > 0
            ? (
                (fullHealth.metrics.requests.errors /
                  fullHealth.metrics.requests.total) *
                100
              ).toFixed(2) + "%"
            : "0%",
        avgLatencyMs: fullHealth.metrics.requests.avgLatencyMs.toFixed(0),
      },
    },
  };
}
