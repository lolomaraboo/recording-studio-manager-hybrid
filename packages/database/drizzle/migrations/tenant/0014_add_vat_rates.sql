-- Migration: Add vat_rates table and FK columns for multi-rate VAT system
-- Phase: 39-01 (Multi-rate VAT management)
-- Created: 2026-01-22

-- Create vat_rates table
CREATE TABLE "vat_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add vat_rate_id to invoice_items (nullable during migration)
ALTER TABLE "invoice_items" ADD COLUMN "vat_rate_id" integer;
--> statement-breakpoint

-- Add vat_rate_id to quote_items (nullable during migration)
ALTER TABLE "quote_items" ADD COLUMN "vat_rate_id" integer;
--> statement-breakpoint

-- Add vat_rate_id to rooms (optional - some rooms may not have VAT)
ALTER TABLE "rooms" ADD COLUMN "vat_rate_id" integer;
--> statement-breakpoint

-- Add vat_rate_id to service_catalog (nullable during migration, will replace tax_rate)
ALTER TABLE "service_catalog" ADD COLUMN "vat_rate_id" integer;
--> statement-breakpoint

-- Add foreign key constraints (ON DELETE RESTRICT to prevent orphaning historical data)
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_vat_rate_id_vat_rates_id_fk" FOREIGN KEY ("vat_rate_id") REFERENCES "vat_rates"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_vat_rate_id_vat_rates_id_fk" FOREIGN KEY ("vat_rate_id") REFERENCES "vat_rates"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_vat_rate_id_vat_rates_id_fk" FOREIGN KEY ("vat_rate_id") REFERENCES "vat_rates"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_catalog" ADD CONSTRAINT "service_catalog_vat_rate_id_vat_rates_id_fk" FOREIGN KEY ("vat_rate_id") REFERENCES "vat_rates"("id") ON DELETE restrict ON UPDATE no action;
