-- Migration: Add oauth_accounts table
-- Created: 2026-06-11
-- Description: Links users to external OAuth providers (Google, Apple)
-- Apply: docker exec -i rsm-postgres psql -U postgres -d rsm_master < packages/database/drizzle/migrations/master/0004_add_oauth_accounts.sql
--   (or: psql -U postgres -d rsm_master -f ... if PostgreSQL runs natively)

CREATE TABLE IF NOT EXISTS "oauth_accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" varchar(50) NOT NULL,
  "provider_account_id" varchar(255) NOT NULL,
  "email" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "oauth_accounts_provider_provider_account_id_unique" UNIQUE("provider", "provider_account_id")
);

CREATE INDEX IF NOT EXISTS "oauth_accounts_user_id_idx" ON "oauth_accounts" ("user_id");
