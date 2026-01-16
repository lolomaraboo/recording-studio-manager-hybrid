-- Migration: Add Stripe billing columns to organizations
-- Phase: 18.1-01 (Fix for BUG-001)
-- Created: 2026-01-15
-- Description: Adds Stripe customer and subscription tracking columns to organizations table

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" varchar(255);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "subscription_status" varchar(50) DEFAULT 'trial';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "current_period_end" timestamp;
