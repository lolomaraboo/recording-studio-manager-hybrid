-- Migration: Add subscription_plans and ai_credits tables
-- Phase: 18.1-01
-- Created: 2026-01-16

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"price_monthly" integer NOT NULL,
	"price_yearly" integer NOT NULL,
	"stripe_price_id_monthly" varchar(255),
	"stripe_price_id_yearly" varchar(255),
	"features" text NOT NULL,
	"max_users" integer,
	"max_sessions" integer,
	"max_storage" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_name_unique" UNIQUE("name")
);

-- Create ai_credits table
CREATE TABLE IF NOT EXISTS "ai_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"credits_remaining" integer DEFAULT 0 NOT NULL,
	"credits_used_this_month" integer DEFAULT 0 NOT NULL,
	"plan" varchar(50) DEFAULT 'trial' NOT NULL,
	"last_recharge_at" timestamp,
	"next_recharge_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_credits_organization_id_unique" UNIQUE("organization_id")
);

-- Add foreign key constraint
ALTER TABLE "ai_credits" ADD CONSTRAINT "ai_credits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
