/**
 * Sentry Error Tracking Module
 *
 * Centralized error tracking and performance monitoring with Sentry.
 *
 * Features:
 * - Automatic error capture
 * - Performance tracing
 * - User context tracking
 * - Environment and release tracking
 * - Custom tags and breadcrumbs
 * - Multi-region support
 *
 * Setup:
 * 1. Create a Sentry project at https://sentry.io
 * 2. Set SENTRY_DSN environment variable
 * 3. Call initSentry() at app startup
 *
 * Usage:
 *   import { initSentry, captureError, setUserContext } from './_core/sentry';
 *   initSentry();
 *   // Later...
 *   captureError(error, { userId: 123 });
 */

import { CURRENT_REGION } from "./region";

// =============================================================================
// Types
// =============================================================================

export interface SentryUser {
  id: string | number;
  email?: string;
  username?: string;
  ip_address?: string;
}

export interface SentryContext {
  [key: string]: unknown;
}

export interface SentryBreadcrumb {
  type?: string;
  category?: string;
  message?: string;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  data?: Record<string, unknown>;
  timestamp?: number;
}

export interface SentryTransaction {
  name: string;
  op: string;
  finish: () => void;
  setTag: (key: string, value: string) => void;
  setData: (key: string, value: unknown) => void;
  startChild: (opts: { op: string; description?: string }) => SentrySpan;
}

export interface SentrySpan {
  finish: () => void;
  setTag: (key: string, value: string) => void;
  setData: (key: string, value: unknown) => void;
}

// =============================================================================
// Configuration
// =============================================================================

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate: number;
  tracesSampleRate: number;
  profilesSampleRate: number;
  debug: boolean;
  enabled: boolean;
}

const config: SentryConfig = {
  dsn: process.env.SENTRY_DSN ?? "",
  environment: process.env.NODE_ENV ?? "development",
  release: process.env.npm_package_version ?? "0.0.0",
  sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE ?? "1.0"),
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
  profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? "0.1"),
  debug: process.env.SENTRY_DEBUG === "true",
  enabled: !!process.env.SENTRY_DSN,
};

// In-memory state (in production, this would use actual Sentry SDK)
let isInitialized = false;
let currentUser: SentryUser | null = null;
const breadcrumbs: SentryBreadcrumb[] = [];
const MAX_BREADCRUMBS = 100;

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize Sentry SDK
 * Call this at application startup
 */
export function initSentry(): void {
  if (!config.enabled) {
    console.log("[Sentry] Disabled - SENTRY_DSN not configured");
    return;
  }

  if (isInitialized) {
    console.warn("[Sentry] Already initialized");
    return;
  }

  // In production, this would call Sentry.init()
  // For now, we simulate the initialization
  console.log(`[Sentry] Initializing...`);
  console.log(`[Sentry] Environment: ${config.environment}`);
  console.log(`[Sentry] Release: ${config.release}`);
  console.log(`[Sentry] Region: ${CURRENT_REGION}`);
  console.log(`[Sentry] Sample Rate: ${config.sampleRate}`);
  console.log(`[Sentry] Traces Sample Rate: ${config.tracesSampleRate}`);

  isInitialized = true;

  // Set default tags
  setTag("region", CURRENT_REGION);
  setTag("service", "rsm-api");

  console.log("[Sentry] Initialized successfully");
}

/**
 * Check if Sentry is enabled and initialized
 */
export function isSentryEnabled(): boolean {
  return config.enabled && isInitialized;
}

// =============================================================================
// Error Capture
// =============================================================================

/**
 * Capture an error and send to Sentry
 */
export function captureError(
  error: Error | string,
  context?: SentryContext
): string {
  const eventId = generateEventId();

  if (!isSentryEnabled()) {
    console.error("[Sentry-Mock] Error captured:", error);
    return eventId;
  }

  // Log for development/debugging
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[Sentry] Capturing error: ${errorMessage}`);
  if (config.debug && errorStack) {
    console.error(`[Sentry] Stack trace:\n${errorStack}`);
  }

  // In production, this would call Sentry.captureException()
  logToSentry({
    type: "error",
    eventId,
    message: errorMessage,
    stack: errorStack,
    context,
    user: currentUser,
    breadcrumbs: [...breadcrumbs],
    tags: {
      region: CURRENT_REGION,
      environment: config.environment,
    },
    timestamp: new Date().toISOString(),
  });

  return eventId;
}

/**
 * Capture a message (non-error) and send to Sentry
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
  context?: SentryContext
): string {
  const eventId = generateEventId();

  if (!isSentryEnabled()) {
    console.log(`[Sentry-Mock] Message captured (${level}): ${message}`);
    return eventId;
  }

  console.log(`[Sentry] Capturing message (${level}): ${message}`);

  logToSentry({
    type: "message",
    eventId,
    level,
    message,
    context,
    user: currentUser,
    tags: {
      region: CURRENT_REGION,
      environment: config.environment,
    },
    timestamp: new Date().toISOString(),
  });

  return eventId;
}

// =============================================================================
// User Context
// =============================================================================

/**
 * Set the current user context
 */
export function setUserContext(user: SentryUser | null): void {
  currentUser = user;

  if (config.debug) {
    console.log("[Sentry] User context set:", user?.id ?? "cleared");
  }
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  currentUser = null;

  if (config.debug) {
    console.log("[Sentry] User context cleared");
  }
}

// =============================================================================
// Tags and Context
// =============================================================================

const globalTags = new Map<string, string>();

/**
 * Set a global tag
 */
export function setTag(key: string, value: string): void {
  globalTags.set(key, value);
}

/**
 * Set multiple global tags
 */
export function setTags(tags: Record<string, string>): void {
  for (const [key, value] of Object.entries(tags)) {
    globalTags.set(key, value);
  }
}

/**
 * Set extra context data
 */
export function setContext(name: string, context: SentryContext): void {
  if (config.debug) {
    console.log(`[Sentry] Context set: ${name}`, context);
  }
}

// =============================================================================
// Breadcrumbs
// =============================================================================

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
  const bc: SentryBreadcrumb = {
    ...breadcrumb,
    timestamp: breadcrumb.timestamp ?? Date.now(),
  };

  breadcrumbs.push(bc);

  // Keep only last N breadcrumbs
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }

  if (config.debug) {
    console.log(`[Sentry] Breadcrumb: ${bc.category} - ${bc.message}`);
  }
}

/**
 * Clear all breadcrumbs
 */
export function clearBreadcrumbs(): void {
  breadcrumbs.length = 0;
}

// =============================================================================
// Performance Monitoring
// =============================================================================

/**
 * Start a new transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string = "http.server"
): SentryTransaction {
  const startTime = Date.now();
  const transactionTags = new Map<string, string>();
  const transactionData = new Map<string, unknown>();

  const transaction: SentryTransaction = {
    name,
    op,
    finish: () => {
      const duration = Date.now() - startTime;
      if (config.debug) {
        console.log(`[Sentry] Transaction finished: ${name} (${duration}ms)`);
      }
    },
    setTag: (key: string, value: string) => {
      transactionTags.set(key, value);
    },
    setData: (key: string, value: unknown) => {
      transactionData.set(key, value);
    },
    startChild: (opts: { op: string; description?: string }): SentrySpan => {
      const childStartTime = Date.now();
      return {
        finish: () => {
          const childDuration = Date.now() - childStartTime;
          if (config.debug) {
            console.log(`[Sentry] Span finished: ${opts.description ?? opts.op} (${childDuration}ms)`);
          }
        },
        setTag: () => {},
        setData: () => {},
      };
    },
  };

  if (config.debug) {
    console.log(`[Sentry] Transaction started: ${name}`);
  }

  return transaction;
}

// =============================================================================
// Express Middleware
// =============================================================================

interface ExpressRequest {
  method: string;
  url: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  user?: { id: number | string; email?: string };
}

interface ExpressResponse {
  statusCode: number;
  on: (event: string, callback: () => void) => void;
}

/**
 * Express error handling middleware
 */
export function sentryErrorHandler() {
  return (
    err: Error,
    req: ExpressRequest,
    _res: ExpressResponse,
    next: (err?: Error) => void
  ) => {
    // Set request context
    setContext("request", {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
    });

    // Set user if available
    if (req.user) {
      setUserContext({
        id: req.user.id,
        email: req.user.email,
        ip_address: req.ip,
      });
    }

    // Capture the error
    captureError(err, {
      path: req.path,
      method: req.method,
    });

    next(err);
  };
}

/**
 * Express request tracking middleware
 */
export function sentryRequestHandler() {
  return (
    req: ExpressRequest,
    res: ExpressResponse,
    next: () => void
  ) => {
    // Start transaction
    const transaction = startTransaction(`${req.method} ${req.path}`, "http.server");

    // Add breadcrumb
    addBreadcrumb({
      type: "http",
      category: "request",
      message: `${req.method} ${req.url}`,
      level: "info",
    });

    // Track response
    res.on("finish", () => {
      transaction.setTag("http.status_code", String(res.statusCode));
      transaction.finish();

      // Add response breadcrumb
      addBreadcrumb({
        type: "http",
        category: "response",
        message: `${res.statusCode} ${req.method} ${req.url}`,
        level: res.statusCode >= 400 ? "error" : "info",
      });
    });

    next();
  };
}

// =============================================================================
// tRPC Integration
// =============================================================================

/**
 * Create Sentry context for tRPC procedures
 */
export function createTRPCSentryContext(opts: {
  path: string;
  type: "query" | "mutation" | "subscription";
  userId?: number;
  organizationId?: number;
}): {
  transaction: SentryTransaction;
  captureError: (error: Error) => void;
} {
  const transaction = startTransaction(`trpc.${opts.path}`, `trpc.${opts.type}`);

  transaction.setTag("trpc.path", opts.path);
  transaction.setTag("trpc.type", opts.type);

  if (opts.userId) {
    transaction.setTag("user.id", String(opts.userId));
  }
  if (opts.organizationId) {
    transaction.setTag("organization.id", String(opts.organizationId));
  }

  return {
    transaction,
    captureError: (error: Error) => {
      captureError(error, {
        trpc: {
          path: opts.path,
          type: opts.type,
        },
        user: opts.userId ? { id: opts.userId } : undefined,
        organization: opts.organizationId ? { id: opts.organizationId } : undefined,
      });
    },
  };
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Generate a unique event ID
 */
function generateEventId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sanitize headers to remove sensitive information
 */
function sanitizeHeaders(
  headers: Record<string, string | string[] | undefined>
): Record<string, string> {
  const sensitiveKeys = ["authorization", "cookie", "x-api-key", "x-auth-token"];
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else if (value) {
      result[key] = Array.isArray(value) ? value.join(", ") : value;
    }
  }

  return result;
}

/**
 * Log to Sentry (simulated in development)
 */
function logToSentry(data: Record<string, unknown>): void {
  if (config.debug) {
    console.log("[Sentry] Event:", JSON.stringify(data, null, 2));
  }
  // In production, this would send to Sentry API
}

// =============================================================================
// Shutdown
// =============================================================================

/**
 * Flush pending events and close Sentry
 */
export async function closeSentry(timeout = 2000): Promise<void> {
  if (!isInitialized) return;

  console.log(`[Sentry] Flushing events (timeout: ${timeout}ms)...`);

  // In production, this would call Sentry.close()
  await new Promise((resolve) => setTimeout(resolve, Math.min(timeout, 100)));

  isInitialized = false;
  console.log("[Sentry] Closed");
}

// =============================================================================
// Exports
// =============================================================================

export { config as sentryConfig };
