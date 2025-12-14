/**
 * Audit Logging Module
 *
 * SOC2 compliant audit trail for all sensitive operations.
 * Logs are stored in the Master database for centralized compliance.
 *
 * Categories:
 * - auth: Login, logout, 2FA, password changes
 * - data: CRUD operations on sensitive data
 * - admin: User management, role changes
 * - billing: Payment, subscription changes
 * - security: Security-related events
 */

import { getMasterDb } from "@rsm/database/connection";
import { auditLogs, type InsertAuditLog } from "@rsm/database/master";
import type { TrpcContext } from "./context";

// ============================================================================
// Types
// ============================================================================

export type AuditCategory = "auth" | "data" | "admin" | "billing" | "security";
export type AuditSeverity = "info" | "warning" | "error" | "critical";
export type AuditStatus = "success" | "failure";

export interface AuditLogInput {
  // Who
  userId?: number;
  userEmail?: string;
  organizationId?: number;

  // What
  action: string;
  category: AuditCategory;

  // Resource
  resourceType?: string;
  resourceId?: string;
  description?: string;

  // Data changes
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;

  // Request context
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;

  // Metadata
  severity?: AuditSeverity;
  status?: AuditStatus;
  errorMessage?: string;
}

// ============================================================================
// Predefined Actions
// ============================================================================

export const AuditActions = {
  // Auth actions
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",
  AUTH_LOGIN_FAILED: "auth.login_failed",
  AUTH_PASSWORD_CHANGE: "auth.password_change",
  AUTH_PASSWORD_RESET: "auth.password_reset",
  AUTH_2FA_ENABLED: "auth.2fa_enabled",
  AUTH_2FA_DISABLED: "auth.2fa_disabled",
  AUTH_2FA_VERIFIED: "auth.2fa_verified",
  AUTH_2FA_FAILED: "auth.2fa_failed",
  AUTH_BACKUP_CODE_USED: "auth.backup_code_used",
  AUTH_TOKEN_REFRESH: "auth.token_refresh",

  // User management
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",
  USER_ROLE_CHANGE: "user.role_change",
  USER_DEACTIVATE: "user.deactivate",
  USER_REACTIVATE: "user.reactivate",

  // Organization management
  ORG_CREATE: "organization.create",
  ORG_UPDATE: "organization.update",
  ORG_DELETE: "organization.delete",
  ORG_MEMBER_ADD: "organization.member_add",
  ORG_MEMBER_REMOVE: "organization.member_remove",
  ORG_MEMBER_ROLE_CHANGE: "organization.member_role_change",

  // Invitation
  INVITATION_SEND: "invitation.send",
  INVITATION_ACCEPT: "invitation.accept",
  INVITATION_EXPIRE: "invitation.expire",
  INVITATION_REVOKE: "invitation.revoke",

  // Client management
  CLIENT_CREATE: "client.create",
  CLIENT_UPDATE: "client.update",
  CLIENT_DELETE: "client.delete",

  // Project management
  PROJECT_CREATE: "project.create",
  PROJECT_UPDATE: "project.update",
  PROJECT_DELETE: "project.delete",
  PROJECT_STATUS_CHANGE: "project.status_change",

  // Session management
  SESSION_CREATE: "session.create",
  SESSION_UPDATE: "session.update",
  SESSION_DELETE: "session.delete",
  SESSION_STATUS_CHANGE: "session.status_change",

  // Financial
  QUOTE_CREATE: "quote.create",
  QUOTE_UPDATE: "quote.update",
  QUOTE_DELETE: "quote.delete",
  QUOTE_SEND: "quote.send",
  QUOTE_ACCEPT: "quote.accept",
  QUOTE_REJECT: "quote.reject",

  INVOICE_CREATE: "invoice.create",
  INVOICE_UPDATE: "invoice.update",
  INVOICE_DELETE: "invoice.delete",
  INVOICE_SEND: "invoice.send",
  INVOICE_MARK_PAID: "invoice.mark_paid",

  // Billing
  SUBSCRIPTION_CREATE: "subscription.create",
  SUBSCRIPTION_UPDATE: "subscription.update",
  SUBSCRIPTION_CANCEL: "subscription.cancel",
  PAYMENT_SUCCESS: "payment.success",
  PAYMENT_FAILED: "payment.failed",

  // Security
  SECURITY_SUSPICIOUS_ACTIVITY: "security.suspicious_activity",
  SECURITY_RATE_LIMIT: "security.rate_limit",
  SECURITY_PERMISSION_DENIED: "security.permission_denied",
} as const;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Log an audit event
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    const db = await getMasterDb();
    const logEntry: InsertAuditLog = {
      userId: input.userId,
      userEmail: input.userEmail,
      organizationId: input.organizationId,
      action: input.action,
      category: input.category,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      description: input.description,
      previousData: input.previousData,
      newData: input.newData,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      requestId: input.requestId,
      severity: input.severity ?? "info",
      status: input.status ?? "success",
      errorMessage: input.errorMessage,
    };

    await db.insert(auditLogs).values(logEntry);
  } catch (error) {
    // Never throw from audit logging - just log the error
    console.error("[AUDIT] Failed to write audit log:", error);
  }
}

/**
 * Extract request context from tRPC context
 */
export function extractRequestContext(ctx: TrpcContext): {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
} {
  const req = ctx.req;
  if (!req) {
    return {};
  }

  // Extract IP address (handles proxies)
  const forwardedFor = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  let ipAddress: string | undefined;

  if (typeof forwardedFor === "string") {
    ipAddress = forwardedFor.split(",")[0]?.trim();
  } else if (typeof realIp === "string") {
    ipAddress = realIp;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipAddress = (req.socket as any)?.remoteAddress;
  }

  // Extract user agent
  const userAgent = req.headers["user-agent"];

  // Extract or generate request ID
  const requestId = req.headers["x-request-id"] as string | undefined;

  return {
    ipAddress,
    userAgent: typeof userAgent === "string" ? userAgent : undefined,
    requestId,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Log an authentication event
 */
export async function logAuth(
  action: string,
  ctx: TrpcContext,
  options: {
    userId?: number;
    userEmail?: string;
    organizationId?: number;
    status?: AuditStatus;
    errorMessage?: string;
    description?: string;
  } = {}
): Promise<void> {
  const requestContext = extractRequestContext(ctx);

  await logAudit({
    action,
    category: "auth",
    userId: options.userId ?? ctx.user?.id,
    userEmail: options.userEmail ?? ctx.user?.email,
    organizationId: options.organizationId ?? ctx.organizationId ?? undefined,
    status: options.status ?? "success",
    errorMessage: options.errorMessage,
    description: options.description,
    severity: options.status === "failure" ? "warning" : "info",
    ...requestContext,
  });
}

/**
 * Log a data change event
 */
export async function logDataChange(
  action: string,
  ctx: TrpcContext,
  options: {
    resourceType: string;
    resourceId: string;
    previousData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    description?: string;
  }
): Promise<void> {
  const requestContext = extractRequestContext(ctx);

  await logAudit({
    action,
    category: "data",
    userId: ctx.user?.id,
    userEmail: ctx.user?.email,
    organizationId: ctx.organizationId ?? undefined,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    previousData: options.previousData,
    newData: options.newData,
    description: options.description,
    severity: "info",
    status: "success",
    ...requestContext,
  });
}

/**
 * Log an admin event
 */
export async function logAdmin(
  action: string,
  ctx: TrpcContext,
  options: {
    resourceType?: string;
    resourceId?: string;
    previousData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    description?: string;
  } = {}
): Promise<void> {
  const requestContext = extractRequestContext(ctx);

  await logAudit({
    action,
    category: "admin",
    userId: ctx.user?.id,
    userEmail: ctx.user?.email,
    organizationId: ctx.organizationId ?? undefined,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    previousData: options.previousData,
    newData: options.newData,
    description: options.description,
    severity: "info",
    status: "success",
    ...requestContext,
  });
}

/**
 * Log a security event
 */
export async function logSecurity(
  action: string,
  ctx: TrpcContext,
  options: {
    severity?: AuditSeverity;
    description?: string;
    userId?: number;
    userEmail?: string;
    status?: AuditStatus;
    errorMessage?: string;
  } = {}
): Promise<void> {
  const requestContext = extractRequestContext(ctx);

  await logAudit({
    action,
    category: "security",
    userId: options.userId ?? ctx.user?.id,
    userEmail: options.userEmail ?? ctx.user?.email,
    organizationId: ctx.organizationId ?? undefined,
    description: options.description,
    severity: options.severity ?? "warning",
    status: options.status ?? "success",
    errorMessage: options.errorMessage,
    ...requestContext,
  });
}

/**
 * Log a billing event
 */
export async function logBilling(
  action: string,
  ctx: TrpcContext,
  options: {
    resourceType?: string;
    resourceId?: string;
    previousData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    description?: string;
    status?: AuditStatus;
    errorMessage?: string;
  } = {}
): Promise<void> {
  const requestContext = extractRequestContext(ctx);

  await logAudit({
    action,
    category: "billing",
    userId: ctx.user?.id,
    userEmail: ctx.user?.email,
    organizationId: ctx.organizationId ?? undefined,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    previousData: options.previousData,
    newData: options.newData,
    description: options.description,
    severity: options.status === "failure" ? "error" : "info",
    status: options.status ?? "success",
    errorMessage: options.errorMessage,
    ...requestContext,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sanitize sensitive data before logging
 * Removes passwords, tokens, secrets, etc.
 */
export function sanitizeForAudit<T extends Record<string, unknown>>(
  data: T,
  sensitiveFields: string[] = ["password", "passwordHash", "token", "secret", "accessToken", "refreshToken", "twoFactorSecret"]
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeForAudit(value as Record<string, unknown>, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create a diff between two objects for audit logging
 */
export function createAuditDiff(
  previous: Record<string, unknown>,
  current: Record<string, unknown>
): { changed: Record<string, { from: unknown; to: unknown }>; added: string[]; removed: string[] } {
  const changed: Record<string, { from: unknown; to: unknown }> = {};
  const added: string[] = [];
  const removed: string[] = [];

  const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);

  for (const key of allKeys) {
    const prevValue = previous[key];
    const currValue = current[key];

    if (!(key in previous)) {
      added.push(key);
    } else if (!(key in current)) {
      removed.push(key);
    } else if (JSON.stringify(prevValue) !== JSON.stringify(currValue)) {
      changed[key] = { from: prevValue, to: currValue };
    }
  }

  return { changed, added, removed };
}
