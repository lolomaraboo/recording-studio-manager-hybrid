-- Migration: Add company_members table for many-to-many relationship
-- Created: 2026-01-17
-- Purpose: Replace client_contacts with proper many-to-many architecture

CREATE TABLE IF NOT EXISTS "company_members" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_client_id" integer NOT NULL,
  "member_client_id" integer NOT NULL,
  "role" varchar(255),
  "is_primary" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "company_members_company_client_id_clients_id_fk" FOREIGN KEY ("company_client_id") REFERENCES "clients"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "company_members_member_client_id_clients_id_fk" FOREIGN KEY ("member_client_id") REFERENCES "clients"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "company_members_unique" UNIQUE("company_client_id", "member_client_id")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "company_members_company_idx" ON "company_members" ("company_client_id");
CREATE INDEX IF NOT EXISTS "company_members_member_idx" ON "company_members" ("member_client_id");
