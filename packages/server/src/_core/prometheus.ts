/**
 * Prometheus Metrics Module
 *
 * Exposes application metrics in Prometheus format for monitoring.
 *
 * Metrics exposed:
 * - HTTP request duration histogram
 * - HTTP request counter (by status, method, path)
 * - Active connections gauge
 * - Database pool metrics
 * - Memory usage gauge
 * - Custom business metrics
 *
 * Usage:
 *   import { prometheusMiddleware, metricsEndpoint } from './_core/prometheus';
 *   app.use(prometheusMiddleware());
 *   app.get('/metrics', metricsEndpoint);
 *
 * Scrape config for Prometheus:
 *   - job_name: 'rsm-api'
 *     static_configs:
 *       - targets: ['localhost:3001']
 *     metrics_path: '/metrics'
 */

import { CURRENT_REGION } from "./region";

// =============================================================================
// Types
// =============================================================================

interface MetricLabels {
  [key: string]: string;
}

interface CounterMetric {
  name: string;
  help: string;
  labels: string[];
  values: Map<string, number>;
}

interface GaugeMetric {
  name: string;
  help: string;
  labels: string[];
  values: Map<string, number>;
}

interface HistogramMetric {
  name: string;
  help: string;
  labels: string[];
  buckets: number[];
  values: Map<string, { count: number; sum: number; buckets: Map<number, number> }>;
}

// =============================================================================
// Metrics Registry
// =============================================================================

const counters = new Map<string, CounterMetric>();
const gauges = new Map<string, GaugeMetric>();
const histograms = new Map<string, HistogramMetric>();

// Default histogram buckets for response times (in seconds)
const DEFAULT_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

// =============================================================================
// Metric Registration
// =============================================================================

function registerCounter(name: string, help: string, labels: string[] = []): CounterMetric {
  const metric: CounterMetric = { name, help, labels, values: new Map() };
  counters.set(name, metric);
  return metric;
}

function registerGauge(name: string, help: string, labels: string[] = []): GaugeMetric {
  const metric: GaugeMetric = { name, help, labels, values: new Map() };
  gauges.set(name, metric);
  return metric;
}

function registerHistogram(
  name: string,
  help: string,
  labels: string[] = [],
  buckets: number[] = DEFAULT_BUCKETS
): HistogramMetric {
  const metric: HistogramMetric = { name, help, labels, buckets, values: new Map() };
  histograms.set(name, metric);
  return metric;
}

// =============================================================================
// Pre-defined Metrics
// =============================================================================

// HTTP metrics
const httpRequestsTotal = registerCounter(
  "http_requests_total",
  "Total number of HTTP requests",
  ["method", "path", "status", "region"]
);

const httpRequestDuration = registerHistogram(
  "http_request_duration_seconds",
  "HTTP request duration in seconds",
  ["method", "path", "status", "region"]
);

const httpActiveRequests = registerGauge(
  "http_active_requests",
  "Number of active HTTP requests",
  ["region"]
);

// Database metrics
const dbPoolConnections = registerGauge(
  "db_pool_connections",
  "Database connection pool status",
  ["state", "region"]
);

const dbQueryDuration = registerHistogram(
  "db_query_duration_seconds",
  "Database query duration in seconds",
  ["operation", "region"]
);

// Application metrics
const memoryUsageBytes = registerGauge(
  "process_memory_bytes",
  "Process memory usage in bytes",
  ["type", "region"]
);

const appInfo = registerGauge(
  "app_info",
  "Application information",
  ["version", "node_version", "region"]
);

// Business metrics
const activeUsers = registerGauge(
  "rsm_active_users",
  "Number of active users",
  ["region"]
);

const activeSessions = registerGauge(
  "rsm_active_sessions",
  "Number of active recording sessions",
  ["region"]
);

const invoicesGenerated = registerCounter(
  "rsm_invoices_generated_total",
  "Total number of invoices generated",
  ["region"]
);

const paymentsProcessed = registerCounter(
  "rsm_payments_processed_total",
  "Total number of payments processed",
  ["status", "region"]
);

// =============================================================================
// Metric Operations
// =============================================================================

function labelKey(labels: MetricLabels): string {
  return JSON.stringify(labels);
}

export function incCounter(name: string, labels: MetricLabels = {}, value = 1): void {
  const metric = counters.get(name);
  if (!metric) return;

  const key = labelKey(labels);
  const current = metric.values.get(key) ?? 0;
  metric.values.set(key, current + value);
}

export function setGauge(name: string, labels: MetricLabels = {}, value: number): void {
  const metric = gauges.get(name);
  if (!metric) return;

  const key = labelKey(labels);
  metric.values.set(key, value);
}

export function incGauge(name: string, labels: MetricLabels = {}, value = 1): void {
  const metric = gauges.get(name);
  if (!metric) return;

  const key = labelKey(labels);
  const current = metric.values.get(key) ?? 0;
  metric.values.set(key, current + value);
}

export function decGauge(name: string, labels: MetricLabels = {}, value = 1): void {
  const metric = gauges.get(name);
  if (!metric) return;

  const key = labelKey(labels);
  const current = metric.values.get(key) ?? 0;
  metric.values.set(key, Math.max(0, current - value));
}

export function observeHistogram(name: string, labels: MetricLabels = {}, value: number): void {
  const metric = histograms.get(name);
  if (!metric) return;

  const key = labelKey(labels);
  let data = metric.values.get(key);

  if (!data) {
    data = {
      count: 0,
      sum: 0,
      buckets: new Map(metric.buckets.map((b) => [b, 0])),
    };
    metric.values.set(key, data);
  }

  data.count++;
  data.sum += value;

  // Update buckets
  for (const bucket of metric.buckets) {
    if (value <= bucket) {
      data.buckets.set(bucket, (data.buckets.get(bucket) ?? 0) + 1);
    }
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

export function trackHttpRequest(
  method: string,
  path: string,
  status: number,
  durationMs: number
): void {
  const labels = {
    method,
    path: normalizePath(path),
    status: String(status),
    region: CURRENT_REGION,
  };

  incCounter("http_requests_total", labels);
  observeHistogram("http_request_duration_seconds", labels, durationMs / 1000);
}

export function trackDbQuery(operation: string, durationMs: number): void {
  observeHistogram(
    "db_query_duration_seconds",
    { operation, region: CURRENT_REGION },
    durationMs / 1000
  );
}

export function setDbPoolStatus(active: number, idle: number): void {
  setGauge("db_pool_connections", { state: "active", region: CURRENT_REGION }, active);
  setGauge("db_pool_connections", { state: "idle", region: CURRENT_REGION }, idle);
}

export function trackPayment(success: boolean): void {
  incCounter("rsm_payments_processed_total", {
    status: success ? "success" : "failed",
    region: CURRENT_REGION,
  });
}

export function trackInvoice(): void {
  incCounter("rsm_invoices_generated_total", { region: CURRENT_REGION });
}

// Normalize path to prevent high cardinality
function normalizePath(path: string): string {
  // Replace IDs with placeholders
  return path
    .replace(/\/\d+/g, "/:id")
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:uuid")
    .replace(/\?.*$/, ""); // Remove query string
}

// =============================================================================
// Metrics Collection
// =============================================================================

function collectProcessMetrics(): void {
  const memUsage = process.memoryUsage();

  setGauge("process_memory_bytes", { type: "rss", region: CURRENT_REGION }, memUsage.rss);
  setGauge("process_memory_bytes", { type: "heapTotal", region: CURRENT_REGION }, memUsage.heapTotal);
  setGauge("process_memory_bytes", { type: "heapUsed", region: CURRENT_REGION }, memUsage.heapUsed);
  setGauge("process_memory_bytes", { type: "external", region: CURRENT_REGION }, memUsage.external);

  // App info (always 1)
  setGauge(
    "app_info",
    {
      version: process.env.npm_package_version ?? "0.0.0",
      node_version: process.version,
      region: CURRENT_REGION,
    },
    1
  );
}

// =============================================================================
// Prometheus Format Output
// =============================================================================

function formatLabels(labelsJson: string): string {
  try {
    const labels = JSON.parse(labelsJson) as MetricLabels;
    const parts = Object.entries(labels).map(([k, v]) => `${k}="${escapeLabel(v)}"`);
    return parts.length > 0 ? `{${parts.join(",")}}` : "";
  } catch {
    return "";
  }
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export function generatePrometheusOutput(): string {
  // Collect process metrics before output
  collectProcessMetrics();

  const lines: string[] = [];

  // Counters
  for (const metric of counters.values()) {
    lines.push(`# HELP ${metric.name} ${metric.help}`);
    lines.push(`# TYPE ${metric.name} counter`);

    for (const [labels, value] of metric.values) {
      lines.push(`${metric.name}${formatLabels(labels)} ${value}`);
    }
    lines.push("");
  }

  // Gauges
  for (const metric of gauges.values()) {
    lines.push(`# HELP ${metric.name} ${metric.help}`);
    lines.push(`# TYPE ${metric.name} gauge`);

    for (const [labels, value] of metric.values) {
      lines.push(`${metric.name}${formatLabels(labels)} ${value}`);
    }
    lines.push("");
  }

  // Histograms
  for (const metric of histograms.values()) {
    lines.push(`# HELP ${metric.name} ${metric.help}`);
    lines.push(`# TYPE ${metric.name} histogram`);

    for (const [labels, data] of metric.values) {
      const labelStr = formatLabels(labels);
      const baseLabels = labelStr.slice(0, -1); // Remove trailing }

      // Bucket values (cumulative)
      let cumulative = 0;
      for (const bucket of metric.buckets) {
        cumulative += data.buckets.get(bucket) ?? 0;
        const le = bucket === Infinity ? "+Inf" : String(bucket);
        const bucketLabels = baseLabels ? `${baseLabels},le="${le}"}` : `{le="${le}"}`;
        lines.push(`${metric.name}_bucket${bucketLabels} ${cumulative}`);
      }

      // +Inf bucket
      const infLabels = baseLabels ? `${baseLabels},le="+Inf"}` : `{le="+Inf"}`;
      lines.push(`${metric.name}_bucket${infLabels} ${data.count}`);

      // Sum and count
      lines.push(`${metric.name}_sum${labelStr} ${data.sum}`);
      lines.push(`${metric.name}_count${labelStr} ${data.count}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// =============================================================================
// Express Middleware
// =============================================================================

interface Request {
  method: string;
  path: string;
  url: string;
}

interface Response {
  statusCode: number;
  on: (event: string, callback: () => void) => void;
}

export function prometheusMiddleware() {
  return (req: Request, res: Response, next: () => void) => {
    const startTime = Date.now();

    // Track active requests
    incGauge("http_active_requests", { region: CURRENT_REGION });

    res.on("finish", () => {
      const durationMs = Date.now() - startTime;

      // Track completed request
      trackHttpRequest(req.method, req.path || req.url, res.statusCode, durationMs);

      // Decrement active requests
      decGauge("http_active_requests", { region: CURRENT_REGION });
    });

    next();
  };
}

// =============================================================================
// Metrics Endpoint Handler
// =============================================================================

interface ExpressResponse {
  set: (header: string, value: string) => void;
  send: (body: string) => void;
}

export function metricsEndpoint(_req: unknown, res: ExpressResponse): void {
  res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(generatePrometheusOutput());
}

// =============================================================================
// Exports for Business Metrics
// =============================================================================

export {
  httpRequestsTotal,
  httpRequestDuration,
  httpActiveRequests,
  dbPoolConnections,
  dbQueryDuration,
  memoryUsageBytes,
  appInfo,
  activeUsers,
  activeSessions,
  invoicesGenerated,
  paymentsProcessed,
};
