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

import { pgTable, serial, varchar, text, timestamp, integer, boolean, unique } from "drizzle-orm/pg-core";

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
 * AI Credits table (Master DB only)
 * Tracks AI usage credits per organization
 */
export const aiCredits = pgTable("ai_credits", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().unique().references(() => organizations.id),

  // Credits
  creditsRemaining: integer("credits_remaining").notNull().default(0),
  creditsUsedThisMonth: integer("credits_used_this_month").notNull().default(0),

  // Limits by plan
  plan: varchar("plan", { length: 50 }).notNull().default("trial"), // "trial" | "pro" | "enterprise"

  // Recharge history
  lastRechargeAt: timestamp("last_recharge_at"),
  nextRechargeAt: timestamp("next_recharge_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AICredit = typeof aiCredits.$inferSelect;
export type InsertAICredit = typeof aiCredits.$inferInsert;
