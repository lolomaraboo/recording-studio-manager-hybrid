/**
 * Master Database Schema
 *
 * Contains:
 * - users: System users
 * - organizations: Tenant organizations
 * - tenant_databases: Mapping org → database
 * - organization_members: User-org relationships
 * - invitations: Pending invitations
 * - subscription_plans: Subscription tiers
 */

import { pgTable, serial, varchar, text, timestamp, integer, boolean, unique, jsonb, index } from "drizzle-orm/pg-core";

/**
 * Users table (Master DB only)
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("member"), // "admin" | "member"
  isActive: boolean("is_active").notNull().default(true),
  // 2FA fields
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: varchar("two_factor_secret", { length: 255 }), // encrypted TOTP secret
  twoFactorBackupCodes: text("two_factor_backup_codes"), // JSON array of hashed codes
  twoFactorVerifiedAt: timestamp("two_factor_verified_at"), // when 2FA was first verified
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Organizations table (Master DB only)
 */
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  subdomain: varchar("subdomain", { length: 100 }).notNull().unique(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  timezone: varchar("timezone", { length: 100 }).notNull().default("Europe/Paris"),
  currency: varchar("currency", { length: 10 }).notNull().default("EUR"),
  language: varchar("language", { length: 10 }).notNull().default("fr"),
  subscriptionTier: varchar("subscription_tier", { length: 50 }).notNull().default("trial"), // "trial" | "starter" | "pro" | "enterprise"
  trialEndsAt: timestamp("trial_ends_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Tenant Databases table (Master DB only)
 * Maps organization → dedicated PostgreSQL database
 */
export const tenantDatabases = pgTable("tenant_databases", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().unique().references(() => organizations.id),
  databaseName: varchar("database_name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TenantDatabase = typeof tenantDatabases.$inferSelect;
export type InsertTenantDatabase = typeof tenantDatabases.$inferInsert;

/**
 * Organization Members table (Master DB only)
 * Junction table: users ↔ organizations
 */
export const organizationMembers = pgTable("organization_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  role: varchar("role", { length: 50 }).notNull().default("member"), // "owner" | "admin" | "member"
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserOrg: unique().on(table.userId, table.organizationId),
}));

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;

/**
 * Invitations table (Master DB only)
 */
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  invitedBy: integer("invited_by").notNull().references(() => users.id),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  token: varchar("token", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // "pending" | "accepted" | "expired"
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

/**
 * Subscription Plans table (Master DB only)
 */
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  priceMonthly: integer("price_monthly").notNull(), // cents
  priceYearly: integer("price_yearly").notNull(), // cents
  features: text("features").notNull(), // JSON array
  maxUsers: integer("max_users"),
  maxSessions: integer("max_sessions"),
  maxStorage: integer("max_storage"), // GB
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * Audit Logs table (Master DB only)
 * SOC2 compliant audit trail for all sensitive operations
 *
 * Categories:
 * - auth: Login, logout, 2FA, password changes
 * - data: CRUD operations on sensitive data
 * - admin: User management, role changes
 * - billing: Payment, subscription changes
 * - security: Security-related events
 */
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  // Who performed the action
  userId: integer("user_id").references(() => users.id),
  userEmail: varchar("user_email", { length: 255 }), // Denormalized for queries when user deleted
  // Which organization context
  organizationId: integer("organization_id").references(() => organizations.id),
  // What happened
  action: varchar("action", { length: 100 }).notNull(), // e.g., "user.login", "client.create", "invoice.delete"
  category: varchar("category", { length: 50 }).notNull(), // "auth" | "data" | "admin" | "billing" | "security"
  // Details
  resourceType: varchar("resource_type", { length: 50 }), // e.g., "client", "invoice", "session"
  resourceId: varchar("resource_id", { length: 100 }), // ID of affected resource
  description: text("description"), // Human-readable description
  // Before/after for data changes
  previousData: jsonb("previous_data"), // State before change
  newData: jsonb("new_data"), // State after change
  // Request context
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  requestId: varchar("request_id", { length: 100 }), // For correlating related logs
  // Metadata
  severity: varchar("severity", { length: 20 }).notNull().default("info"), // "info" | "warning" | "error" | "critical"
  status: varchar("status", { length: 20 }).notNull().default("success"), // "success" | "failure"
  errorMessage: text("error_message"), // If status is failure
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Indexes for common queries
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  orgIdIdx: index("audit_logs_org_id_idx").on(table.organizationId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  categoryIdx: index("audit_logs_category_idx").on(table.category),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  resourceIdx: index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
