-- Migration: Add invoice_id FK to time_entries table
-- Created: 2026-01-09
-- Phase: 16-01 (Facturation Automatique Backend)

-- Add invoice_id column to time_entries
ALTER TABLE "time_entries" ADD COLUMN "invoice_id" integer;

-- Add foreign key constraint with ON DELETE SET NULL
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE set null ON UPDATE no action;

-- Add index for performance on invoice_id lookups
CREATE INDEX IF NOT EXISTS "time_entries_invoice_id_idx" ON "time_entries" ("invoice_id");
